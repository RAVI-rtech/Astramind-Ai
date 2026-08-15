const fs = require('fs');
const path = 'src/components/ResumeBuilderPage.tsx';
let content = fs.readFileSync(path, 'utf8');

// Replace imports
content = content.replace(/downloadResumePDF,\n\s*downloadResumeAsImage,/, '');
content = content.replace(/downloadResumePDF,\s*downloadResumeAsImage,/, '');
content = content.replace(/downloadResumePDF,/, '');
content = content.replace(/downloadResumeAsImage,/, '');

// Add new import
content = `import { downloadResumePDF } from "../lib/pdfExport";\n` + content;

// Remove image export logic
content = content.replace(/const handleDownloadImage = async \(\) => {[\s\S]*?};\n\n/, '');

content = content.replace(/\| "image"/g, '');

content = content.replace(/if \(type === "pdf"\) {[\s\S]*?} else {[\s\S]*?}/, 'setIsExportingPDF(true);');
content = content.replace(/type === "pdf" \? "pdf" : "png"/g, '"pdf"');
content = content.replace(/type === "pdf" \? "PDF" : "Resume photo"/g, '"PDF"');
content = content.replace(/type === "pdf" \? "PDF" : "resume photo"/g, '"PDF"');

const exportCallRegex = /if \(type === "pdf"\) {\s*await downloadResumePDF\("resume-printable-area", cleanName\);\s*} else {\s*await downloadResumeAsImage\("resume-printable-area", cleanName\);\s*}/;
content = content.replace(exportCallRegex, `await downloadResumePDF("resume-printable-area", cleanName);`);

const photoBtnRegex = /\{\/\* Download Photo \/ Image \(PNG\) \*\/\}\s*<button\s*onClick=\{handleDownloadImage\}[\s\S]*?<\/button>/;
content = content.replace(photoBtnRegex, '');

fs.writeFileSync(path, content);
