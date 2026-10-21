import React, { useEffect, useRef } from "react";
import { ADSENSE_CONFIG, isAdSenseConfigured, isSlotConfigured } from "../config/adsense";

declare global {
  interface Window {
    adsbygoogle?: any[];
  }
}

export interface AdSenseBannerProps {
  /**
   * Google AdSense Ad Slot ID.
   * If omitted, falls back to the configured slot.
   */
  slotId?: string;

  /**
   * Google AdSense Publisher Client ID (e.g. "ca-pub-1234567890123456").
   * Defaults to ADSENSE_CONFIG.publisherId or VITE_ADSENSE_CLIENT_ID.
   */
  clientId?: string;

  /**
   * Ad display format: "auto", "horizontal", "rectangle", or "fluid"
   */
  format?: "auto" | "horizontal" | "rectangle" | "fluid";

  /**
   * Whether to enable full-width responsive ads. Defaults to true.
   */
  responsive?: boolean;

  /**
   * Visual variant:
   * - "banner": standard full-width banner (Home, Notes, Resume)
   * - "compact": slim divider banner (AI Tutor between sections)
   */
  variant?: "banner" | "compact";

  /**
   * Custom CSS class names
   */
  className?: string;

  /**
   * Custom style overrides for the outer container
   */
  style?: React.CSSProperties;

  /**
   * Accessible test ID or element ID
   */
  id?: string;
}

export default function AdSenseBanner({
  slotId,
  clientId = ADSENSE_CONFIG.publisherId,
  format = "auto",
  responsive = true,
  variant = "banner",
  className = "",
  style,
  id,
}: AdSenseBannerProps) {
  const adRef = useRef<HTMLModElement | null>(null);
  const isPushed = useRef(false);

  const effectiveSlot = slotId || "";
  const isConfigured = isAdSenseConfigured(clientId) && isSlotConfigured(effectiveSlot);

  useEffect(() => {
    // Only attempt to load and push ads when valid configuration IDs are present
    if (!isConfigured) return;

    // Prevent duplicate ad injection into the same container
    if (isPushed.current) return;

    try {
      // Check if ad element has already been processed by AdSense
      if (adRef.current && !adRef.current.getAttribute("data-adsbygoogle-status")) {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
        isPushed.current = true;
      }
    } catch (err) {
      // Gracefully catch AdSense initialization errors (e.g. ad blockers, network offline)
      // This guarantees that AstraMind AI never crashes when ads are blocked or pending approval
    }
  }, [clientId, effectiveSlot, isConfigured]);

  // Keep ad container ready in the DOM for future Google AdSense ad-unit IDs,
  // while safely preventing any fake ads, placeholder advertisements, or UI changes.
  if (!isConfigured) {
    return (
      <div
        id={id || "astramind-adsense-slot"}
        data-adsense-client={clientId}
        data-adsense-status="ready-for-slot"
        className="hidden"
        aria-hidden="true"
      />
    );
  }

  const minHeightClass = variant === "compact" ? "min-h-[60px] sm:min-h-[70px]" : "min-h-[90px] sm:min-h-[110px]";
  const paddingClass = variant === "compact" ? "py-2 px-3" : "py-3 sm:py-4 px-4 sm:px-6";

  return (
    <div
      id={id || "astramind-adsense-slot"}
      className={`w-full flex flex-col items-center justify-center transition-all select-none ${className}`}
      style={style}
    >
      {/* Container with minimal glassmorphic styling matching AstraMind design */}
      <div
        className={`w-full flex flex-col items-center justify-center rounded-2xl border border-white/[0.06] bg-white/[0.015] backdrop-blur-sm overflow-hidden ${minHeightClass} ${paddingClass}`}
      >
        {/* Subtle, standard Advertisement disclosure label */}
        <div className="w-full flex items-center justify-center mb-1.5 opacity-60">
          <span className="text-[10px] font-medium tracking-widest uppercase text-slate-400 font-mono">
            Advertisement
          </span>
        </div>

        {/* Real Google AdSense Tag */}
        <div className="w-full flex items-center justify-center overflow-hidden">
          <ins
            ref={adRef}
            className="adsbygoogle"
            style={{
              display: "block",
              width: "100%",
              textAlign: "center",
            }}
            data-ad-client={clientId}
            data-ad-slot={effectiveSlot}
            data-ad-format={format}
            data-full-width-responsive={responsive ? "true" : "false"}
          />
        </div>
      </div>
    </div>
  );
}
