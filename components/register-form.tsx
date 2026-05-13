"use client";

import Image from "next/image";
import { useActionState } from "react";
import Link from "next/link";
import type { RegisterFormState } from "@/app/actions/auth";
import { registerCandidate } from "@/app/actions/auth";
import { COMPANIES, type CompanyId } from "@/lib/companies";
import { getLoginTheme } from "@/lib/portal-theme";

type Props = {
  companyId: CompanyId;
  returnTo?: string;
};

export function RegisterForm({ companyId, returnTo }: Props) {
  const [state, formAction, pending] = useActionState(
    registerCandidate,
    null as RegisterFormState,
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
          <p className={t.eyebrow}>Applicant portal</p>
          <h1 className={t.title}>Register — {meta.shortLabel}</h1>
          <p className={t.description}>
            Create a website user and candidate profile in ERPNext, then continue to the portal.
          </p>
        </div>
        <form action={formAction} className="flex flex-col gap-5">
          <input type="hidden" name="company" value={companyId} />
          {returnTo ? (
            <input type="hidden" name="returnTo" value={returnTo} />
          ) : null}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="firstName" className={t.label}>
              First name <span className="text-red-600">*</span>
            </label>
            <input
              id="firstName"
              name="firstName"
              type="text"
              autoComplete="given-name"
              required
              className={t.input}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="lastName" className={t.label}>
              Last name <span className="text-red-600">*</span>
            </label>
            <input
              id="lastName"
              name="lastName"
              type="text"
              autoComplete="family-name"
              required
              className={t.input}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className={t.label}>
              Email <span className="text-red-600">*</span>
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              placeholder="you@example.com"
              className={t.input}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="password" className={t.label}>
              Password <span className="text-red-600">*</span>
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              placeholder="At least 8 characters"
              className={t.input}
            />
            <p className="text-xs text-slate-500">
              ERPNext may reject passwords that are too common. Choose a stronger passphrase if
              registration fails.
            </p>
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="phoneNumber" className={t.label}>
              Phone
            </label>
            <input
              id="phoneNumber"
              name="phoneNumber"
              type="tel"
              autoComplete="tel"
              className={t.input}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="linkedin" className={t.label}>
              LinkedIn URL
            </label>
            <input
              id="linkedin"
              name="linkedin"
              type="url"
              autoComplete="url"
              placeholder="https://linkedin.com/in/…"
              className={t.input}
            />
          </div>
          {state?.error ? (
            <p className={t.errorBox} role="alert">
              {state.error}
            </p>
          ) : null}
          <button type="submit" disabled={pending} className={t.submit}>
            {pending ? "Creating account…" : "Register & continue"}
          </button>
        </form>
        <p className={`${t.footerHint} mt-4`}>
          Already have an account?{" "}
          <Link
            href={`/applicant/login?intent=applicant&company=${companyId}${returnTo ? `&from=${encodeURIComponent(returnTo)}` : ""}`}
            className={t.contactLink}
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
