import { JOB_DESCRIPTION_PREVIEW_HTML_CLASS } from "@/lib/job-description-preview-classes";

type Props = {
  /** Plain-text fallback (e.g. stripped ERP copy). */
  text: string;
  /** Normalized HTML from ERPNext when available (Quill / Text Editor). */
  html?: string | null;
};

export function JobDescriptionBox({ text, html }: Props) {
  const hasHtml = Boolean(html?.trim());

  return (
    <div className="w-full min-w-0 rounded-lg border border-slate-200 bg-white p-4">
      <div className="max-h-52 min-h-0 overflow-y-auto pr-1">
        {hasHtml ?
          <div
            className={JOB_DESCRIPTION_PREVIEW_HTML_CLASS}
            dangerouslySetInnerHTML={{ __html: html!.trim() }}
          />
        : <div className="whitespace-pre-wrap text-slate-700">{text}</div>}
      </div>
    </div>
  );
}
