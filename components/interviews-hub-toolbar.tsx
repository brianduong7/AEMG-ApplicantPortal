"use client";

import { useState } from "react";
import Link from "next/link";
import { IconPlus } from "@/components/icons";
import { InterviewRoundCreateDialog } from "@/components/interview-round-create-dialog";
import { InterviewTypeCreateDialog } from "@/components/interview-type-create-dialog";

type Props = {
  canManage: boolean;
};

export function InterviewsHubToolbar({ canManage }: Props) {
  const [roundOpen, setRoundOpen] = useState(false);
  const [typeOpen, setTypeOpen] = useState(false);

  if (!canManage) return null;

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <Link
          href="/staff/interviews/new"
          className="inline-flex items-center gap-2 rounded-lg bg-[#0a1628] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#152a45]"
        >
          <IconPlus className="h-4 w-4" />
          New interview
        </Link>
        <button
          type="button"
          onClick={() => setRoundOpen(true)}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50"
        >
          <IconPlus className="h-4 w-4" />
          New round
        </button>
        <button
          type="button"
          onClick={() => setTypeOpen(true)}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50"
        >
          <IconPlus className="h-4 w-4" />
          New type
        </button>
      </div>

      <InterviewRoundCreateDialog open={roundOpen} onClose={() => setRoundOpen(false)} />
      <InterviewTypeCreateDialog open={typeOpen} onClose={() => setTypeOpen(false)} />
    </>
  );
}
