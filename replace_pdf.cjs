const fs = require('fs');

const path = 'src/components/ResumeBuilder.tsx';
let content = fs.readFileSync(path, 'utf8');

const match = "      const handleExportPdf = async () => {";
const endMatch = "  };\n\n  // Color Map for Resume Themes";

const startIndex = content.indexOf(match);
const endIndex = content.indexOf(endMatch);

if (startIndex === -1 || endIndex === -1) {
  console.log("Could not find start or end index.");
} else {
  const replacement = `      const handleExportPdf = async () => {
    if (!resumePrintRef.current) return;
    setIsExportingPdf(true);

    try {
      const { downloadResumePDF } = await import('../lib/pdfExport');
      if (!resumePrintRef.current.id) {
        resumePrintRef.current.id = 'resume-export-container';
      }
      await downloadResumePDF(resumePrintRef.current.id, \`\${activeResume.personalInfo.fullName.replace(/\\s+/g, "_")}_Resume.pdf\`);
    } catch (err) {
      console.error("PDF generation failed:", err);
    } finally {
      setIsExportingPdf(false);
    }
`;
  
  const newContent = content.substring(0, startIndex) + replacement + content.substring(endIndex);
  fs.writeFileSync(path, newContent);
  console.log("Replaced successfully.");
}
