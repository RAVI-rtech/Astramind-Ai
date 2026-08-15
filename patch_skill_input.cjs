const fs = require('fs');
let code = fs.readFileSync('src/components/ResumeBuilderPage.tsx', 'utf8');

// Insert SkillInput component before the ResumeBuilderPage component definition
const componentRegex = /export default function ResumeBuilderPage\(/;

if (!code.includes('const SkillInput =')) {
  code = code.replace(
    componentRegex,
    `const SkillInput = ({ categoryIndex, onAddSkill }: { categoryIndex: number, onAddSkill: (idx: number, skill: string) => void }) => {
  const [value, setValue] = useState("");
  return (
    <input
      type="text"
      placeholder="Type a skill and press Enter..."
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          if (value.trim()) {
            onAddSkill(categoryIndex, value.trim());
            setValue("");
          }
        }
      }}
      className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white outline-none focus:border-indigo-500"
    />
  );
};

export default function ResumeBuilderPage(`
  );
}

// Replace the existing input with the new component
const inputBlockRegex = /<div className="pt-2">\s*<input[\s\S]*?className="w-full bg-slate-800 border border-\w+\/10 rounded-lg px-3 py-1.5 text-xs text-white outline-none focus:border-indigo-500"\s*\/>\s*<\/div>/;

code = code.replace(
  inputBlockRegex,
  `<div className="pt-2">
                            <SkillInput 
                              categoryIndex={cIdx} 
                              onAddSkill={(idx, skillVal) => {
                                const updated = [...activeResume.skills];
                                if (!updated[idx].skills.includes(skillVal)) {
                                  updated[idx] = { ...updated[idx], skills: [...updated[idx].skills, skillVal] };
                                  handleUpdateResume({ ...activeResume, skills: updated });
                                }
                              }} 
                            />
                          </div>`
);

fs.writeFileSync('src/components/ResumeBuilderPage.tsx', code);
console.log("Patched SkillInput");
