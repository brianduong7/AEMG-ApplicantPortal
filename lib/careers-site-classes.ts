import { JOB_DESCRIPTION_PREVIEW_HTML_CLASS } from "@/lib/job-description-preview-classes";

/** Rich HTML job body on the public careers site (larger than portal preview). */
export const CAREERS_JOB_HTML_CLASS = [
  JOB_DESCRIPTION_PREVIEW_HTML_CLASS,
  "text-base leading-relaxed text-slate-800",
  "[&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-slate-900",
  "[&_h3]:text-lg",
].join(" ");
