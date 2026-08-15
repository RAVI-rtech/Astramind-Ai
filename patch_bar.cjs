const fs = require('fs');
let code = fs.readFileSync('src/components/ResumeBuilderPage.tsx', 'utf8');
code = code.replace(
  '          {/* View Toggle (Edit Form / Preview / Split) */}',
  `          {/* Extended Mode Toggle */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleUpdateResume({ ...activeResume, isExtended: !activeResume.isExtended })}
              className={\`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border \${
                activeResume.isExtended 
                  ? "bg-indigo-500/20 text-indigo-300 border-indigo-500/50 shadow-[0_0_10px_rgba(99,102,241,0.2)]" 
                  : "bg-white/5 text-slate-400 border-white/10 hover:text-white hover:bg-white/10"
              }\`}
            >
              <FilePlus className="w-3.5 h-3.5" />
              {activeResume.isExtended ? "Extended (Max 2 Pages)" : "Standard (1 Page)"}
            </button>
          </div>

          {/* View Toggle (Edit Form / Preview / Split) */}`
);
fs.writeFileSync('src/components/ResumeBuilderPage.tsx', code);
