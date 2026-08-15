import React, { useState } from "react";
import { Sparkles, Target, GraduationCap, Clock, Briefcase, X, Check } from "lucide-react";
import { PersonalProfile, SkillLevel } from "./learnTypes";

interface PersonalizationWizardProps {
  onClose: () => void;
  onSaveProfile: (profile: PersonalProfile) => void;
  initialProfile?: PersonalProfile;
}

export default function PersonalizationWizard({ onClose, onSaveProfile, initialProfile }: PersonalizationWizardProps) {
  const [skillLevel, setSkillLevel] = useState<SkillLevel>(initialProfile?.skillLevel || "Beginner");
  const [collegeYear, setCollegeYear] = useState<string>(initialProfile?.collegeYear || "Sophomore (2nd Year)");
  const [goals, setGoals] = useState<string>(initialProfile?.goals || "Build production full stack apps & master AI tools");
  const [weeklyHours, setWeeklyHours] = useState<number>(initialProfile?.weeklyHours || 10);
  const [targetJob, setTargetJob] = useState<string>(initialProfile?.targetJob || "AI / Full Stack Software Engineer");
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGeneratePersonalizedRoadmap = async () => {
    setIsGenerating(true);
    try {
      const promptText = `Generate a personalized structured learning roadmap for a student with the following profile:
- Skill Level: ${skillLevel}
- College Year / Status: ${collegeYear}
- Primary Learning Goals: ${goals}
- Weekly Study Commitment: ${weeklyHours} hours/week
- Target Job / Career Role: ${targetJob}

Return valid JSON with keys:
- title: string
- summary: string
- weeks: array of objects with keys: week (number), focus (string), tasks (array of 3 short actionable tasks)`;

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ sender: "user", text: promptText }],
          systemInstruction: "You are an executive tech career coach. Return ONLY valid JSON."
        })
      });

      const data = await res.json();
      const cleanJson = data.text.replace(/```json/g, "").replace(/```/g, "").trim();
      const parsedRoadmap = JSON.parse(cleanJson);

      const profile: PersonalProfile = {
        skillLevel,
        collegeYear,
        goals,
        weeklyHours,
        targetJob,
        generatedRoadmap: parsedRoadmap,
      };

      onSaveProfile(profile);
      onClose();
    } catch (e) {
      console.error("Failed to generate personalized roadmap", e);
      const fallbackProfile: PersonalProfile = {
        skillLevel,
        collegeYear,
        goals,
        weeklyHours,
        targetJob,
        generatedRoadmap: {
          title: `Personalized ${targetJob} Roadmap`,
          summary: `Customized ${weeklyHours}hr/week plan targeting ${targetJob}.`,
          weeks: [
            { week: 1, focus: "Foundations & Syntax Mastery", tasks: ["Master core control flow & data structures", "Solve 5 practice challenges", "Build CLI tool"] },
            { week: 2, focus: "Project Engineering & Frameworks", tasks: ["Build React/Express app", "Set up Git workflow", "Deploy live preview"] }
          ]
        }
      };
      onSaveProfile(fallbackProfile);
      onClose();
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-hidden animate-fadeIn">
      <div className="bg-[#0b0f24] border border-white/10 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl relative">
        <div className="p-5 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white">Personalize Your AI Learning Plan</h2>
              <p className="text-xs text-slate-400">Tailor courses, roadmaps, and daily goals to your exact career target</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl bg-white/5 text-slate-400 hover:text-white cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-5 overflow-y-auto flex-1 scrollbar-thin">
          {/* Skill Level Selection */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <Target className="w-4 h-4 text-indigo-400" />
              Current Skill Level
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(["Beginner", "Intermediate", "Advanced"] as SkillLevel[]).map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => setSkillLevel(lvl)}
                  className={`p-3 rounded-xl border text-xs font-bold text-center transition-all cursor-pointer ${
                    skillLevel === lvl
                      ? "bg-indigo-600 border-indigo-500 text-white shadow-lg"
                      : "bg-white/5 border-white/5 text-slate-400 hover:bg-white/10"
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>

          {/* College Year / Status */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <GraduationCap className="w-4 h-4 text-purple-400" />
              College Year / Student Status
            </label>
            <select
              value={collegeYear}
              onChange={(e) => setCollegeYear(e.target.value)}
              className="w-full bg-[#040612] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-indigo-500"
            >
              <option value="Freshman (1st Year)">Freshman (1st Year)</option>
              <option value="Sophomore (2nd Year)">Sophomore (2nd Year)</option>
              <option value="Junior (3rd Year)">Junior (3rd Year)</option>
              <option value="Senior (Final Year)">Senior (Final Year)</option>
              <option value="Graduate Student / Master's">Graduate Student / Master's</option>
              <option value="Self-Taught Developer">Self-Taught Developer</option>
            </select>
          </div>

          {/* Target Job Role */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <Briefcase className="w-4 h-4 text-emerald-400" />
              Target Job / Career Focus
            </label>
            <input
              type="text"
              value={targetJob}
              onChange={(e) => setTargetJob(e.target.value)}
              placeholder="e.g. Full Stack Developer, AI Engineer, Data Scientist"
              className="w-full bg-[#040612] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-indigo-500"
            />
          </div>

          {/* Weekly Study Hours */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5 justify-between">
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-amber-400" />
                Weekly Study Commitment
              </span>
              <span className="text-indigo-400 font-mono">{weeklyHours} Hours / Week</span>
            </label>
            <input
              type="range"
              min="2"
              max="30"
              step="1"
              value={weeklyHours}
              onChange={(e) => setWeeklyHours(Number(e.target.value))}
              className="w-full accent-indigo-500 cursor-pointer"
            />
          </div>

          {/* Primary Goals */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300">Primary Goal / Expectations</label>
            <textarea
              value={goals}
              onChange={(e) => setGoals(e.target.value)}
              placeholder="Describe what you want to achieve..."
              className="w-full h-20 bg-[#040612] border border-white/10 rounded-xl p-3 text-xs text-white outline-none focus:border-indigo-500 resize-none"
            />
          </div>
        </div>

        <div className="p-4 border-t border-white/10 bg-[#080c1d] flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 rounded-xl bg-white/5 text-slate-400 text-xs font-bold cursor-pointer">
            Cancel
          </button>
          <button
            onClick={handleGeneratePersonalizedRoadmap}
            disabled={isGenerating}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs shadow-lg cursor-pointer disabled:opacity-50 flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            <span>{isGenerating ? "Building AI Roadmap..." : "Generate Personalized Plan"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
