const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

content = content.replace("headless: 'new'", "headless: true");
content = content.replace("waitUntil: 'networkidle0'", "waitUntil: 'load'");
fs.writeFileSync('server.ts', content);

let builder = fs.readFileSync('src/components/ResumeBuilder.tsx', 'utf8');
builder = builder.replace('import { sanitizeOklchColors } from "../lib/resumeStorage";\n', '');
fs.writeFileSync('src/components/ResumeBuilder.tsx', builder);

console.log("Fixed lint");
