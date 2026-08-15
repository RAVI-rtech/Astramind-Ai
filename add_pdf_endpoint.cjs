const fs = require('fs');

const path = 'server.ts';
let content = fs.readFileSync(path, 'utf8');

const insertionPoint = "// 4. Vite middleware Integration for single-page applications";
const index = content.indexOf(insertionPoint);

if (index !== -1) {
  const newEndpoint = `
// PDF Generation Endpoint using Puppeteer
const puppeteer = require('puppeteer');

app.post('/api/export-pdf', async (req, res) => {
  try {
    const { html, filename } = req.body;
    
    if (!html) {
      return res.status(400).json({ error: 'Missing html content' });
    }

    const browser = await puppeteer.launch({ 
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
      headless: 'new'
    });
    
    const page = await browser.newPage();
    
    // Set viewport to roughly A4 size at standard DPI
    await page.setViewport({ width: 794, height: 1123 });
    
    // Set content and wait for network/fonts
    await page.setContent(html, { waitUntil: 'networkidle0' });
    
    // Apply print-specific styling internally for safety
    await page.addStyleTag({
      content: \`
        @page { size: A4 portrait; margin: 0; }
        body { margin: 0; padding: 0; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
      \`
    });
    
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      preferCSSPageSize: true,
      margin: { top: 0, right: 0, bottom: 0, left: 0 }
    });
    
    await browser.close();
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', \`attachment; filename="\${filename || 'Resume.pdf'}"\`);
    res.setHeader('Content-Length', pdfBuffer.length);
    
    res.send(Buffer.from(pdfBuffer));
  } catch (err) {
    console.error("PDF Export error:", err);
    res.status(500).json({ error: 'Failed to generate PDF' });
  }
});

`;
  
  content = content.substring(0, index) + newEndpoint + content.substring(index);
  fs.writeFileSync(path, content);
  console.log("PDF endpoint added");
} else {
  console.log("Insertion point not found");
}
