import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { Sparkles, Bot, FileText, Image, GraduationCap, History, ArrowRight, Mail, ShieldAlert, X } from "lucide-react";
import Logo from "./Logo";

interface WelcomeAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGoogleSignIn: () => void;
  onEmailSignIn: () => void;
  onGuestMode: () => void;
  accentColorClass?: string;
  authError?: string | null;
  isLoading?: boolean;
}

export default function WelcomeAuthModal({
  isOpen,
  onClose,
  onGoogleSignIn,
  onEmailSignIn,
  onGuestMode,
  accentColorClass = "from-blue-600 to-indigo-600",
  authError = null,
  isLoading = false,
}: WelcomeAuthModalProps) {
  if (!isOpen) return null;

  const features = [
    { icon: Bot, label: "AI Tutor", desc: "Interactive coding & subject guide" },
    { icon: FileText, label: "Resume Builder", desc: "ATS-optimized resume generator" },
    { icon: Image, label: "Image Generation", desc: "Multimodal AI visual creator" },
    { icon: GraduationCap, label: "Study Assistant", desc: "Personalized learning companion" },
    { icon: History, label: "Saved Chat History", desc: "Cloud sync across all devices" },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          {/* Translucent Backdrop showing Homepage underneath */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onGuestMode}
            className="fixed inset-0 bg-slate-950/75 backdrop-blur-md transition-all cursor-pointer"
          />

          {/* Modal Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: "spring", duration: 0.5, bounce: 0.2 }}
            className="relative w-full max-w-md bg-[#090d1f]/95 border border-white/15 rounded-3xl p-6 sm:p-8 shadow-[0_0_60px_rgba(59,130,246,0.25)] text-slate-100 z-10 overflow-hidden backdrop-blur-2xl"
          >
            {/* Ambient Background Glow */}
            <div className="absolute -top-20 -left-20 w-56 h-56 bg-blue-600/30 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-20 -right-20 w-56 h-56 bg-purple-600/30 rounded-full blur-3xl pointer-events-none" />

            {/* Dismiss Button */}
            <button
              onClick={onGuestMode}
              className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer z-20"
              title="Close & continue as guest"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>

            {/* AstraMind Header Branding */}
            <div className="flex flex-col items-center text-center space-y-3 mb-6">
              <Logo variant="splash" />
            </div>

            {/* Included Features List */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-2.5 mb-6 backdrop-blur-sm">
              <span className="text-[11px] font-bold text-indigo-300 uppercase tracking-wider block mb-1">
                Included Features
              </span>
              <div className="grid grid-cols-1 gap-2">
                {features.map((item, idx) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={idx}
                      className="flex items-center gap-3 p-2 rounded-xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/5 transition-all"
                    >
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-semibold text-white leading-tight">{item.label}</div>
                        <div className="text-[11px] text-slate-400 truncate">{item.desc}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Error Banner */}
            {authError && (
              <div className="mb-5 p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-200 text-xs font-medium flex items-start gap-2.5 shadow-lg animate-in fade-in duration-200">
                <ShieldAlert className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                <div className="flex-1 leading-relaxed break-words">
                  <div className="font-semibold text-rose-300 mb-0.5">Authentication Issue</div>
                  <span>{authError}</span>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-3">
              {/* Primary Button: Continue with Email */}
              <button
                onClick={onEmailSignIn}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-sm flex items-center justify-center gap-2.5 transition-all duration-200 cursor-pointer shadow-lg shadow-blue-500/25 active:scale-[0.98]"
              >
                <Mail className="w-4 h-4 text-blue-200" />
                <span>Continue with Email</span>
              </button>

              {/* Text Button: Continue as Guest (Limited Experience) */}
              <button
                onClick={onGuestMode}
                className="w-full py-2 text-center text-xs font-medium text-slate-400 hover:text-slate-200 transition-colors cursor-pointer flex items-center justify-center gap-1 group"
              >
                <span>Continue as Guest (Limited Experience)</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>

            {/* Footnote */}
            <p className="text-[10px] text-center text-slate-500 mt-5 leading-tight">
              By continuing, you agree to AstraMind&apos;s Terms of Service and Privacy Policy.
            </p>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
