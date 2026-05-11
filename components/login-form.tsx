"use client";

import Image from "next/image";
import { useActionState, useState } from "react";
import Link from "next/link";
import type { AuthFormState } from "@/app/actions/auth";
import { login } from "@/app/actions/auth";
import { COMPANIES, COMPANY_IDS, type CompanyId } from "@/lib/companies";
import { getLoginTheme } from "@/lib/portal-theme";

export function LoginForm() {
  const [company, setCompany] = useState<CompanyId>("aemg");
  const [state, formAction, pending] = useActionState(
    login,
    null as AuthFormState,
  );
  const t = getLoginTheme(company);
  const meta = COMPANIES[company];

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
          <h1 className={t.title}>{meta.shortLabel}</h1>
          <p className={t.description}>
            Sign in with your company account to explore open roles and apply.
          </p>
        </div>
        <form action={formAction} className="flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className={t.label}>
              Email
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
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              minLength={6}
              placeholder="At least 6 characters"
              className={t.input}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="company" className={t.label}>
              Company
            </label>
            <select
              id="company"
              name="company"
              required
              value={company}
              onChange={(e) => setCompany(e.target.value as CompanyId)}
              className={t.select}
            >
              {COMPANY_IDS.map((id) => (
                <option key={id} value={id}>
                  {COMPANIES[id].label}
                </option>
              ))}
            </select>
          </div>
          {state?.error ? (
            <p className={t.errorBox} role="alert">
              {state.error}
            </p>
          ) : null}
          <button type="submit" disabled={pending} className={t.submit}>
            {pending ? "Signing in…" : "Sign in"}
          </button>
          <p className={t.demoNote}>
            Demo: any email works with a password of 6+ characters.
          </p>
        </form>
        <p className={t.footerHint}>
          Need help?{" "}
          <Link href="mailto:careers@example.com" className={t.contactLink}>
            Contact recruiting
          </Link>
        </p>
      </div>
    </div>
  );
}
