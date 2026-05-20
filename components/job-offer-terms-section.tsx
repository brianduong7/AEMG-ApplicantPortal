"use client";

import { useCallback, useEffect, useState } from "react";
import type { JobOfferTermLine } from "@/lib/job-offer-terms";
import { serializeJobOfferTerms } from "@/lib/job-offer-terms";

type LinkOption = { name: string; title?: string };

type Props = {
  offerTermOptions: LinkOption[];
  jobOfferTermTemplates: LinkOption[];
  termsAndConditions: LinkOption[];
  initialTemplate?: string;
  initialSelectTerms?: string;
  initialTerms?: string;
  initialRows?: JobOfferTermLine[];
  /** Prefix for element ids when multiple sections on a page */
  idPrefix?: string;
};

const inputClass =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none focus:border-[#0a1628]/40 focus:ring-2 focus:ring-[#0a1628]/15";
const selectClass = `${inputClass} appearance-none bg-[length:1rem] bg-[right_0.5rem_center] bg-no-repeat pr-8`;
const labelClass = "text-sm font-medium text-slate-700";
const selectChevronStyle = {
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%2364748b' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3E%3C/svg%3E")`,
} as const;

function emptyRow(): JobOfferTermLine {
  return { offer_term: "", value: "" };
}

function normalizeInitialRows(rows?: JobOfferTermLine[]): JobOfferTermLine[] {
  if (!rows?.length) return [emptyRow()];
  return rows.map((r) => ({
    offer_term: r.offer_term?.trim() ?? "",
    value: r.value?.trim() ?? "",
  }));
}

export function JobOfferTermsSection({
  offerTermOptions,
  jobOfferTermTemplates,
  termsAndConditions,
  initialTemplate = "",
  initialSelectTerms = "",
  initialTerms = "",
  initialRows,
  idPrefix = "jo",
}: Props) {
  const [template, setTemplate] = useState(initialTemplate);
  const [selectTerms, setSelectTerms] = useState(initialSelectTerms);
  const [termsBody, setTermsBody] = useState(initialTerms);
  const [rows, setRows] = useState<JobOfferTermLine[]>(() => normalizeInitialRows(initialRows));
  const [loadingTemplate, setLoadingTemplate] = useState(false);
  const [loadingTerms, setLoadingTerms] = useState(false);

  useEffect(() => {
    setTemplate(initialTemplate);
    setSelectTerms(initialSelectTerms);
    setTermsBody(initialTerms);
  }, [initialTemplate, initialSelectTerms, initialTerms]);

  const applyTemplate = useCallback(async (templateName: string) => {
    if (!templateName.trim()) return;
    setLoadingTemplate(true);
    try {
      const res = await fetch(
        `/api/staff/job-offer-term-template?name=${encodeURIComponent(templateName)}`,
      );
      if (!res.ok) return;
      const json = (await res.json()) as { offer_terms?: JobOfferTermLine[] };
      const loaded = json.offer_terms ?? [];
      setRows(loaded.length ? loaded : [emptyRow()]);
    } finally {
      setLoadingTemplate(false);
    }
  }, []);

  const loadTermsBody = useCallback(async (termsName: string) => {
    if (!termsName.trim()) {
      setTermsBody("");
      return;
    }
    setLoadingTerms(true);
    try {
      const res = await fetch(
        `/api/staff/terms-and-conditions?name=${encodeURIComponent(termsName)}`,
      );
      if (!res.ok) return;
      const json = (await res.json()) as { terms?: string };
      if (typeof json.terms === "string") setTermsBody(json.terms);
    } finally {
      setLoadingTerms(false);
    }
  }, []);

  const updateRow = (index: number, patch: Partial<JobOfferTermLine>) => {
    setRows((prev) => prev.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  };

  const addRow = () => setRows((prev) => [...prev, emptyRow()]);

  const removeRow = (index: number) => {
    setRows((prev) => {
      if (prev.length <= 1) return [emptyRow()];
      return prev.filter((_, i) => i !== index);
    });
  };

  const validRows = rows.filter((r) => r.offer_term.trim() && r.value.trim());

  return (
    <div className="flex flex-col gap-6 border-t border-slate-100 pt-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-semibold text-slate-900">Offer terms</h3>
          <p className="mt-1 text-sm text-slate-600">
            Line items such as department, notice period, and benefits. Pick a template to prefill
            rows, or add them manually.
          </p>
        </div>
        <button
          type="button"
          className="shrink-0 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm hover:bg-slate-50"
        >
          Use Offer Template
        </button>
      </div>

      <input type="hidden" name="offerTermsJson" value={serializeJobOfferTerms(validRows)} />

      {jobOfferTermTemplates.length > 0 ?
        <div className="flex flex-col gap-1.5">
          <label htmlFor={`${idPrefix}-term-template`} className={labelClass}>
            Job offer term template
          </label>
          <select
            id={`${idPrefix}-term-template`}
            name="jobOfferTermTemplate"
            value={template}
            disabled={loadingTemplate}
            onChange={(e) => {
              const next = e.target.value;
              setTemplate(next);
              if (next) void applyTemplate(next);
            }}
            className={selectClass}
            style={selectChevronStyle}
          >
            <option value="">— None —</option>
            {jobOfferTermTemplates.map((t) => (
              <option key={t.name} value={t.name}>
                {t.title ?? t.name}
              </option>
            ))}
          </select>
          {loadingTemplate ?
            <p className="text-xs text-slate-500">Loading template rows…</p>
          : null}
        </div>
      : null}

      {offerTermOptions.length > 0 ?
        <div className="flex flex-col gap-2">
          <span className={labelClass}>
            Job offer terms <span className="font-normal text-slate-500">(offer term + value)</span>
          </span>
          <div className="overflow-x-auto rounded-lg border border-slate-200">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="w-10 px-2 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    #
                  </th>
                  <th className="min-w-[10rem] px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Offer term <span className="text-red-600">*</span>
                  </th>
                  <th className="min-w-[14rem] px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Value / description <span className="text-red-600">*</span>
                  </th>
                  <th className="w-12 px-2 py-2" aria-label="Actions" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {rows.map((row, index) => (
                  <tr key={index}>
                    <td className="px-2 py-2 text-slate-500">{index + 1}</td>
                    <td className="px-3 py-2">
                      <select
                        value={row.offer_term}
                        onChange={(e) => updateRow(index, { offer_term: e.target.value })}
                        className={selectClass}
                        style={selectChevronStyle}
                        aria-label={`Offer term row ${index + 1}`}
                      >
                        <option value="">Select…</option>
                        {offerTermOptions.map((o) => (
                          <option key={o.name} value={o.name}>
                            {o.title ?? o.name}
                          </option>
                        ))}
                        {row.offer_term &&
                        !offerTermOptions.some((o) => o.name === row.offer_term) ?
                          <option value={row.offer_term}>{row.offer_term}</option>
                        : null}
                      </select>
                    </td>
                    <td className="px-3 py-2">
                      <textarea
                        value={row.value}
                        onChange={(e) => updateRow(index, { value: e.target.value })}
                        rows={2}
                        className={`${inputClass} min-h-[2.5rem] resize-y`}
                        placeholder="Value or description"
                        aria-label={`Value row ${index + 1}`}
                      />
                    </td>
                    <td className="px-2 py-2 text-center">
                      <button
                        type="button"
                        onClick={() => removeRow(index)}
                        className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                        title="Remove row"
                        aria-label={`Remove row ${index + 1}`}
                      >
                        ×
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button
            type="button"
            onClick={addRow}
            className="self-start rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Add row
          </button>
        </div>
      : null}

      {termsAndConditions.length > 0 ?
        <div className="flex flex-col gap-1.5">
          <label htmlFor={`${idPrefix}-select-terms`} className={labelClass}>
            Select terms and conditions
          </label>
          <select
            id={`${idPrefix}-select-terms`}
            name="selectTerms"
            value={selectTerms}
            disabled={loadingTerms}
            onChange={(e) => {
              const next = e.target.value;
              setSelectTerms(next);
              void loadTermsBody(next);
            }}
            className={selectClass}
            style={selectChevronStyle}
          >
            <option value="">— None —</option>
            {termsAndConditions.map((t) => (
              <option key={t.name} value={t.name}>
                {t.title ?? t.name}
              </option>
            ))}
          </select>
          {loadingTerms ?
            <p className="text-xs text-slate-500">Loading terms…</p>
          : null}
        </div>
      : null}

      <div className="flex flex-col gap-1.5">
        <label htmlFor={`${idPrefix}-terms-body`} className={labelClass}>
          Terms and conditions
        </label>
        <textarea
          id={`${idPrefix}-terms-body`}
          name="terms"
          rows={8}
          value={termsBody}
          onChange={(e) => setTermsBody(e.target.value)}
          className={`${inputClass} min-h-[10rem] resize-y font-mono`}
          placeholder="Offer letter body (HTML supported)…"
        />
      </div>
    </div>
  );
}
