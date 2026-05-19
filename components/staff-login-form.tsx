"use client";

import Image from "next/image";
import { useActionState } from "react";
import Link from "next/link";
import type { AuthFormState } from "@/app/actions/auth";
import { staffLogin } from "@/app/actions/auth";
import { COMPANIES, type CompanyId } from "@/lib/companies";
import { getLoginTheme } from "@/lib/portal-theme";

type Props = {
  companyId: CompanyId;
  returnTo?: string;
  staleSession?: boolean;
};

export function StaffLoginForm({ companyId, returnTo, staleSession }: Props) {
  const [state, formAction, pending] = useActionState(staffLogin, null as AuthFormState);
  const t = getLoginTheme(companyId);
  const meta = COMPANIES[companyId];

  return (
    <div className={`${t.outer} min-h-dvh`}>
      <div className={`${t.card} w-full max-w-md`}>
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
          <p className={t.eyebrow}>Staff</p>
          <h1 className={t.title}>{meta.shortLabel}</h1>
        </div>
        {staleSession ?
          <p className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950">
            Your previous session expired. Sign in again to continue.
          </p>
        : null}
        <form action={formAction} className="flex flex-col gap-5">
          <input type="hidden" name="company" value={companyId} />
          {returnTo ? <input type="hidden" name="returnTo" value={returnTo} /> : null}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="staff-email" className={t.label}>
              Email
            </label>
            <input
              id="staff-email"
              name="email"
              type="email"
              autoComplete="email"
              required
              placeholder="you@example.com"
              className={t.input}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="staff-password" className={t.label}>
              Password
            </label>
            <input
              id="staff-password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              minLength={6}
              placeholder="Your password"
              className={t.input}
            />
          </div>
          {state?.error ?
            <p className={t.errorBox} role="alert">
              {state.error}
            </p>
          : null}
          <button type="submit" disabled={pending} className={t.submit}>
            {pending ? "Signing in…" : "Sign in"}
          </button>
        </form>
        <p className={`${t.footerHint} mt-6`}>
          New recruiter account?{" "}
          <Link
            href={
              returnTo ?
                `/recruiter/register?from=${encodeURIComponent(returnTo)}&company=${companyId}`
              : `/recruiter/register?company=${companyId}`
            }
            className={t.contactLink}
          >
            Create an account
          </Link>
        </p>
        <p className={t.footerHint}>
          <Link
            href={`/applicant/login?company=${companyId}&intent=applicant`}
            className={t.contactLink}
          >
            Applicant sign-in
          </Link>
        </p>
      </div>
    </div>
  );
}
