/** Collapse Quill filler paragraphs so section spacing (e.g. Key Responsibilities) reads cleanly. */
export function compactQuillEmptyParagraphs(html: string): string {
  return html.replace(/<p>\s*(<br\s*\/?>|&nbsp;|\s)*<\/p>/gi, "");
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
