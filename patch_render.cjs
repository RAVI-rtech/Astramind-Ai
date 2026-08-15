const fs = require('fs');
let code = fs.readFileSync('src/components/ResumeBuilderPage.tsx', 'utf8');

const replacement = `
  // Process resume data to enforce length constraints based on isExtended flag
  const getProcessedResume = () => {
    let processed = { ...activeResume };
    
    // Always apply some smart limits to prevent crazy lengths
    if (!processed.isExtended) {
      // 1 Page Mode Limits
      if (processed.projects && processed.projects.length > 2) {
        processed.projects = processed.projects.slice(0, 2);
      }
      if (processed.experience && processed.experience.length > 2) {
        processed.experience = processed.experience.slice(0, 2);
      }
      if (processed.certifications && processed.certifications.length > 3) {
        processed.certifications = processed.certifications.slice(0, 3);
      }
      // Truncate summary if too long
      if (processed.personalInfo.summary && processed.personalInfo.summary.length > 300) {
        processed.personalInfo.summary = processed.personalInfo.summary.substring(0, 300) + "...";
      }
    } else {
      // 2 Page Mode Limits (still prevent infinite)
      if (processed.projects && processed.projects.length > 5) {
        processed.projects = processed.projects.slice(0, 5);
      }
      if (processed.experience && processed.experience.length > 5) {
        processed.experience = processed.experience.slice(0, 5);
      }
    }
    return processed;
  };

  // Render Template
  const renderTemplateView = () => {
    const processedResume = getProcessedResume();
    switch (activeResume.templateId) {
      case "regular-ats":
        return <RegularAtsTemplate resume={processedResume} accentHex={currentAccentHex} />;
      case "minimalist-ats":
        return <MinimalistAtsTemplate resume={processedResume} accentHex={currentAccentHex} />;
      case "tech-lead":
        return <TechLeadTemplate resume={processedResume} accentHex={currentAccentHex} />;
      case "elegant-serif":
        return <ElegantSerifTemplate resume={processedResume} accentHex={currentAccentHex} />;
      case "modern-executive":
      default:
        return <ModernExecutiveTemplate resume={processedResume} accentHex={currentAccentHex} />;
    }
  };
`;

code = code.replace(
  /\/\/ Render Template[\s\S]*?renderTemplateView \(\) => \{[\s\S]*?\}[\s\S]*?\};\n/,
  replacement
);

fs.writeFileSync('src/components/ResumeBuilderPage.tsx', code);
