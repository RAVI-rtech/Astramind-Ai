/**
 * =======================================================================
 * Google AdSense Configuration - AstraMind AI
 * =======================================================================
 * 
 * Replace the placeholder values below with your official Google AdSense
 * Publisher Client ID and Ad Slot IDs obtained from your Google AdSense Dashboard.
 * 
 * You can configure these in one of two ways:
 * 1. Set environment variables in your .env file:
 *    - VITE_ADSENSE_CLIENT_ID="ca-pub-XXXXXXXXXXXXXXXX"
 *    - VITE_ADSENSE_SLOT_HOME="XXXXXXXXXX"
 *    - VITE_ADSENSE_SLOT_AI_TUTOR="XXXXXXXXXX"
 *    - VITE_ADSENSE_SLOT_NOTES="XXXXXXXXXX"
 *    - VITE_ADSENSE_SLOT_RESUME="XXXXXXXXXX"
 * 
 * 2. Or directly update the default values in this config object.
 */

export interface AdSenseConfig {
  /**
   * Your Google AdSense Publisher Client ID
   * Example: "ca-pub-1234567890123456"
   */
  publisherId: string;

  /**
   * Designated Ad Unit Slot IDs created in your Google AdSense console
   */
  slots: {
    /** 1. Home / Dashboard Page - Bottom Banner */
    homeBottomBanner: string;

    /** 2. AI Tutor Page - Compact Section Divider Slot */
    aiTutorSection: string;

    /** 3. Notes & Resources Page - Bottom Slot */
    notesBottom: string;

    /** 4. Resume Builder Page - Bottom Slot */
    resumeBuilderBottom: string;
  };
}

const metaEnv = (import.meta as any).env || {};

export const ADSENSE_CONFIG: AdSenseConfig = {
  // Official Google AdSense Publisher Client ID
  publisherId: metaEnv.VITE_ADSENSE_CLIENT_ID || "ca-pub-2213626580102683",

  slots: {
    // Left empty until individual Google AdSense ad-unit slot IDs are created
    homeBottomBanner: metaEnv.VITE_ADSENSE_SLOT_HOME || "",
    aiTutorSection: metaEnv.VITE_ADSENSE_SLOT_AI_TUTOR || "",
    notesBottom: metaEnv.VITE_ADSENSE_SLOT_NOTES || "",
    resumeBuilderBottom: metaEnv.VITE_ADSENSE_SLOT_RESUME || "",
  },
};

/**
 * Checks whether a real Google AdSense client ID has been configured
 */
export function isAdSenseConfigured(clientId: string = ADSENSE_CONFIG.publisherId): boolean {
  return Boolean(
    clientId &&
    clientId !== "ca-pub-XXXXXXXXXXXXXXXX" &&
    clientId.startsWith("ca-pub-") &&
    clientId.length > 10
  );
}

/**
 * Checks whether a specific ad slot ID has been configured.
 * Rejects empty values, placeholders, non-numeric strings,
 * and ensures publisher ID is never mistakenly used as a slot ID.
 */
export function isSlotConfigured(slotId?: string | null): boolean {
  if (!slotId) return false;
  const trimmed = slotId.trim();
  if (!trimmed) return false;

  // Guard: Never allow publisher ID or placeholder values as a slot ID
  if (
    trimmed === "XXXXXXXXXX" ||
    trimmed === ADSENSE_CONFIG.publisherId ||
    trimmed.startsWith("ca-pub-")
  ) {
    return false;
  }

  // Official Google AdSense ad-unit slot IDs are strictly numeric (typically 10 digits)
  return /^\d{5,}$/.test(trimmed);
}
