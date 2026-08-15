import React from "react";
import ChatInput from "./ChatInput";
import { UserProfile } from "../types";

interface HeroLandingProps {
  onSend: (text: string, attachment?: any, options?: any) => void;
  isLoading: boolean;
  userProfile?: UserProfile | null;
  isAuthenticated?: boolean;
  accentColorClass: string;
  onOpenLive: () => void;
  onOpenSettings: () => void;
  onStartChatting: () => void;
  onOpenFounder?: () => void;
}

export default function HeroLanding({
  onSend,
  isLoading,
  userProfile,
  isAuthenticated = false,
  accentColorClass,
  onOpenLive,
}: HeroLandingProps) {

  // Greeting time calculation
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  const userName = (isAuthenticated && userProfile?.name) ? userProfile.name.split(" ")[0] : "there";

  return (
    <div id="hero-landing-wrapper" className="relative z-10 w-full min-h-[calc(100vh-6rem)] flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 py-12 max-w-3xl mx-auto my-auto">
      
      {/* Clean, Minimal Introduction */}
      <div className="flex flex-col items-center text-center space-y-4 mb-8 max-w-xl mx-auto">
        <p className="text-xs font-mono font-medium tracking-widest text-purple-400 uppercase">
          {getGreeting()}, <span className="text-slate-200 font-semibold">{userName}</span>
        </p>

        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-white leading-tight">
          What would you like to explore?
        </h1>
        
        <p className="text-sm text-slate-400 font-normal leading-relaxed max-w-md">
          Your focused workspace for reasoning, deep research, coding, and problem solving.
        </p>
      </div>

      {/* Primary Centered Input Component - Only Element on Screen */}
      <div id="interactive-chat-box" className="w-full max-w-2xl mx-auto">
        <ChatInput
          onSend={onSend}
          isLoading={isLoading}
          variant="centered"
          accentColorClass={accentColorClass}
          onOpenLive={onOpenLive}
        />
      </div>

    </div>
  );
}


