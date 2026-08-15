// Security utility functions for AstraMind AI

export interface PasswordStrength {
  score: number; // 0 to 4
  label: "Too Weak" | "Weak" | "Fair" | "Strong" | "Very Strong";
  color: string;
  hasMinLength: boolean;
  hasUpper: boolean;
  hasLower: boolean;
  hasNumber: boolean;
  hasSpecial: boolean;
}

/**
 * Validates password strength against security best practices
 */
export function checkPasswordStrength(password: string): PasswordStrength {
  const hasMinLength = password.length >= 8;
  const hasUpper = /[A-Z]/.exec(password) !== null;
  const hasLower = /[a-z]/.exec(password) !== null;
  const hasNumber = /[0-9]/.exec(password) !== null;
  const hasSpecial = /[^A-Za-z0-9]/.exec(password) !== null;

  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (hasUpper && hasLower) score++;
  if (hasNumber || hasSpecial) score++;

  let label: PasswordStrength["label"] = "Too Weak";
  let color = "bg-rose-500";

  if (score === 1) {
    label = "Weak";
    color = "bg-rose-500";
  } else if (score === 2) {
    label = "Fair";
    color = "bg-amber-500";
  } else if (score === 3) {
    label = "Strong";
    color = "bg-blue-500";
  } else if (score >= 4) {
    label = "Very Strong";
    color = "bg-emerald-500";
  }

  return {
    score,
    label,
    color,
    hasMinLength,
    hasUpper,
    hasLower,
    hasNumber,
    hasSpecial,
  };
}

/**
 * Sanitizes user data for export or sharing to prevent exposure of sensitive IDs or emails
 */
export function sanitizeDataForSharing<T extends Record<string, any>>(data: T): Partial<T> {
  const copy = { ...data };
  delete copy.email;
  delete copy.internalId;
  delete copy.password;
  delete copy.authToken;
  delete copy.sessionToken;
  return copy;
}

/**
 * Generates a random secure session token
 */
export function generateSessionToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join("");
}
