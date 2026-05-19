"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { approveJobRequisition } from "@/app/actions/job-requisition";

type Props = {
  docName: string;
};

export function JobRequisitionApproveButton({ docName }: Props) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        startTransition(async () => {
          const result = await approveJobRequisition(docName);
          if (!result.error) router.refresh();
        });
      }}
      className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-900 hover:bg-emerald-100 disabled:opacity-60"
    >
      {pending ? "Approving…" : "Approve"}
    </button>
  );
}
