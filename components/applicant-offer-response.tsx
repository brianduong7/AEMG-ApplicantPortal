"use client";

import { useActionState } from "react";
import {
  respondToJobOffer,
  type ApplicantOfferResponseState,
} from "@/app/actions/applicant-offer";
import type { ApplicantOfferForApplication } from "@/lib/applications";

type Props = {
  offer: ApplicantOfferForApplication;
  accentButtonClass: string;
  accentOutlineClass: string;
};

export function ApplicantOfferResponse({
  offer,
  accentButtonClass,
  accentOutlineClass,
}: Props) {
  const [state, formAction, pending] = useActionState(
    respondToJobOffer,
    null as ApplicantOfferResponseState,
  );

  if (!offer.canRespond) return null;

  return (
    <div className="mt-4 rounded-lg border border-amber-200/80 bg-amber-50/60 p-4">
      <p className="text-sm font-medium text-amber-950">
        You have a job offer waiting for your response.
      </p>
      <p className="mt-1 text-sm text-amber-900/90">
        {offer.designation} · {offer.company} · Offer date {offer.offerDate}
      </p>

      {state?.error ?
        <p className="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">
          {state.error}
        </p>
      : null}
      {state?.ok ?
        <p className="mt-3 rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-900" role="status">
          {state.ok}
        </p>
      : null}

      {!state?.ok ?
        <div className="mt-4 flex flex-wrap gap-3">
          <form action={formAction}>
            <input type="hidden" name="offerDocName" value={offer.id} />
            <input type="hidden" name="decision" value="accept" />
            <button
              type="submit"
              disabled={pending}
              className={`rounded-lg px-4 py-2 text-sm font-semibold text-white shadow-sm disabled:opacity-60 ${accentButtonClass}`}
            >
              {pending ? "Saving…" : "Accept offer"}
            </button>
          </form>
          <form action={formAction}>
            <input type="hidden" name="offerDocName" value={offer.id} />
            <input type="hidden" name="decision" value="decline" />
            <button
              type="submit"
              disabled={pending}
              className={`rounded-lg border bg-white px-4 py-2 text-sm font-semibold shadow-sm disabled:opacity-60 ${accentOutlineClass}`}
            >
              Decline offer
            </button>
          </form>
        </div>
      : null}
    </div>
  );
}
