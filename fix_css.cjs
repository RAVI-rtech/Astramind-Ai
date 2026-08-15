const fs = require('fs');
const path = 'src/lib/pdfExport.ts';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(/#resume-printable-area \{/g, '#print-content > div {');

fs.writeFileSync(path, content);
console.log("Fixed css");
