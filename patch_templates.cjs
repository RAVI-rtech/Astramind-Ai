const fs = require('fs');
const path = require('path');

const templatesDir = 'src/components/resumeTemplates';
const files = fs.readdirSync(templatesDir);

for (const file of files) {
  if (file.endsWith('.tsx')) {
    const filePath = path.join(templatesDir, file);
    let code = fs.readFileSync(filePath, 'utf8');

    // Replace hardcoded max-w-[800px] and min-h-[1050px] with the dynamic classes
    code = code.replace(
      /id="resume-printable-area"\s*\n\s*className="([^"]+)"/,
      (match, p1) => {
        let cleanClass = p1.replace(/max-w-\[800px\]/, '').replace(/min-h-\[1050px\]/, '');
        return `id="resume-printable-area"\n      className={\`${cleanClass} \${resume.isExtended ? 'is-extended' : 'is-standard'}\`}`;
      }
    );
    
    // Some templates might have them inline without newlines
    code = code.replace(
      /id="resume-printable-area" className="([^"]+)"/,
      (match, p1) => {
        let cleanClass = p1.replace(/max-w-\[800px\]/, '').replace(/min-h-\[1050px\]/, '');
        return `id="resume-printable-area" className={\`${cleanClass} \${resume.isExtended ? 'is-extended' : 'is-standard'}\`}`;
      }
    );

    fs.writeFileSync(filePath, code);
  }
}
console.log("Patched templates");
