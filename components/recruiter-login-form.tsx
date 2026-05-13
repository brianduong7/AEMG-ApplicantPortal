"use client";

import Image from "next/image";
import { useActionState } from "react";
import Link from "next/link";
import type { AuthFormState } from "@/app/actions/auth";
import { recruiterLogin } from "@/app/actions/auth";
import { COMPANIES, type CompanyId } from "@/lib/companies";
import { getLoginTheme } from "@/lib/portal-theme";

type Props = {
  companyId: CompanyId;
  returnTo?: string;
};

export function RecruiterLoginForm({ companyId, returnTo }: Props) {
  const [state, formAction, pending] = useActionState(
    recruiterLogin,
    null as AuthFormState,
  );
  const t = getLoginTheme(companyId);
  const meta = COMPANIES[companyId];

  return (
    <div className={t.outer}>
      <div className={t.overlay} />
      <div className={t.card}>
        <div className="mb-6 flex justify-center">
          <Image
            src={meta.logoSrc}
            alt={`${meta.shortLabel} logo`}
            width={200}
            height={64}
            className="h-14 w-auto max-w-[220px] object-contain"
            priority
          />
        </div>
        <div className="mb-8 text-center">
          <p className={t.eyebrow}>Recruiter portal</p>
          <h1 className={t.title}>{meta.shortLabel}</h1>
          <p className={t.description}>
            Sign in to manage job openings, applicants, and interviews via ERPNext.
          </p>
        </div>
        <form action={formAction} className="flex flex-col gap-5">
          <input type="hidden" name="company" value={companyId} />
          {returnTo ? (
            <input type="hidden" name="returnTo" value={returnTo} />
          ) : null}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="recruiter-email" className={t.label}>
              Email
            </label>
            <input
              id="recruiter-email"
              name="email"
              type="email"
              autoComplete="email"
              required
              placeholder="you@example.com"
              className={t.input}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="recruiter-password" className={t.label}>
              Password
            </label>
            <input
              id="recruiter-password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              minLength={6}
              placeholder="At least 6 characters"
              className={t.input}
            />
          </div>
          {state?.error ? (
            <p className={t.errorBox} role="alert">
              {state.error}
            </p>
          ) : null}
          <button type="submit" disabled={pending} className={t.submit}>
            {pending ? "Signing in…" : "Sign in to recruiter portal"}
          </button>
          <p className={t.demoNote}>
            Demo: any email works with a password of 6+ characters unless{" "}
            <code className="rounded bg-slate-100 px-1">ATS_RECRUITER_ALLOWED_EMAILS</code> (or{" "}
            <code className="rounded bg-slate-100 px-1">ATS_HR_ALLOWED_EMAILS</code>) is set.
          </p>
        </form>
        <p className={t.footerHint}>
          <Link
            href={`/applicant/login?company=${encodeURIComponent(companyId)}&intent=applicant`}
            className={t.contactLink}
          >
            Applicant sign-in
          </Link>
        </p>
      </div>
    </div>
  );
}
