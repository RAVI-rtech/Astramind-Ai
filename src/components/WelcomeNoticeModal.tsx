import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
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
  ArrowRight,
  X,
  BookOpen,
} from "lucide-react";

interface WelcomeNoticeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLearnMore?: () => void;
}

export default function WelcomeNoticeModal({
  isOpen,
  onClose,
  onLearnMore,
}: WelcomeNoticeModalProps) {
  const [dontShowToday, setDontShowToday] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        handleClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, dontShowToday]);

  if (!isOpen) return null;

  const handleClose = () => {
    if (dontShowToday) {
      const expiry = Date.now() + 86400000; // 24 hours
      localStorage.setItem("astramind_hide_welcome_notice_until", expiry.toString());
    }
    onClose();
  };

  const handleLearnMoreClick = () => {
    if (dontShowToday) {
      const expiry = Date.now() + 86400000;
      localStorage.setItem("astramind_hide_welcome_notice_until", expiry.toString());
    }
    if (onLearnMore) {
      onLearnMore();
    } else {
      onClose();
    }
  };

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
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
          {/* Backdrop with Blur and Darken */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-xl transition-all cursor-pointer"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: "spring", duration: 0.5, bounce: 0.15 }}
            className="relative w-full max-w-[650px] max-h-[90vh] bg-[#090d1f]/95 border border-white/15 rounded-[24px] p-5 sm:p-7 shadow-[0_0_80px_rgba(59,130,246,0.2)] text-slate-100 z-10 overflow-y-auto scrollbar-none no-scrollbar backdrop-blur-2xl flex flex-col my-auto"
          >
            {/* Ambient Lighting FX */}
            <div className="absolute -top-24 -left-24 w-64 h-64 bg-blue-600/25 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />

            {/* Close Button */}
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all cursor-pointer z-20"
              aria-label="Close dialog"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header Section */}
            <div className="space-y-2 mb-6">
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

            <div className="w-full h-px bg-white/10 my-1" />

            {/* Key Features Card */}
            <div className="my-5 p-4 sm:p-5 rounded-2xl bg-white/[0.03] border border-white/10 shadow-lg space-y-3">
              <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-blue-400 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-blue-400" />
                <span>Key Features</span>
              </h2>
              <div className="space-y-2.5">
                {keyFeatures.map((feat, idx) => {
                  const IconComp = feat.icon;
                  return (
                    <div
                      key={idx}
                      className="flex items-center gap-3 p-2.5 rounded-xl bg-white/[0.02] hover:bg-white/[0.06] border border-white/5 hover:border-white/15 transition-all duration-200 group cursor-default"
                    >
                      <div className={`p-2 rounded-xl border ${feat.color} shrink-0 group-hover:scale-110 transition-transform`}>
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
            <div className="my-2 p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-amber-500/10 border border-amber-500/30 text-amber-200 shadow-lg space-y-3">
              <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Important Notice</span>
              </h2>
              <div className="space-y-2 text-xs sm:text-sm text-amber-100/90 leading-relaxed font-medium">
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

            {/* Footer Quote */}
            <div className="mt-5 mb-6 text-center text-xs sm:text-sm font-semibold text-slate-300 italic bg-white/[0.02] p-3 rounded-xl border border-white/5">
              Thank you for exploring AstraMind AI and being a part of its journey. 🚀
            </div>

            {/* Controls Row */}
            <div className="pt-2 border-t border-white/10 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
              {/* Bottom Left Checkbox */}
              <label className="flex items-center gap-2.5 text-xs text-slate-300 hover:text-white cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={dontShowToday}
                  onChange={(e) => setDontShowToday(e.target.checked)}
                  className="w-4 h-4 rounded border-white/20 bg-white/10 text-blue-600 focus:ring-blue-500 cursor-pointer accent-blue-600"
                />
                <span className="font-medium">Don't show again today</span>
              </label>

              {/* Action Buttons */}
              <div className="flex items-center gap-2.5 justify-end">
                <button
                  onClick={handleLearnMoreClick}
                  className="px-4 py-2.5 min-h-[44px] rounded-xl bg-white/10 hover:bg-white/15 text-slate-200 hover:text-white font-semibold text-xs sm:text-sm transition-all cursor-pointer border border-white/10 active:scale-95"
                >
                  Learn More
                </button>
                <button
                  onClick={handleClose}
                  className="px-5 py-2.5 min-h-[44px] rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs sm:text-sm transition-all shadow-lg shadow-blue-600/30 cursor-pointer border border-blue-400/30 flex items-center gap-1.5 active:scale-95"
                >
                  <span>Continue</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
