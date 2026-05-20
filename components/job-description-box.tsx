import { prepareJobDescriptionForDisplay } from "@/lib/job-description-html";
import { JOB_DESCRIPTION_PREVIEW_HTML_CLASS } from "@/lib/job-description-preview-classes";

type Props = {
  /** Plain-text fallback when content cannot be structured as HTML. */
  text: string;
  /** Raw or normalized HTML from ERPNext (optional; combined with text for display). */
  html?: string | null;
  /** Short preview with scroll (lists, cards). */
  compact?: boolean;
  /** Taller scroll area for detail pages (e.g. job requisition). */
  scrollable?: boolean;
};

export function JobDescriptionBox({ text, html, compact = true, scrollable = false }: Props) {
  const raw = (html ?? text ?? "").trim();
  const { html: displayHtml, plain } = prepareJobDescriptionForDisplay(raw);
  const hasHtml = Boolean(displayHtml?.trim());
  const fallbackText = plain || text.trim() || "No description provided.";

  const bodyClass =
    scrollable ? "max-h-[28rem] min-h-0 overflow-y-auto pr-1"
    : compact ? "max-h-52 min-h-0 overflow-y-auto pr-1"
    : "min-h-0 pr-1";

  return (
    <div className="w-full min-w-0 rounded-lg border border-slate-200 bg-white p-4">
      <div className={bodyClass}>
        {hasHtml ?
          <div
            className={JOB_DESCRIPTION_PREVIEW_HTML_CLASS}
            dangerouslySetInnerHTML={{ __html: displayHtml!.trim() }}
          />
        : <div className="whitespace-pre-wrap text-slate-700">{fallbackText}</div>}
      </div>
    </div>
  );
}
