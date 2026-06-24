"use client";

import { useActionState, useEffect, useRef } from "react";
import {
  addJobOfferComment,
  type JobOfferCommentFormState,
} from "@/app/actions/job-offer-comment";

type Props = {
  offerDocName: string;
};

export function JobOfferCommentForm({ offerDocName }: Props) {
  const [state, formAction, pending] = useActionState(
    addJobOfferComment,
    null as JobOfferCommentFormState,
  );
  const formRef = useRef<HTMLFormElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (state?.ok) {
      formRef.current?.reset();
      if (textareaRef.current) {
        textareaRef.current.style.height = "";
      }
    }
  }, [state?.ok]);

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-3 border-t border-slate-100 pt-4">
      <input type="hidden" name="offerDocName" value={offerDocName} />
      <label htmlFor="job-offer-comment" className="text-sm font-medium text-slate-700">
        Add comment
      </label>
      <textarea
        ref={textareaRef}
        id="job-offer-comment"
        name="content"
        required
        rows={5}
        placeholder="Add internal notes or reference details for this offer…"
        className="min-h-[7.5rem] max-h-[24rem] resize-y overflow-y-auto rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-[#0a1628] focus:outline-none focus:ring-1 focus:ring-[#0a1628]/25"
      />
      {state?.error ?
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">
          {state.error}
        </p>
      : null}
      {state?.ok ?
        <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-900" role="status">
          {state.ok}
        </p>
      : null}
      <button
        type="submit"
        disabled={pending}
        className="w-fit rounded-lg bg-[#0a1628] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#152a45] disabled:opacity-60"
      >
        {pending ? "Posting…" : "Post comment"}
      </button>
    </form>
  );
}
