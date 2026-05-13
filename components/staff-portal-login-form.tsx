"use client";

import Image from "next/image";
import { useActionState } from "react";
import Link from "next/link";
import type { AuthFormState } from "@/app/actions/auth";
import {
  departmentManagerLogin,
  hrPortalLogin,
} from "@/app/actions/auth";
import { COMPANIES, type CompanyId } from "@/lib/companies";
import { getLoginTheme } from "@/lib/portal-theme";

type PortalKind = "department_manager" | "hr_portal";

type LoginFn = (
  _prev: AuthFormState,
  formData: FormData,
) => Promise<AuthFormState>;

const CONFIG: Record<
  PortalKind,
  {
    action: LoginFn;
    eyebrow: string;
    description: string;
    submitIdle: string;
    envCodes: string[];
    emailId: string;
    passwordId: string;
  }
> = {
  department_manager: {
    action: departmentManagerLogin,
    eyebrow: "Department manager portal",
    description:
      "Sign in to review team staffing, approvals, and hiring activity for your department (stub — connect workflows when ready).",
    submitIdle: "Sign in to department manager portal",
    envCodes: ["ATS_DEPARTMENT_MANAGER_ALLOWED_EMAILS"],
    emailId: "dm-email",
    passwordId: "dm-password",
  },
  hr_portal: {
    action: hrPortalLogin,
    eyebrow: "HR portal",
    description:
      "Sign in for HR-wide tools—policies, compliance, and org reporting (stub). Day-to-day hiring tasks live in the recruiter portal.",
    submitIdle: "Sign in to HR portal",
    envCodes: ["ATS_HR_PORTAL_ALLOWED_EMAILS"],
    emailId: "hrp-email",
    passwordId: "hrp-password",
  },
};

type Props = {
  portal: PortalKind;
  companyId: CompanyId;
  returnTo?: string;
};

export function StaffPortalLoginForm({ portal, companyId, returnTo }: Props) {
  const cfg = CONFIG[portal];
  const [state, formAction, pending] = useActionState(cfg.action, null as AuthFormState);
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
          <p className={t.eyebrow}>{cfg.eyebrow}</p>
          <h1 className={t.title}>{meta.shortLabel}</h1>
          <p className={t.description}>{cfg.description}</p>
        </div>
        <form action={formAction} className="flex flex-col gap-5">
          <input type="hidden" name="company" value={companyId} />
          {returnTo ? <input type="hidden" name="returnTo" value={returnTo} /> : null}
          <div className="flex flex-col gap-1.5">
            <label htmlFor={cfg.emailId} className={t.label}>
              Email
            </label>
            <input
              id={cfg.emailId}
              name="email"
              type="email"
              autoComplete="email"
              required
              placeholder="you@example.com"
              className={t.input}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor={cfg.passwordId} className={t.label}>
              Password
            </label>
            <input
              id={cfg.passwordId}
              name="password"
              type="password"
              autoComplete="current-password"
              required
              minLength={6}
              placeholder="At least 6 characters"
              className={t.input}
            />
          </div>
          {state?.error ?
            <p className={t.errorBox} role="alert">
              {state.error}
            </p>
          : null}
          <button type="submit" disabled={pending} className={t.submit}>
            {pending ? "Signing in…" : cfg.submitIdle}
          </button>
          <p className={t.demoNote}>
            Demo: any email works with a password of 6+ characters unless{" "}
            {cfg.envCodes.map((code, i) => (
              <span key={code}>
                {i > 0 ? " or " : null}
                <code className="rounded bg-slate-100 px-1">{code}</code>
              </span>
            ))}{" "}
            is set.
          </p>
        </form>
        <p className={t.footerHint}>
          <Link
            href={`/applicant/login?company=${encodeURIComponent(companyId)}&intent=applicant`}
            className={t.contactLink}
          >
            Applicant sign-in
          </Link>
          {" · "}
          <Link
            href={`/recruiter/login?company=${encodeURIComponent(companyId)}`}
            className={t.contactLink}
          >
            Recruiter sign-in
          </Link>
        </p>
      </div>
    </div>
  );
}
