import http from "http";
import querystring from "querystring";
import * as cheerio from "cheerio";

export interface AttendanceSubjectItem {
  name: string;
  code?: string;
  present: number;
  absent: number;
  total: number;
  percentage: number;
}

export interface AttendanceSummary {
  overallPercentage: number;
  present: number;
  absent: number;
  workingDays: number;
}

export interface AttendanceReportResult {
  success: boolean;
  student?: {
    name: string;
    rollNumber: string;
    branch: string;
    year: string;
    section: string;
  };
  period?: {
    from: string;
    to: string;
  };
  summary?: AttendanceSummary;
  subjects?: AttendanceSubjectItem[];
  error?: string;
}

interface FetchOptions {
  method?: string;
  headers?: Record<string, string>;
  body?: string;
  timeoutMs?: number;
}

interface HttpResponse {
  statusCode: number;
  headers: http.IncomingHttpHeaders;
  body: string;
}

const DEFAULT_BASE_URL = "http://103.52.36.11/Attendance";
const DEFAULT_USER = "999";
const DEFAULT_PASS = "vgnt";

/**
 * Perform an HTTP request returning a Promise with cookies and body
 */
function makeHttpRequest(urlStr: string, options: FetchOptions = {}): Promise<HttpResponse> {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(urlStr);
    const timeout = options.timeoutMs || 85000;

    const reqOptions: http.RequestOptions = {
      protocol: parsedUrl.protocol,
      hostname: parsedUrl.hostname,
      port: parsedUrl.port ? parseInt(parsedUrl.port, 10) : 80,
      path: parsedUrl.pathname + parsedUrl.search,
      method: options.method || "GET",
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        ...options.headers,
      },
    };

    const req = http.request(reqOptions, (res) => {
      let data = "";
      res.setEncoding("utf8");

      res.on("data", (chunk) => {
        data += chunk;
      });

      res.on("end", () => {
        resolve({
          statusCode: res.statusCode || 200,
          headers: res.headers,
          body: data,
        });
      });
    });

    req.setTimeout(timeout, () => {
      req.destroy(new Error("TIMEOUT"));
    });

    req.on("error", (err: any) => {
      if (err.message === "TIMEOUT" || err.code === "ETIMEDOUT") {
        reject(new Error("The attendance portal is taking longer than expected. Please try again."));
      } else if (err.code === "ECONNREFUSED" || err.code === "ENOTFOUND") {
        reject(new Error("The college attendance portal is currently unavailable. Please try again later."));
      } else {
        reject(err);
      }
    });

    if (options.body) {
      req.write(options.body);
    }
    req.end();
  });
}

/**
 * Merge cookies from multiple Set-Cookie headers into a single cookie string
 */
function extractCookieHeader(existingCookie: string, newHeaders: http.IncomingHttpHeaders): string {
  const cookieMap = new Map<string, string>();

  if (existingCookie) {
    existingCookie.split(";").forEach((pair) => {
      const [k, v] = pair.trim().split("=");
      if (k && v) cookieMap.set(k.trim(), v.trim());
    });
  }

  const setCookie = newHeaders["set-cookie"];
  if (setCookie) {
    const list = Array.isArray(setCookie) ? setCookie : [setCookie];
    list.forEach((c) => {
      const part = c.split(";")[0];
      const [k, v] = part.split("=");
      if (k && v) cookieMap.set(k.trim(), v.trim());
    });
  }

  return Array.from(cookieMap.entries())
    .map(([k, v]) => `${k}=${v}`)
    .join("; ");
}

/**
 * Server-side attendance retrieval engine
 */
export async function fetchCollegeAttendanceReport(params: {
  rollNumber: string;
  studentName?: string;
  branch?: string;
  year?: string;
  section?: string;
  fromDate: string;
  toDate: string;
}): Promise<AttendanceReportResult> {
  const baseUrl = process.env.COLLEGE_ATTENDANCE_URL || DEFAULT_BASE_URL;
  const username = process.env.COLLEGE_ATTENDANCE_USER || DEFAULT_USER;
  const password = process.env.COLLEGE_ATTENDANCE_PASS || DEFAULT_PASS;

  const rollNumber = (params.rollNumber || "").trim().toUpperCase();
  const fromDate = params.fromDate.trim();
  const toDate = params.toDate.trim();

  // Validate dates
  if (!fromDate || !toDate) {
    return { success: false, error: "Please provide valid From and To dates." };
  }
  if (fromDate > toDate) {
    return { success: false, error: "From Date cannot be later than To Date." };
  }

  let sessionCookie = "";

  try {
    // 1. Initialize session by requesting index.html
    const indexUrl = `${baseUrl.replace(/\/$/, "")}/index.html`;
    const indexRes = await makeHttpRequest(indexUrl, { timeoutMs: 15000 });
    sessionCookie = extractCookieHeader(sessionCookie, indexRes.headers);

    // 2. Authenticate to Validate.php
    const validateUrl = `${baseUrl.replace(/\/$/, "")}/Validate.php`;
    const postPayload = querystring.stringify({
      uname: username,
      pass: password,
    });

    const loginRes = await makeHttpRequest(validateUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Content-Length": Buffer.byteLength(postPayload).toString(),
        Cookie: sessionCookie,
      },
      body: postPayload,
      timeoutMs: 20000,
    });

    sessionCookie = extractCookieHeader(sessionCookie, loginRes.headers);

    // If login returned an error page or not a redirect
    if (loginRes.statusCode !== 302 && loginRes.statusCode !== 200) {
      return {
        success: false,
        error: "Unable to authenticate with the college attendance portal.",
      };
    }

    // 3. Open Creports.php to discover dynamic report form and action
    const creportsUrl = `${baseUrl.replace(/\/$/, "")}/Creports.php`;
    const creportsRes = await makeHttpRequest(creportsUrl, {
      headers: {
        Cookie: sessionCookie,
      },
      timeoutMs: 25000,
    });

    sessionCookie = extractCookieHeader(sessionCookie, creportsRes.headers);

    const $creports = cheerio.load(creportsRes.body);
    const form = $creports("form");

    if (form.length === 0) {
      return {
        success: false,
        error: "The attendance portal returned an unexpected response. Please try again later.",
      };
    }

    // Determine form action dynamically
    const rawAction = form.attr("action") || "Crprint.php";
    const reportActionUrl = rawAction.startsWith("http")
      ? rawAction
      : `${baseUrl.replace(/\/$/, "")}/${rawAction.replace(/^\//, "")}`;

    // 4. Determine parameters for report submission
    const rawBranch = (params.branch || "").trim().toUpperCase();
    const rawYear = (params.year || "1").trim();
    const rawSection = (params.section || "A").trim().toUpperCase();

    const VALID_BRANCHES = ["CE", "EEE", "ME", "ECE", "CSE", "EIE", "IT", "CSM", "CSD", "AI&DS", "AIML", "BSH"];
    const VALID_SECTIONS = [
      "A", "B", "C", "D", "E",
      "CSE_A", "CSE_B", "CSE_C", "CSE_D",
      "CSM_A", "CSM_B", "CSM_C", "CSM_D", "CSM_E",
      "DS_A", "DS_B", "DS_C",
      "ECE_A", "ECE_B", "EIE", "EEE", "MECH", "CIVIL", "IT", "AIDS", "AIML"
    ];

    let portalBranch = rawBranch;
    let portalSection = rawSection;

    // Resolve branch
    if (!VALID_BRANCHES.includes(portalBranch)) {
      if (rawYear === "1" || rawBranch.includes("BSH") || rawBranch.includes("BASIC")) {
        portalBranch = "BSH";
      } else if (rawBranch.includes("AI&ML") || rawBranch.includes("CSM") || rawBranch.includes("CSE (AI")) {
        portalBranch = "CSM";
      } else if (rawBranch.includes("DATA") || rawBranch.includes("DS") || rawBranch.includes("CSD")) {
        portalBranch = "CSD";
      } else if (rawBranch.includes("AI&DS") || rawBranch.includes("AIDS")) {
        portalBranch = "AI&DS";
      } else if (rawBranch.includes("AIML")) {
        portalBranch = "AIML";
      } else if (rawBranch.includes("CSE")) {
        portalBranch = "CSE";
      } else if (rawBranch.includes("IT")) {
        portalBranch = "IT";
      } else if (rawBranch.includes("ECE")) {
        portalBranch = "ECE";
      } else if (rawBranch.includes("EEE")) {
        portalBranch = "EEE";
      } else if (rawBranch.includes("ME") || rawBranch.includes("MECHANICAL")) {
        portalBranch = "ME";
      } else if (rawBranch.includes("CE") || rawBranch.includes("CIVIL")) {
        portalBranch = "CE";
      } else if (rawBranch.includes("EIE")) {
        portalBranch = "EIE";
      } else {
        portalBranch = "BSH";
      }
    }

    // Resolve section
    if (!VALID_SECTIONS.includes(portalSection)) {
      const cleanSec = rawSection.replace(/[^A-E]/gi, "").toUpperCase() || "A";
      if (portalBranch === "BSH" || rawYear === "1") {
        if (rawBranch.includes("AI&ML") || rawBranch.includes("CSM")) {
          portalSection = `CSM_${cleanSec}`;
        } else if (rawBranch.includes("DS") || rawBranch.includes("DATA")) {
          portalSection = `DS_${cleanSec}`;
        } else if (rawBranch.includes("CSE")) {
          portalSection = `CSE_${cleanSec}`;
        } else if (rawBranch.includes("ECE")) {
          portalSection = `ECE_${cleanSec}`;
        } else {
          portalSection = `CSM_${cleanSec}`;
        }
      } else {
        portalSection = cleanSec;
      }
    }

    const reportParams = {
      br: portalBranch,
      yr: rawYear,
      sc: portalSection,
      fdt: fromDate,
      tdt: toDate,
      Submit: "VIEW REPORT",
    };

    const reportPostData = querystring.stringify(reportParams);

    // 5. Submit report request (can take up to 60 seconds on college portal)
    const reportRes = await makeHttpRequest(reportActionUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Content-Length": Buffer.byteLength(reportPostData).toString(),
        Cookie: sessionCookie,
      },
      body: reportPostData,
      timeoutMs: 85000,
    });

    if (reportRes.statusCode !== 200 || !reportRes.body || reportRes.body.length === 0) {
      return {
        success: false,
        error: "Attendance report could not be generated. Please verify the branch/year/section and try again.",
      };
    }

    // 6. Parse Returned HTML table
    const $ = cheerio.load(reportRes.body);
    const tables = $("table");

    if (tables.length === 0) {
      // Check if page contains an empty notice
      const bodyText = $("body").text();
      if (bodyText.includes("No records") || bodyText.includes("Not Found")) {
        return {
          success: false,
          error: "No attendance records were found for the selected period.",
        };
      }
      return {
        success: false,
        error: "The attendance portal returned an unexpected response. Please try again later.",
      };
    }

    // Find table that contains H.T No or S.No or Roll
    let targetTable: cheerio.Cheerio<any> | null = null;
    tables.each((_, tbl) => {
      const headerText = $(tbl).text();
      if (headerText.includes("H.T No.") || headerText.includes("S.No.") || headerText.includes("Percentage")) {
        targetTable = $(tbl);
        return false;
      }
    });

    if (!targetTable) {
      targetTable = tables.first();
    }

    const rows = $(targetTable).find("tr");
    if (rows.length < 2) {
      return {
        success: false,
        error: "No attendance records were found for the selected period.",
      };
    }

    // Helper to extract cells from row while respecting colspan
    function extractRowCells(row: cheerio.Cheerio<any>): string[] {
      const cells: string[] = [];
      $(row)
        .find("th, td")
        .each((_, td) => {
          const colspan = parseInt($(td).attr("colspan") || "1", 10) || 1;
          const text = $(td).text().trim().replace(/\s+/g, " ");
          for (let i = 0; i < colspan; i++) {
            cells.push(text);
          }
        });
      return cells;
    }

    // Row 0: Headers (e.g. S.No., H.T No., Sub1, Sub2, ..., Total, Percentage(%))
    const headerCells = extractRowCells($(rows[0]));

    // Row 1: Conducted hours (e.g. "Number of Hours Conducted", 18, 13, ..., 150, 100%)
    const conductedCells = rows.length > 1 ? extractRowCells($(rows[1])) : [];

    // Find index of H.T No and Total / Percentage
    let htIndex = headerCells.findIndex((h) => /h\.?t\.?\s*no/i.test(h) || /roll/i.test(h));
    if (htIndex === -1) htIndex = 1; // standard default is col 1

    let totalIndex = headerCells.findIndex((h) => /^total$/i.test(h));
    let pctIndex = headerCells.findIndex((h) => /percentage/i.test(h) || /%/i.test(h));

    if (pctIndex === -1) pctIndex = headerCells.length - 1;
    if (totalIndex === -1) totalIndex = pctIndex - 1;

    // Identify subject column indices (columns between H.T No and Total)
    const subjectColumns: { index: number; name: string; totalConducted: number }[] = [];
    for (let c = htIndex + 1; c < totalIndex; c++) {
      const name = headerCells[c] || `Subject ${c}`;
      // Read total conducted from conducted row if available
      const conductedStr = conductedCells[c] || "0";
      const totalHours = parseInt(conductedStr.replace(/[^0-9]/g, ""), 10) || 0;
      subjectColumns.push({
        index: c,
        name,
        totalConducted: totalHours,
      });
    }

    // Extract student matching rollNumber
    let matchedRowCells: string[] | null = null;
    let fallbackFirstStudentRow: string[] | null = null;

    for (let r = 2; r < rows.length; r++) {
      const cells = extractRowCells($(rows[r]));

      if (cells.length >= 3) {
        if (!fallbackFirstStudentRow) {
          fallbackFirstStudentRow = cells;
        }

        const rowHt = (cells[htIndex] || "").trim().toUpperCase();
        if (rollNumber && (rowHt === rollNumber || rowHt.includes(rollNumber) || rollNumber.includes(rowHt))) {
          matchedRowCells = cells;
          break;
        }
      }
    }

    // If specific rollNumber wasn't matched, check if rollNumber was empty or user requested first record
    const targetCells = matchedRowCells || fallbackFirstStudentRow;

    if (!targetCells) {
      return {
        success: false,
        error: `No attendance record found for roll number ${rollNumber} in ${portalBranch} section ${portalSection}.`,
      };
    }

    const studentRoll = targetCells[htIndex] || rollNumber;
    const studentPresentHours = parseInt((targetCells[totalIndex] || "0").replace(/[^0-9]/g, ""), 10) || 0;
    const totalConductedHours =
      parseInt((conductedCells[totalIndex] || "0").replace(/[^0-9]/g, ""), 10) ||
      subjectColumns.reduce((sum, s) => sum + s.totalConducted, 0);

    const absentHours = Math.max(0, totalConductedHours - studentPresentHours);

    // Read or compute overall percentage
    const rawPctStr = targetCells[pctIndex] || "";
    const parsedPct = parseFloat(rawPctStr.replace(/[^0-9.]/g, ""));
    const overallPercentage = !isNaN(parsedPct)
      ? Math.round(parsedPct * 10) / 10
      : totalConductedHours > 0
      ? Math.round((studentPresentHours / totalConductedHours) * 1000) / 10
      : 0;

    // Build subject-wise breakdown
    const subjects: AttendanceSubjectItem[] = subjectColumns.map((col) => {
      const presentVal = parseInt((targetCells[col.index] || "0").replace(/[^0-9]/g, ""), 10) || 0;
      const totalVal = col.totalConducted > 0 ? col.totalConducted : Math.max(presentVal, 1);
      const absentVal = Math.max(0, totalVal - presentVal);
      const subPct = totalVal > 0 ? Math.round((presentVal / totalVal) * 1000) / 10 : 0;

      return {
        name: col.name,
        present: presentVal,
        absent: absentVal,
        total: totalVal,
        percentage: subPct,
      };
    });

    return {
      success: true,
      student: {
        name: params.studentName || "Student",
        rollNumber: studentRoll,
        branch: portalBranch,
        year: rawYear,
        section: rawSection,
      },
      period: {
        from: fromDate,
        to: toDate,
      },
      summary: {
        overallPercentage,
        present: studentPresentHours,
        absent: absentHours,
        workingDays: totalConductedHours,
      },
      subjects,
    };
  } catch (err: any) {
    console.error("Attendance fetch error:", err);
    if (err.message && (err.message.includes("taking longer") || err.message.includes("unavailable"))) {
      return { success: false, error: err.message };
    }
    return {
      success: false,
      error: "Unable to retrieve attendance report from the college portal right now. Please try again.",
    };
  }
}
