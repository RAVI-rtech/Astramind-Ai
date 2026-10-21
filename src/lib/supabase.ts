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
 * Resilient profile table helpers
 * Seamlessly supports both public."Profiles" and public."profiles"
 * and gracefully resolves primary key as id or user_id.
 */
async function fetchDbProfile(userId: string) {
  // 1. Try public."Profiles" with 'id'
  let res = await supabase.from("Profiles").select("*").eq("id", userId).maybeSingle();
  if (res.data && !res.error) return { data: res.data, error: null, table: "Profiles", key: "id" };

  // 2. If column 'id' doesn't exist on Profiles, try 'user_id'
  if (res.error?.message?.includes("column \"id\" does not exist")) {
    const resUserId = await supabase.from("Profiles").select("*").eq("user_id", userId).maybeSingle();
    if (resUserId.data && !resUserId.error) return { data: resUserId.data, error: null, table: "Profiles", key: "user_id" };
  }

  // 3. Try lowercase public."profiles" with 'id'
  const fallback = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
  if (fallback.data && !fallback.error) return { data: fallback.data, error: null, table: "profiles", key: "id" };

  // 4. Try lowercase with 'user_id'
  if (fallback.error?.message?.includes("column \"id\" does not exist")) {
    const fallbackUserId = await supabase.from("profiles").select("*").eq("user_id", userId).maybeSingle();
    if (fallbackUserId.data && !fallbackUserId.error) return { data: fallbackUserId.data, error: null, table: "profiles", key: "user_id" };
  }

  // Return best attempt (prefer Profiles if neither found)
  return { data: res.data || fallback.data || null, error: res.error && fallback.error ? res.error : null, table: "Profiles", key: "id" };
}

async function upsertDbProfile(record: Record<string, any>) {
  // Try "Profiles" first
  const res1 = await supabase.from("Profiles").upsert([record]).select("*").maybeSingle();
  if (!res1.error) return res1;

  // If table doesn't exist or error, fallback to "profiles"
  if (res1.error.code === "42P01" || res1.error.message?.includes("does not exist")) {
    return await supabase.from("profiles").upsert([record]).select("*").maybeSingle();
  }

  // If primary key issue ('id' vs 'user_id')
  if (res1.error.message?.includes("column \"id\" does not exist")) {
    const altRecord = { ...record };
    delete altRecord.id;
    altRecord.user_id = record.id;
    const resAlt = await supabase.from("Profiles").upsert([altRecord]).select("*").maybeSingle();
    if (!resAlt.error) return resAlt;
    return await supabase.from("profiles").upsert([altRecord]).select("*").maybeSingle();
  }

  return res1;
}

async function updateDbProfile(userId: string, updates: Record<string, any>) {
  // Try "Profiles" with 'id'
  let res = await supabase.from("Profiles").update(updates).eq("id", userId);
  if (!res.error) return { error: null };

  if (res.error.code === "42P01" || res.error.message?.includes("does not exist")) {
    return await supabase.from("profiles").update(updates).eq("id", userId);
  }

  if (res.error.message?.includes("column \"id\" does not exist")) {
    let resAlt = await supabase.from("Profiles").update(updates).eq("user_id", userId);
    if (!resAlt.error) return { error: null };
    return await supabase.from("profiles").update(updates).eq("user_id", userId);
  }

  return res;
}

/**
 * Look up user email by Roll Number from Profiles table.
 * Enables students to log in using either Email or Roll Number.
 */
export async function findEmailByRollNumber(rollNumber: string): Promise<string | null> {
  const clean = rollNumber.trim();
  if (!clean) return null;
  const upper = clean.toUpperCase();

  try {
    // 1. Try public."Profiles" with exact or uppercase match
    let res = await supabase
      .from("Profiles")
      .select("email, roll_number")
      .or(`roll_number.eq.${clean},roll_number.eq.${upper}`)
      .limit(1)
      .maybeSingle();

    if (res.data?.email) return res.data.email;

    // 2. Fallback to lowercase "profiles"
    if (res.error?.code === "42P01" || res.error?.message?.includes("does not exist") || !res.data) {
      const resLower = await supabase
        .from("profiles")
        .select("email, roll_number")
        .or(`roll_number.eq.${clean},roll_number.eq.${upper}`)
        .limit(1)
        .maybeSingle();

      if (resLower.data?.email) return resLower.data.email;
    }

    // 3. Try case-insensitive ilike match
    const ilikeRes = await supabase
      .from("Profiles")
      .select("email, roll_number")
      .ilike("roll_number", clean)
      .limit(1)
      .maybeSingle();

    if (ilikeRes.data?.email) return ilikeRes.data.email;

    const ilikeLower = await supabase
      .from("profiles")
      .select("email, roll_number")
      .ilike("roll_number", clean)
      .limit(1)
      .maybeSingle();

    if (ilikeLower.data?.email) return ilikeLower.data.email;

    return null;
  } catch (err) {
    console.warn("Notice: could not find email by roll number:", err);
    return null;
  }
}

/**
 * Fetch or create profile in Supabase 'Profiles' table.
 */
export async function getOrCreateSupabaseProfile(
  userId: string,
  userEmail: string,
  nameHint?: string,
  createdAt?: string,
  avatarHint?: string,
  studentData?: {
    rollNumber?: string;
    roll_number?: string;
    branch?: string;
    section?: string;
  }
): Promise<Partial<UserProfile>> {
  try {
    const formattedMemberSince = formatMemberSince(createdAt);

    // 1. Check if profile exists in 'Profiles' / 'profiles' table
    const { data: existingProfile, error: fetchError } = await fetchDbProfile(userId);

    if (existingProfile && !fetchError) {
      const dbPlan = (existingProfile.plan || existingProfile.current_plan || "free").toLowerCase().trim();
      const planVal = dbPlan === "pro" ? "pro" : "free";
      const currentPlanDisplay = planVal === "pro" ? "AstraMind Pro" : "Free";
      const nameVal = existingProfile.full_name || existingProfile.name || nameHint || (userEmail ? userEmail.split("@")[0] : "");

      const rollVal = existingProfile.roll_number || existingProfile.rollNumber || studentData?.rollNumber || studentData?.roll_number || "";
      const branchVal = existingProfile.branch || studentData?.branch || "";
      const sectionVal = existingProfile.section || studentData?.section || "";

      // If student metadata is provided but missing in existing DB record, backfill it
      if (
        (studentData?.rollNumber || studentData?.roll_number || studentData?.branch || studentData?.section) &&
        (!existingProfile.roll_number || !existingProfile.branch || !existingProfile.section)
      ) {
        const backfill: Record<string, any> = {};
        if (!existingProfile.roll_number && (studentData?.rollNumber || studentData?.roll_number)) {
          backfill.roll_number = studentData.rollNumber || studentData.roll_number;
        }
        if (!existingProfile.branch && studentData?.branch) {
          backfill.branch = studentData.branch;
        }
        if (!existingProfile.section && studentData?.section) {
          backfill.section = studentData.section;
        }
        if (Object.keys(backfill).length > 0) {
          try {
            await updateDbProfile(userId, backfill);
          } catch {
            // non-fatal
          }
        }
      }

      return {
        id: userId,
        user_id: userId,
        name: nameVal,
        email: existingProfile.email || userEmail,
        avatarUrl: existingProfile.avatar_url || avatarHint || "",
        plan: planVal,
        currentPlan: currentPlanDisplay,
        memberSince: formatMemberSince(existingProfile.member_since || existingProfile.memberSince) || formattedMemberSince,
        rollNumber: rollVal,
        roll_number: rollVal,
        branch: branchVal,
        section: sectionVal,
      };
    }

    // 2. Profile doesn't exist, create it automatically with default plan = "free"
    const displayName = nameHint || (userEmail ? userEmail.split("@")[0] : "");
    const initialRoll = studentData?.rollNumber?.trim() || studentData?.roll_number?.trim() || "";
    const initialBranch = studentData?.branch || "";
    const initialSection = studentData?.section || "";

    const newProfile: Record<string, any> = {
      id: userId,
      user_id: userId,
      email: userEmail,
      full_name: displayName,
      name: displayName,
      roll_number: initialRoll,
      branch: initialBranch,
      section: initialSection,
      avatar_url: avatarHint || "",
      plan: "free",
      current_plan: "free",
      member_since: formattedMemberSince,
      updated_at: new Date().toISOString(),
    };

    const { data: insertedProfile, error: insertError } = await upsertDbProfile(newProfile);

    if (insertError) {
      console.warn("Could not upsert to Profiles table, fallback to memory:", insertError.message);
      return {
        id: userId,
        user_id: userId,
        name: displayName,
        email: userEmail,
        avatarUrl: avatarHint || "",
        plan: "free",
        currentPlan: "Free",
        memberSince: formattedMemberSince,
        rollNumber: initialRoll,
        roll_number: initialRoll,
        branch: initialBranch,
        section: initialSection,
      };
    }

    const insertedDbPlan = (insertedProfile?.plan || insertedProfile?.current_plan || "free").toLowerCase().trim();
    const insertedPlanVal = insertedDbPlan === "pro" ? "pro" : "free";

    return {
      id: userId,
      user_id: userId,
      name: insertedProfile?.full_name || insertedProfile?.name || displayName,
      email: insertedProfile?.email || userEmail,
      avatarUrl: insertedProfile?.avatar_url || avatarHint || "",
      plan: insertedPlanVal,
      currentPlan: insertedPlanVal === "pro" ? "AstraMind Pro" : "Free",
      memberSince: formatMemberSince(insertedProfile?.member_since) || formattedMemberSince,
      rollNumber: insertedProfile?.roll_number || initialRoll,
      roll_number: insertedProfile?.roll_number || initialRoll,
      branch: insertedProfile?.branch || initialBranch,
      section: insertedProfile?.section || initialSection,
    };
  } catch (err) {
    console.error("Error in getOrCreateSupabaseProfile:", err);
    const initialRoll = studentData?.rollNumber?.trim() || studentData?.roll_number?.trim() || "";
    return {
      id: userId,
      user_id: userId,
      name: nameHint || (userEmail ? userEmail.split("@")[0] : ""),
      email: userEmail,
      avatarUrl: avatarHint || "",
      plan: "free",
      currentPlan: "Free",
      memberSince: formatMemberSince(createdAt),
      rollNumber: initialRoll,
      roll_number: initialRoll,
      branch: studentData?.branch || "",
      section: studentData?.section || "",
    };
  }
}

/**
 * Update user profile in Supabase 'Profiles' table
 */
export async function updateSupabaseProfile(
  userId: string,
  profileUpdates: Partial<UserProfile>
): Promise<{ success: boolean; error?: string }> {
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
    if (profileUpdates.rollNumber !== undefined) {
      payload.roll_number = profileUpdates.rollNumber.trim();
    }
    if (profileUpdates.roll_number !== undefined) {
      payload.roll_number = profileUpdates.roll_number.trim();
    }
    if (profileUpdates.branch !== undefined) {
      payload.branch = profileUpdates.branch;
    }
    if (profileUpdates.section !== undefined) {
      payload.section = profileUpdates.section;
    }

    const { error } = await updateDbProfile(userId, payload);
    if (error) {
      console.warn("Notice: Failed updating profile in Supabase table:", error.message);
    }

    // Also update Supabase Auth user metadata
    const userMetaUpdates: Record<string, any> = {};
    if (profileUpdates.name !== undefined) {
      userMetaUpdates.full_name = profileUpdates.name;
      userMetaUpdates.name = profileUpdates.name;
    }
    if (profileUpdates.avatarUrl !== undefined) {
      userMetaUpdates.avatar_url = profileUpdates.avatarUrl;
    }
    if (profileUpdates.rollNumber !== undefined || profileUpdates.roll_number !== undefined) {
      const r = (profileUpdates.rollNumber || profileUpdates.roll_number || "").trim();
      userMetaUpdates.roll_number = r;
      userMetaUpdates.rollNumber = r;
    }
    if (profileUpdates.branch !== undefined) {
      userMetaUpdates.branch = profileUpdates.branch;
    }
    if (profileUpdates.section !== undefined) {
      userMetaUpdates.section = profileUpdates.section;
    }

    if (Object.keys(userMetaUpdates).length > 0) {
      await supabase.auth.updateUser({
        data: userMetaUpdates,
      }).catch(() => {});
    }

    return { success: !error, error: error?.message };
  } catch (err: any) {
    console.error("Error updating Supabase profile:", err);
    return { success: false, error: err.message };
  }
}

/**
 * Retrieve current Supabase access token for authenticated API requests
 */
export async function getSupabaseAccessToken(): Promise<string | null> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token || null;
  } catch {
    return null;
  }
}

/**
 * Helper to build Authorization header for authenticated backend requests
 */
export async function getSupabaseAuthHeaders(): Promise<Record<string, string>> {
  const token = await getSupabaseAccessToken();
  if (!token) return {};
  return {
    Authorization: `Bearer ${token}`,
  };
}

