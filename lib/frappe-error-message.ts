/**
 * Turns Frappe REST / API JSON error bodies (often HTML inside `exception`) into short plain text.
 */

const MAX_LEN = 700;

/** Known Frappe exception types → user-facing copy (login, forms, API). */
const FRAPPE_EXCEPTION_MESSAGES: Record<string, string> = {
  AuthenticationError: "Invalid email or password.",
  InvalidLoginCredentials: "Invalid email or password.",
  ValidationError: "Please check your details and try again.",
  MandatoryError: "A required field is missing. Please complete all required fields.",
  DuplicateEntryError: "This record already exists.",
  PermissionError: "You do not have permission to perform this action.",
  DoesNotExistError: "The requested record was not found.",
  LinkValidationError: "One of the selected values is invalid.",
  TimestampMismatchError:
    "This record was changed by someone else. Please refresh the page and try again.",
  SessionExpired: "Your session has expired. Please sign in again.",
  CSRFTokenError: "Your session expired. Please refresh the page and try again.",
  RateLimitExceededError: "Too many attempts. Please wait a moment and try again.",
  UserDisabledError: "This account has been disabled. Contact your administrator.",
  UserNotConfirmedError: "Please confirm your email before signing in.",
};

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

function extractFrappeExceptionType(raw: string): string | null {
  const trimmed = raw.trim();
  const dotted = trimmed.match(/frappe\.exceptions\.(\w+)/i);
  if (dotted) return dotted[1];
  const bare = trimmed.match(/^(\w+)$/);
  if (bare && /Error$/i.test(bare[1])) return bare[1];
  return null;
}

function looksLikeRawExceptionIdentifier(text: string): boolean {
  const t = text.trim();
  if (!t) return true;
  if (/^frappe\.exceptions\.\w+$/i.test(t)) return true;
  if (/^[\w.]*Exception$/i.test(t) && !/\s/.test(t)) return true;
  return false;
}

function friendlyMessageForExceptionType(
  type: string | null | undefined,
  httpStatus?: number,
): string {
  if (type && FRAPPE_EXCEPTION_MESSAGES[type]) {
    return FRAPPE_EXCEPTION_MESSAGES[type];
  }
  if (httpStatus === 401 || httpStatus === 403) {
    return "Invalid email or password.";
  }
  if (httpStatus === 404) {
    return "The requested item was not found.";
  }
  if (httpStatus && httpStatus >= 500) {
    return "Something went wrong on the server. Please try again later.";
  }
  return "Something went wrong. Please try again.";
}

function finalizeMessage(
  candidate: string,
  opts?: { exceptionType?: string | null; httpStatus?: number },
): string {
  const plain = stripHtmlToPlainText(candidate);
  if (!plain || looksLikeRawExceptionIdentifier(plain)) {
    return friendlyMessageForExceptionType(opts?.exceptionType, opts?.httpStatus);
  }
  return plain;
}

function normalizeFrappeExceptionPrefix(raw: string): string {
  return raw
    .replace(/^frappe\.exceptions\.\w+:\s*/i, "")
    .replace(/^frappe\.exceptions\.\w+$/i, "")
    .replace(/^[\w.]+Exception:\s*/i, "")
    .replace(/^[\w.]+Exception$/i, "")
    .trim();
}

function parseServerMessages(entry: unknown): string | null {
  if (typeof entry !== "string" || !entry.trim()) return null;
  try {
    const inner = JSON.parse(entry) as { message?: unknown };
    if (typeof inner.message === "string" && inner.message.trim()) {
      const plain = stripHtmlToPlainText(inner.message);
      if (plain && !looksLikeRawExceptionIdentifier(plain)) return plain;
    }
  } catch {
    const plain = stripHtmlToPlainText(entry);
    if (plain && !looksLikeRawExceptionIdentifier(plain)) return plain;
  }
  return null;
}

/**
 * Parses a Frappe error HTTP body (JSON or HTML) into a single readable sentence.
 */
export function humanMessageFromFrappeApiError(body: string, httpStatus?: number): string {
  const trimmed = body.trim();
  if (!trimmed) {
    return friendlyMessageForExceptionType(null, httpStatus);
  }

  let exceptionType: string | null = null;

  try {
    const j = JSON.parse(trimmed) as Record<string, unknown>;

    if (Array.isArray(j._server_messages)) {
      for (const raw of j._server_messages) {
        const line = parseServerMessages(raw);
        if (line) return line;
      }
    }

    const msg = j.message;
    if (typeof msg === "string" && msg.trim()) {
      const out = finalizeMessage(msg, { httpStatus });
      if (!looksLikeRawExceptionIdentifier(out)) return out;
    }
    if (Array.isArray(msg)) {
      const joined = msg.map(String).join(" ");
      const out = finalizeMessage(joined, { httpStatus });
      if (!looksLikeRawExceptionIdentifier(out)) return out;
    }

    const exception = typeof j.exception === "string" ? j.exception : "";
    if (exception) {
      exceptionType = extractFrappeExceptionType(exception) ?? exceptionType;
      const normalized = normalizeFrappeExceptionPrefix(exception);
      if (normalized) {
        const out = finalizeMessage(normalized, { exceptionType, httpStatus });
        if (!looksLikeRawExceptionIdentifier(out)) return out;
      }
    }

    if (typeof j.exc_type === "string" && j.exc_type.trim()) {
      exceptionType = j.exc_type.trim();
      const exc = typeof j.exc === "string" ? j.exc : "";
      if (exc.trim()) {
        const hint = finalizeMessage(exc.slice(0, 400), { exceptionType, httpStatus });
        if (!looksLikeRawExceptionIdentifier(hint)) return hint;
      }
      return friendlyMessageForExceptionType(exceptionType, httpStatus);
    }

    if (exceptionType) {
      return friendlyMessageForExceptionType(exceptionType, httpStatus);
    }
  } catch {
    /* body is not JSON */
  }

  const fallback = stripHtmlToPlainText(trimmed);
  return finalizeMessage(fallback, { exceptionType, httpStatus });
}

/** Same as {@link humanMessageFromFrappeApiError} but accepts a parsed JSON value. */
export function humanMessageFromFrappeJsonValue(
  json: unknown,
  httpStatus?: number,
): string | null {
  if (json === null || json === undefined) return null;
  try {
    const text = typeof json === "string" ? json : JSON.stringify(json);
    const out = humanMessageFromFrappeApiError(text, httpStatus);
    return out.trim() ? out : null;
  } catch {
    return null;
  }
}
