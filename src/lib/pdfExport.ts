/**
 * Modern HTML-to-PDF Export Engine
 * Preserves native HTML structure, fonts, CSS grid/flexbox, colors, and selectable text.
 * Uses server-side Puppeteer API with seamless client-side print fallback.
 */

function collectAllStylesheets(): string {
  let cssText = "";

  // 1. Collect rules from document.styleSheets
  try {
    const sheets = Array.from(document.styleSheets);
    for (const sheet of sheets) {
      try {
        const rules = sheet.cssRules || sheet.rules;
        if (rules) {
          for (let i = 0; i < rules.length; i++) {
            cssText += rules[i].cssText + "\n";
          }
        }
      } catch {
        // Handle cross-origin stylesheet access restrictions
      }
    }
  } catch {
    // Ignore global stylesheet access errors
  }

  // 2. Collect content from all inline <style> tags
  const styleNodes = Array.from(document.querySelectorAll("style"));
  for (const styleNode of styleNodes) {
    cssText += (styleNode.textContent || styleNode.innerHTML || "") + "\n";
  }

  return cssText;
}

function collectFontLinks(): string {
  let fontLinks = "";
  const linkNodes = Array.from(document.querySelectorAll('link[rel="stylesheet"], link[rel="preconnect"]'));
  for (const linkNode of linkNodes) {
    const href = linkNode.getAttribute("href") || "";
    if (href.includes("fonts.googleapis.com") || href.includes("fonts.gstatic.com")) {
      fontLinks += linkNode.outerHTML + "\n";
    }
  }
  return fontLinks;
}

export async function downloadResumePDF(elementId: string, filename: string = "Resume.pdf") {
  const cleanFilename = filename.endsWith(".pdf") ? filename : `${filename}.pdf`;
  const element = document.getElementById(elementId);

  if (!element) {
    console.error(`[PDF Export] Target resume element #${elementId} not found.`);
    throw new Error(`Resume preview element not found. Please ensure the resume preview is visible.`);
  }

  // Clone target element
  const clonedElement = element.cloneNode(true) as HTMLElement;

  // Ensure element ID matches
  clonedElement.id = elementId;

  // Remove any preview/UI artifacts from clone
  const removeElements = clonedElement.querySelectorAll(".no-print, [data-no-print], .print-hidden");
  removeElements.forEach((el) => el.remove());

  // Collect all styles and fonts from the live DOM
  const collectedStyles = collectAllStylesheets();
  const fontLinks = collectFontLinks();

  // Print-specific layout overrides to ensure perfect A4 size, multi-page breaks, and no red guidelines
  const exportPrintCss = `
    @page {
      size: A4 portrait;
      margin: 0;
    }
    @media print {
      body {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
    }
    *, *::before, *::after {
      box-sizing: border-box !important;
    }
    html, body {
      margin: 0 !important;
      padding: 0 !important;
      background-color: #ffffff !important;
      color: #0f172a !important;
      width: 210mm !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    }
    #${elementId}, .resume-export-wrapper {
      width: 210mm !important;
      min-height: 297mm !important;
      margin: 0 auto !important;
      box-shadow: none !important;
      border: none !important;
      transform: none !important;
      zoom: 1 !important;
      background-color: #ffffff !important;
      border-radius: 0 !important;
      max-width: none !important;
      max-height: none !important;
      overflow: visible !important;
    }
    #${elementId}::before,
    #${elementId}::after {
      display: none !important;
      content: none !important;
      border: none !important;
    }
    .resume-section, .resume-card, section, article, table, tr, li, h1, h2, h3, h4, h5, h6 {
      break-inside: avoid !important;
      page-break-inside: avoid !important;
    }
  `;

  // Build complete standalone HTML document string
  const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=210mm, initial-scale=1.0">
  <title>${cleanFilename}</title>
  ${fontLinks}
  <style>
    ${collectedStyles}
  </style>
  <style>
    ${exportPrintCss}
  </style>
</head>
<body>
  <div class="resume-export-wrapper">
    ${clonedElement.outerHTML}
  </div>
</body>
</html>`;

  // Primary Export Strategy: Server-side Puppeteer Endpoint (/api/export-pdf)
  try {
    console.log(`[PDF Export] Requesting PDF from /api/export-pdf for element #${elementId}...`);
    const response = await fetch("/api/export-pdf", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        html: fullHtml,
        filename: cleanFilename,
      }),
    });

    if (response.ok) {
      const blob = await response.blob();
      if (blob && blob.size > 0) {
        console.log(`[PDF Export] Received PDF blob (${blob.size} bytes). Triggering download...`);
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = cleanFilename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        return;
      }
    } else {
      console.warn(`[PDF Export] Server returned status ${response.status}. Switching to fallback...`);
    }
  } catch (apiErr) {
    console.warn(`[PDF Export] Network error accessing /api/export-pdf:`, apiErr);
  }

  // Fallback Export Strategy: Hidden Printable Frame
  console.log(`[PDF Export] Initiating browser print fallback for #${elementId}...`);
  return new Promise<void>((resolve, reject) => {
    try {
      const iframe = document.createElement("iframe");
      iframe.style.position = "fixed";
      iframe.style.right = "0";
      iframe.style.bottom = "0";
      iframe.style.width = "0";
      iframe.style.height = "0";
      iframe.style.border = "0";
      iframe.style.visibility = "hidden";
      document.body.appendChild(iframe);

      const frameDoc = iframe.contentWindow?.document;
      if (!frameDoc) {
        throw new Error("Unable to create printable iframe context.");
      }

      frameDoc.open();
      frameDoc.write(fullHtml);
      frameDoc.close();

      setTimeout(() => {
        try {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
          setTimeout(() => {
            if (document.body.contains(iframe)) {
              document.body.removeChild(iframe);
            }
            resolve();
          }, 1000);
        } catch (printErr) {
          if (document.body.contains(iframe)) {
            document.body.removeChild(iframe);
          }
          reject(printErr);
        }
      }, 400);
    } catch (err) {
      reject(err);
    }
  });
}
