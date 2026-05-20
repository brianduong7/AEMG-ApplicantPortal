"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  approveJobRequisition,
  rejectJobRequisition,
} from "@/app/actions/job-requisition";

type Props = {
  docName: string;
  /** Inline buttons on list rows vs stacked on detail header */
  layout?: "inline" | "stacked";
};

export function JobRequisitionReviewActions({ docName, layout = "inline" }: Props) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const run = (action: "approve" | "reject") => {
    if (action === "reject") {
      const confirmed = window.confirm(
        "Reject this job requisition? The department manager will see it as rejected.",
      );
      if (!confirmed) return;
    }

    setError(null);
    startTransition(async () => {
      const result =
        action === "approve" ?
          await approveJobRequisition(docName)
        : await rejectJobRequisition(docName);
      if (result.error) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  };

  const containerClass =
    layout === "stacked" ?
      "flex flex-col items-start gap-2"
    : "flex flex-wrap items-center justify-end gap-2";

  return (
    <div className={containerClass}>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={pending}
          onClick={() => run("approve")}
          className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-900 hover:bg-emerald-100 disabled:opacity-60"
        >
          {pending ? "Saving…" : "Approve"}
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => run("reject")}
          className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-900 hover:bg-red-100 disabled:opacity-60"
        >
          {pending ? "Saving…" : "Reject"}
        </button>
      </div>
      {error ?
        <p className="text-xs text-red-700" role="alert">
          {error}
        </p>
      : null}
    </div>
  );
}
