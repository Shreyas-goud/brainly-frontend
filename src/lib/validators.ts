export type FieldError = string | null;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function validateEmail(value: string): FieldError {
  const trimmed = value.trim();
  if (!trimmed) return "Email is required.";
  if (trimmed.length > 254) return "Email is too long.";
  if (!EMAIL_RE.test(trimmed)) return "Enter a valid email address.";
  return null;
}

export function validatePasswordForSignin(value: string): FieldError {
  if (!value) return "Password is required.";
  return null;
}

export function validatePasswordForSignup(
  value: string,
  email?: string
): FieldError {
  if (!value) return "Password is required.";
  if (value.length < 8) return "Use at least 8 characters.";
  if (value.length > 128) return "Password is too long.";
  if (/^\s|\s$/.test(value)) return "Password can't start or end with a space.";
  if (email) {
    const local = email.split("@")[0]?.toLowerCase();
    if (local && local.length >= 3 && value.toLowerCase().includes(local)) {
      return "Password shouldn't contain your email.";
    }
  }
  return null;
}

export type PasswordStrength = "weak" | "fair" | "strong";

export function estimatePasswordStrength(value: string): PasswordStrength {
  let score = 0;
  if (value.length >= 8) score++;
  if (value.length >= 12) score++;
  if (/[A-Z]/.test(value) && /[a-z]/.test(value)) score++;
  if (/\d/.test(value)) score++;
  if (/[^A-Za-z0-9]/.test(value)) score++;
  if (score <= 2) return "weak";
  if (score <= 3) return "fair";
  return "strong";
}
