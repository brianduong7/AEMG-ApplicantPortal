import type { ERPNextCommentRow } from "@/lib/erpnext";

export function stripCommentHtml(html: string): string {
  return html
    .replace(/\r\n?/g, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|li)>/gi, "\n")
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function formatCommentWhen(iso?: string): string {
  if (!iso?.trim()) return "";
  const d = new Date(iso.trim());
  if (Number.isNaN(d.getTime())) return iso.trim().slice(0, 16);
  return d.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function commentAuthor(row: ERPNextCommentRow): string {
  return row.comment_by?.trim() || row.owner?.trim() || "System";
}
