const fs = require('fs');
let code = fs.readFileSync('src/components/ResumeBuilderPage.tsx', 'utf8');

code = code.replace(
  /updated\[cIdx\]\.skills = updated\[cIdx\]\.skills\.filter\(\(_, i\) => i !== skIdx\);/,
  `updated[cIdx] = { ...updated[cIdx], skills: updated[cIdx].skills.filter((_, i) => i !== skIdx) };`
);

fs.writeFileSync('src/components/ResumeBuilderPage.tsx', code);
console.log("Patched skill remove");
