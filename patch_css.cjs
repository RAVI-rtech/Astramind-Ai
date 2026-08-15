const fs = require('fs');
let code = fs.readFileSync('src/index.css', 'utf8');

// Find the @media print block
code = code.replace(
  /#resume-printable-area {[\s\S]*?background-color: #ffffff !important;\n  }/,
  `#resume-printable-area {
    position: absolute !important;
    left: 0 !important;
    top: 0 !important;
    width: 210mm !important;
    margin: 0 !important;
    padding: 20mm !important;
    box-shadow: none !important;
    border-radius: 0 !important;
    background-color: #ffffff !important;
  }`
);

const newCss = `
/* Pagination and Preview Styles */
@media screen {
  #resume-printable-area {
    width: 210mm !important;
    max-width: 210mm !important;
    min-height: 297mm;
    box-sizing: border-box;
    margin: 0 auto;
    position: relative;
    overflow: hidden; /* Enforce page limit by clipping */
  }

  /* Page Guide Line */
  #resume-printable-area::before {
    content: '';
    position: absolute;
    top: 297mm;
    left: 0;
    right: 0;
    border-top: 2px dashed #ef4444; /* red dashed line */
    z-index: 50;
    opacity: 0.5;
    pointer-events: none;
  }
  
  #resume-printable-area::after {
    content: 'End of Page 1';
    position: absolute;
    top: calc(297mm - 20px);
    right: 10px;
    color: #ef4444;
    font-size: 12px;
    font-weight: bold;
    z-index: 50;
    opacity: 0.5;
    pointer-events: none;
  }

  /* Mode classes added in templates */
  #resume-printable-area.is-standard {
    max-height: 297mm;
  }

  #resume-printable-area.is-extended {
    max-height: 594mm;
  }
}
`;

if (!code.includes("/* Pagination and Preview Styles */")) {
  code += newCss;
}

fs.writeFileSync('src/index.css', code);
console.log("Patched css");
