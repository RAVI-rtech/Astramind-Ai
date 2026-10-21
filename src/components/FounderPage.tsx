import React from "react";
import { Crown, Sparkles, ExternalLink, Globe, Github, Linkedin, GraduationCap, HeartHandshake, User } from "lucide-react";

export default function FounderPage() {
  return (
    <div id="founder-page-container" className="relative min-h-full w-full bg-[#0d0d0e] text-[#fcfcfc] py-8 px-4 sm:px-6 lg:px-8 overflow-hidden font-sans">
      {/* Variation 3 Ambient Studio Orb Background */}
      <div className="studio-orb pointer-events-none" />

      <div className="relative z-10 max-w-3xl mx-auto space-y-8">
        
        {/* Hero Section */}
        <div className="flex flex-col items-center text-center space-y-4 py-4">
          
          {/* Founder Avatar */}
          <div className="relative group mb-1">
            <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-3xl bg-gradient-to-tr from-[#1f1b2e] via-[#1a1728] to-[#2d224d] p-[2px] shadow-2xl border border-[#a78bfa]/40 shrink-0">
              <div className="w-full h-full bg-[#151517] rounded-3xl flex flex-col items-center justify-center relative overflow-hidden">
                <span className="font-serif-studio text-3xl sm:text-4xl font-medium text-[#a78bfa] tracking-tight">
                  KRC
                </span>
                <span className="text-[9px] font-mono-studio tracking-widest text-[#a78bfa]/70 uppercase mt-0.5">FOUNDER</span>
              </div>
            </div>
            <div className="absolute -bottom-1 -right-1 p-2 rounded-full bg-white text-[#0d0d0e] shadow-lg border border-white/20">
              <Crown className="w-3.5 h-3.5 fill-[#0d0d0e]" />
            </div>
          </div>

          {/* Title & Name */}
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono-studio tracking-wider bg-[#a78bfa]/10 border border-[#a78bfa]/25 text-[#a78bfa] mb-1">
              <span>AstraMind AI Founder</span>
            </div>
            <h1 className="font-serif-studio text-4xl sm:text-5xl font-medium text-white tracking-tight">
              Kolloju Ravi Charan
            </h1>
            <p className="text-xs sm:text-sm font-mono-studio uppercase tracking-wider text-[#a78bfa]">
              Founder &amp; Chief Architect
            </p>
          </div>

          {/* Tagline Quote */}
          <p className="text-white/60 italic text-base max-w-lg leading-relaxed font-serif-studio">
            "Building AI that makes university-level education accessible and delightful for every student."
          </p>

          {/* Primary Action Button */}
          <div className="pt-2">
            <a
              href="https://astramind.ai.studio"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-white text-[#0d0d0e] hover:bg-slate-200 text-xs sm:text-sm font-semibold transition-all shadow-md hover:scale-[1.02] cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#a78bfa]" />
              <span>Visit AstraMind Platform</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* About Card */}
        <div className="p-6 sm:p-8 rounded-[28px] bg-[#151517] border border-white/[0.06] space-y-3 shadow-xl">
          <div className="flex items-center gap-2 pb-2 border-b border-white/[0.06]">
            <User className="w-4 h-4 text-[#a78bfa]" />
            <h2 className="text-xs font-mono-studio font-bold uppercase tracking-wider text-white/40">
              About
            </h2>
          </div>
          <p className="text-white/70 text-sm leading-relaxed font-normal">
            I am Ravi Charan, the founder and developer of AstraMind AI. My mission is to build a modern AI-powered learning platform that helps students learn coding, master curriculum concepts, and access high-quality educational resources with an elegant and simple studio experience.
          </p>
        </div>

        {/* Education Card */}
        <div className="p-6 sm:p-8 rounded-[28px] bg-[#151517] border border-white/[0.06] space-y-4 shadow-xl">
          <div className="flex items-center gap-2 pb-2 border-b border-white/[0.06]">
            <GraduationCap className="w-4 h-4 text-[#a78bfa]" />
            <h2 className="text-xs font-mono-studio font-bold uppercase tracking-wider text-white/40">
              Education &amp; Background
            </h2>
          </div>
          <ul className="space-y-3 text-sm text-white/70">
            <li className="flex items-start gap-2.5">
              <span className="text-[#a78bfa] text-base leading-none">•</span>
              <span>Aurobindo Public School</span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="text-[#a78bfa] text-base leading-none">•</span>
              <span>Pragathi Junior College</span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="text-[#a78bfa] text-base leading-none">•</span>
              <div>
                <span className="font-medium text-white">Vignan Institute of Technology &amp; Science</span>
                <p className="text-xs text-white/40 mt-0.5 font-mono-studio">B.Tech – CSE (AI &amp; ML)</p>
              </div>
            </li>
          </ul>
        </div>

        {/* Mission Card */}
        <div className="p-6 sm:p-8 rounded-[28px] bg-[#151517] border border-white/[0.06] space-y-3 shadow-xl">
          <div className="flex items-center gap-2 pb-2 border-b border-white/[0.06]">
            <HeartHandshake className="w-4 h-4 text-[#a78bfa]" />
            <h2 className="text-xs font-mono-studio font-bold uppercase tracking-wider text-white/40">
              Vision &amp; Philosophy
            </h2>
          </div>
          <p className="text-xl font-medium text-white italic tracking-tight font-serif-studio">
            "Democratizing AI-powered education for every student."
          </p>
        </div>

        {/* Links Card */}
        <div className="p-6 sm:p-8 rounded-[28px] bg-[#151517] border border-white/[0.06] space-y-4 shadow-xl">
          <div className="flex items-center gap-2 pb-2 border-b border-white/[0.06]">
            <Globe className="w-4 h-4 text-[#a78bfa]" />
            <h2 className="text-xs font-mono-studio font-bold uppercase tracking-wider text-white/40">
              Connect &amp; Profiles
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <a
              href="https://astramind.ai.studio"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-3.5 rounded-2xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] text-white text-xs font-medium transition-all group"
            >
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-[#a78bfa] group-hover:scale-105 transition-transform" />
                <span>Website</span>
              </div>
              <ExternalLink className="w-3.5 h-3.5 text-white/40 group-hover:text-white" />
            </a>

            <a
              href="https://github.com/RAVI-rtech"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-3.5 rounded-2xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] text-white text-xs font-medium transition-all group"
            >
              <div className="flex items-center gap-2">
                <Github className="w-4 h-4 text-[#a78bfa] group-hover:scale-105 transition-transform" />
                <span>GitHub</span>
              </div>
              <ExternalLink className="w-3.5 h-3.5 text-white/40 group-hover:text-white" />
            </a>

            <a
              href="https://www.linkedin.com/in/ravi-charan-066388421"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-3.5 rounded-2xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] text-white text-xs font-medium transition-all group"
            >
              <div className="flex items-center gap-2">
                <Linkedin className="w-4 h-4 text-[#a78bfa] group-hover:scale-105 transition-transform" />
                <span>LinkedIn</span>
              </div>
              <ExternalLink className="w-3.5 h-3.5 text-white/40 group-hover:text-white" />
            </a>
          </div>
        </div>

      </div>
    </div>
  );
}
