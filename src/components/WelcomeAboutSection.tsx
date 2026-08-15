import React from "react";
import {
  Sparkles,
  GraduationCap,
  Code2,
  Compass,
  FileText,
  Brain,
  AlertTriangle,
  Globe,
  Wrench,
  BookOpen,
} from "lucide-react";

export default function WelcomeAboutSection() {
  const keyFeatures = [
    {
      icon: GraduationCap,
      text: "Personal AI Mentor for B.Tech Students",
      color: "text-blue-400 bg-blue-500/10 border-blue-500/20",
    },
    {
      icon: Code2,
      text: "Step-by-step Coding Guidance",
      color: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20",
    },
    {
      icon: Compass,
      text: "Personalized Career Roadmaps",
      color: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20",
    },
    {
      icon: FileText,
      text: "Resume Builder & Skill Development",
      color: "text-purple-400 bg-purple-500/10 border-purple-500/20",
    },
    {
      icon: Brain,
      text: "AI-powered Learning Assistant",
      color: "text-amber-400 bg-amber-500/10 border-amber-500/20",
    },
  ];

  return (
    <div className="w-full max-w-[650px] mx-auto space-y-6 text-slate-100 font-sans">
      {/* Header Section */}
      <div className="p-6 sm:p-8 rounded-[24px] bg-[#090d1f]/90 border border-white/15 backdrop-blur-2xl shadow-2xl space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5 text-blue-400" />
          <span>AstraMind AI Platform</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
          <span>🚀 Welcome to AstraMind AI</span>
        </h1>
        <p className="text-sm sm:text-base font-semibold text-blue-300">
          Your Personal AI Mentor for B.Tech Students
        </p>
        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed pt-1">
          AstraMind AI is designed to support engineering students throughout their learning journey by providing personalized guidance and AI-powered assistance.
        </p>
      </div>

      {/* Key Features Card */}
      <div className="p-6 sm:p-8 rounded-[24px] bg-white/[0.03] border border-white/15 backdrop-blur-2xl shadow-2xl space-y-4">
        <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-blue-400 flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-blue-400" />
          <span>Key Features</span>
        </h2>
        <div className="space-y-3">
          {keyFeatures.map((feat, idx) => {
            const IconComp = feat.icon;
            return (
              <div
                key={idx}
                className="flex items-center gap-3 p-3 rounded-2xl bg-white/[0.02] hover:bg-white/[0.06] border border-white/5 hover:border-white/15 transition-all duration-200 group cursor-default"
              >
                <div className={`p-2.5 rounded-xl border ${feat.color} shrink-0 group-hover:scale-110 transition-transform`}>
                  <IconComp className="w-4 h-4" />
                </div>
                <span className="text-xs sm:text-sm text-slate-200 font-medium group-hover:text-white transition-colors">
                  {feat.text}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Important Notice Card */}
      <div className="p-6 sm:p-8 rounded-[24px] bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-amber-500/10 border border-amber-500/30 text-amber-200 backdrop-blur-2xl shadow-2xl space-y-3">
        <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
          <span>Important Notice</span>
        </h2>
        <div className="space-y-2.5 text-xs sm:text-sm text-amber-100/90 leading-relaxed font-medium">
          <div className="flex items-start gap-2.5">
            <span className="shrink-0 text-amber-400">⚠</span>
            <span>AstraMind AI is currently under active development.</span>
          </div>
          <div className="flex items-start gap-2.5">
            <Globe className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <span>This version has been deployed for testing and demonstration purposes only.</span>
          </div>
          <div className="flex items-start gap-2.5">
            <Wrench className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <span>Some features may be incomplete or subject to change as we continue improving the platform.</span>
          </div>
        </div>
      </div>

      {/* Footer Text */}
      <div className="text-center text-xs sm:text-sm font-semibold text-slate-300 italic bg-white/[0.02] p-4 rounded-2xl border border-white/5">
        Thank you for exploring AstraMind AI and being a part of its journey. 🚀
      </div>
    </div>
  );
}
