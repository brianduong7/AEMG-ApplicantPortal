/** First-name style label from an email local-part (fallback when no profile name). */
export function hrGreetingNameFromEmail(email: string): string {
  const local = email.split("@")[0]?.trim() ?? "there";
  const part = local.split(/[._-]/)[0] ?? local;
  if (!part) return "there";
  return part.slice(0, 1).toUpperCase() + part.slice(1).toLowerCase();
}

/** First token of a full name (e.g. "Jason Mamoa" → "Jason"). */
export function firstNameFromFullName(fullName: string | null | undefined): string | null {
  const t = fullName?.trim();
  if (!t) return null;
  const first = t.split(/\s+/)[0];
  return first || null;
}

/** Prefer registered full name; fall back to email local-part. */
export function greetingNameFromProfile(
  fullName: string | null | undefined,
  email: string,
): string {
  const fromName = firstNameFromFullName(fullName);
  if (fromName) {
    return fromName.slice(0, 1).toUpperCase() + fromName.slice(1).toLowerCase();
  }
  return hrGreetingNameFromEmail(email);
}
