/** First-name style label from an email local-part (shared HR UI). */
export function hrGreetingNameFromEmail(email: string): string {
  const local = email.split("@")[0]?.trim() ?? "there";
  const part = local.split(/[._-]/)[0] ?? local;
  if (!part) return "there";
  return part.slice(0, 1).toUpperCase() + part.slice(1).toLowerCase();
}
