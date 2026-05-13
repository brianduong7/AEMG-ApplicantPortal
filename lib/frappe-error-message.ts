/**
 * Turns Frappe REST / API JSON error bodies (often HTML inside `exception`) into short plain text.
 */

const MAX_LEN = 700;

function decodeBasicEntities(s: string): string {
  return s
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#0*39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&#(\d+);/g, (_, n: string) => {
      const code = Number.parseInt(n, 10);
      return Number.isFinite(code) && code > 0 ? String.fromCharCode(code) : "";
    });
}

/** Removes tags and collapses whitespace for safe UI display. */
export function stripHtmlToPlainText(html: string, maxLen = MAX_LEN): string {
  const decoded = decodeBasicEntities(html);
  const noTags = decoded.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  if (noTags.length <= maxLen) return noTags;
  return `${noTags.slice(0, maxLen - 1)}…`;
}

function normalizeFrappeExceptionPrefix(raw: string): string {
  return raw
    .replace(/^frappe\.exceptions\.\w+:\s*/i, "")
    .replace(/^[\w.]+Exception:\s*/i, "")
    .trim();
}

function parseServerMessages(entry: unknown): string | null {
  if (typeof entry !== "string" || !entry.trim()) return null;
  try {
    const inner = JSON.parse(entry) as { message?: unknown };
    if (typeof inner.message === "string" && inner.message.trim()) {
      return stripHtmlToPlainText(inner.message);
    }
  } catch {
    return stripHtmlToPlainText(entry);
  }
  return null;
}

/**
 * Parses a Frappe error HTTP body (JSON or HTML) into a single readable sentence.
 */
export function humanMessageFromFrappeApiError(body: string, httpStatus?: number): string {
  const trimmed = body.trim();
  if (!trimmed) {
    return httpStatus ? `Request failed (${httpStatus}).` : "Request failed.";
  }

  try {
    const j = JSON.parse(trimmed) as Record<string, unknown>;

    const exception = typeof j.exception === "string" ? j.exception : "";
    if (exception) {
      const normalized = normalizeFrappeExceptionPrefix(exception);
      const plain = stripHtmlToPlainText(normalized);
      if (plain) return plain;
    }

    const msg = j.message;
    if (typeof msg === "string" && msg.trim()) {
      const plain = stripHtmlToPlainText(msg);
      if (plain) return plain;
    }
    if (Array.isArray(msg)) {
      const joined = msg.map(String).join(" ");
      const plain = stripHtmlToPlainText(joined);
      if (plain) return plain;
    }

    if (Array.isArray(j._server_messages)) {
      for (const raw of j._server_messages) {
        const line = parseServerMessages(raw);
        if (line) return line;
      }
    }

    if (typeof j.exc_type === "string" && j.exc_type.trim()) {
      const et = j.exc_type.trim();
      const exc = typeof j.exc === "string" ? j.exc : "";
      const hint = exc ? stripHtmlToPlainText(exc.slice(0, 400)) : "";
      if (hint) return `${et}: ${hint}`;
      return et;
    }
  } catch {
    /* body is not JSON */
  }

  return stripHtmlToPlainText(trimmed);
}

/** Same as {@link humanMessageFromFrappeApiError} but accepts a parsed JSON value. */
export function humanMessageFromFrappeJsonValue(json: unknown): string | null {
  if (json === null || json === undefined) return null;
  try {
    const text = typeof json === "string" ? json : JSON.stringify(json);
    const out = humanMessageFromFrappeApiError(text);
    return out.trim() ? out : null;
  } catch {
    return null;
  }
}
