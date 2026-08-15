import React, { useState, useEffect, useRef } from "react";
import { X, Sparkles } from "lucide-react";

export interface LogoProps {
  className?: string;
  iconOnly?: boolean;
  variant?: "default" | "navbar" | "header" | "sidebar" | "mobile" | "login" | "splash" | "card" | "footer";
  size?: "sm" | "md" | "lg" | "xl" | number;
  disablePopup?: boolean;
}

export function AppLogo({
  className = "",
  iconOnly = false,
  variant = "default",
  size,
  disablePopup = false
}: LogoProps) {
  const [hasError, setHasError] = useState(false);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [lastTap, setLastTap] = useState(0);
  const hoverTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Close popup modal on Escape key press & clean up timer on unmount
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsPopupOpen(false);
      }
    };
    if (isPopupOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      if (hoverTimerRef.current) {
        clearTimeout(hoverTimerRef.current);
      }
    };
  }, [isPopupOpen]);

  // Handle double tap detection for touch devices
  const handleTouchEnd = () => {
    const now = Date.now();
    if (now - lastTap < 350) {
      if (!disablePopup) {
        setIsPopupOpen(true);
      }
    }
    setLastTap(now);
  };

  // 5-second continuous hover to trigger logo popup
  const handleMouseEnter = () => {
    if (!disablePopup) {
      if (hoverTimerRef.current) {
        clearTimeout(hoverTimerRef.current);
      }
      hoverTimerRef.current = setTimeout(() => {
        setIsPopupOpen(true);
      }, 5000);
    }
  };

  // Cancel hover timer if cursor leaves before 5 seconds
  const handleMouseLeave = () => {
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }
  };

  const handleDoubleClick = () => {
    if (!disablePopup) {
      if (hoverTimerRef.current) {
        clearTimeout(hoverTimerRef.current);
        hoverTimerRef.current = null;
      }
      setIsPopupOpen(true);
    }
  };

  // Render popup modal lightbox
  const renderPopupModal = () => {
    if (!isPopupOpen || disablePopup) return null;

    return (
      <div
        id="logo-popup-modal-backdrop"
        onClick={(e) => {
          e.stopPropagation();
          setIsPopupOpen(false);
        }}
        className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-[#09090B]/85 backdrop-blur-xl animate-in fade-in duration-200"
      >
        <div
          id="logo-popup-card"
          onClick={(e) => e.stopPropagation()}
          className="relative max-w-sm sm:max-w-md w-full bg-[#0f1424]/95 border border-white/15 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-black/80 flex flex-col items-center text-center space-y-5 backdrop-blur-2xl animate-in zoom-in-95 duration-200"
        >
          {/* Close Button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsPopupOpen(false);
            }}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors cursor-pointer"
            title="Close preview"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Header Tag */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Official AstraMind Brand Logo</span>
          </div>

          {/* High Res Logo Showcase */}
          <div className="relative w-48 h-48 sm:w-56 sm:h-56 p-3 rounded-2xl bg-[#0a0d18] border border-white/10 shadow-[0_0_24px_rgba(255,255,255,0.12)] flex items-center justify-center">
            <img
              src="/logo.png"
              alt="AstraMind AI Official Logo"
              className="w-full h-full object-contain rounded-xl"
            />
          </div>

          {/* Brand Description */}
          <div className="space-y-1">
            <h3 className="text-xl font-bold text-white tracking-tight uppercase">
              ASTRAMIND AI
            </h3>
            <p className="text-xs text-slate-400 font-medium">
              Intelligence • Learn • Build
            </p>
          </div>

          {/* Action Button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsPopupOpen(false);
            }}
            className="w-full py-2.5 rounded-full bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-all shadow-md cursor-pointer hover:scale-[1.01]"
          >
            Close Preview
          </button>
        </div>
      </div>
    );
  };

  // If image fails to load, render developer warning
  if (hasError) {
    return (
      <div className={`inline-flex items-center justify-center p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-mono text-center ${className}`}>
        Logo file not found. Please add logo.png to the public folder.
      </div>
    );
  }

  // Determine logo dimensions based on variant or size prop
  let logoSizeClass = "w-[36px] h-[36px]"; // default navbar size
  if (variant === "splash") {
    logoSizeClass = "w-[128px] h-[128px]";
  } else if (variant === "login") {
    logoSizeClass = "w-[96px] h-[96px]";
  } else if (variant === "sidebar") {
    logoSizeClass = "w-[40px] h-[40px]";
  } else if (variant === "navbar" || variant === "header") {
    logoSizeClass = "w-[32px] h-[32px] md:w-[36px] md:h-[36px]";
  } else if (variant === "mobile") {
    logoSizeClass = "w-[32px] h-[32px]";
  } else if (variant === "footer" || variant === "card" || size === "sm") {
    logoSizeClass = "w-[28px] h-[28px]";
  }

  // Splash Screen Variant (128px)
  if (variant === "splash") {
    return (
      <>
        <div
          id="astramind-splash-logo"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onDoubleClick={handleDoubleClick}
          onTouchEnd={handleTouchEnd}
          className={`flex flex-col items-center justify-center text-center space-y-4 cursor-pointer select-none ${className}`}
        >
          <div className="relative flex items-center justify-center w-[128px] h-[128px] shrink-0 p-2 rounded-3xl border border-white/10 bg-[#0f1424] shadow-[0_0_12px_rgba(255,255,255,0.08)]">
            <img
              src="/logo.png"
              alt="AstraMind AI"
              className="w-full h-full object-contain rounded-2xl"
              onError={() => setHasError(true)}
            />
          </div>
          {!iconOnly && (
            <div className="flex flex-col items-center gap-1.5">
              <span className="text-2xl sm:text-3xl font-semibold tracking-[-0.02em] text-[#FFFFFF] font-sans uppercase leading-none">
                ASTRAMIND
              </span>
              <span className="text-xs sm:text-[13px] font-medium text-[#A1A1AA] tracking-normal font-sans">
                Learn. Build. Innovate.
              </span>
            </div>
          )}
        </div>
        {renderPopupModal()}
      </>
    );
  }

  // Login Page Variant (96px)
  if (variant === "login") {
    return (
      <>
        <div
          id="astramind-login-logo"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onDoubleClick={handleDoubleClick}
          onTouchEnd={handleTouchEnd}
          className={`flex flex-col items-center justify-center text-center space-y-3 cursor-pointer select-none ${className}`}
        >
          <div className="relative flex items-center justify-center w-[96px] h-[96px] shrink-0 p-2 rounded-2xl border border-white/10 bg-[#0f1424] shadow-[0_0_12px_rgba(255,255,255,0.08)]">
            <img
              src="/logo.png"
              alt="AstraMind AI"
              className="w-full h-full object-contain rounded-xl"
              onError={() => setHasError(true)}
            />
          </div>
          {!iconOnly && (
            <div className="flex flex-col items-center gap-1">
              <span className="text-xl font-semibold tracking-[-0.02em] text-[#FFFFFF] font-sans uppercase leading-none">
                ASTRAMIND
              </span>
              <span className="text-[12px] font-medium text-[#A1A1AA] font-sans">
                Intelligence • Learn • Build
              </span>
            </div>
          )}
        </div>
        {renderPopupModal()}
      </>
    );
  }

  // Desktop Sidebar Variant (40px)
  if (variant === "sidebar") {
    return (
      <>
        <div
          id="astramind-sidebar-logo"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onDoubleClick={handleDoubleClick}
          onTouchEnd={handleTouchEnd}
          className={`flex items-center gap-[12px] cursor-pointer select-none ${className}`}
        >
          <div className="relative flex items-center justify-center w-[40px] h-[40px] shrink-0 p-1 rounded-xl border border-white/10 bg-[#0f1424] shadow-[0_0_12px_rgba(255,255,255,0.08)]">
            <img
              src="/logo.png"
              alt="AstraMind AI"
              className="w-full h-full object-contain rounded-lg"
              onError={() => setHasError(true)}
            />
          </div>
          {!iconOnly && (
            <div className="flex flex-col justify-center gap-y-[2px]">
              <span className="text-[16px] font-semibold tracking-[-0.02em] text-[#FFFFFF] font-sans uppercase leading-none">
                ASTRAMIND
              </span>
              <span className="text-[12px] font-medium text-[#A1A1AA] font-sans leading-none">
                Intelligence • Learn • Build
              </span>
            </div>
          )}
        </div>
        {renderPopupModal()}
      </>
    );
  }

  // Footer / Card Variant (28px)
  if (variant === "footer" || variant === "card" || size === "sm") {
    return (
      <>
        <div
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onDoubleClick={handleDoubleClick}
          onTouchEnd={handleTouchEnd}
          className={`flex items-center gap-[12px] cursor-pointer select-none ${className}`}
        >
          <div className="relative flex items-center justify-center w-[28px] h-[28px] shrink-0 p-0.5 rounded-lg border border-white/10 bg-[#0f1424] shadow-[0_0_12px_rgba(255,255,255,0.08)]">
            <img
              src="/logo.png"
              alt="AstraMind AI"
              className="w-full h-full object-contain rounded-md"
              onError={() => setHasError(true)}
            />
          </div>
          {!iconOnly && (
            <span className="text-sm font-semibold tracking-[-0.02em] text-[#FFFFFF] font-sans uppercase">
              ASTRAMIND
            </span>
          )}
        </div>
        {renderPopupModal()}
      </>
    );
  }

  // Navbar / Header / Default Logo (36px desktop, 32px mobile)
  return (
    <>
      <div
        id="astramind-logo-container"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onDoubleClick={handleDoubleClick}
        onTouchEnd={handleTouchEnd}
        className={`flex items-center gap-[12px] cursor-pointer select-none ${className}`}
      >
        <div
          id="logo-badge-wrapper"
          className={`relative flex items-center justify-center ${logoSizeClass} shrink-0 p-1 rounded-xl border border-white/10 bg-[#0f1424] shadow-[0_0_12px_rgba(255,255,255,0.08)]`}
        >
          <img
            src="/logo.png"
            alt="AstraMind AI"
            className="w-full h-full object-contain rounded-lg"
            onError={() => setHasError(true)}
          />
        </div>

        {!iconOnly && (
          <div id="logo-text-wrapper" className="flex flex-col justify-center gap-y-[2px]">
            <span
              id="logo-brand-title"
              className="text-[15px] sm:text-[16px] md:text-[17px] font-semibold tracking-[-0.02em] text-[#FFFFFF] font-sans uppercase leading-none"
            >
              ASTRAMIND
            </span>
            <span
              id="logo-brand-subtitle"
              className="text-[12px] font-medium text-[#A1A1AA] font-sans leading-none"
            >
              <span className="hidden xl:inline">Intelligence • Learn • Build</span>
              <span className="hidden md:inline xl:hidden">AI Learning Platform</span>
              <span className="inline md:hidden">Learn • Build • Innovate</span>
            </span>
          </div>
        )}
      </div>
      {renderPopupModal()}
    </>
  );
}

export default AppLogo;

