const fs = require('fs');
let code = fs.readFileSync('src/components/ResumeBuilderPage.tsx', 'utf8');

code = code.replace(
  /if \(e.key === "Enter" && e.currentTarget.value.trim\(\)\) \{[\s\S]*?e.currentTarget.value = "";\n\s*\}/,
  `if (e.key === "Enter") {
                                  e.preventDefault();
                                  if (e.currentTarget.value.trim()) {
                                    const val = e.currentTarget.value.trim();
                                    const updated = [...activeResume.skills];
                                    if (!updated[cIdx].skills.includes(val)) {
                                      updated[cIdx] = { ...updated[cIdx], skills: [...updated[cIdx].skills, val] };
                                      handleUpdateResume({ ...activeResume, skills: updated });
                                    }
                                    e.currentTarget.value = "";
                                  }
                                }`
);

fs.writeFileSync('src/components/ResumeBuilderPage.tsx', code);
console.log("Patched");
