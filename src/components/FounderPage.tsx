import React from "react";
import { Crown, Sparkles, ExternalLink, Globe, Github, Linkedin, GraduationCap, HeartHandshake, User } from "lucide-react";

export default function FounderPage() {
  return (
    <div id="founder-page-container" className="flex-1 overflow-y-auto z-10 px-4 sm:px-6 py-10 max-w-[850px] mx-auto w-full space-y-8 scrollbar-thin animate-fade-in">
      
      {/* Hero Section */}
      <div className="flex flex-col items-center text-center space-y-4 py-4">
        
        {/* Founder Avatar */}
        <div className="relative group mb-2">
          <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-gradient-to-br from-amber-400 via-amber-500 to-purple-600 p-[2.5px] shadow-2xl shadow-amber-500/20 shrink-0">
            <div className="w-full h-full bg-[#0b0f19] rounded-full flex flex-col items-center justify-center border border-white/10 relative overflow-hidden">
              <span className="text-3xl font-black bg-gradient-to-r from-amber-200 via-amber-300 to-amber-400 bg-clip-text text-transparent font-mono tracking-tight">
                KRC
              </span>
              <span className="text-[8px] font-mono tracking-widest text-amber-400/80 uppercase mt-0.5">FOUNDER</span>
            </div>
          </div>
          <div className="absolute bottom-0 right-0 p-2 rounded-full bg-amber-400 text-slate-950 shadow-lg border-2 border-slate-950">
            <Crown className="w-4 h-4 fill-slate-950" />
          </div>
        </div>

        {/* Title & Name */}
        <div className="space-y-1">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight font-mono uppercase">
            KOLLOJU RAVI CHARAN
          </h1>
          <p className="text-sm font-semibold text-amber-400/90 tracking-wide uppercase font-mono">
            Founder &amp; Developer
          </p>
        </div>

        {/* Tagline Quote */}
        <p className="text-slate-300 italic text-base max-w-lg leading-relaxed pt-1 font-serif">
          "Building AI that makes education accessible for every student."
        </p>

        {/* Primary Action Button */}
        <div className="pt-2">
          <a
            href="https://astramind.ai.studio"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2.5 px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-500 via-purple-600 to-indigo-600 hover:from-amber-400 hover:to-indigo-500 text-white font-bold text-xs tracking-wide shadow-xl shadow-amber-500/10 border border-white/20 transition-all cursor-pointer active:scale-95"
          >
            <Sparkles className="w-4 h-4 text-amber-300 fill-amber-300/30" />
            <span>Visit AstraMind</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* About Card */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-white/10 space-y-3 shadow-xl">
        <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
          <User className="w-4 h-4" />
          <span>About</span>
        </h2>
        <p className="text-slate-300 text-sm leading-relaxed">
          I am Ravi Charan, the founder and developer of AstraMind AI. My mission is to build a modern AI-powered learning platform that helps students learn coding, improve skills, and access high-quality educational resources with an elegant and simple experience.
        </p>
      </div>

      {/* Education Card */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white/[0.03] backdrop-blur-2xl border border-white/10 hover:border-amber-500/30 hover:bg-white/[0.06] hover:-translate-y-1 hover:shadow-2xl hover:shadow-amber-500/10 transition-all duration-300 space-y-4 shadow-xl group">
        <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
          <GraduationCap className="w-4 h-4 group-hover:scale-110 transition-transform" />
          <span>Education</span>
        </h2>
        <ul className="space-y-2.5 text-sm text-slate-300">
          <li className="flex items-start gap-2.5">
            <span className="text-amber-400 text-base leading-none">•</span>
            <span>Aurobindo Public School</span>
          </li>
          <li className="flex items-start gap-2.5">
            <span className="text-amber-400 text-base leading-none">•</span>
            <span>Pragathi Junior College</span>
          </li>
          <li className="flex items-start gap-2.5">
            <span className="text-amber-400 text-base leading-none">•</span>
            <div>
              <span className="font-semibold text-white">Vignan Institute of Technology &amp; Science</span>
              <p className="text-xs text-slate-400 mt-0.5">B.Tech – CSE (AI &amp; ML)</p>
            </div>
          </li>
        </ul>
      </div>

      {/* Mission Card */}
      <div className="p-6 sm:p-8 rounded-3xl border border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-purple-600/10 to-indigo-600/10 backdrop-blur-2xl hover:border-amber-400/50 hover:from-amber-500/15 hover:via-purple-600/15 hover:to-indigo-600/15 hover:-translate-y-1 hover:shadow-2xl hover:shadow-amber-500/20 transition-all duration-300 space-y-3 shadow-xl group">
        <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
          <HeartHandshake className="w-4 h-4 group-hover:scale-110 transition-transform" />
          <span>Mission</span>
        </h2>
        <p className="text-lg font-bold text-white italic tracking-tight font-serif">
          "Democratizing AI-powered education for every student."
        </p>
      </div>

      {/* Links Card */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-white/10 space-y-4 shadow-xl">
        <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
          <Globe className="w-4 h-4" />
          <span>Links</span>
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <a
            href="https://astramind.ai.studio"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between p-3.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-semibold transition-all group"
          >
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform" />
              <span>Website</span>
            </div>
            <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-white" />
          </a>

          <a
            href="https://github.com/RAVI-rtech"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between p-3.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-semibold transition-all group"
          >
            <div className="flex items-center gap-2">
              <Github className="w-4 h-4 text-purple-400 group-hover:scale-110 transition-transform" />
              <span>GitHub</span>
            </div>
            <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-white" />
          </a>

          <a
            href="https://www.linkedin.com/in/ravi-charan-066388421"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between p-3.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-semibold transition-all group"
          >
            <div className="flex items-center gap-2">
              <Linkedin className="w-4 h-4 text-blue-400 group-hover:scale-110 transition-transform" />
              <span>LinkedIn</span>
            </div>
            <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-white" />
          </a>
        </div>
      </div>

    </div>
  );
}
