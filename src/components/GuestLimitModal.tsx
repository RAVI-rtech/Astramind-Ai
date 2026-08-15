import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { Lock, Sparkles, X, ShieldAlert } from "lucide-react";

interface GuestLimitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSignIn: () => void;
  limit?: number;
}

export default function GuestLimitModal({
  isOpen,
  onClose,
  onSignIn,
  limit = 3,
}: GuestLimitModalProps) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-md cursor-pointer"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="relative w-full max-w-sm bg-[#0a0e24] border border-blue-500/30 rounded-3xl p-6 shadow-2xl text-slate-100 z-10 overflow-hidden"
          >
            {/* Ambient Top Glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-24 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-cyan-500/20 blur-2xl pointer-events-none" />

            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex flex-col items-center text-center space-y-3 pt-2">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-lg">
                <Lock className="w-6 h-6" />
              </div>

              <div>
                <h3 className="text-xl font-bold text-white">Guest AI Limit Reached</h3>
                <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
                  You&apos;ve used your <span className="font-semibold text-amber-300">{limit} free guest queries</span>. Sign in or create a free AstraMind account to unlock unlimited AI features!
                </p>
              </div>

              <div className="w-full pt-3 space-y-2">
                <button
                  onClick={onSignIn}
                  className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-blue-500/20"
                >
                  <Sparkles className="w-4 h-4 text-blue-200" />
                  <span>Sign In / Create Free Account</span>
                </button>

                <button
                  onClick={onClose}
                  className="w-full py-1.5 text-center text-xs text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                >
                  Continue Browsing
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
