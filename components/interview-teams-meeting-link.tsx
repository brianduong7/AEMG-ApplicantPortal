"use client";

import { useState } from "react";

type Props = {
  meetingUrl: string;
  /** Compact row for tables; full block for detail pages. */
  variant?: "compact" | "full";
};

export function InterviewTeamsMeetingLink({ meetingUrl, variant = "full" }: Props) {
  const [copied, setCopied] = useState(false);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(meetingUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  if (variant === "compact") {
    return (
      <div className="flex flex-col items-end gap-1">
        <button
          type="button"
          onClick={copyLink}
          className="text-xs font-medium text-[#0d4f6e] hover:underline"
        >
          {copied ? "Copied" : "Copy Teams link"}
        </button>
        <a
          href={meetingUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="max-w-[12rem] truncate text-xs text-slate-500 hover:text-slate-700"
          title={meetingUrl}
        >
          Open link
        </a>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-slate-600">
        Share this link with the candidate. This is a placeholder URL for demo purposes — it does not
        create a real Microsoft Teams meeting yet.
      </p>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <a
          href={meetingUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="min-w-0 flex-1 break-all rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 font-mono text-xs text-[#0d4f6e] hover:bg-slate-100"
        >
          {meetingUrl}
        </a>
        <button
          type="button"
          onClick={copyLink}
          className="inline-flex shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50"
        >
          {copied ? "Copied" : "Copy link"}
        </button>
      </div>
    </div>
  );
}
