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
    <div id="hero-landing-wrapper" className="relative min-h-[calc(100vh-6rem)] w-full flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 py-12 max-w-3xl mx-auto my-auto font-sans">
      {/* Variation 3 Ambient Studio Orb Background */}
      <div className="studio-orb pointer-events-none" />
      
      {/* Clean, Minimal Introduction */}
      <div className="relative z-10 flex flex-col items-center text-center space-y-4 mb-8 max-w-xl mx-auto">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono-studio tracking-wider bg-[#a78bfa]/10 border border-[#a78bfa]/25 text-[#a78bfa] uppercase">
          <span>{getGreeting()}, <span className="text-white font-semibold">{userName}</span></span>
        </div>

        <h1 className="font-serif-studio text-5xl sm:text-6xl md:text-7xl font-medium tracking-tight text-white leading-[0.92]">
          What would you like to explore?
        </h1>
        
        <p className="text-sm text-white/50 font-normal leading-relaxed max-w-md">
          Your focused workspace for reasoning, deep research, coding, and university problem solving.
        </p>
      </div>

      {/* Primary Centered Input Component - Only Element on Screen */}
      <div id="interactive-chat-box" className="relative z-10 w-full max-w-2xl mx-auto">
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


