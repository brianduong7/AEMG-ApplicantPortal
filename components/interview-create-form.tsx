"use client";

import { useActionState, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  createInterviewForStaff,
  type InterviewFormState,
} from "@/app/actions/interview";
import { InterviewRoundCreateDialog } from "@/components/interview-round-create-dialog";
import { IconPlus } from "@/components/icons";

type ApplicationOption = {
  name: string;
  label: string;
  jobOpeningId?: string;
  jobOpeningLabel?: string;
};

type RoundOption = {
  name: string;
  interviewType?: string;
};

type TypeOption = {
  name: string;
  description?: string;
};

type Props = {
  applications: ApplicationOption[];
  interviewLinkMode: "round" | "type";
  interviewRounds: RoundOption[];
  interviewTypes: TypeOption[];
  defaultInterviewRound?: string;
  defaultInterviewType?: string;
  preselectedApplication?: string;
};

const inputClass =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-slate-900 shadow-sm outline-none focus:border-[#0a1628]/40 focus:ring-2 focus:ring-[#0a1628]/15";
const labelClass = "text-sm font-medium text-slate-700";
const readOnlyClass =
  "w-full rounded-lg border border-slate-100 bg-slate-50 px-3 py-2.5 text-sm text-slate-800";

export function InterviewCreateForm({
  applications,
  interviewLinkMode,
  interviewRounds: initialRounds,
  interviewTypes,
  defaultInterviewRound,
  defaultInterviewType,
  preselectedApplication,
}: Props) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(
    createInterviewForStaff,
    null as InterviewFormState,
  );

  const useRound = interviewLinkMode === "round";
  const roundDefault = defaultInterviewRound ?? initialRounds[0]?.name ?? "";
  const typeDefault = defaultInterviewType ?? interviewTypes[0]?.name ?? "";

  const [roundDialogOpen, setRoundDialogOpen] = useState(false);
  const [rounds, setRounds] = useState(initialRounds);
  const [applicationName, setApplicationName] = useState(preselectedApplication ?? "");
  const [roundName, setRoundName] = useState(roundDefault);
  const [typeName, setTypeName] = useState(typeDefault);

  const selectedApplication = useMemo(
    () => applications.find((a) => a.name === applicationName),
    [applications, applicationName],
  );

  const selectedRound = useMemo(
    () => rounds.find((r) => r.name === roundName),
    [rounds, roundName],
  );

  const selectedTypeMeta = useMemo(
    () => interviewTypes.find((t) => t.name === typeName),
    [interviewTypes, typeName],
  );

  const derivedInterviewType = useRound ? selectedRound?.interviewType : typeName;

  return (
    <>
      <form
        action={formAction}
        className="rounded-xl border border-slate-200/80 bg-white p-6 shadow-sm sm:p-8"
      >
        <div className="flex w-full flex-col gap-6">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Interview details</h2>
            <p className="mt-1 text-sm text-slate-600">
              Schedule an interview and get a Teams link to share with the candidate. The link is a
              placeholder until live Microsoft Teams integration is enabled.
            </p>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="applicantName" className={labelClass}>
              Select application <span className="text-red-600">*</span>
            </label>
            <select
              id="applicantName"
              name="applicantName"
              required
              value={applicationName}
              onChange={(e) => setApplicationName(e.target.value)}
              className={inputClass}
            >
              <option value="" disabled>
                Select application…
              </option>
              {applications.map((a) => (
                <option key={a.name} value={a.name}>
                  {a.label}
                </option>
              ))}
            </select>
          </div>

          {selectedApplication?.jobOpeningLabel ?
            <div className="flex flex-col gap-1.5">
              <span className={labelClass}>Job opening</span>
              <p className={readOnlyClass} aria-live="polite">
                {selectedApplication.jobOpeningLabel}
              </p>
            </div>
          : null}

          {useRound ?
            <div className="flex flex-col gap-2">
              <div className="flex flex-wrap items-end justify-between gap-2">
                <label htmlFor="interviewRound" className={labelClass}>
                  Interview round <span className="text-red-600">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => setRoundDialogOpen(true)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  <IconPlus className="h-3.5 w-3.5" />
                  New round
                </button>
              </div>
              <select
                id="interviewRound"
                name="interviewRound"
                required
                value={roundName}
                onChange={(e) => setRoundName(e.target.value)}
                className={inputClass}
              >
                <option value="" disabled>
                  Select round…
                </option>
                {rounds.map((r) => (
                  <option key={r.name} value={r.name}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>
          : <div className="flex flex-col gap-1.5">
              <label htmlFor="interviewType" className={labelClass}>
                Interview type <span className="text-red-600">*</span>
              </label>
              <select
                id="interviewType"
                name="interviewType"
                required
                value={typeName}
                onChange={(e) => setTypeName(e.target.value)}
                className={inputClass}
              >
                <option value="" disabled>
                  Select type…
                </option>
                {interviewTypes.map((t) => (
                  <option key={t.name} value={t.name}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
          }

          {derivedInterviewType ?
            <div className="flex flex-col gap-1.5">
              <span className={labelClass}>Interview type</span>
              <p className={readOnlyClass} aria-live="polite">
                {derivedInterviewType}
              </p>
            </div>
          : null}

          {!useRound && selectedTypeMeta?.description ?
            <div className="flex flex-col gap-1.5">
              <span className={labelClass}>Type description</span>
              <p className={`${readOnlyClass} whitespace-pre-wrap`}>{selectedTypeMeta.description}</p>
            </div>
          : null}

          <div className="flex flex-col gap-1.5">
            <label htmlFor="scheduledOn" className={labelClass}>
              Date <span className="text-red-600">*</span>
            </label>
            <input
              id="scheduledOn"
              name="scheduledOn"
              type="date"
              required
              className={inputClass}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="fromTime" className={labelClass}>
              From <span className="text-red-600">*</span>
            </label>
            <input
              id="fromTime"
              name="fromTime"
              type="time"
              required
              defaultValue="10:00"
              className={inputClass}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="toTime" className={labelClass}>
              To <span className="text-red-600">*</span>
            </label>
            <input
              id="toTime"
              name="toTime"
              type="time"
              required
              defaultValue="11:00"
              className={inputClass}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="interviewSummary" className={labelClass}>
              Interview summary
            </label>
            <textarea
              id="interviewSummary"
              name="interviewSummary"
              rows={4}
              className={`${inputClass} resize-y min-h-[6rem]`}
              placeholder="Planning notes, agenda, or post-interview notes…"
            />
            <p className="text-xs text-slate-500">
              Optional. You can update this anytime from the interview detail page.
            </p>
          </div>

          {state?.error ?
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">
              {state.error}
            </p>
          : null}

          <div className="flex flex-wrap gap-3 border-t border-slate-100 pt-2">
            <button
              type="submit"
              disabled={pending}
              className="rounded-lg bg-[#0a1628] px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#152a45] disabled:opacity-60"
            >
              {pending ? "Creating…" : "Create interview"}
            </button>
            <Link
              href="/staff/interviews"
              className="rounded-lg border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </Link>
          </div>
        </div>
      </form>

      <InterviewRoundCreateDialog
        open={roundDialogOpen}
        onClose={() => setRoundDialogOpen(false)}
        onCreated={(name) => {
          setRounds((prev) => {
            if (prev.some((r) => r.name === name)) return prev;
            return [...prev, { name }].sort((a, b) => a.name.localeCompare(b.name));
          });
          setRoundName(name);
          router.refresh();
        }}
      />
    </>
  );
}
