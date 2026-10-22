import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import { load } from "cheerio";
import { GoogleGenAI } from "@google/genai";

export interface CollegeSyllabusLink {
  title: string;
  url: string;
  sourcePageUrl: string;
  host: string;
  kind: "pdf" | "page";
}

export interface CollegeSyllabusDiscovery {
  college: string;
  officialWebsiteUrl: string;
  siteDomain: string;
  links: CollegeSyllabusLink[];
  note: string;
}

const MAX_HTML_BYTES = 2 * 1024 * 1024;
const MAX_PDF_BYTES = 18 * 1024 * 1024;
const PAGE_TIMEOUT_MS = 9000;
const SYLLABUS_TERMS = /syllabus|curricul(?:um|a)|course[\s_-]*(?:structure|content|outline)|academic[\s_-]*(?:scheme|program|calendar)|regulation|ordinance|scheme[\s_-]*of[\s_-]*study|programme[\s_-]*structure|program[\s_-]*structure|handbook/i;

function getRegistrableSiteDomain(hostname: string): string {
  const host = hostname.toLowerCase().replace(/^www\./, "").replace(/\.$/, "");
  const parts = host.split(".");
  const twoLevelSuffixes = new Set(["ac.in", "edu.in", "co.in", "gov.in", "org.in", "res.in", "ac.uk", "co.uk", "gov.uk", "org.uk", "edu.au", "com.au"]);
  if (parts.length >= 3 && twoLevelSuffixes.has(parts.slice(-2).join("."))) {
    return parts.slice(-3).join(".");
  }
  return parts.slice(-2).join(".");
}

function isPublicAddress(address: string): boolean {
  const family = isIP(address);
  if (family === 4) {
    const octets = address.split(".").map(Number);
    const [a, b, c] = octets;
    if (octets.length !== 4 || octets.some((octet) => !Number.isInteger(octet) || octet < 0 || octet > 255)) return false;
    if (a === 0 || a === 10 || a === 127 || a >= 224) return false;
    if (a === 169 && b === 254) return false;
    if (a === 172 && b >= 16 && b <= 31) return false;
    if (a === 192 && b === 168) return false;
    if (a === 100 && b >= 64 && b <= 127) return false;
    if (a === 198 && (b === 18 || b === 19)) return false;
    if (a === 192 && b === 0 && c === 0) return false;
    if (a === 192 && b === 0 && c === 2) return false;
    if (a === 198 && b === 51 && c === 100) return false;
    if (a === 203 && b === 0 && c === 113) return false;
    return true;
  }
  if (family === 6) {
    const value = address.toLowerCase();
    if (value === "::" || value === "::1") return false;
    if (value.startsWith("fc") || value.startsWith("fd") || /^fe[89ab]/.test(value)) return false;
    if (value.startsWith("::ffff:")) return isPublicAddress(value.slice(7));
    return true;
  }
  return false;
}

async function validateHttpsUrl(input: string, expectedSiteDomain?: string): Promise<URL> {
  let url: URL;
  try {
    url = new URL(input.startsWith("https://") ? input : `https://${input}`);
  } catch {
    throw new Error("Enter a valid official HTTPS college website or syllabus page.");
  }
  if (url.protocol !== "https:" || !url.hostname || url.username || url.password || (url.port && url.port !== "443")) {
    throw new Error("Only public HTTPS college websites are supported.");
  }
  const hostname = url.hostname.toLowerCase().replace(/\.$/, "");
  if (hostname === "localhost" || hostname.endsWith(".localhost") || hostname.endsWith(".local") || isIP(hostname)) {
    throw new Error("That host cannot be used as a public college website.");
  }
  if (expectedSiteDomain && !isAllowedSourceHost(hostname, expectedSiteDomain)) {
    throw new Error("The requested link left the college's official website and approved document-hosting services.");
  }
  let addresses: Array<{ address: string; family: number }>;
  try {
    addresses = await lookup(hostname, { all: true, verbatim: true });
  } catch {
    throw new Error("The official website could not be resolved. Check the address and try again.");
  }
  if (!addresses.length || addresses.some((entry) => !isPublicAddress(entry.address))) {
    throw new Error("The website resolves to a non-public address and was blocked for safety.");
  }
  return url;
}

function isAllowedSourceHost(hostname: string, siteDomain: string): boolean {
  const host = hostname.toLowerCase().replace(/\.$/, "");
  return host === siteDomain ||
    host.endsWith(`.${siteDomain}`) ||
    host === "drive.google.com" ||
    host === "docs.google.com" ||
    host === "drive.usercontent.google.com" ||
    host.endsWith(".googleusercontent.com");
}

async function readLimitedBody(response: Response, maxBytes: number): Promise<Buffer> {
  const declaredLength = Number(response.headers.get("content-length") || 0);
  if (declaredLength > maxBytes) throw new Error("The official page or PDF is too large to process safely.");
  if (!response.body) return Buffer.alloc(0);
  const reader = response.body.getReader();
  const chunks: Buffer[] = [];
  let total = 0;
  while (true) {
    const part = await reader.read();
    if (part.done) break;
    const chunk = Buffer.from(part.value);
    total += chunk.length;
    if (total > maxBytes) {
      await reader.cancel();
      throw new Error("The official page or PDF is too large to process safely.");
    }
    chunks.push(chunk);
  }
  return Buffer.concat(chunks, total);
}

async function fetchPublicResource(
  input: string,
  siteDomain: string,
  maxBytes: number
): Promise<{ url: URL; contentType: string; body: Buffer }> {
  let target = await validateHttpsUrl(input, siteDomain);
  for (let attempt = 0; attempt < 4; attempt++) {
    if (!isAllowedSourceHost(target.hostname, siteDomain)) {
      throw new Error("A redirect tried to leave the college website or an approved PDF hosting service.");
    }
    const response = await fetch(target, {
      redirect: "manual",
      signal: AbortSignal.timeout(PAGE_TIMEOUT_MS),
      headers: {
        "User-Agent": "AstraMind-College-Syllabus-Importer/1.0",
        Accept: "text/html,application/pdf,application/octet-stream;q=0.9,*/*;q=0.5",
      },
    });
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location");
      if (!location) throw new Error("The official website returned an invalid redirect.");
      target = await validateHttpsUrl(new URL(location, target).toString(), siteDomain);
      continue;
    }
    if (!response.ok) throw new Error(`The official website returned HTTP ${response.status}.`);
    const body = await readLimitedBody(response, maxBytes);
    return { url: target, contentType: (response.headers.get("content-type") || "").toLowerCase(), body };
  }
  throw new Error("The official website redirected too many times.");
}

function titleFromAnchor($: ReturnType<typeof load>, element: any, url: URL): string {
  const raw = $(element).text().replace(/\s+/g, " ").trim() ||
    $(element).attr("title")?.trim() ||
    $(element).attr("aria-label")?.trim() ||
    decodeURIComponent(url.pathname.split("/").pop() || "Official syllabus");
  return raw.slice(0, 180);
}

function isPdfLink(url: URL, title: string): boolean {
  return /\.pdf(?:$|[?#])/i.test(url.pathname + url.search) ||
    /\.pdf\b/i.test(title) ||
    (url.hostname === "drive.google.com" && /\/file\/d\//.test(url.pathname));
}

function extractSyllabusLinks(html: string, pageUrl: URL, siteDomain: string): CollegeSyllabusLink[] {
  const $ = load(html);
  const found: CollegeSyllabusLink[] = [];
  $("a[href]").each((_index, element) => {
    const href = $(element).attr("href");
    if (!href || /^(?:javascript:|mailto:|tel:|#)/i.test(href)) return;
    let url: URL;
    try { url = new URL(href, pageUrl); } catch { return; }
    if (url.protocol !== "https:" || !isAllowedSourceHost(url.hostname, siteDomain)) return;
    if (url.hostname.toLowerCase() === pageUrl.hostname.toLowerCase() && url.pathname === pageUrl.pathname && url.search === pageUrl.search) return;
    const title = titleFromAnchor($, element, url);
    const pdf = isPdfLink(url, title);
    if (!pdf && !SYLLABUS_TERMS.test(`${title} ${url.pathname} ${url.search}`)) return;
    found.push({
      title,
      url: url.toString(),
      sourcePageUrl: pageUrl.toString(),
      host: url.hostname,
      kind: pdf ? "pdf" : "page",
    });
  });
  const unique = new Map<string, CollegeSyllabusLink>();
  for (const item of found) {
    const key = item.url.replace(/#.*$/, "");
    if (!unique.has(key) || (item.kind === "pdf" && unique.get(key)?.kind !== "pdf")) unique.set(key, item);
  }
  return Array.from(unique.values());
}

function rankLinks(links: CollegeSyllabusLink[], filters: { programType?: string; branch?: string; year?: string; semester?: string }): CollegeSyllabusLink[] {
  const normal = (value?: string) => (value || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  const targets = [filters.programType, filters.branch, filters.year, filters.semester].map(normal).filter(Boolean);
  return links.sort((a, b) => {
    const score = (item: CollegeSyllabusLink) => {
      const haystack = normal(`${item.title} ${item.url}`);
      return targets.reduce((total, target) => total + (haystack.includes(target) ? 2 : 0), 0) +
        (item.kind === "pdf" ? 1 : 0);
    };
    return score(b) - score(a);
  });
}

export async function discoverCollegeSyllabus(params: {
  college: string;
  officialWebsiteUrl: string;
  programType?: string;
  branch?: string;
  year?: string;
  semester?: string;
}): Promise<CollegeSyllabusDiscovery> {
  const college = params.college.trim();
  if (!college) throw new Error("Enter your college or institution name.");
  if (!params.officialWebsiteUrl.trim()) throw new Error("Enter the official college website or its academics/syllabus page.");

  const inputUrl = await validateHttpsUrl(params.officialWebsiteUrl.trim());
  const siteDomain = getRegistrableSiteDomain(inputUrl.hostname);
  if (!siteDomain || siteDomain.split(".").length < 2) throw new Error("The college website address is incomplete.");

  const links: CollegeSyllabusLink[] = [];
  const visited = new Set<string>();
  const pages: string[] = [inputUrl.toString()];
  const directPdf = isPdfLink(inputUrl, inputUrl.pathname);
  if (directPdf) {
    links.push({
      title: decodeURIComponent(inputUrl.pathname.split("/").pop() || "Official syllabus PDF"),
      url: inputUrl.toString(),
      sourcePageUrl: inputUrl.toString(),
      host: inputUrl.hostname,
      kind: "pdf",
    });
  }

  while (pages.length > 0 && visited.size < 5) {
    const next = pages.shift()!;
    if (visited.has(next)) continue;
    visited.add(next);
    if (directPdf && visited.size === 1) continue;
    try {
      const resource = await fetchPublicResource(next, siteDomain, MAX_HTML_BYTES);
      if (!resource.contentType.includes("text/html") && !/^\s*<!doctype html|^\s*<html/i.test(resource.body.toString("utf8", 0, 400))) continue;
      const pageLinks = extractSyllabusLinks(resource.body.toString("utf8"), resource.url, siteDomain);
      links.push(...pageLinks);
      if (links.filter((item) => item.kind === "pdf").length === 0) {
        for (const pageLink of pageLinks.filter((item) => item.kind === "page").slice(0, 3)) {
          if (!visited.has(pageLink.url) && pages.length < 4) pages.push(pageLink.url);
        }
      }
    } catch (error) {
      if (visited.size === 1) throw error;
    }
  }

  const rankedLinks = rankLinks(
    Array.from(new Map(links.map((item) => [item.url.replace(/#.*$/, ""), item])).values()),
    params
  );
  return {
    college,
    officialWebsiteUrl: inputUrl.toString(),
    siteDomain,
    links: rankedLinks.slice(0, 80),
    note: rankedLinks.some((item) => item.kind === "pdf")
      ? "Links were discovered on the official page you provided. Check the course, year, semester and regulation before using a syllabus."
      : "No direct syllabus PDF was discovered. Open the official academic pages below, or paste the official syllabus-page URL and try again.",
  };
}

export async function downloadOfficialSyllabusPdf(params: {
  college: string;
  officialWebsiteUrl: string;
  syllabusUrl: string;
  programType?: string;
  branch?: string;
  year?: string;
  semester?: string;
}): Promise<{ buffer: Buffer; url: string; fileName: string; siteDomain: string }> {
  const discovery = await discoverCollegeSyllabus({
    college: params.college,
    officialWebsiteUrl: params.officialWebsiteUrl,
    programType: params.programType,
    branch: params.branch,
    year: params.year,
    semester: params.semester,
  });
  const selected = discovery.links.find((item) => item.kind === "pdf" && item.url === params.syllabusUrl);
  if (!selected) throw new Error("That PDF was not found among the links on the supplied official college page. Refresh the syllabus list and select a listed PDF.");

  let sourceUrl = selected.url;
  const parsedSource = new URL(sourceUrl);
  if (parsedSource.hostname === "drive.google.com" && /\/file\/d\//.test(parsedSource.pathname)) {
    const fileId = parsedSource.pathname.match(/\/file\/d\/([^/]+)/)?.[1];
    if (!fileId) throw new Error("The official Google Drive PDF link did not contain a valid file ID.");
    sourceUrl = `https://drive.google.com/uc?export=download&id=${encodeURIComponent(fileId)}`;
  }

  const resource = await fetchPublicResource(sourceUrl, discovery.siteDomain, MAX_PDF_BYTES);
  if (resource.body.length < 5 || resource.body.subarray(0, 5).toString("ascii") !== "%PDF-") {
    throw new Error("The official link did not provide a directly downloadable PDF. Open the official link in your browser, download it, and upload the PDF to AstraMind.");
  }
  const pathName = new URL(selected.url).pathname;
  let fileName = decodeURIComponent(pathName.split("/").pop() || "official-syllabus.pdf").replace(/[^a-zA-Z0-9._ -]/g, "_");
  if (!fileName.toLowerCase().endsWith(".pdf")) fileName = `${fileName.replace(/\.[^.]+$/, "")}.pdf`;
  return { buffer: resource.body, url: selected.url, fileName, siteDomain: discovery.siteDomain };
}


export interface OfficialCollegeWebsiteDiscovery {
  college: string;
  officialWebsiteUrl: string;
  evidenceUrls: string[];
  note: string;
}

/**
 * Use Gemini's grounded Google Search tool to identify the likely official homepage.
 * A candidate is accepted only when its host is also present in the returned search-grounding sources,
 * then verified as a public HTTPS site. The client can show the resulting URL before import.
 */
export async function findOfficialCollegeWebsite(collegeName: string): Promise<OfficialCollegeWebsiteDiscovery> {
  const college = collegeName.trim();
  if (!college) throw new Error("Enter your college or institution name first.");
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("Automatic website discovery requires GEMINI_API_KEY. Paste your college's official website in the URL field and try again.");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const response: any = await ai.models.generateContent({
    model: "gemini-3.8-flash",
    contents: [{
      role: "user",
      parts: [{
        text: `Find the official website homepage for the higher-education institution named "${college}".
Search the web and use official institutional pages or other reliable results to distinguish it from similarly named institutions, admission aggregators, ranking sites, and third-party directories.
Return JSON only:
{
  "officialWebsiteUrl": "the institution's official HTTPS homepage exactly as present in the search results",
  "reason": "short reason this is the institution's official domain"
}
Do not invent a domain or URL. If you cannot confidently identify it, return {"officialWebsiteUrl":"","reason":"Official site could not be identified confidently."}.`
      }]
    }],
    config: {
      tools: [{ googleSearch: {} }],
      temperature: 0.1,
    },
  });

  const candidate = response.candidates?.[0];
  const groundingChunks = Array.isArray(candidate?.groundingMetadata?.groundingChunks)
    ? candidate.groundingMetadata.groundingChunks
    : [];
  const evidenceUrls = groundingChunks
    .map((chunk: any) => chunk?.web?.uri)
    .filter((url: unknown): url is string => typeof url === "string" && /^https:\/\//i.test(url))
    .map((url: string) => {
      try { return new URL(url).origin + new URL(url).pathname; } catch { return ""; }
    })
    .filter(Boolean);
  const uniqueEvidence = Array.from(new Set<string>(evidenceUrls)).slice(0, 10);

  let parsed: any = null;
  const rawText = String(candidate?.content?.parts?.map((part: any) => part?.text || "").join("\\n") || response.text || "").trim();
  const jsonCandidate = rawText.replace(/^\`\`\`(?:json)?\s*/i, "").replace(/\s*\`\`\`$/, "");
  try { parsed = JSON.parse(jsonCandidate); } catch {
    const match = jsonCandidate.match(/\{[\\s\\S]*\}/);
    if (match) {
      try { parsed = JSON.parse(match[0]); } catch { parsed = null; }
    }
  }

  const requestedUrl = typeof parsed?.officialWebsiteUrl === "string" ? parsed.officialWebsiteUrl.trim() : "";
  if (!requestedUrl || !uniqueEvidence.length) {
    throw new Error("Search did not produce a verifiable official website. Paste the official college URL in the field and try again.");
  }

  const candidateUrl = await validateHttpsUrl(requestedUrl);
  const candidateDomain = getRegistrableSiteDomain(candidateUrl.hostname);
  const evidenceDomains = uniqueEvidence.map((url) => {
    try { return getRegistrableSiteDomain(new URL(url).hostname); } catch { return ""; }
  });
  if (!evidenceDomains.includes(candidateDomain)) {
    throw new Error("The suggested website was not present in the verified search results. Paste the official college URL and try again.");
  }

  return {
    college,
    officialWebsiteUrl: candidateUrl.toString(),
    evidenceUrls: uniqueEvidence,
    note: "Candidate official site found through Google Search grounding. Verify the domain belongs to your college before using the syllabus links.",
  };
}
