"use client";

import { useMemo, useState } from "react";
import { IconCircleHelp } from "@/components/icons";
import type { RecruitmentQuestion } from "@/lib/recruitment-questions-demo";
import { ADDITIONAL_RECRUITMENT_QUESTION_FIELD } from "@/lib/job-opening-questions-demo";

const labelClass = "text-sm font-medium text-slate-700";

type DropZone = "included" | "pool";

type DragPayload = {
  id: string;
  source: DropZone;
};

type Props = {
  defaultQuestions: RecruitmentQuestion[];
  optionalQuestions: RecruitmentQuestion[];
  /** Selected optional question ids (edit mode). */
  initialAdditionalQuestionIds?: string[];
};

function questionMeta(q: RecruitmentQuestion) {
  return (
    <div className="mt-1 flex flex-wrap gap-2 text-xs text-slate-500">
      <span className="font-mono">{q.id}</span>
      <span>{q.question_type}</span>
      {q.is_required_default ?
        <span className="text-amber-800">Required</span>
      : null}
      {q.category ?
        <span>{q.category}</span>
      : null}
    </div>
  );
}

function GripIcon() {
  return (
    <svg
      className="size-4 shrink-0 text-slate-400"
      viewBox="0 0 16 16"
      fill="currentColor"
      aria-hidden
    >
      <circle cx="5" cy="4" r="1.25" />
      <circle cx="11" cy="4" r="1.25" />
      <circle cx="5" cy="8" r="1.25" />
      <circle cx="11" cy="8" r="1.25" />
      <circle cx="5" cy="12" r="1.25" />
      <circle cx="11" cy="12" r="1.25" />
    </svg>
  );
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      className={`size-5 shrink-0 text-slate-500 transition-transform ${open ? "rotate-180" : ""}`}
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden
    >
      <path
        fillRule="evenodd"
        d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
        clipRule="evenodd"
      />
    </svg>
  );
}

export function OpeningQuestionPicker({
  defaultQuestions,
  optionalQuestions,
  initialAdditionalQuestionIds = [],
}: Props) {
  const [open, setOpen] = useState(false);
  const [includedIds, setIncludedIds] = useState<string[]>(() =>
    initialAdditionalQuestionIds.filter((id) =>
      optionalQuestions.some((q) => q.id === id),
    ),
  );
  const [dragOverZone, setDragOverZone] = useState<DropZone | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);

  const optionalById = useMemo(
    () => new Map(optionalQuestions.map((q) => [q.id, q] as const)),
    [optionalQuestions],
  );

  const includedOptional = includedIds
    .map((id) => optionalById.get(id))
    .filter((q): q is RecruitmentQuestion => Boolean(q));

  const poolQuestions = optionalQuestions.filter((q) => !includedIds.includes(q.id));

  const totalIncluded = defaultQuestions.length + includedOptional.length;

  function moveToIncluded(id: string) {
    if (!optionalById.has(id) || includedIds.includes(id)) return;
    setIncludedIds((prev) => [...prev, id]);
  }

  function moveToPool(id: string) {
    setIncludedIds((prev) => prev.filter((x) => x !== id));
  }

  function readDragPayload(event: React.DragEvent): DragPayload | null {
    const raw = event.dataTransfer.getData("application/json");
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw) as DragPayload;
      if (parsed?.id && (parsed.source === "included" || parsed.source === "pool")) {
        return parsed;
      }
    } catch {
      /* ignore */
    }
    return null;
  }

  function handleDrop(zone: DropZone, event: React.DragEvent) {
    event.preventDefault();
    setDragOverZone(null);
    setDraggingId(null);
    const payload = readDragPayload(event);
    if (!payload) return;
    if (zone === "included" && payload.source === "pool") {
      moveToIncluded(payload.id);
    }
    if (zone === "pool" && payload.source === "included") {
      moveToPool(payload.id);
    }
  }

  function startDrag(source: DropZone, id: string, event: React.DragEvent) {
    const payload: DragPayload = { id, source };
    event.dataTransfer.setData("application/json", JSON.stringify(payload));
    event.dataTransfer.effectAllowed = "move";
    setDraggingId(id);
  }

  function zoneClass(zone: DropZone) {
    const active = dragOverZone === zone;
    return [
      "min-h-[10rem] rounded-lg border-2 border-dashed p-3 transition-colors",
      active ? "border-violet-400 bg-violet-100/50" : "border-slate-200 bg-white/80",
    ].join(" ");
  }

  return (
    <section className="w-full overflow-hidden rounded-xl border border-violet-200/80 bg-violet-50/30">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition hover:bg-violet-50/60 sm:px-5"
        aria-expanded={open}
      >
        <ChevronIcon open={open} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg bg-violet-100 text-violet-700"
              aria-hidden
            >
              <IconCircleHelp className="h-4 w-4" />
            </span>
            <h3 className="text-base font-semibold text-slate-900">Application questions</h3>
          </div>
          <p className="mt-0.5 text-sm text-slate-600">
            {defaultQuestions.length} standard · {includedOptional.length} from pool ·{" "}
            {totalIncluded} included
            {!open ? " — click to configure" : null}
          </p>
        </div>
      </button>

      {open ?
        <div className="border-t border-violet-200/80 px-4 pb-5 pt-4 sm:px-5">
          <p className="text-sm text-slate-600">
            Drag questions between the pool and included list. Standard questions always stay on the
            application form.
          </p>

          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <div>
              <p className={labelClass}>Included on this opening</p>
              <p className="mt-0.5 text-xs text-slate-500">
                Drop questions here to add them to the applicant form.
              </p>
              <div
                className={`${zoneClass("included")} mt-2`}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOverZone("included");
                }}
                onDragLeave={() => setDragOverZone(null)}
                onDrop={(e) => handleDrop("included", e)}
              >
                <ul className="space-y-2">
                  {defaultQuestions.map((q) => (
                    <li
                      key={q.id}
                      className="flex items-start gap-2 rounded-lg border border-violet-100 bg-violet-50/80 px-3 py-2.5 text-sm"
                    >
                      <span
                        className="mt-0.5 inline-flex size-5 shrink-0 items-center justify-center rounded bg-violet-200/80 text-[10px] font-bold text-violet-800"
                        title="Always included"
                      >
                        ★
                      </span>
                      <div className="min-w-0 flex-1">
                        <span className="font-medium text-slate-900">{q.question}</span>
                        {questionMeta(q)}
                      </div>
                    </li>
                  ))}
                  {includedOptional.map((q) => (
                    <li
                      key={q.id}
                      draggable
                      onDragStart={(e) => startDrag("included", q.id, e)}
                      onDragEnd={() => {
                        setDraggingId(null);
                        setDragOverZone(null);
                      }}
                      className={`flex cursor-grab items-start gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm shadow-sm active:cursor-grabbing ${
                        draggingId === q.id ? "opacity-40" : ""
                      }`}
                    >
                      <GripIcon />
                      <div className="min-w-0 flex-1">
                        <span className="font-medium text-slate-900">{q.question}</span>
                        {questionMeta(q)}
                        {q.help_text ?
                          <p className="mt-1 text-xs text-slate-500">{q.help_text}</p>
                        : null}
                      </div>
                    </li>
                  ))}
                  {includedOptional.length === 0 && defaultQuestions.length === 0 ?
                    <li className="py-6 text-center text-sm text-slate-500">
                      Drop questions here
                    </li>
                  : null}
                </ul>
              </div>
            </div>

            <div>
              <p className={labelClass}>Question pool</p>
              <p className="mt-0.5 text-xs text-slate-500">
                Drag questions here to remove them from this opening.
              </p>
              <div
                className={`${zoneClass("pool")} mt-2`}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOverZone("pool");
                }}
                onDragLeave={() => setDragOverZone(null)}
                onDrop={(e) => handleDrop("pool", e)}
              >
                {poolQuestions.length === 0 ?
                  <p className="py-6 text-center text-sm text-slate-500">
                    All pool questions are included
                  </p>
                : <ul className="space-y-2">
                    {poolQuestions.map((q) => (
                      <li
                        key={q.id}
                        draggable
                        onDragStart={(e) => startDrag("pool", q.id, e)}
                        onDragEnd={() => {
                          setDraggingId(null);
                          setDragOverZone(null);
                        }}
                        className={`flex cursor-grab items-start gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm shadow-sm active:cursor-grabbing ${
                          draggingId === q.id ? "opacity-40" : ""
                        }`}
                      >
                        <GripIcon />
                        <div className="min-w-0 flex-1">
                          <span className="font-medium text-slate-900">{q.question}</span>
                          {questionMeta(q)}
                          {q.help_text ?
                            <p className="mt-1 text-xs text-slate-500">{q.help_text}</p>
                          : null}
                        </div>
                      </li>
                    ))}
                  </ul>
                }
              </div>
            </div>
          </div>
        </div>
      : null}

      {includedIds.map((id) => (
        <input key={id} type="hidden" name={ADDITIONAL_RECRUITMENT_QUESTION_FIELD} value={id} />
      ))}
    </section>
  );
}
