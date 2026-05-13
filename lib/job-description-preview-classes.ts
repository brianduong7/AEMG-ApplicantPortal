/**
 * Shared Tailwind classes for rendering ERPNext / Quill HTML job descriptions.
 * Includes list styles, Quill indents, and “section title” paragraphs that are only `<strong>…</strong>`.
 */
export const JOB_DESCRIPTION_PREVIEW_HTML_CLASS =
  [
    "job-desc-preview max-w-none text-sm leading-relaxed text-slate-800",
    "[&_a]:break-all [&_a]:text-blue-600 [&_a]:underline",
    "[&_h1]:mb-2 [&_h1]:text-lg [&_h1]:font-semibold",
    "[&_h2]:mb-2 [&_h2]:text-base [&_h2]:font-semibold",
    "[&_h3]:mb-2 [&_h3]:text-sm [&_h3]:font-semibold",
    "[&_li]:my-0.5 [&_li]:pl-0 [&_li]:[list-style-position:outside]",
    "[&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-6 [&_ol>li]:[list-style-type:decimal]",
    "[&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-6 [&_ul>li]:[list-style-type:disc]",
    "[&_p]:mb-2 [&_p:last-child]:mb-0 [&_p>br]:block",
    // “Key Responsibilities”–style lines: single strong in a paragraph
    "[&_p:has(>strong:only-child)]:mb-2 [&_p:has(>strong:only-child)]:mt-4 [&_p:has(>strong:only-child)]:text-sm [&_p:has(>strong:only-child)]:font-semibold [&_p:has(>strong:only-child)]:text-slate-900",
    "[&_p:has(>strong:only-child):first-child]:mt-0",
    "[&_strong]:font-semibold",
    "[&_.ql-align-center]:text-center [&_.ql-align-right]:text-right [&_.ql-align-justify]:text-justify",
    "[&_.ql-indent-1]:pl-4 [&_.ql-indent-2]:pl-8 [&_.ql-indent-3]:pl-12",
    "[&_li.ql-indent-1]:pl-4 [&_li.ql-indent-2]:pl-8",
    // Quill list attributes (v1.x / HRMS)
    "[&_li[data-list=ordered]]:[list-style-type:decimal]",
    "[&_li[data-list=bullet]]:[list-style-type:disc]",
  ].join(" ");
