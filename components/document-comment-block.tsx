import type { ERPNextCommentRow } from "@/lib/erpnext";
import {
  commentAuthor,
  formatCommentWhen,
  stripCommentHtml,
} from "@/lib/document-comment-display";

export function DocumentCommentBlock({ row }: { row: ERPNextCommentRow }) {
  const body = row.content?.trim() ? stripCommentHtml(row.content) : "";
  const when = formatCommentWhen(row.creation);

  return (
    <article className="rounded-lg border border-slate-100 bg-slate-50/80 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
        <span className="font-medium text-slate-700">{commentAuthor(row)}</span>
        {when ? <time dateTime={row.creation}>{when}</time> : null}
      </div>
      {body ?
        <pre className="mt-3 min-h-[4rem] max-h-[24rem] resize-y overflow-y-auto whitespace-pre-wrap rounded-md border border-slate-200/80 bg-white p-3 text-sm leading-relaxed text-slate-800">
          {body}
        </pre>
      : <p className="mt-3 text-sm text-slate-600">(No text)</p>}
    </article>
  );
}
