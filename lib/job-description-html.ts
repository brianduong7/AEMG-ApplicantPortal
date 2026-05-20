/** Collapse Quill filler paragraphs so section spacing (e.g. Key Responsibilities) reads cleanly. */
export function compactQuillEmptyParagraphs(html: string): string {
  return html.replace(/<p>\s*(<br\s*\/?>|&nbsp;|\s)*<\/p>/gi, "");
}

const HTML_TAG_RE = /<[a-z][\s\S]*>/i;

const SECTION_HEADING_RE =
  /\s+(?=(?:Job Title|Job Summary|Key Responsibilities|Required Skills(?:\s*(?:&|and)\s*Qualifications)?|Qualifications|About (?:the Role|Us)|What (?:you will|you'll) do|Duties|Responsibilities|Experience|Benefits)\b)/gi;

const SECTION_TITLE_LINE_RE =
  /^(job title|job summary|key responsibilities|required skills|qualifications|responsibilities|experience|benefits|about (?:the role|us))\b/i;

export function looksLikeJobDescriptionHtml(raw: string): boolean {
  return HTML_TAG_RE.test(raw.trim());
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Turn plain-text job copy (newlines and/or inline bullets) into preview HTML. */
export function plainTextJobDescriptionToHtml(raw: string): string {
  let text = raw.replace(/\r\n?/g, "\n").trim();
  if (!text) return "";

  if (!text.includes("\n")) {
    text = text.replace(SECTION_HEADING_RE, "\n\n");
    text = text.replace(/\s+\*\s+/g, "\n* ");
    text = text.replace(/\s+•\s+/g, "\n• ");
  }

  const blocks = text.split(/\n{2,}/);
  const parts: string[] = [];

  for (const block of blocks) {
    const lines = block
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
    if (!lines.length) continue;

    const listLines = lines.filter((line) => /^[\*\-•]\s+/.test(line));
    const proseLines = lines.filter((line) => !/^[\*\-•]\s+/.test(line));

    for (const line of proseLines) {
      if (SECTION_TITLE_LINE_RE.test(line) && line.length < 120) {
        parts.push(`<p><strong>${escapeHtml(line)}</strong></p>`);
      } else {
        parts.push(`<p>${escapeHtml(line)}</p>`);
      }
    }

    if (listLines.length) {
      parts.push(
        `<ul>${listLines
          .map((line) => `<li>${escapeHtml(line.replace(/^[\*\-•]\s+/, ""))}</li>`)
          .join("")}</ul>`,
      );
    }
  }

  return compactQuillEmptyParagraphs(parts.join(""));
}

/**
 * ERPNext Text Editor often persists HTML wrapped in one or more
 * `<div class="ql-editor read-mode">…</div>` layers. Strip those so the
 * textarea shows the inner markup and previews render like the ERPNext UI.
 */
export function normalizeJobDescriptionForEditor(raw: string): string {
  let html = (raw ?? "").trim();
  const qlWrap = /^<div\b[^>]*\bql-editor\b[^>]*>([\s\S]*)<\/div>\s*$/i;
  for (let i = 0; i < 8; i++) {
    const m = html.match(qlWrap);
    if (!m) break;
    const inner = m[1].trim();
    if (!inner) break;
    html = inner;
  }
  return compactQuillEmptyParagraphs(html);
}

export type JobDescriptionDisplay = {
  html: string | null;
  plain: string;
};

/** Normalize ERP HTML or structure plain text for rich preview (lists, section spacing). */
export function prepareJobDescriptionForDisplay(raw: string): JobDescriptionDisplay {
  const plain = (raw ?? "").trim();
  if (!plain) return { html: null, plain: "" };

  if (looksLikeJobDescriptionHtml(plain)) {
    const html = normalizeJobDescriptionForEditor(plain);
    return { html: html || null, plain };
  }

  const html = plainTextJobDescriptionToHtml(plain);
  return { html: html || null, plain };
}
