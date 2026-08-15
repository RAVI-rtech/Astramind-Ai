const fs = require('fs');
const path = 'src/lib/pdfExport.ts';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(/iframe.style.width = "0";/, 'iframe.style.width = "210mm";');
content = content.replace(/iframe.style.height = "0";/, 'iframe.style.height = "297mm";');
content = content.replace(/iframe.style.border = "none";/, 'iframe.style.border = "none";\n  iframe.style.opacity = "0";');
content = content.replace(/iframe.style.position = "fixed";/, 'iframe.style.position = "absolute";');

fs.writeFileSync(path, content);
