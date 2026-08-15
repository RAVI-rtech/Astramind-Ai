import { createClient } from "@supabase/supabase-js";
import { UserProfile } from "../types";

// Environment variables for Supabase Project URL and Publishable (Anon) Key
const supabaseUrl =
  (import.meta as any).env?.VITE_SUPABASE_URL ||
  (process as any).env?.VITE_SUPABASE_URL ||
  (process as any).env?.SUPABASE_URL ||
  "https://placeholder-project.supabase.co";

const supabaseAnonKey =
  (import.meta as any).env?.VITE_SUPABASE_ANON_KEY ||
  (process as any).env?.VITE_SUPABASE_ANON_KEY ||
  (process as any).env?.SUPABASE_ANON_KEY ||
  "placeholder-anon-key";

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export const isSupabaseConfigured = () => {
  return (
    supabaseUrl &&
    supabaseUrl !== "https://placeholder-project.supabase.co" &&
    supabaseAnonKey &&
    supabaseAnonKey !== "placeholder-anon-key"
  );
};

export interface FormattedAuthError {
  message: string;
  code: string;
  fullError: any;
  details: string;
}

export function handleAndLogGoogleAuthError(err: any): FormattedAuthError {
  const message =
    err?.message ||
    err?.error_description ||
    (typeof err === "string" ? err : "Google sign-in failed.");
  const code =
    err?.code || err?.error || err?.status || err?.name || "OAUTH_ERROR";
  const redirectUrl = typeof window !== "undefined" ? window.location.origin : "";
  const isConfigured = isSupabaseConfigured();

  console.error("=================================================");
  console.error("GOOGLE OAUTH AUTHENTICATION ERROR DETECTED");
  console.error("1. error.message:", message);
  console.error("2. error.code:", code);
  console.error("3. full error object:", err);
  console.error("4. OAuth Environment Verification:", {
    supabaseConfigured: isConfigured,
    redirectUrl: redirectUrl,
    authorizedOrigins: [redirectUrl],
    authorizedRedirectURIs: [redirectUrl, `${redirectUrl}/auth/v1/callback`],
    provider: "google",
  });
  console.error("=================================================");

  let userFriendlyReason = message;

  if (!isConfigured) {
    userFriendlyReason = `Supabase credentials missing. VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must be set in environment variables or Settings.`;
  } else if (
    code === "validation_failed" ||
    message.includes("provider is not enabled") ||
    message.includes("Unsupported provider")
  ) {
    userFriendlyReason = `Google OAuth provider is disabled in your Supabase project. Enable Google in Supabase Dashboard -> Auth -> Providers and supply Client ID & Secret.`;
  } else if (
    message.includes("invalid_client") ||
    message.includes("OAuth client")
  ) {
    userFriendlyReason = `Invalid Google OAuth Client ID or Client Secret in Supabase settings. Check Google Cloud Console credentials.`;
  } else if (message.includes("redirect_uri_mismatch")) {
    userFriendlyReason = `Redirect URI mismatch. Add '${redirectUrl}' and '${redirectUrl}/auth/v1/callback' to Authorized Redirect URIs in Google Cloud Console.`;
  }

  const completeErrorText = `Google Auth Error [Code: ${code}]: ${userFriendlyReason}`;

  return {
    message,
    code,
    fullError: err,
    details: completeErrorText,
  };
}

export function formatMemberSince(createdAt?: string | null): string {
  if (!createdAt) return "";
  try {
    const d = new Date(createdAt);
    if (isNaN(d.getTime())) return createdAt;
    return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  } catch {
    return createdAt || "";
  }
}

export function getInitials(name?: string, email?: string): string {
  const target = name?.trim() || email?.split("@")[0]?.trim() || "";
  if (!target) return "";
  const parts = target.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "";
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Helper to check if a user profile is a Pro plan
 */
export function isProUser(profile?: UserProfile | null): boolean {
  if (!profile) return false;
  const p = (profile.plan || profile.currentPlan || "").toLowerCase().trim();
  return p === "pro";
}

/**
 * Fetch or create profile in Supabase 'profiles' table.
 */
export async function getOrCreateSupabaseProfile(
  userId: string,
  userEmail: string,
  nameHint?: string,
  createdAt?: string,
  avatarHint?: string
): Promise<Partial<UserProfile>> {
  try {
    const formattedMemberSince = formatMemberSince(createdAt);

    // 1. Check if profile exists in 'profiles' table
    const { data: existingProfile, error: fetchError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    if (existingProfile && !fetchError) {
      const dbPlan = (existingProfile.plan || existingProfile.current_plan || "free").toLowerCase().trim();
      const planVal = dbPlan === "pro" ? "pro" : "free";
      const currentPlanDisplay = planVal === "pro" ? "AstraMind Pro" : "Free";
      const nameVal = existingProfile.full_name || existingProfile.name || nameHint || (userEmail ? userEmail.split("@")[0] : "");

      return {
        name: nameVal,
        email: existingProfile.email || userEmail,
        avatarUrl: existingProfile.avatar_url || avatarHint || "",
        plan: planVal,
        currentPlan: currentPlanDisplay,
        memberSince: formatMemberSince(existingProfile.member_since || existingProfile.memberSince) || formattedMemberSince,
      };
    }

    // 2. Profile doesn't exist, create it automatically with default plan = "free"
    const displayName = nameHint || (userEmail ? userEmail.split("@")[0] : "");
    const newProfile = {
      id: userId,
      email: userEmail,
      full_name: displayName,
      name: displayName,
      avatar_url: avatarHint || "",
      plan: "free",
      current_plan: "free",
      member_since: formattedMemberSince,
      updated_at: new Date().toISOString(),
    };

    const { data: insertedProfile, error: insertError } = await supabase
      .from("profiles")
      .upsert([newProfile])
      .select("*")
      .single();

    if (insertError) {
      console.warn("Could not upsert to profiles table, fallback to memory:", insertError.message);
      return {
        name: displayName,
        email: userEmail,
        avatarUrl: avatarHint || "",
        plan: "free",
        currentPlan: "Free",
        memberSince: formattedMemberSince,
      };
    }

    const insertedDbPlan = (insertedProfile.plan || insertedProfile.current_plan || "free").toLowerCase().trim();
    const insertedPlanVal = insertedDbPlan === "pro" ? "pro" : "free";

    return {
      name: insertedProfile.full_name || insertedProfile.name || displayName,
      email: insertedProfile.email || userEmail,
      avatarUrl: insertedProfile.avatar_url || avatarHint || "",
      plan: insertedPlanVal,
      currentPlan: insertedPlanVal === "pro" ? "AstraMind Pro" : "Free",
      memberSince: formatMemberSince(insertedProfile.member_since) || formattedMemberSince,
    };
  } catch (err) {
    console.error("Error in getOrCreateSupabaseProfile:", err);
    return {
      name: nameHint || (userEmail ? userEmail.split("@")[0] : ""),
      email: userEmail,
      avatarUrl: avatarHint || "",
      plan: "free",
      currentPlan: "Free",
      memberSince: formatMemberSince(createdAt),
    };
  }
}

/**
 * Update user profile in Supabase 'profiles' table
 */
export async function updateSupabaseProfile(
  userId: string,
  profileUpdates: Partial<UserProfile>
): Promise<void> {
  try {
    const payload: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };
    if (profileUpdates.name !== undefined) {
      payload.name = profileUpdates.name;
      payload.full_name = profileUpdates.name;
    }
    if (profileUpdates.email !== undefined) payload.email = profileUpdates.email;
    if (profileUpdates.avatarUrl !== undefined) payload.avatar_url = profileUpdates.avatarUrl;
    if (profileUpdates.plan !== undefined) {
      payload.plan = profileUpdates.plan;
      payload.current_plan = profileUpdates.plan;
    }
    if (profileUpdates.currentPlan !== undefined) {
      payload.current_plan = profileUpdates.currentPlan;
      payload.plan = profileUpdates.currentPlan.toLowerCase().trim() === "pro" ? "pro" : "free";
    }

    const { error } = await supabase.from("profiles").update(payload).eq("id", userId);
    if (error) {
      console.warn("Notice: Failed updating profile in Supabase table:", error.message);
    }

    // Also update Supabase Auth user metadata
    if (profileUpdates.name !== undefined || profileUpdates.avatarUrl !== undefined) {
      await supabase.auth.updateUser({
        data: {
          full_name: profileUpdates.name,
          name: profileUpdates.name,
          avatar_url: profileUpdates.avatarUrl,
        },
      }).catch(() => {});
    }
  } catch (err) {
    console.error("Error updating Supabase profile:", err);
  }
}
