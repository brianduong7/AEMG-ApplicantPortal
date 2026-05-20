"use client";

import { useActionState } from "react";
import Link from "next/link";
import type { RegisterRecruiterFormState } from "@/app/actions/auth";
import { registerRecruiter } from "@/app/actions/auth";
import { RecruiterBrandLogos } from "@/components/recruiter-brand-logos";
import { getLoginTheme } from "@/lib/portal-theme";

const t = getLoginTheme("aife");

type Props = {
  returnTo?: string;
};

export function RecruiterRegisterForm({ returnTo }: Props) {
  const [state, formAction, pending] = useActionState(
    registerRecruiter,
    null as RegisterRecruiterFormState,
  );

  return (
    <div className={t.outer}>
      <div className={t.overlay} />
      <div className={t.card}>
        <div className="mb-6 flex justify-center">
          <RecruiterBrandLogos layout="auth" />
        </div>
        <div className="mb-8 text-center">
          <p className={t.eyebrow}>Recruiter portal</p>
          <h1 className={t.title}>Register — AIFE &amp; AEMG</h1>
          <p className={t.description}>
            Create a staff account for recruitment workflows, then continue to the portal.
          </p>
        </div>
        <form action={formAction} className="flex flex-col gap-5">
          {returnTo ? (
            <input type="hidden" name="returnTo" value={returnTo} />
          ) : null}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="recruiter-reg-firstName" className={t.label}>
              First name <span className="text-red-600">*</span>
            </label>
            <input
              id="recruiter-reg-firstName"
              name="firstName"
              type="text"
              autoComplete="given-name"
              required
              className={t.input}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="recruiter-reg-lastName" className={t.label}>
              Last name <span className="text-red-600">*</span>
            </label>
            <input
              id="recruiter-reg-lastName"
              name="lastName"
              type="text"
              autoComplete="family-name"
              required
              className={t.input}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="recruiter-reg-email" className={t.label}>
              Email <span className="text-red-600">*</span>
            </label>
            <input
              id="recruiter-reg-email"
              name="email"
              type="email"
              autoComplete="email"
              required
              placeholder="you@example.com"
              className={t.input}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="recruiter-reg-password" className={t.label}>
              Password <span className="text-red-600">*</span>
            </label>
            <input
              id="recruiter-reg-password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              placeholder="At least 8 characters"
              className={t.input}
            />
            <p className="text-xs text-slate-500">
              Weak passwords may be rejected. Your administrator assigns recruitment roles after
              registration.
            </p>
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
            href={
              returnTo ?
                `/staff/login?from=${encodeURIComponent(returnTo)}`
              : "/staff/login"
            }
            className={t.contactLink}
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
