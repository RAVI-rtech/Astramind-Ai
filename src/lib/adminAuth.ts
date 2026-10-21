/**
 * AstraMind Exclusive Administrator Authorization Configuration
 * 
 * Strict access control: Only ravicharan.7878@gmail.com is authorized as administrator.
 * All comparisons are case-insensitive and enforce server-side validation.
 */

export const AUTHORIZED_ADMIN_EMAIL = "ravicharan.7878@gmail.com";

/**
 * Case-insensitive comparison against the single authorized administrator email.
 */
export function isAuthorizedAdminEmail(email?: string | null): boolean {
  if (!email || typeof email !== "string") return false;
  return email.trim().toLowerCase() === AUTHORIZED_ADMIN_EMAIL.toLowerCase();
}

/**
 * Client helper to check whether a given profile or user has the admin email.
 * NOTE: Frontend checks are for UI visibility only; true security is enforced
 * on the server via verifyAdminSessionWithServer().
 */
export function isClientAdmin(email?: string | null): boolean {
  return isAuthorizedAdminEmail(email);
}

/**
 * Cryptographically verify admin status with the server using the Supabase JWT token.
 * Never trusts client state alone.
 */
export async function verifyAdminSessionWithServer(accessToken?: string | null): Promise<{
  isAdmin: boolean;
  email?: string;
  error?: string;
}> {
  if (!accessToken) {
    return { isAdmin: false, error: "Unauthenticated" };
  }

  try {
    const res = await fetch("/api/admin/check", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (res.ok) {
      const data = await res.json();
      return {
        isAdmin: data.isAdmin === true,
        email: data.email,
      };
    }

    if (res.status === 403) {
      return { isAdmin: false, error: "Forbidden: Not an administrator" };
    }

    return { isAdmin: false, error: `Authentication failed (status ${res.status})` };
  } catch (err: any) {
    console.error("Failed to verify admin status with server:", err);
    return { isAdmin: false, error: err?.message || "Network error" };
  }
}
