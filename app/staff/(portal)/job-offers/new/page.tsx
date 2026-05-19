import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { JobOfferCreateForm } from "@/components/job-offer-create-form";
import { erpCompanyNameForPortal } from "@/lib/companies";
import { toDesignationOptions } from "@/lib/designation-options";
import {
  fetchERPNextDesignations,
  fetchERPNextHrTermsAndConditions,
  fetchERPNextJobOfferTermTemplates,
  fetchERPNextOfferTerms,
  fetchERPNextJobOpeningsForHr,
  getERPNextJobApplicantOpeningField,
  hasERPNextConfig,
} from "@/lib/erpnext";
import {
  buildJobOfferApplicationOptions,
  type JobOfferApplicationOption,
} from "@/lib/job-offer-application-options";
import { loadApplicantForRecruiterPortal } from "@/lib/recruiter-applicants";
import { readStaffFrappeCookieHeader } from "@/lib/staff-erpnext-session";
import {
  staffHasHrCapabilities,
  staffHasRecruiterCapabilities,
} from "@/lib/staff-roles";
import { requireStaffRoles } from "@/lib/staff-session";

export const metadata: Metadata = {
  title: "New job offer — Staff",
};

type Props = {
  searchParams?: Promise<{ applicant?: string }>;
};

function mergeDesignationOption(
  options: ReturnType<typeof toDesignationOptions>,
  value?: string,
) {
  if (value && !options.some((d) => d.name === value)) {
    options.push({ name: value, label: value });
    options.sort((a, b) => a.label.localeCompare(b.label));
  }
}

async function preselectedApplicationFromApplicant(
  applicantId: string,
): Promise<JobOfferApplicationOption | null> {
  const applicant = await loadApplicantForRecruiterPortal(applicantId);
  if (!applicant?.name) return null;

  const openings = await fetchERPNextJobOpeningsForHr();
  const openingField = getERPNextJobApplicantOpeningField();
  const openingId = (applicant as Record<string, string | undefined>)[openingField];
  const openingRow = openings?.find((o) => o.name === openingId);

  let designation = applicant.designation?.trim() ?? "";
  designation = openingRow?.designation?.trim() || designation;

  const applicantName = applicant.applicant_name?.trim() || applicant.name;
  const email = applicant.email_id?.trim();
  const label = [applicantName, email].filter(Boolean).join(" · ") || applicant.name;

  return {
    name: applicant.name,
    label,
    applicantName,
    email: email || undefined,
    designation: designation || undefined,
    jobOpeningLabel: openingRow?.job_title?.trim() || openingId,
  };
}

export default async function StaffNewJobOfferPage({ searchParams }: Props) {
  const { session, roles } = await requireStaffRoles([
    "d_recruiter",
    "d_hr",
    "d_executive",
    "super_admin",
  ]);

  const canCreate =
    staffHasRecruiterCapabilities(roles) || staffHasHrCapabilities(roles);
  const isHr = staffHasHrCapabilities(roles);

  if (!canCreate) {
    return (
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">New job offer</h1>
        <p className="mt-2 text-sm text-slate-600">You do not have permission to create job offers.</p>
      </div>
    );
  }

  if (!hasERPNextConfig()) {
    return (
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">New job offer</h1>
        <p className="mt-2 text-sm text-slate-600">Recruitment backend is not configured.</p>
      </div>
    );
  }

  const sp = (await searchParams) ?? {};
  const applicantId =
    typeof sp.applicant === "string" && sp.applicant.trim() ? sp.applicant.trim() : "";

  if (!applicantId && !isHr) {
    redirect("/staff/job-offers");
  }

  const frappeCookie = await readStaffFrappeCookieHeader();
  const [designations, termsRows, templateRows, offerTermRows] = await Promise.all([
    fetchERPNextDesignations({ frappeSessionCookie: frappeCookie }),
    fetchERPNextHrTermsAndConditions(),
    fetchERPNextJobOfferTermTemplates(),
    fetchERPNextOfferTerms(),
  ]);

  const designationOptions = toDesignationOptions(designations);
  const termsAndConditions = (termsRows ?? []).map((t) => ({
    name: t.name,
    title: t.title,
  }));
  const jobOfferTermTemplates = (templateRows ?? []).map((t) => ({
    name: t.name,
    title: t.name,
  }));
  const offerTermOptions = (offerTermRows ?? []).map((t) => ({
    name: t.name,
    title: t.name,
  }));

  const defaultOfferDate = new Date().toISOString().slice(0, 10);
  const companyLabel = erpCompanyNameForPortal(session.company);

  if (applicantId) {
    const preselected = await preselectedApplicationFromApplicant(applicantId);
    if (!preselected) notFound();
    mergeDesignationOption(designationOptions, preselected.designation);

    return (
      <div className="flex flex-col gap-6">
        <div>
          <Link
            href={`/staff/applicants/${encodeURIComponent(preselected.name)}`}
            className="text-sm font-medium text-slate-600 hover:text-slate-900"
          >
            ← {preselected.applicantName}
          </Link>
          <h1 className="mt-2 text-2xl font-semibold text-slate-900">New job offer</h1>
          <p className="mt-1 text-sm text-slate-600">
            Create a draft offer for this application. HR will review, submit, and send when ready.
          </p>
        </div>

        <JobOfferCreateForm
          mode="prefilled"
          companyId={session.company}
          companyLabel={companyLabel}
          designations={designationOptions}
          termsAndConditions={termsAndConditions}
          jobOfferTermTemplates={jobOfferTermTemplates}
          offerTermOptions={offerTermOptions}
          defaultOfferDate={defaultOfferDate}
          preselectedApplication={preselected}
          cancelHref={`/staff/applicants/${encodeURIComponent(preselected.name)}`}
        />
      </div>
    );
  }

  const applications = await buildJobOfferApplicationOptions();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/staff/job-offers" className="text-sm font-medium text-slate-600 hover:text-slate-900">
          ← Job offers
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-slate-900">New job offer</h1>
        <p className="mt-1 text-sm text-slate-600">
          Select an application to prefill applicant details, then complete the offer and save as a
          draft.
        </p>
      </div>

      <JobOfferCreateForm
        mode="picker"
        companyId={session.company}
        companyLabel={companyLabel}
        designations={designationOptions}
        termsAndConditions={termsAndConditions}
        jobOfferTermTemplates={jobOfferTermTemplates}
        offerTermOptions={offerTermOptions}
        defaultOfferDate={defaultOfferDate}
        applications={applications}
        cancelHref="/staff/job-offers"
      />
    </div>
  );
}
