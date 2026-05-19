import { erpCompanyNameForPortal, type CompanyId } from "@/lib/companies";
import { humanMessageFromFrappeApiError } from "@/lib/frappe-error-message";

type ERPNextJob = {
  name?: string;
  job_title?: string;
  designation?: string;
  department?: string;
  location?: string;
  employment_type?: string;
  description?: string;
  company?: string;
  status?: string;
  publish?: number;
  job_requisition?: string;
};

/** Link field on Job Opening → Job Requisition (override via env). */
export function jobOpeningRequisitionField(): string {
  return getEnv("ERPNEXT_JOB_OPENING_REQUISITION_FIELD")?.trim() || "job_requisition";
}

type ERPNextListResponse = {
  data?: ERPNextJob[];
};

type ERPNextSingleJobResponse = {
  data?: ERPNextJob;
};

type ERPNextCreateResponse = {
  data?: {
    name?: string;
  };
};

type ERPNextUploadResponse = {
  message?: {
    file_url?: string;
  };
};

type ERPNextUpdateResponse = {
  data?: {
    name?: string;
    resume_attachment?: string;
  };
};

function getEnv(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value ? value : undefined;
}

/** Public site URL for Frappe auth (`/api/method/login`, etc.). Does not require API keys. */
export function getERPNextSiteBaseUrl(): string | null {
  const baseUrl = getEnv("ERPNEXT_BASE_URL");
  return baseUrl ?? null;
}

function getERPConfig() {
  const baseUrl = getEnv("ERPNEXT_BASE_URL");
  const apiKey = getEnv("ERPNEXT_API_KEY");
  const apiSecret = getEnv("ERPNEXT_API_SECRET");
  const doctype = getEnv("ERPNEXT_JOB_DOCTYPE") ?? "Job Opening";
  const openStatus = getEnv("ERPNEXT_OPEN_STATUS");
  /**
   * Frappe HRMS: Job Applicant links to Job Opening on field `job_title` (UI label "Job Opening").
   * Set `job_opening` only if your DocType uses that fieldname instead.
   */
  const jobApplicantOpeningField =
    getEnv("ERPNEXT_JOB_APPLICANT_OPENING_FIELD") ?? "job_title";
  /** Job Applicant → Candidate link field (custom). */
  const jobApplicantCandidateField =
    getEnv("ERPNEXT_JOB_APPLICANT_CANDIDATE_FIELD") ?? "custom_candidate";
  const candidateDoctype = getEnv("ERPNEXT_CANDIDATE_DOCTYPE") ?? "Candidate";
  /** Candidate DocType field that links to User (default: `user`). */
  const candidateUserField = getEnv("ERPNEXT_CANDIDATE_USER_FIELD") ?? "user";
  /** Optional LinkedIn / social field on Candidate (override if your site uses `custom_linkedin`). */
  const candidateLinkedinField = getEnv("ERPNEXT_CANDIDATE_LINKEDIN_FIELD") ?? "linkedin";
  /** Must match Job Applicant Source `name` (field `source`, not `source_name`). */
  const applicantSource =
    getEnv("ERPNEXT_APPLICANT_SOURCE") ?? getEnv("ERPNEXT_APPLICANT_SOURCE_NAME");

  if (!baseUrl || !apiKey || !apiSecret) return null;

  return {
    baseUrl,
    apiKey,
    apiSecret,
    doctype,
    openStatus,
    jobApplicantOpeningField,
    jobApplicantCandidateField,
    candidateDoctype,
    candidateUserField,
    candidateLinkedinField,
    applicantSource,
  };
}

export function hasERPNextConfig(): boolean {
  return getERPConfig() !== null;
}

/** Field on `Job Applicant` that links to Job Opening (HRMS default: `job_title`). */
export function getERPNextJobApplicantCandidateField(): string {
  return getERPConfig()?.jobApplicantCandidateField ?? "custom_candidate";
}

export function getERPNextJobApplicantOpeningField(): string {
  const c = getERPConfig();
  if (c) return c.jobApplicantOpeningField;
  return process.env.ERPNEXT_JOB_APPLICANT_OPENING_FIELD?.trim() ?? "job_title";
}

export async function fetchERPNextJobs(company: CompanyId) {
  const config = getERPConfig();
  if (!config) return null;

  void company;
  const fields = [
    "name",
    "job_title",
    "designation",
    "department",
    "location",
    "employment_type",
    "description",
    "company",
    "status",
    "publish",
  ];
  const candidateFilters: Array<Array<[string, string, string]>> = config.openStatus
    ? [[["status", "=", config.openStatus]], []]
    : [[]];

  for (const filters of candidateFilters) {
    const url = new URL(
      `/api/resource/${encodeURIComponent(config.doctype)}`,
      config.baseUrl.endsWith("/") ? config.baseUrl : `${config.baseUrl}/`,
    );
    url.searchParams.set("fields", JSON.stringify(fields));
    if (filters.length) {
      url.searchParams.set("filters", JSON.stringify(filters));
    }
    url.searchParams.set("limit_page_length", "100");
    url.searchParams.set("order_by", "modified desc");

    const res = await fetch(url.toString(), {
      headers: {
        Authorization: `token ${config.apiKey}:${config.apiSecret}`,
        Accept: "application/json",
      },
      cache: "no-store",
    });
    if (!res.ok) {
      continue;
    }
    const json = (await res.json()) as ERPNextListResponse;
    const rows = json.data ?? [];
    if (rows.length > 0) return rows;
  }

  return [];
}

/** Published, open job openings for the public careers site. */
export async function fetchERPNextPublishedJobOpenings(): Promise<ERPNextJob[] | null> {
  const config = getERPConfig();
  if (!config) return null;

  const fields = [
    "name",
    "job_title",
    "designation",
    "department",
    "location",
    "employment_type",
    "description",
    "company",
    "status",
    "publish",
    "creation",
    "modified",
  ];

  const status = config.openStatus?.trim() || "Open";
  const filters: Array<[string, string, string | number]> = [
    ["publish", "=", 1],
    ["status", "=", status],
  ];

  const url = new URL(
    `/api/resource/${encodeURIComponent(config.doctype)}`,
    config.baseUrl.endsWith("/") ? config.baseUrl : `${config.baseUrl}/`,
  );
  url.searchParams.set("fields", JSON.stringify(fields));
  url.searchParams.set("filters", JSON.stringify(filters));
  url.searchParams.set("limit_page_length", "100");
  url.searchParams.set("order_by", "modified desc");

  const res = await fetch(url.toString(), {
    headers: {
      Authorization: `token ${config.apiKey}:${config.apiSecret}`,
      Accept: "application/json",
    },
    cache: "no-store",
  });
  if (!res.ok) return null;
  const json = (await res.json()) as ERPNextListResponse;
  return json.data ?? [];
}

/** Load one Job Opening by document name (e.g. HR-OPN-2026-0002). */
export async function fetchERPNextJobOpeningByDocName(
  docName: string,
): Promise<ERPNextJob | null> {
  const config = getERPConfig();
  const trimmed = docName.trim();
  if (!config || !trimmed) return null;

  const url = new URL(
    `/api/resource/${encodeURIComponent(config.doctype)}/${encodeURIComponent(trimmed)}`,
    config.baseUrl.endsWith("/") ? config.baseUrl : `${config.baseUrl}/`,
  );

  const res = await fetch(url.toString(), {
    headers: {
      Authorization: `token ${config.apiKey}:${config.apiSecret}`,
      Accept: "application/json",
    },
    cache: "no-store",
  });
  if (!res.ok) return null;
  const json = (await res.json()) as ERPNextSingleJobResponse;
  return json.data ?? null;
}

export async function createERPNextJobApplicant(input: {
  applicantName: string;
  email: string;
  phone?: string;
  country?: string;
  jobCode: string;
  coverLetter?: string;
  /** Job Applicant → Candidate (custom link), when configured. */
  candidateDocName?: string;
}) {
  const config = getERPConfig();
  if (!config) {
    throw new Error("ERPNext config missing");
  }

  const endpoint = new URL(
    "/api/resource/Job Applicant",
    config.baseUrl.endsWith("/") ? config.baseUrl : `${config.baseUrl}/`,
  );

  const headers = {
    Authorization: `token ${config.apiKey}:${config.apiSecret}`,
    Accept: "application/json",
    "Content-Type": "application/json",
  };
  const sourceFields = config.applicantSource ? { source: config.applicantSource } : {};

  const candidateField =
    input.candidateDocName?.trim() ?
      { [config.jobApplicantCandidateField]: input.candidateDocName.trim() }
    : {};

  const baseApplicant = {
    applicant_name: input.applicantName,
    email_id: input.email,
    phone_number: input.phone || undefined,
    country: input.country || undefined,
    cover_letter: input.coverLetter || undefined,
    status: "Open",
    ...sourceFields,
    ...candidateField,
  };

  // HRMS: the Link to Job Opening is stored in `job_title` (document name e.g. HR-OPN-2026-0002).
  // Never put the human-readable role name there — ERPNext validates it as a Job Opening id.
  const openingId = input.jobCode.trim();
  const openingKey = config.jobApplicantOpeningField;
  const candidates = [
    { ...baseApplicant, [openingKey]: openingId },
    { ...baseApplicant, [openingKey]: openingId, custom_job_opening_code: openingId },
  ];

  let lastError = "Unknown ERPNext error";
  for (const payload of candidates) {
    const res = await fetch(endpoint.toString(), {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
      cache: "no-store",
    });
    if (res.ok) {
      const json = (await res.json()) as ERPNextCreateResponse;
      if (json.data?.name) return json.data.name;
      throw new Error("ERPNext did not return applicant id");
    }
    const text = await res.text();
    lastError = `(${res.status}) ${text.slice(0, 220)}`;
  }
  throw new Error(`Failed to create Job Applicant ${lastError}`);
}

export async function uploadResumeForJobApplicant(input: {
  applicantId: string;
  file: File;
}) {
  const config = getERPConfig();
  if (!config) {
    throw new Error("ERPNext config missing");
  }

  const endpoint = new URL(
    "/api/method/upload_file",
    config.baseUrl.endsWith("/") ? config.baseUrl : `${config.baseUrl}/`,
  );

  const body = new FormData();
  body.append("file", input.file, input.file.name);
  body.append("is_private", "1");
  body.append("doctype", "Job Applicant");
  body.append("docname", input.applicantId);
  body.append("fieldname", "resume_attachment");
  body.append("folder", "Home/Attachments");

  const res = await fetch(endpoint.toString(), {
    method: "POST",
    headers: {
      Authorization: `token ${config.apiKey}:${config.apiSecret}`,
      Accept: "application/json",
    },
    body,
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to upload resume (${res.status}): ${text.slice(0, 220)}`);
  }

  const json = (await res.json()) as ERPNextUploadResponse;
  const fileUrl = json.message?.file_url ?? "";
  if (!fileUrl) {
    throw new Error("ERPNext did not return uploaded file URL");
  }

  const updateEndpoint = new URL(
    `/api/resource/Job Applicant/${encodeURIComponent(input.applicantId)}`,
    config.baseUrl.endsWith("/") ? config.baseUrl : `${config.baseUrl}/`,
  );
  const updateRes = await fetch(updateEndpoint.toString(), {
    method: "PUT",
    headers: {
      Authorization: `token ${config.apiKey}:${config.apiSecret}`,
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      resume_attachment: fileUrl,
    }),
    cache: "no-store",
  });

  if (!updateRes.ok) {
    const text = await updateRes.text();
    throw new Error(
      `Uploaded resume but failed to set resume_attachment (${updateRes.status}): ${text.slice(0, 220)}`,
    );
  }

  const updateJson = (await updateRes.json()) as ERPNextUpdateResponse;
  return updateJson.data?.resume_attachment ?? fileUrl;
}

export type ERPNextFetchedSiteFile = {
  ok: boolean;
  status: number;
  contentType: string | null;
  contentDisposition: string | null;
  body: ArrayBuffer | null;
};

/**
 * Downloads a site file (e.g. `/private/files/...` from `resume_attachment`) using API token auth.
 * Rejects absolute URLs whose host does not match `ERPNEXT_BASE_URL` to avoid SSRF.
 */
export async function fetchERPNextSiteFile(fileRef: string): Promise<ERPNextFetchedSiteFile> {
  const empty: ERPNextFetchedSiteFile = {
    ok: false,
    status: 404,
    contentType: null,
    contentDisposition: null,
    body: null,
  };

  const config = getERPConfig();
  const trimmed = fileRef.trim();
  if (!config || !trimmed) return empty;

  let siteBase: URL;
  try {
    siteBase = new URL(config.baseUrl.endsWith("/") ? config.baseUrl : `${config.baseUrl}/`);
  } catch {
    return { ...empty, status: 400 };
  }

  if (trimmed.startsWith("//")) return { ...empty, status: 400 };

  let pathWithQuery: string;
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    let refUrl: URL;
    try {
      refUrl = new URL(trimmed);
    } catch {
      return { ...empty, status: 400 };
    }
    if (refUrl.hostname !== siteBase.hostname) {
      return { ...empty, status: 400 };
    }
    pathWithQuery = refUrl.pathname + refUrl.search;
  } else {
    pathWithQuery = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  }

  if (!pathWithQuery.startsWith("/") || pathWithQuery.startsWith("//")) {
    return { ...empty, status: 400 };
  }

  const fileUrl = new URL(pathWithQuery, siteBase).toString();

  const res = await fetch(fileUrl, {
    method: "GET",
    headers: {
      Authorization: `token ${config.apiKey}:${config.apiSecret}`,
      Accept: "*/*",
    },
    cache: "no-store",
  });

  if (!res.ok) {
    return {
      ok: false,
      status: res.status,
      contentType: null,
      contentDisposition: null,
      body: null,
    };
  }

  const body = await res.arrayBuffer();
  const ctLower = (res.headers.get("content-type") ?? "").toLowerCase();
  if (ctLower.includes("text/html")) {
    return {
      ok: false,
      status: 502,
      contentType: null,
      contentDisposition: null,
      body: null,
    };
  }
  return {
    ok: true,
    status: 200,
    contentType: res.headers.get("content-type"),
    contentDisposition: res.headers.get("content-disposition"),
    body,
  };
}

// --- HR portal (same API key as applicant flows) ---

export type ERPNextJobApplicantRow = {
  name?: string;
  applicant_name?: string;
  email_id?: string;
  phone_number?: string;
  status?: string;
  job_title?: string;
  /** Link to Designation (when present on Job Applicant). */
  designation?: string;
  creation?: string;
  cover_letter?: string;
  resume_attachment?: string;
  /** AI / recruiter notes (Frappe `comments` on Job Applicant when present). */
  comments?: string;
};

type ERPNextApplicantListResponse = {
  data?: ERPNextJobApplicantRow[];
};

export type ERPNextCandidateRow = {
  name?: string;
  full_name?: string;
  email?: string;
  phone?: string;
  user?: string;
  linkedin?: string;
};

type ERPNextCandidateListResponse = {
  data?: ERPNextCandidateRow[];
};

/** Load Candidate linked to the given Frappe User name (usually same as email for website users). */
export async function fetchERPNextCandidateForUserName(
  userName: string,
): Promise<ERPNextCandidateRow | null> {
  const config = getERPConfig();
  const u = userName.trim();
  if (!config || !u) return null;

  const fieldSet = new Set([
    "name",
    "full_name",
    "email",
    "phone",
    config.candidateUserField,
    config.candidateLinkedinField,
  ]);
  const fields = [...fieldSet];

  const filters: unknown[] = [[config.candidateUserField, "=", u]];

  const url = new URL(
    `/api/resource/${encodeURIComponent(config.candidateDoctype)}`,
    config.baseUrl.endsWith("/") ? config.baseUrl : `${config.baseUrl}/`,
  );
  url.searchParams.set("fields", JSON.stringify(fields));
  url.searchParams.set("filters", JSON.stringify(filters));
  url.searchParams.set("limit_page_length", "1");

  const res = await fetch(url.toString(), {
    headers: {
      Authorization: `token ${config.apiKey}:${config.apiSecret}`,
      Accept: "application/json",
    },
    cache: "no-store",
  });
  if (!res.ok) return null;
  const json = (await res.json()) as ERPNextCandidateListResponse;
  const row = json.data?.[0];
  return row ?? null;
}

/** Job Applicants linked to a Candidate document (server-side filter; integration token). */
export async function fetchERPNextJobApplicantsForCandidateDoc(
  candidateDocName: string,
): Promise<ERPNextJobApplicantRow[] | null> {
  const config = getERPConfig();
  const c = candidateDocName.trim();
  if (!config || !c) return null;

  const openingField = config.jobApplicantOpeningField;
  const fields = [
    "name",
    "applicant_name",
    "email_id",
    "phone_number",
    "status",
    openingField,
    "creation",
    "resume_attachment",
  ];
  const filters: unknown[] = [[config.jobApplicantCandidateField, "=", c]];

  const url = new URL(
    "/api/resource/Job Applicant",
    config.baseUrl.endsWith("/") ? config.baseUrl : `${config.baseUrl}/`,
  );
  url.searchParams.set("fields", JSON.stringify(fields));
  url.searchParams.set("filters", JSON.stringify(filters));
  url.searchParams.set("limit_page_length", "100");
  url.searchParams.set("order_by", "modified desc");

  const res = await fetch(url.toString(), {
    headers: {
      Authorization: `token ${config.apiKey}:${config.apiSecret}`,
      Accept: "application/json",
    },
    cache: "no-store",
  });
  if (!res.ok) return null;
  const json = (await res.json()) as ERPNextApplicantListResponse;
  return json.data ?? [];
}

/**
 * Comma-separated Role `name` values (Desk → Role). If unset, no `roles` rows are sent;
 * Frappe assigns defaults for `user_type: "Website User"`. Do not use "Website User" here —
 * that is a User Type, not a Role, and usually does not exist on the Role master.
 */
function registrationUserRolesChildTable(): { role: string }[] | undefined {
  const raw = getEnv("ERPNEXT_REGISTRATION_USER_ROLES");
  if (!raw) return undefined;
  const parts = raw.split(",").map((s) => s.trim()).filter(Boolean);
  if (!parts.length) return undefined;
  return parts.map((role) => ({ role }));
}

export type RegisterCandidateInput = {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  linkedin?: string;
};

/**
 * Creates a Website User and a linked Candidate (integration API key).
 * Requires permission on the integration user to insert `User` and your Candidate DocType.
 */
export async function registerERPNextWebsiteUserAndCandidate(
  input: RegisterCandidateInput,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const config = getERPConfig();
  if (!config) {
    return { ok: false, message: "Registration is unavailable (ERPNext is not configured)." };
  }

  const email = input.email.trim().toLowerCase();
  if (!email) {
    return { ok: false, message: "Email is required." };
  }

  const first = input.firstName.trim();
  const last = input.lastName.trim();
  if (!first || !last) {
    return { ok: false, message: "First name and last name are required." };
  }
  const fullName = [first, last].join(" ").trim();

  const headers: Record<string, string> = {
    Authorization: `token ${config.apiKey}:${config.apiSecret}`,
    Accept: "application/json",
    "Content-Type": "application/json",
  };

  const userEndpoint = new URL(
    "/api/resource/User",
    config.baseUrl.endsWith("/") ? config.baseUrl : `${config.baseUrl}/`,
  );

  const userPayload: Record<string, unknown> = {
    email,
    first_name: first,
    last_name: last,
    new_password: input.password,
    send_welcome_email: 0,
    enabled: 1,
    user_type: "Website User",
  };
  const regRoles = registrationUserRolesChildTable();
  if (regRoles) {
    userPayload.roles = regRoles;
  }

  const userRes = await fetch(userEndpoint.toString(), {
    method: "POST",
    headers,
    body: JSON.stringify(userPayload),
    cache: "no-store",
  });

  if (!userRes.ok) {
    const text = await userRes.text();
    const lower = text.toLowerCase();
    if (
      lower.includes("could not find") &&
      lower.includes("role") &&
      lower.includes("linkvalidationerror")
    ) {
      return {
        ok: false,
        message:
          "ERPNext could not find a Role name in the request. In Frappe, \"Website User\" is a User Type, not a Role on the Role master. " +
          "Leave ERPNEXT_REGISTRATION_USER_ROLES unset to omit role rows, or set it to comma-separated Role names from Desk → Role (e.g. Customer).",
      };
    }
    if (userRes.status === 409 || lower.includes("duplicate") || lower.includes("exists")) {
      return {
        ok: false,
        message: "An account with this email already exists. Try signing in instead.",
      };
    }
    return {
      ok: false,
      message: humanMessageFromFrappeApiError(text, userRes.status),
    };
  }

  const candidateEndpoint = new URL(
    `/api/resource/${encodeURIComponent(config.candidateDoctype)}`,
    config.baseUrl.endsWith("/") ? config.baseUrl : `${config.baseUrl}/`,
  );

  const candidatePayload: Record<string, unknown> = {
    full_name: fullName,
    email,
    ...(input.phone?.trim() ? { phone: input.phone.trim() } : {}),
  };
  candidatePayload[config.candidateUserField] = email;
  if (input.linkedin?.trim()) {
    candidatePayload[config.candidateLinkedinField] = input.linkedin.trim();
  }

  const candRes = await fetch(candidateEndpoint.toString(), {
    method: "POST",
    headers,
    body: JSON.stringify(candidatePayload),
    cache: "no-store",
  });

  if (!candRes.ok) {
    const text = await candRes.text();
    const delUrl = new URL(
      `/api/resource/User/${encodeURIComponent(email)}`,
      config.baseUrl.endsWith("/") ? config.baseUrl : `${config.baseUrl}/`,
    );
    await fetch(delUrl.toString(), {
      method: "DELETE",
      headers: { Authorization: headers.Authorization, Accept: "application/json" },
      cache: "no-store",
    });
    const lower = text.toLowerCase();
    if (lower.includes("duplicate") || lower.includes("unique")) {
      return {
        ok: false,
        message: "This email is already registered as a candidate.",
      };
    }
    return {
      ok: false,
      message: humanMessageFromFrappeApiError(text, candRes.status),
    };
  }

  return { ok: true };
}

type ERPNextInterviewTypeListRow = { name?: string };

type ERPNextInterviewTypeListResponse = {
  data?: ERPNextInterviewTypeListRow[];
};

function getDefaultInterviewTypeName(): string | undefined {
  return getEnv("ERPNEXT_DEFAULT_INTERVIEW_TYPE");
}

/** All job openings for the HR portal (no filters). */
export async function fetchERPNextJobOpeningsForHr(): Promise<ERPNextJob[] | null> {
  const config = getERPConfig();
  if (!config) return null;

  const fields = [
    "name",
    "job_title",
    "designation",
    "department",
    "location",
    "employment_type",
    "description",
    "company",
    "status",
    "publish",
  ];

  const url = new URL(
    `/api/resource/${encodeURIComponent(config.doctype)}`,
    config.baseUrl.endsWith("/") ? config.baseUrl : `${config.baseUrl}/`,
  );
  url.searchParams.set("fields", JSON.stringify(fields));
  url.searchParams.set("limit_page_length", "200");
  url.searchParams.set("order_by", "modified desc");

  const res = await fetch(url.toString(), {
    headers: {
      Authorization: `token ${config.apiKey}:${config.apiSecret}`,
      Accept: "application/json",
    },
    cache: "no-store",
  });
  if (!res.ok) return null;
  const json = (await res.json()) as ERPNextListResponse;
  return json.data ?? [];
}

function getDepartmentManagerJobOpeningUserField(): string {
  const v = getEnv("ERPNEXT_DM_JOB_OPENING_USER_FIELD");
  return v && v.length > 0 ? v : "owner";
}

/** Job openings visible to a department manager (filtered by user field, default `owner`). */
export async function fetchERPNextJobOpeningsForDepartmentManager(
  managerUserId: string,
): Promise<ERPNextJob[] | null> {
  const config = getERPConfig();
  if (!config) return null;
  const field = getDepartmentManagerJobOpeningUserField();
  const filters: unknown[] = [[field, "=", managerUserId.trim()]];

  const fields = [
    "name",
    "job_title",
    "designation",
    "department",
    "location",
    "employment_type",
    "description",
    "company",
    "status",
    "publish",
    field,
  ];

  const url = new URL(
    `/api/resource/${encodeURIComponent(config.doctype)}`,
    config.baseUrl.endsWith("/") ? config.baseUrl : `${config.baseUrl}/`,
  );
  url.searchParams.set("fields", JSON.stringify([...new Set(fields)]));
  url.searchParams.set("filters", JSON.stringify(filters));
  url.searchParams.set("limit_page_length", "200");
  url.searchParams.set("order_by", "modified desc");

  const res = await fetch(url.toString(), {
    headers: {
      Authorization: `token ${config.apiKey}:${config.apiSecret}`,
      Accept: "application/json",
    },
    cache: "no-store",
  });
  if (!res.ok) return null;
  const json = (await res.json()) as ERPNextListResponse;
  return json.data ?? [];
}

export const JOB_REQUISITION_STATUS_PENDING = "Pending";
export const JOB_REQUISITION_STATUS_OPEN_APPROVED = "Open & Approved";

export type ERPNextJobRequisitionRow = {
  name?: string;
  status?: string;
  designation?: string;
  department?: string;
  company?: string;
  creation?: string;
  requested_by?: string;
  no_of_positions?: number;
  expected_compensation?: string | number;
  posting_date?: string;
  expected_by?: string;
  description?: string;
};

function jobRequisitionDoctype(): string {
  return getEnv("ERPNEXT_JOB_REQUISITION_DOCTYPE")?.trim() || "Job Requisition";
}

export function jobRequisitionUserField(): string {
  return getEnv("ERPNEXT_DM_JOB_REQUISITION_USER_FIELD")?.trim() || "requested_by";
}

type ERPNextUserRow = {
  name?: string;
  email?: string;
  role_profile?: string;
};

/** Resolve User document by login id (email) or document name. */
export async function fetchERPNextUserRecord(
  userIdOrEmail: string,
): Promise<ERPNextUserRow | null> {
  const config = getERPConfig();
  const trimmed = userIdOrEmail.trim();
  if (!config || !trimmed) return null;

  const base = config.baseUrl.endsWith("/") ? config.baseUrl : `${config.baseUrl}/`;
  const headers = {
    Authorization: `token ${config.apiKey}:${config.apiSecret}`,
    Accept: "application/json",
  };

  const byNameUrl = new URL(
    `/api/resource/User/${encodeURIComponent(trimmed)}`,
    base,
  );
  byNameUrl.searchParams.set("fields", JSON.stringify(["name", "email", "role_profile"]));

  const byNameRes = await fetch(byNameUrl.toString(), { headers, cache: "no-store" });
  if (byNameRes.ok) {
    const json = (await byNameRes.json()) as { data?: ERPNextUserRow };
    if (json.data?.name) return json.data;
  }

  const listUrl = new URL("/api/resource/User", base);
  listUrl.searchParams.set("fields", JSON.stringify(["name", "email", "role_profile"]));
  listUrl.searchParams.set(
    "filters",
    JSON.stringify([["email", "=", trimmed]]),
  );
  listUrl.searchParams.set("limit_page_length", "1");

  const listRes = await fetch(listUrl.toString(), { headers, cache: "no-store" });
  if (!listRes.ok) return null;
  const listJson = (await listRes.json()) as { data?: ERPNextUserRow[] };
  return listJson.data?.[0] ?? null;
}

/**
 * Desk Role + Role Profile names for a user (integration token).
 * `Has Role.parent` is the User document name, not always the email.
 */
export async function fetchERPNextDeskRolesForUser(userIdOrEmail: string): Promise<string[]> {
  const config = getERPConfig();
  if (!config) return [];

  const user = await fetchERPNextUserRecord(userIdOrEmail);
  if (!user?.name) return [];

  const names = new Set<string>();
  if (user.role_profile?.trim()) {
    names.add(user.role_profile.trim());
  }

  const integrationHeaders = {
    Authorization: `token ${config.apiKey}:${config.apiSecret}`,
    Accept: "application/json",
  };

  const url = new URL(
    "/api/resource/Has Role",
    config.baseUrl.endsWith("/") ? config.baseUrl : `${config.baseUrl}/`,
  );
  url.searchParams.set("fields", JSON.stringify(["role"]));
  url.searchParams.set(
    "filters",
    JSON.stringify([
      ["parent", "=", user.name],
      ["parenttype", "=", "User"],
    ]),
  );
  url.searchParams.set("limit_page_length", "200");

  const res = await fetch(url.toString(), {
    headers: {
      Authorization: `token ${config.apiKey}:${config.apiSecret}`,
      Accept: "application/json",
    },
    cache: "no-store",
  });
  if (res.ok) {
    const json = (await res.json()) as { data?: { role?: string }[] };
    for (const row of json.data ?? []) {
      const role = row.role?.trim();
      if (role) names.add(role);
    }
  }

  const fullUserUrl = new URL(
    `/api/resource/User/${encodeURIComponent(user.name)}`,
    config.baseUrl.endsWith("/") ? config.baseUrl : `${config.baseUrl}/`,
  );
  const fullRes = await fetch(fullUserUrl.toString(), {
    headers: integrationHeaders,
    cache: "no-store",
  });
  if (fullRes.ok) {
    const fullJson = (await fullRes.json()) as {
      data?: { roles?: Array<{ role?: string }> };
    };
    for (const row of fullJson.data?.roles ?? []) {
      const role = row.role?.trim();
      if (role) names.add(role);
    }
  }

  return [...names];
}

/** Roles for the currently logged-in Frappe user (uses their session cookie). */
export async function fetchERPNextDeskRolesForSession(
  frappeCookieHeader: string,
): Promise<string[]> {
  const baseUrl = getERPNextSiteBaseUrl();
  const cookie = frappeCookieHeader.trim();
  if (!baseUrl || !cookie) return [];

  const url = new URL(
    "/api/method/frappe.core.doctype.user.user.get_roles",
    baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`,
  );

  const headers = {
    Cookie: cookie,
    Accept: "application/json",
    "Content-Type": "application/json",
  };

  let res = await fetch(url.toString(), {
    method: "POST",
    headers,
    body: "{}",
    cache: "no-store",
  });
  if (!res.ok) {
    res = await fetch(url.toString(), {
      headers: { Cookie: cookie, Accept: "application/json" },
      cache: "no-store",
    });
  }
  if (!res.ok) return [];

  const json = (await res.json()) as { message?: unknown };
  const message = json.message;
  if (!Array.isArray(message)) return [];
  return message
    .map((r) => (typeof r === "string" ? r.trim() : ""))
    .filter(Boolean);
}

export async function fetchERPNextJobRequisitions(options: {
  requestedBy?: string;
  status?: string;
  statusIn?: string[];
  limit?: number;
}): Promise<ERPNextJobRequisitionRow[] | null> {
  const config = getERPConfig();
  if (!config) return null;
  const doctype = jobRequisitionDoctype();
  const userField = jobRequisitionUserField();
  const filters: unknown[] = [];
  if (options.requestedBy?.trim()) {
    filters.push([userField, "=", options.requestedBy.trim()]);
  }
  if (options.status?.trim()) {
    filters.push(["status", "=", options.status.trim()]);
  } else if (options.statusIn?.length) {
    filters.push(["status", "in", options.statusIn]);
  }

  const fields = [
    "name",
    "status",
    "designation",
    "department",
    "company",
    "creation",
    userField,
    "no_of_positions",
    "expected_compensation",
    "posting_date",
    "expected_by",
  ];

  const url = new URL(
    `/api/resource/${encodeURIComponent(doctype)}`,
    config.baseUrl.endsWith("/") ? config.baseUrl : `${config.baseUrl}/`,
  );
  url.searchParams.set("fields", JSON.stringify([...new Set(fields)]));
  if (filters.length) url.searchParams.set("filters", JSON.stringify(filters));
  url.searchParams.set("limit_page_length", String(options.limit ?? 100));
  url.searchParams.set("order_by", "modified desc");

  const res = await fetch(url.toString(), {
    headers: {
      Authorization: `token ${config.apiKey}:${config.apiSecret}`,
      Accept: "application/json",
    },
    cache: "no-store",
  });
  if (!res.ok) return null;
  const json = (await res.json()) as { data?: ERPNextJobRequisitionRow[] };
  return json.data ?? [];
}

/** Job requisitions for this manager (default doctype `Job Requisition`, user field `requested_by`). */
export async function fetchERPNextJobRequisitionsForDepartmentManager(
  managerUserId: string,
): Promise<ERPNextJobRequisitionRow[] | null> {
  return fetchERPNextJobRequisitions({ requestedBy: managerUserId });
}

export async function createERPNextJobRequisition(input: {
  company: CompanyId;
  designation: string;
  noOfPositions: number;
  expectedCompensation: string;
  department?: string;
  requestedBy: string;
  postingDate: string;
  expectedBy?: string;
  description?: string;
  status?: string;
  namingSeries?: string;
}): Promise<string> {
  const config = getERPConfig();
  if (!config) throw new Error("ERPNext config missing");

  const companyName = erpCompanyNameForPortal(input.company);
  const payload: Record<string, unknown> = {
    company: companyName,
    designation: input.designation.trim(),
    no_of_positions: input.noOfPositions,
    expected_compensation: input.expectedCompensation.trim(),
    requested_by: input.requestedBy.trim(),
    posting_date: input.postingDate.trim(),
    status: input.status?.trim() || JOB_REQUISITION_STATUS_PENDING,
  };
  if (input.department?.trim()) payload.department = input.department.trim();
  if (input.expectedBy?.trim()) payload.expected_by = input.expectedBy.trim();
  if (input.description?.trim()) payload.description = input.description.trim();
  if (input.namingSeries?.trim()) payload.naming_series = input.namingSeries.trim();

  const doctype = jobRequisitionDoctype();
  const endpoint = new URL(
    `/api/resource/${encodeURIComponent(doctype)}`,
    config.baseUrl.endsWith("/") ? config.baseUrl : `${config.baseUrl}/`,
  );
  const res = await fetch(endpoint.toString(), {
    method: "POST",
    headers: {
      Authorization: `token ${config.apiKey}:${config.apiSecret}`,
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
    cache: "no-store",
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(humanMessageFromFrappeApiError(text, res.status));
  }
  const json = (await res.json()) as ERPNextCreateResponse;
  if (!json.data?.name) throw new Error("ERPNext did not return Job Requisition id");
  return json.data.name;
}

export async function fetchERPNextJobRequisitionByName(
  docName: string,
): Promise<ERPNextJobRequisitionRow | null> {
  const config = getERPConfig();
  const trimmed = docName.trim();
  if (!config || !trimmed) return null;

  const doctype = jobRequisitionDoctype();
  const userField = jobRequisitionUserField();
  const url = new URL(
    `/api/resource/${encodeURIComponent(doctype)}/${encodeURIComponent(trimmed)}`,
    config.baseUrl.endsWith("/") ? config.baseUrl : `${config.baseUrl}/`,
  );

  const res = await fetch(url.toString(), {
    headers: {
      Authorization: `token ${config.apiKey}:${config.apiSecret}`,
      Accept: "application/json",
    },
    cache: "no-store",
  });
  if (!res.ok) return null;
  const json = (await res.json()) as { data?: ERPNextJobRequisitionRow & Record<string, unknown> };
  const row = json.data;
  if (!row) return null;
  if (userField !== "requested_by" && row[userField] !== undefined) {
    row.requested_by = String(row[userField] ?? "");
  }
  return row;
}

/** Job openings linked to a requisition (when the link field exists on Job Opening). */
export async function fetchERPNextJobOpeningsForRequisition(
  requisitionDocName: string,
): Promise<ERPNextJob[] | null> {
  const config = getERPConfig();
  const trimmed = requisitionDocName.trim();
  if (!config || !trimmed) return null;

  const linkField = jobOpeningRequisitionField();
  const fields = [
    "name",
    "job_title",
    "designation",
    "department",
    "status",
    "publish",
    "creation",
    "modified",
    linkField,
  ];

  const url = new URL(
    `/api/resource/${encodeURIComponent(config.doctype)}`,
    config.baseUrl.endsWith("/") ? config.baseUrl : `${config.baseUrl}/`,
  );
  url.searchParams.set("fields", JSON.stringify([...new Set(fields)]));
  url.searchParams.set("filters", JSON.stringify([[linkField, "=", trimmed]]));
  url.searchParams.set("limit_page_length", "50");
  url.searchParams.set("order_by", "modified desc");

  const res = await fetch(url.toString(), {
    headers: {
      Authorization: `token ${config.apiKey}:${config.apiSecret}`,
      Accept: "application/json",
    },
    cache: "no-store",
  });
  if (!res.ok) return null;
  const json = (await res.json()) as ERPNextListResponse;
  return json.data ?? [];
}

export async function updateERPNextJobRequisitionStatus(
  docName: string,
  status: string,
): Promise<void> {
  const config = getERPConfig();
  const trimmed = docName.trim();
  if (!config || !trimmed) throw new Error("ERPNext config missing");

  const doctype = jobRequisitionDoctype();
  const endpoint = new URL(
    `/api/resource/${encodeURIComponent(doctype)}/${encodeURIComponent(trimmed)}`,
    config.baseUrl.endsWith("/") ? config.baseUrl : `${config.baseUrl}/`,
  );
  const res = await fetch(endpoint.toString(), {
    method: "PUT",
    headers: {
      Authorization: `token ${config.apiKey}:${config.apiSecret}`,
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ status: status.trim() }),
    cache: "no-store",
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(humanMessageFromFrappeApiError(text, res.status));
  }
}

export async function createERPNextJobOpening(input: {
  company: CompanyId;
  jobTitle: string;
  designation: string;
  department?: string;
  employmentType?: string;
  location?: string;
  description?: string;
  status?: "Open" | "Closed";
  publish?: 0 | 1;
  jobRequisition?: string;
}): Promise<string> {
  const config = getERPConfig();
  if (!config) throw new Error("ERPNext config missing");

  const companyName = erpCompanyNameForPortal(input.company);
  const payload: Record<string, unknown> = {
    job_title: input.jobTitle.trim(),
    company: companyName,
    designation: input.designation.trim(),
    status: input.status ?? "Open",
    publish: input.publish ?? 1,
  };
  if (input.department?.trim()) payload.department = input.department.trim();
  if (input.employmentType?.trim()) payload.employment_type = input.employmentType.trim();
  if (input.location?.trim()) payload.location = input.location.trim();
  if (input.description?.trim()) payload.description = input.description.trim();
  if (input.jobRequisition?.trim()) {
    payload[jobOpeningRequisitionField()] = input.jobRequisition.trim();
  }

  const endpoint = new URL(
    `/api/resource/${encodeURIComponent(config.doctype)}`,
    config.baseUrl.endsWith("/") ? config.baseUrl : `${config.baseUrl}/`,
  );
  const res = await fetch(endpoint.toString(), {
    method: "POST",
    headers: {
      Authorization: `token ${config.apiKey}:${config.apiSecret}`,
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
    cache: "no-store",
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`(${res.status}) ${text.slice(0, 280)}`);
  }
  const json = (await res.json()) as ERPNextCreateResponse;
  if (!json.data?.name) throw new Error("ERPNext did not return Job Opening id");
  return json.data.name;
}

export async function updateERPNextJobOpening(
  docName: string,
  input: {
    jobTitle?: string;
    designation?: string;
    department?: string;
    employmentType?: string;
    location?: string;
    description?: string;
    status?: "Open" | "Closed";
    publish?: 0 | 1;
    jobRequisition?: string | null;
  },
): Promise<void> {
  const config = getERPConfig();
  if (!config) throw new Error("ERPNext config missing");

  const payload: Record<string, unknown> = {};
  if (input.jobTitle !== undefined) payload.job_title = input.jobTitle.trim();
  if (input.designation !== undefined) payload.designation = input.designation.trim();
  if (input.department !== undefined)
    payload.department = input.department.trim() || null;
  if (input.employmentType !== undefined)
    payload.employment_type = input.employmentType.trim() || null;
  if (input.location !== undefined) payload.location = input.location.trim() || null;
  if (input.description !== undefined) payload.description = input.description.trim();
  if (input.status !== undefined) payload.status = input.status;
  if (input.publish !== undefined) payload.publish = input.publish;
  if (input.jobRequisition !== undefined) {
    const linkField = jobOpeningRequisitionField();
    payload[linkField] = input.jobRequisition?.trim() || null;
  }

  const endpoint = new URL(
    `/api/resource/${encodeURIComponent(config.doctype)}/${encodeURIComponent(docName.trim())}`,
    config.baseUrl.endsWith("/") ? config.baseUrl : `${config.baseUrl}/`,
  );
  const res = await fetch(endpoint.toString(), {
    method: "PUT",
    headers: {
      Authorization: `token ${config.apiKey}:${config.apiSecret}`,
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
    cache: "no-store",
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`(${res.status}) ${text.slice(0, 280)}`);
  }
}

async function fetchERPNextJobApplicantListRequest(
  config: NonNullable<ReturnType<typeof getERPConfig>>,
  options: {
    fields: string[];
    filters: unknown[];
    limit: number;
  },
): Promise<ERPNextJobApplicantRow[] | null> {
  const url = new URL(
    "/api/resource/Job Applicant",
    config.baseUrl.endsWith("/") ? config.baseUrl : `${config.baseUrl}/`,
  );
  url.searchParams.set("fields", JSON.stringify([...new Set(options.fields)]));
  if (options.filters.length) {
    url.searchParams.set("filters", JSON.stringify(options.filters));
  }
  url.searchParams.set("limit_page_length", String(options.limit));
  url.searchParams.set("order_by", "modified desc");

  const res = await fetch(url.toString(), {
    headers: {
      Authorization: `token ${config.apiKey}:${config.apiSecret}`,
      Accept: "application/json",
    },
    cache: "no-store",
  });
  if (!res.ok) return null;
  const json = (await res.json()) as ERPNextApplicantListResponse;
  return json.data ?? [];
}

export async function fetchERPNextJobApplicants(options: {
  jobOpeningDocName?: string;
  /** When set, only applicants linked to one of these Job Opening document names (Frappe `in` filter). */
  jobOpeningDocNamesIn?: string[];
  limit?: number;
}): Promise<ERPNextJobApplicantRow[] | null> {
  const config = getERPConfig();
  if (!config) return null;

  const openingField = config.jobApplicantOpeningField;
  const filters: unknown[] = [];
  const single = options.jobOpeningDocName?.trim();
  if (single) {
    filters.push([openingField, "=", single]);
  } else if (options.jobOpeningDocNamesIn?.length) {
    filters.push([openingField, "in", options.jobOpeningDocNamesIn]);
  }

  const coreFields = [
    "name",
    "applicant_name",
    "email_id",
    "phone_number",
    "status",
    openingField,
    "creation",
  ];
  const limit = options.limit ?? 100;

  const withComments = await fetchERPNextJobApplicantListRequest(config, {
    fields: [...coreFields, "comments"],
    filters,
    limit,
  });
  if (withComments !== null) return withComments;

  return fetchERPNextJobApplicantListRequest(config, {
    fields: coreFields,
    filters,
    limit,
  });
}

export async function fetchERPNextJobApplicantByName(
  name: string,
): Promise<ERPNextJobApplicantRow | null> {
  const configRaw = getERPConfig();
  const trimmed = name.trim();
  if (!configRaw || !trimmed) return null;
  const config = configRaw;

  const openingField = config.jobApplicantOpeningField;
  const coreFields = [
    "name",
    "applicant_name",
    "email_id",
    "phone_number",
    "status",
    "designation",
    openingField,
    "creation",
    "cover_letter",
    "resume_attachment",
  ];

  async function fetchOne(fields: string[]): Promise<ERPNextJobApplicantRow | null> {
    const url = new URL(
      `/api/resource/Job Applicant/${encodeURIComponent(trimmed)}`,
      config.baseUrl.endsWith("/") ? config.baseUrl : `${config.baseUrl}/`,
    );
    url.searchParams.set("fields", JSON.stringify(fields));

    const res = await fetch(url.toString(), {
      headers: {
        Authorization: `token ${config.apiKey}:${config.apiSecret}`,
        Accept: "application/json",
      },
      cache: "no-store",
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { data?: ERPNextJobApplicantRow };
    return json.data ?? null;
  }

  const withComments = await fetchOne([...coreFields, "comments"]);
  if (withComments) return withComments;
  return fetchOne(coreFields);
}

export type ERPNextInterviewRow = {
  name?: string;
  job_applicant?: string;
  job_opening?: string;
  status?: string;
  scheduled_on?: string;
  from_time?: string;
  to_time?: string;
  /** HRMS v15+ (older) Interview doc */
  interview_round?: string;
  /** HRMS develop / newer Interview doc */
  interview_type?: string;
};

/** Single Interview document (detail view). */
export type ERPNextInterviewDetail = ERPNextInterviewRow & {
  interview_summary?: string;
  interview_details?: Array<{
    name?: string;
    interviewer?: string;
  }>;
};

type ERPNextInterviewListResponse = {
  data?: ERPNextInterviewRow[];
};

function interviewListFieldNames(useRoundField: boolean): string[] {
  const base = [
    "name",
    "job_applicant",
    "job_opening",
    "status",
    "scheduled_on",
    "from_time",
    "to_time",
  ];
  return useRoundField ? [...base, "interview_round"] : [...base, "interview_type"];
}

async function fetchERPNextInterviewRowsWithHeaders(
  useRoundField: boolean,
  headers: Record<string, string>,
): Promise<ERPNextInterviewRow[] | null> {
  const baseUrl = getERPNextSiteBaseUrl();
  if (!baseUrl) return null;

  const url = new URL(
    "/api/resource/Interview",
    baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`,
  );
  url.searchParams.set("fields", JSON.stringify(interviewListFieldNames(useRoundField)));
  url.searchParams.set("limit_page_length", "500");
  url.searchParams.set("order_by", "modified desc");

  const res = await fetch(url.toString(), {
    headers: {
      Accept: "application/json",
      ...headers,
    },
    cache: "no-store",
  });
  if (!res.ok) return null;
  const json = (await res.json()) as ERPNextInterviewListResponse;
  return json.data ?? [];
}

/**
 * Lists Interview docs (newest first).
 *
 * Pass `frappeSessionCookie` from the recruiter portal so results match Desk / Frappe Web
 * (User Permissions on the logged-in recruiter). Otherwise uses the integration user (API key),
 * which may not see interviews created by HR in the client.
 */
export async function fetchERPNextInterviewsForHr(opts?: {
  frappeSessionCookie?: string | null;
}): Promise<ERPNextInterviewRow[] | null> {
  const baseUrl = getERPNextSiteBaseUrl();
  if (!baseUrl) return null;

  const roundsDoctypeAvailable = (await fetchERPNextInterviewRounds()) !== null;
  const useRoundField = roundsDoctypeAvailable;

  const cookie = opts?.frappeSessionCookie?.trim();
  if (cookie) {
    const asUser = await fetchERPNextInterviewRowsWithHeaders(useRoundField, {
      Cookie: cookie,
    });
    if (asUser) return asUser;
  }

  const config = getERPConfig();
  if (!config) return null;
  return fetchERPNextInterviewRowsWithHeaders(useRoundField, {
    Authorization: `token ${config.apiKey}:${config.apiSecret}`,
  });
}

async function fetchERPNextInterviewRowsFiltered(
  useRoundField: boolean,
  filters: unknown[],
  headers: Record<string, string>,
): Promise<ERPNextInterviewRow[] | null> {
  const baseUrl = getERPNextSiteBaseUrl();
  if (!baseUrl) return null;

  const url = new URL(
    "/api/resource/Interview",
    baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`,
  );
  url.searchParams.set("fields", JSON.stringify(interviewListFieldNames(useRoundField)));
  url.searchParams.set("filters", JSON.stringify(filters));
  url.searchParams.set("limit_page_length", "200");
  url.searchParams.set("order_by", "scheduled_on desc, modified desc");

  const res = await fetch(url.toString(), {
    headers: {
      Accept: "application/json",
      ...headers,
    },
    cache: "no-store",
  });
  if (!res.ok) return null;
  const json = (await res.json()) as ERPNextInterviewListResponse;
  return json.data ?? [];
}

/**
 * Interviews linked to a Job Applicant (for applicant detail page).
 */
export async function fetchERPNextInterviewsForJobApplicant(
  jobApplicantName: string,
  opts?: { frappeSessionCookie?: string | null },
): Promise<ERPNextInterviewRow[] | null> {
  const baseUrl = getERPNextSiteBaseUrl();
  if (!baseUrl || !jobApplicantName.trim()) return null;

  const useRoundField = (await fetchERPNextInterviewRounds()) !== null;
  const filters = [["job_applicant", "=", jobApplicantName.trim()]];

  const cookie = opts?.frappeSessionCookie?.trim();
  if (cookie) {
    const asUser = await fetchERPNextInterviewRowsFiltered(useRoundField, filters, {
      Cookie: cookie,
    });
    if (asUser) return asUser;
  }

  const config = getERPConfig();
  if (!config) return null;
  return fetchERPNextInterviewRowsFiltered(useRoundField, filters, {
    Authorization: `token ${config.apiKey}:${config.apiSecret}`,
  });
}

/** Interviews tied to job openings in the department manager's scope (portal-side filter). */
export async function fetchERPNextInterviewsForDepartmentManagerOpenings(
  openingDocNames: string[],
): Promise<ERPNextInterviewRow[] | null> {
  if (openingDocNames.length === 0) return [];
  const config = getERPConfig();
  if (!config) return null;
  const useRoundField = (await fetchERPNextInterviewRounds()) !== null;
  return fetchERPNextInterviewRowsFiltered(useRoundField, [["job_opening", "in", openingDocNames]], {
    Authorization: `token ${config.apiKey}:${config.apiSecret}`,
  });
}

function interviewDetailFieldNames(useRoundField: boolean): string[] {
  const base = [
    "name",
    "job_applicant",
    "job_opening",
    "status",
    "scheduled_on",
    "from_time",
    "to_time",
    "interview_summary",
    "interview_details",
  ];
  return useRoundField ? [...base, "interview_round"] : [...base, "interview_type"];
}

type ERPNextInterviewSingleResponse = {
  data?: ERPNextInterviewDetail;
};

/**
 * Loads one Interview by document name (`HR-INT-.YYYY.-.####`, etc.).
 */
export async function fetchERPNextInterviewByName(
  interviewName: string,
  opts?: { frappeSessionCookie?: string | null },
): Promise<ERPNextInterviewDetail | null> {
  const baseUrl = getERPNextSiteBaseUrl();
  if (!baseUrl || !interviewName.trim()) return null;

  const useRoundField = (await fetchERPNextInterviewRounds()) !== null;
  const enc = encodeURIComponent(interviewName.trim());
  const url = new URL(
    `/api/resource/Interview/${enc}`,
    baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`,
  );
  url.searchParams.set("fields", JSON.stringify(interviewDetailFieldNames(useRoundField)));

  const tryFetch = async (headers: Record<string, string>) => {
    const res = await fetch(url.toString(), {
      headers: { Accept: "application/json", ...headers },
      cache: "no-store",
    });
    if (!res.ok) return null;
    const json = (await res.json()) as ERPNextInterviewSingleResponse;
    return json.data ?? null;
  };

  const cookie = opts?.frappeSessionCookie?.trim();
  if (cookie) {
    const row = await tryFetch({ Cookie: cookie });
    if (row) return row;
  }

  const config = getERPConfig();
  if (!config) return null;
  return tryFetch({
    Authorization: `token ${config.apiKey}:${config.apiSecret}`,
  });
}

export type ERPNextInterviewTypeRow = {
  name: string;
  description?: string;
};

export async function fetchERPNextInterviewTypes(): Promise<ERPNextInterviewTypeRow[] | null> {
  const config = getERPConfig();
  if (!config) return null;

  const url = new URL(
    "/api/resource/Interview Type",
    config.baseUrl.endsWith("/") ? config.baseUrl : `${config.baseUrl}/`,
  );
  url.searchParams.set("fields", JSON.stringify(["name", "description"]));
  url.searchParams.set("limit_page_length", "200");
  url.searchParams.set("order_by", "name asc");

  const res = await fetch(url.toString(), {
    headers: {
      Authorization: `token ${config.apiKey}:${config.apiSecret}`,
      Accept: "application/json",
    },
    cache: "no-store",
  });
  if (!res.ok) return null;
  const json = (await res.json()) as { data?: Array<{ name?: string; description?: string }> };
  const rows = json.data ?? [];
  const out: ERPNextInterviewTypeRow[] = [];
  for (const r of rows) {
    const name = typeof r.name === "string" ? r.name.trim() : "";
    if (!name) continue;
    out.push({
      name,
      description: typeof r.description === "string" ? r.description.trim() : undefined,
    });
  }
  return out;
}

export type ERPNextInterviewRoundRow = {
  name: string;
  /** Link field on Interview Round → Interview Type (when configured in HRMS). */
  interviewType?: string;
};

type ERPNextInterviewRoundListResponse = {
  data?: Array<{ name?: string; interview_type?: string }>;
};

/**
 * Lists Interview Round docs (HRMS v15-style Interview form).
 * Returns `null` if the doctype is missing (newer HRMS uses Interview Type on Interview instead).
 */
export async function fetchERPNextInterviewRounds(): Promise<ERPNextInterviewRoundRow[] | null> {
  const config = getERPConfig();
  if (!config) return null;

  const url = new URL(
    "/api/resource/Interview Round",
    config.baseUrl.endsWith("/") ? config.baseUrl : `${config.baseUrl}/`,
  );
  url.searchParams.set("fields", JSON.stringify(["name", "interview_type"]));
  url.searchParams.set("limit_page_length", "200");
  url.searchParams.set("order_by", "name asc");

  const res = await fetch(url.toString(), {
    headers: {
      Authorization: `token ${config.apiKey}:${config.apiSecret}`,
      Accept: "application/json",
    },
    cache: "no-store",
  });
  if (!res.ok) return null;
  const json = (await res.json()) as ERPNextInterviewRoundListResponse;
  const rows = json.data ?? [];
  const out: ERPNextInterviewRoundRow[] = [];
  for (const r of rows) {
    const name = typeof r.name === "string" ? r.name.trim() : "";
    if (!name) continue;
    const interviewType =
      typeof r.interview_type === "string" && r.interview_type.trim() ?
        r.interview_type.trim()
      : undefined;
    out.push({ name, interviewType });
  }
  return out;
}

export type ERPNextUserPickerRow = {
  name: string;
  email?: string;
  full_name?: string;
};

type ERPNextUserListResponse = {
  data?: Array<{ name?: string; email?: string; full_name?: string }>;
};

/** Search enabled System Users for interviewer assignment (integration token). */
export async function searchERPNextSystemUsersForPicker(
  query: string,
  limit = 25,
): Promise<ERPNextUserPickerRow[]> {
  const config = getERPConfig();
  if (!config) return [];

  const fields = JSON.stringify(["name", "email", "full_name"]);
  const filters = JSON.stringify([
    ["enabled", "=", 1],
    ["user_type", "=", "System User"],
  ]);

  const url = new URL(
    "/api/resource/User",
    config.baseUrl.endsWith("/") ? config.baseUrl : `${config.baseUrl}/`,
  );
  url.searchParams.set("fields", fields);
  url.searchParams.set("filters", filters);
  url.searchParams.set("limit_page_length", "120");
  url.searchParams.set("order_by", "full_name asc");

  const res = await fetch(url.toString(), {
    headers: {
      Authorization: `token ${config.apiKey}:${config.apiSecret}`,
      Accept: "application/json",
    },
    cache: "no-store",
  });
  if (!res.ok) return [];
  const json = (await res.json()) as ERPNextUserListResponse;
  const rows = json.data ?? [];
  const q = query.trim().toLowerCase();
  const mapped = rows.flatMap((r): ERPNextUserPickerRow[] => {
    const name = typeof r.name === "string" ? r.name.trim() : "";
    if (!name) return [];
    return [
      {
        name,
        email: typeof r.email === "string" ? r.email : undefined,
        full_name: typeof r.full_name === "string" ? r.full_name : undefined,
      },
    ];
  });

  if (!q) return mapped.slice(0, limit);

  return mapped
    .filter((r) => {
      const hay = `${r.name} ${r.email ?? ""} ${r.full_name ?? ""}`.toLowerCase();
      return hay.includes(q);
    })
    .slice(0, limit);
}

function recruiterRegistrationRolesChildTable(): { role: string }[] | undefined {
  const raw = getEnv("ERPNEXT_RECRUITER_REGISTRATION_USER_ROLES");
  if (!raw) return undefined;
  const parts = raw.split(",").map((s) => s.trim()).filter(Boolean);
  if (!parts.length) return undefined;
  return parts.map((role) => ({ role }));
}

export type RegisterRecruiterInput = {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
};

async function fetchUserTypeFromErpnext(
  config: NonNullable<ReturnType<typeof getERPConfig>>,
  docName: string,
  headers: Record<string, string>,
): Promise<string | null> {
  const url = new URL(
    `/api/resource/User/${encodeURIComponent(docName)}`,
    config.baseUrl.endsWith("/") ? config.baseUrl : `${config.baseUrl}/`,
  );
  url.searchParams.set("fields", JSON.stringify(["user_type"]));
  const res = await fetch(url.toString(), {
    headers: { ...headers, Accept: "application/json" },
    cache: "no-store",
  });
  if (!res.ok) return null;
  const j = (await res.json()) as { data?: { user_type?: string } };
  const t = j.data?.user_type;
  return typeof t === "string" ? t.trim() : null;
}

/**
 * Frappe often creates REST `User` rows as Website User and may ignore `user_type` on `POST`/`PUT`.
 * Tries `PUT`, verifies with `GET`, then `frappe.client.set_value` if still not System User.
 */
async function coerceRecruiterUserToSystemUser(
  config: NonNullable<ReturnType<typeof getERPConfig>>,
  docName: string,
  headers: Record<string, string>,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const resourceUrl = new URL(
    `/api/resource/User/${encodeURIComponent(docName)}`,
    config.baseUrl.endsWith("/") ? config.baseUrl : `${config.baseUrl}/`,
  );

  const putRes = await fetch(resourceUrl.toString(), {
    method: "PUT",
    headers,
    body: JSON.stringify({ user_type: "System User" }),
    cache: "no-store",
  });
  if (!putRes.ok) {
    // Some sites disallow PUT on `user_type` but allow `frappe.client.set_value`; continue.
    await putRes.text().catch(() => "");
  }

  let userType = await fetchUserTypeFromErpnext(config, docName, headers);
  if (userType === "System User") return { ok: true };

  const setValueUrl = new URL(
    "/api/method/frappe.client.set_value",
    config.baseUrl.endsWith("/") ? config.baseUrl : `${config.baseUrl}/`,
  );
  const svRes = await fetch(setValueUrl.toString(), {
    method: "POST",
    headers,
    body: JSON.stringify({
      doctype: "User",
      name: docName,
      fieldname: "user_type",
      value: "System User",
    }),
    cache: "no-store",
  });
  const svText = await svRes.text();
  if (!svRes.ok) {
    return {
      ok: false,
      message: `User Type is "${userType ?? "unknown"}" after PUT. set_value failed: ${humanMessageFromFrappeApiError(svText, svRes.status)}`,
    };
  }
  try {
    const svJson = JSON.parse(svText) as { exc?: string; exception?: string; message?: unknown };
    if (typeof svJson.exc === "string" && svJson.exc.trim()) {
      return {
        ok: false,
        message: `frappe.client.set_value reported an error: ${humanMessageFromFrappeApiError(svText, svRes.status)}`,
      };
    }
    if (typeof svJson.exception === "string" && svJson.exception.trim()) {
      return {
        ok: false,
        message: humanMessageFromFrappeApiError(svText, svRes.status),
      };
    }
  } catch {
    // non-JSON body; treat HTTP ok as success
  }

  userType = await fetchUserTypeFromErpnext(config, docName, headers);
  if (userType !== "System User") {
    return {
      ok: false,
      message:
        `User "${docName}" was created but User Type is still "${userType ?? "unknown"}" after PUT and frappe.client.set_value. ` +
        "A Server Script or customisation on `User` may be forcing Website User — remove it, or change User Type in Desk / use an API user with full User write access.",
    };
  }

  return { ok: true };
}

/**
 * Creates a System User for Desk / HR workflows (integration API key).
 * Set ERPNEXT_RECRUITER_REGISTRATION_USER_ROLES to comma-separated Role names (e.g. `Employee,HR User`).
 */
export async function registerERPNextRecruiterDeskUser(
  input: RegisterRecruiterInput,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const config = getERPConfig();
  if (!config) {
    return { ok: false, message: "Registration is unavailable (ERPNext is not configured)." };
  }

  const email = input.email.trim().toLowerCase();
  if (!email) {
    return { ok: false, message: "Email is required." };
  }

  const first = input.firstName.trim();
  const last = input.lastName.trim();
  if (!first || !last) {
    return { ok: false, message: "First name and last name are required." };
  }

  const headers: Record<string, string> = {
    Authorization: `token ${config.apiKey}:${config.apiSecret}`,
    Accept: "application/json",
    "Content-Type": "application/json",
  };

  const userEndpoint = new URL(
    "/api/resource/User",
    config.baseUrl.endsWith("/") ? config.baseUrl : `${config.baseUrl}/`,
  );

  // Omit `user_type` on POST; Frappe often ignores it or forces Website User until we coerce after create.
  const userPayload: Record<string, unknown> = {
    email,
    first_name: first,
    last_name: last,
    new_password: input.password,
    send_welcome_email: 0,
    enabled: 1,
  };
  const regRoles = recruiterRegistrationRolesChildTable();
  if (regRoles) {
    userPayload.roles = regRoles;
  }

  const userRes = await fetch(userEndpoint.toString(), {
    method: "POST",
    headers,
    body: JSON.stringify(userPayload),
    cache: "no-store",
  });

  if (!userRes.ok) {
    const text = await userRes.text();
    const lower = text.toLowerCase();
    if (userRes.status === 409 || lower.includes("duplicate") || lower.includes("exists")) {
      return {
        ok: false,
        message: "An account with this email already exists. Try signing in instead.",
      };
    }
    return {
      ok: false,
      message: humanMessageFromFrappeApiError(text, userRes.status),
    };
  }

  let createJson: { data?: { name?: string } };
  try {
    createJson = (await userRes.json()) as { data?: { name?: string } };
  } catch {
    createJson = {};
  }
  const docName = typeof createJson.data?.name === "string" ? createJson.data.name.trim() : email;
  if (!docName) {
    return { ok: false, message: "ERPNext created the user but did not return a document name." };
  }

  const coerced = await coerceRecruiterUserToSystemUser(config, docName, headers);
  if (!coerced.ok) {
    return {
      ok: false,
      message: `User ${docName} was created but is not System User yet. ${coerced.message}`,
    };
  }

  return { ok: true };
}

export async function createERPNextInterview(input: {
  jobApplicantName: string;
  scheduledOn: string;
  fromTime: string;
  toTime: string;
  /**
   * HRMS v15-style: `Interview.interview_round` (Link → Interview Round), e.g. “HR Discovery Round”.
   */
  interviewRound?: string;
  /**
   * Newer HRMS: `Interview.interview_type` (Link → Interview Type).
   * Ignored in the API payload when `interviewRound` is set (do not send both — schema differs by version).
   */
  interviewType?: string;
  /** @deprecated use interviewerUsers */
  interviewerUser?: string;
  /** Frappe User names (e.g. email) for `Interview Detail` child rows. */
  interviewerUsers?: string[];
  interviewSummary?: string;
}): Promise<string> {
  const config = getERPConfig();
  if (!config) throw new Error("ERPNext config missing");

  const round = input.interviewRound?.trim();
  const interviewType =
    input.interviewType?.trim() ||
    (!round ? getDefaultInterviewTypeName() : undefined)?.trim();

  if (!round && !interviewType) {
    throw new Error(
      "Interview round or interview type is required. Pick a round (v15 HRMS), a type (newer HRMS), or set ERPNEXT_DEFAULT_INTERVIEW_ROUND / ERPNEXT_DEFAULT_INTERVIEW_TYPE.",
    );
  }

  const fromList = (input.interviewerUsers ?? [])
    .map((s) => s.trim())
    .filter(Boolean);
  const payload: Record<string, unknown> = {
    job_applicant: input.jobApplicantName.trim(),
    status: "Pending",
    scheduled_on: input.scheduledOn.trim(),
    from_time: input.fromTime.trim(),
    to_time: input.toTime.trim(),
  };

  const interviewDetails =
    fromList.length > 0 ?
      fromList.map((interviewer) => ({ interviewer }))
    : input.interviewerUser?.trim() ?
      [{ interviewer: input.interviewerUser.trim() }]
    : [];
  if (interviewDetails.length > 0) {
    payload.interview_details = interviewDetails;
  }

  if (round) {
    payload.interview_round = round;
  } else if (interviewType) {
    payload.interview_type = interviewType;
  }

  if (input.interviewSummary?.trim()) {
    payload.interview_summary = input.interviewSummary.trim();
  }

  const endpoint = new URL(
    "/api/resource/Interview",
    config.baseUrl.endsWith("/") ? config.baseUrl : `${config.baseUrl}/`,
  );
  const res = await fetch(endpoint.toString(), {
    method: "POST",
    headers: {
      Authorization: `token ${config.apiKey}:${config.apiSecret}`,
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
    cache: "no-store",
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(humanMessageFromFrappeApiError(text, res.status));
  }
  const json = (await res.json()) as ERPNextCreateResponse;
  if (!json.data?.name) throw new Error("ERPNext did not return Interview id");
  return json.data.name;
}

export async function updateERPNextInterview(
  docName: string,
  input: { interviewSummary?: string },
): Promise<void> {
  const config = getERPConfig();
  if (!config) throw new Error("Recruitment backend is not configured.");

  const payload: Record<string, unknown> = {};
  if (input.interviewSummary !== undefined) {
    payload.interview_summary = input.interviewSummary.trim();
  }

  const endpoint = new URL(
    `/api/resource/Interview/${encodeURIComponent(docName.trim())}`,
    config.baseUrl.endsWith("/") ? config.baseUrl : `${config.baseUrl}/`,
  );
  const res = await fetch(endpoint.toString(), {
    method: "PUT",
    headers: {
      Authorization: `token ${config.apiKey}:${config.apiSecret}`,
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
    cache: "no-store",
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(humanMessageFromFrappeApiError(text, res.status));
  }
}

export async function createERPNextInterviewRound(input: { roundName: string }): Promise<string> {
  const config = getERPConfig();
  if (!config) throw new Error("Recruitment backend is not configured.");

  const roundName = input.roundName.trim();
  if (!roundName) throw new Error("Round name is required.");

  const endpoint = new URL(
    "/api/resource/Interview Round",
    config.baseUrl.endsWith("/") ? config.baseUrl : `${config.baseUrl}/`,
  );
  const res = await fetch(endpoint.toString(), {
    method: "POST",
    headers: {
      Authorization: `token ${config.apiKey}:${config.apiSecret}`,
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ round_name: roundName }),
    cache: "no-store",
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(humanMessageFromFrappeApiError(text, res.status));
  }
  const json = (await res.json()) as ERPNextCreateResponse;
  if (!json.data?.name) throw new Error("Could not create interview round.");
  return json.data.name;
}

export async function createERPNextInterviewType(input: {
  name: string;
  description?: string;
}): Promise<string> {
  const config = getERPConfig();
  if (!config) throw new Error("Recruitment backend is not configured.");

  const title = input.name.trim();
  if (!title) throw new Error("Interview type name is required.");

  const payload: Record<string, string> = { interview_type: title };
  if (input.description?.trim()) payload.description = input.description.trim();

  const endpoint = new URL(
    "/api/resource/Interview Type",
    config.baseUrl.endsWith("/") ? config.baseUrl : `${config.baseUrl}/`,
  );
  const res = await fetch(endpoint.toString(), {
    method: "POST",
    headers: {
      Authorization: `token ${config.apiKey}:${config.apiSecret}`,
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
    cache: "no-store",
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(humanMessageFromFrappeApiError(text, res.status));
  }
  const json = (await res.json()) as ERPNextCreateResponse;
  if (!json.data?.name) throw new Error("Could not create interview type.");
  return json.data.name;
}

export async function createERPNextJobOffer(input: {
  company: CompanyId;
  jobApplicantName: string;
  applicantName: string;
  applicantEmail?: string;
  designation: string;
  offerDate: string;
  status?: string;
  terms?: string;
  selectTerms?: string;
  jobOfferTermTemplate?: string;
  offerTerms?: Array<{ offer_term: string; value: string }>;
  /** When true (default), creates docstatus 0 — HR submits from portal later. */
  saveAsDraft?: boolean;
}): Promise<string> {
  const config = getERPConfig();
  if (!config) throw new Error("ERPNext config missing");

  const companyName = erpCompanyNameForPortal(input.company);
  const payload: Record<string, unknown> = {
    job_applicant: input.jobApplicantName.trim(),
    applicant_name: input.applicantName.trim(),
    company: companyName,
    designation: input.designation.trim(),
    offer_date: input.offerDate.trim(),
    status: input.status?.trim() || "Awaiting Response",
  };
  if (input.applicantEmail?.trim()) {
    payload.applicant_email = input.applicantEmail.trim();
  }
  if (input.terms?.trim()) payload.terms = input.terms.trim();
  if (input.selectTerms?.trim()) payload.select_terms = input.selectTerms.trim();
  if (input.jobOfferTermTemplate?.trim()) {
    payload.job_offer_term_template = input.jobOfferTermTemplate.trim();
  }
  if (input.offerTerms?.length) {
    payload.offer_terms = input.offerTerms.map((row) => ({
      offer_term: row.offer_term.trim(),
      value: row.value.trim(),
    }));
  }

  const endpoint = new URL(
    "/api/resource/Job Offer",
    config.baseUrl.endsWith("/") ? config.baseUrl : `${config.baseUrl}/`,
  );
  const res = await fetch(endpoint.toString(), {
    method: "POST",
    headers: {
      Authorization: `token ${config.apiKey}:${config.apiSecret}`,
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
    cache: "no-store",
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(humanMessageFromFrappeApiError(text, res.status));
  }
  const json = (await res.json()) as ERPNextCreateResponse;
  if (!json.data?.name) throw new Error("ERPNext did not return Job Offer id");
  return json.data.name;
}

export type ERPNextJobOfferRow = {
  name?: string;
  job_applicant?: string;
  applicant_name?: string;
  applicant_email?: string;
  status?: string;
  designation?: string;
  offer_date?: string;
  company?: string;
  docstatus?: number;
};

export type ERPNextJobOfferTermLine = {
  name?: string;
  offer_term?: string;
  value?: string;
};

export type ERPNextJobOfferDetail = ERPNextJobOfferRow & {
  terms?: string;
  select_terms?: string;
  job_offer_term_template?: string;
  offer_terms?: ERPNextJobOfferTermLine[];
};

type FrappeRpcResponse = {
  message?: unknown;
  exc?: string;
  _server_messages?: string;
};

function erpNextAuthHeaderCandidates(frappeSessionCookie?: string | null): Record<string, string>[] {
  const out: Record<string, string>[] = [];
  const cookie = frappeSessionCookie?.trim();
  if (cookie) out.push({ Cookie: cookie });
  const config = getERPConfig();
  if (config) {
    out.push({ Authorization: `token ${config.apiKey}:${config.apiSecret}` });
  }
  return out;
}

/** Calls a whitelisted Frappe method (`/api/method/...`). Prefers HR/recruiter session cookie when set. */
export async function callERPNextMethod(
  method: string,
  args: Record<string, unknown>,
  opts?: { frappeSessionCookie?: string | null },
): Promise<unknown> {
  const baseUrl = getERPNextSiteBaseUrl();
  if (!baseUrl) throw new Error("Recruitment backend is not configured.");

  const url = new URL(
    `/api/method/${method}`,
    baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`,
  );
  const headersList = erpNextAuthHeaderCandidates(opts?.frappeSessionCookie);

  let lastError = "Could not complete the request.";
  for (const headers of headersList) {
    const res = await fetch(url.toString(), {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        ...headers,
      },
      body: JSON.stringify(args),
      cache: "no-store",
    });
    const text = await res.text();
    if (!res.ok) {
      lastError = humanMessageFromFrappeApiError(text, res.status);
      continue;
    }
    let json: FrappeRpcResponse;
    try {
      json = JSON.parse(text) as FrappeRpcResponse;
    } catch {
      lastError = "Invalid response from recruitment backend.";
      continue;
    }
    if (json.exc) {
      lastError = humanMessageFromFrappeApiError(text, res.status);
      continue;
    }
    return json.message;
  }
  throw new Error(lastError);
}

export async function fetchERPNextJobOfferByName(
  docName: string,
  opts?: { frappeSessionCookie?: string | null },
): Promise<ERPNextJobOfferDetail | null> {
  const baseUrl = getERPNextSiteBaseUrl();
  const trimmed = docName.trim();
  if (!baseUrl || !trimmed) return null;

  const fieldSets = [
    [
      "name",
      "job_applicant",
      "applicant_name",
      "applicant_email",
      "status",
      "designation",
      "offer_date",
      "company",
      "docstatus",
      "terms",
    ],
    [
      "name",
      "job_applicant",
      "applicant_name",
      "applicant_email",
      "status",
      "designation",
      "offer_date",
      "company",
      "docstatus",
    ],
  ] as const;

  for (const headers of erpNextAuthHeaderCandidates(opts?.frappeSessionCookie)) {
    for (const fields of fieldSets) {
      const url = new URL(
        `/api/resource/Job Offer/${encodeURIComponent(trimmed)}`,
        baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`,
      );
      url.searchParams.set("fields", JSON.stringify([...fields]));

      const res = await fetch(url.toString(), {
        headers: { Accept: "application/json", ...headers },
        cache: "no-store",
      });
      if (!res.ok) continue;
      const json = (await res.json()) as { data?: ERPNextJobOfferDetail };
      return json.data ?? null;
    }

    const url = new URL(
      `/api/resource/Job Offer/${encodeURIComponent(trimmed)}`,
      baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`,
    );
    const res = await fetch(url.toString(), {
      headers: { Accept: "application/json", ...headers },
      cache: "no-store",
    });
    if (!res.ok) continue;
    const json = (await res.json()) as { data?: ERPNextJobOfferDetail };
    return json.data ?? null;
  }
  return null;
}

export async function updateERPNextJobOffer(
  docName: string,
  input: {
    designation?: string;
    offerDate?: string;
    status?: string;
    terms?: string;
    selectTerms?: string;
    jobOfferTermTemplate?: string;
    offerTerms?: Array<{ offer_term: string; value: string }>;
  },
  opts?: { frappeSessionCookie?: string | null },
): Promise<void> {
  const baseUrl = getERPNextSiteBaseUrl();
  const trimmed = docName.trim();
  if (!baseUrl || !trimmed) throw new Error("Missing job offer reference.");

  const payload: Record<string, unknown> = {};
  if (input.designation?.trim()) payload.designation = input.designation.trim();
  if (input.offerDate?.trim()) payload.offer_date = input.offerDate.trim();
  if (input.status?.trim()) payload.status = input.status.trim();
  if (input.terms !== undefined) payload.terms = input.terms;
  if (input.selectTerms !== undefined) {
    payload.select_terms = input.selectTerms.trim();
  }
  if (input.jobOfferTermTemplate !== undefined) {
    payload.job_offer_term_template = input.jobOfferTermTemplate.trim();
  }
  if (input.offerTerms !== undefined) {
    payload.offer_terms = input.offerTerms.map((row) => ({
      offer_term: row.offer_term.trim(),
      value: row.value.trim(),
    }));
  }

  if (Object.keys(payload).length === 0) return;

  const url = new URL(
    `/api/resource/Job Offer/${encodeURIComponent(trimmed)}`,
    baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`,
  );

  let lastError = "Could not update job offer.";
  for (const headers of erpNextAuthHeaderCandidates(opts?.frappeSessionCookie)) {
    const res = await fetch(url.toString(), {
      method: "PUT",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        ...headers,
      },
      body: JSON.stringify(payload),
      cache: "no-store",
    });
    if (res.ok) return;
    lastError = humanMessageFromFrappeApiError(await res.text(), res.status);
  }
  throw new Error(lastError);
}

async function fetchERPNextJobOfferDocForSubmit(
  docName: string,
  opts?: { frappeSessionCookie?: string | null },
): Promise<Record<string, unknown>> {
  const baseUrl = getERPNextSiteBaseUrl();
  const trimmed = docName.trim();
  if (!baseUrl || !trimmed) throw new Error("Missing job offer reference.");

  for (const headers of erpNextAuthHeaderCandidates(opts?.frappeSessionCookie)) {
    const url = new URL(
      `/api/resource/Job Offer/${encodeURIComponent(trimmed)}`,
      baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`,
    );
    const res = await fetch(url.toString(), {
      headers: { Accept: "application/json", ...headers },
      cache: "no-store",
    });
    if (!res.ok) continue;
    const json = (await res.json()) as { data?: Record<string, unknown> };
    if (json.data) return json.data;
  }
  throw new Error("Job offer not found.");
}

/** Submits a draft Job Offer (docstatus 0 → 1). HR desk action. */
export async function submitERPNextJobOffer(
  docName: string,
  opts?: { frappeSessionCookie?: string | null },
): Promise<void> {
  const current = await fetchERPNextJobOfferByName(docName, opts);
  if (!current?.name) throw new Error("Job offer not found.");
  if (current.docstatus === 1) throw new Error("This job offer is already submitted.");
  if (current.docstatus === 2) throw new Error("This job offer was cancelled.");

  await updateERPNextJobOffer(
    docName,
    { status: "Awaiting Response" },
    opts,
  );

  const doc = await fetchERPNextJobOfferDocForSubmit(docName, opts);
  await callERPNextMethod("frappe.client.submit", { doc }, opts);
}

/** Emails the Job Offer PDF/details to the applicant (requires submitted doc + email). */
export async function sendERPNextJobOfferToCandidate(
  docName: string,
  opts?: { frappeSessionCookie?: string | null },
): Promise<void> {
  const offer = await fetchERPNextJobOfferByName(docName, opts);
  if (!offer?.name) throw new Error("Job offer not found.");
  if (offer.docstatus !== 1) {
    throw new Error("Submit the job offer before sending it to the candidate.");
  }

  const email = offer.applicant_email?.trim();
  if (!email) throw new Error("This job offer has no applicant email address.");

  const subject = `Job offer — ${offer.designation ?? offer.company ?? "AEMG"}`;
  const content = [
    `<p>Dear ${offer.applicant_name ?? "Candidate"},</p>`,
    `<p>Please find your job offer attached. Review the details and let us know if you have any questions.</p>`,
    `<p>Regards,<br/>${offer.company ?? "HR Team"}</p>`,
  ].join("");

  await callERPNextMethod(
    "frappe.core.doctype.communication.email.make",
    {
      doctype: "Job Offer",
      name: offer.name,
      recipients: email,
      subject,
      content,
      send_email: 1,
      communication_medium: "Email",
    },
    opts,
  );
}

type ERPNextJobOfferListResponse = {
  data?: ERPNextJobOfferRow[];
};

/**
 * Job Offer documents linked to the given Job Applicant document names (same candidate’s applications).
 */
export async function fetchERPNextJobOffersForJobApplicants(
  jobApplicantNames: string[],
): Promise<ERPNextJobOfferRow[] | null> {
  const config = getERPConfig();
  if (!config) return null;
  const names = jobApplicantNames.map((s) => s.trim()).filter(Boolean);
  if (names.length === 0) return [];

  const fields = [
    "name",
    "job_applicant",
    "applicant_name",
    "applicant_email",
    "status",
    "designation",
    "offer_date",
    "company",
    "docstatus",
  ];
  const filters: unknown[] = [["job_applicant", "in", names]];

  const url = new URL(
    "/api/resource/Job Offer",
    config.baseUrl.endsWith("/") ? config.baseUrl : `${config.baseUrl}/`,
  );
  url.searchParams.set("fields", JSON.stringify(fields));
  url.searchParams.set("filters", JSON.stringify(filters));
  url.searchParams.set("limit_page_length", "100");
  url.searchParams.set("order_by", "modified desc");

  const res = await fetch(url.toString(), {
    headers: {
      Authorization: `token ${config.apiKey}:${config.apiSecret}`,
      Accept: "application/json",
    },
    cache: "no-store",
  });
  if (!res.ok) return null;
  const json = (await res.json()) as ERPNextJobOfferListResponse;
  return json.data ?? [];
}

export type ERPNextCommentRow = {
  name?: string;
  content?: string;
  creation?: string;
  comment_by?: string;
  comment_type?: string;
  owner?: string;
};

type ERPNextCommentListResponse = {
  data?: ERPNextCommentRow[];
};

/**
 * Desk timeline entries on a document (Comments, attachments logged as Comment, etc.).
 * This is what appears under Comments / Activity on Job Applicant in ERPNext.
 */
export async function fetchERPNextCommentsForDocument(
  referenceDoctype: string,
  referenceName: string,
): Promise<ERPNextCommentRow[] | null> {
  const config = getERPConfig();
  const docName = referenceName.trim();
  const doctype = referenceDoctype.trim();
  if (!config || !docName || !doctype) return null;

  const fields = ["name", "content", "creation", "comment_by", "comment_type", "owner"];
  const filters: unknown[] = [
    ["reference_doctype", "=", doctype],
    ["reference_name", "=", docName],
  ];

  const url = new URL(
    "/api/resource/Comment",
    config.baseUrl.endsWith("/") ? config.baseUrl : `${config.baseUrl}/`,
  );
  url.searchParams.set("fields", JSON.stringify(fields));
  url.searchParams.set("filters", JSON.stringify(filters));
  url.searchParams.set("limit_page_length", "50");
  url.searchParams.set("order_by", "creation desc");

  const res = await fetch(url.toString(), {
    headers: {
      Authorization: `token ${config.apiKey}:${config.apiSecret}`,
      Accept: "application/json",
    },
    cache: "no-store",
  });
  if (!res.ok) return null;
  const json = (await res.json()) as ERPNextCommentListResponse;
  return json.data ?? [];
}

export async function createERPNextCommentForDocument(
  referenceDoctype: string,
  referenceName: string,
  content: string,
): Promise<string> {
  const config = getERPConfig();
  const docName = referenceName.trim();
  const doctype = referenceDoctype.trim();
  const text = content.trim();
  if (!config || !docName || !doctype || !text) {
    throw new Error("Missing comment data or ERPNext config.");
  }

  const endpoint = new URL(
    "/api/resource/Comment",
    config.baseUrl.endsWith("/") ? config.baseUrl : `${config.baseUrl}/`,
  );
  const res = await fetch(endpoint.toString(), {
    method: "POST",
    headers: {
      Authorization: `token ${config.apiKey}:${config.apiSecret}`,
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      comment_type: "Comment",
      reference_doctype: doctype,
      reference_name: docName,
      content: text,
    }),
    cache: "no-store",
  });
  if (!res.ok) {
    const raw = await res.text();
    throw new Error(humanMessageFromFrappeApiError(raw, res.status));
  }
  const json = (await res.json()) as ERPNextCreateResponse;
  if (!json.data?.name) throw new Error("ERPNext did not return Comment id");
  return json.data.name;
}

/** All job offers (HR / executive review). */
export async function fetchERPNextJobOffersAll(
  limit = 100,
): Promise<ERPNextJobOfferRow[] | null> {
  const config = getERPConfig();
  if (!config) return null;

  const fields = [
    "name",
    "job_applicant",
    "applicant_name",
    "applicant_email",
    "status",
    "designation",
    "offer_date",
    "company",
    "docstatus",
  ];

  const url = new URL(
    "/api/resource/Job Offer",
    config.baseUrl.endsWith("/") ? config.baseUrl : `${config.baseUrl}/`,
  );
  url.searchParams.set("fields", JSON.stringify(fields));
  url.searchParams.set("limit_page_length", String(limit));
  url.searchParams.set("order_by", "modified desc");

  const res = await fetch(url.toString(), {
    headers: {
      Authorization: `token ${config.apiKey}:${config.apiSecret}`,
      Accept: "application/json",
    },
    cache: "no-store",
  });
  if (!res.ok) return null;
  const json = (await res.json()) as ERPNextJobOfferListResponse;
  return json.data ?? [];
}

/** HR Terms and Conditions templates (for Job Offer `select_terms`). */
export async function fetchERPNextHrTermsAndConditions(): Promise<{ name: string; title: string }[] | null> {
  const config = getERPConfig();
  if (!config) return null;

  const url = new URL(
    "/api/resource/Terms and Conditions",
    config.baseUrl.endsWith("/") ? config.baseUrl : `${config.baseUrl}/`,
  );
  url.searchParams.set("fields", JSON.stringify(["name", "title", "hr"]));
  url.searchParams.set("filters", JSON.stringify([["hr", "=", 1]]));
  url.searchParams.set("limit_page_length", "100");
  url.searchParams.set("order_by", "title asc");

  const res = await fetch(url.toString(), {
    headers: {
      Authorization: `token ${config.apiKey}:${config.apiSecret}`,
      Accept: "application/json",
    },
    cache: "no-store",
  });
  if (!res.ok) return null;
  const json = (await res.json()) as { data?: Array<{ name?: string; title?: string }> };
  const out: { name: string; title: string }[] = [];
  for (const r of json.data ?? []) {
    const name = typeof r.name === "string" ? r.name.trim() : "";
    if (!name) continue;
    const title = typeof r.title === "string" && r.title.trim() ? r.title.trim() : name;
    out.push({ name, title });
  }
  return out;
}

/** Job Offer Term Template documents (optional HRMS feature). */
export async function fetchERPNextJobOfferTermTemplates(): Promise<{ name: string }[] | null> {
  const config = getERPConfig();
  if (!config) return null;

  const url = new URL(
    "/api/resource/Job Offer Term Template",
    config.baseUrl.endsWith("/") ? config.baseUrl : `${config.baseUrl}/`,
  );
  url.searchParams.set("fields", JSON.stringify(["name"]));
  url.searchParams.set("limit_page_length", "100");
  url.searchParams.set("order_by", "name asc");

  const res = await fetch(url.toString(), {
    headers: {
      Authorization: `token ${config.apiKey}:${config.apiSecret}`,
      Accept: "application/json",
    },
    cache: "no-store",
  });
  if (!res.ok) return null;
  const json = (await res.json()) as { data?: Array<{ name?: string }> };
  const out: { name: string }[] = [];
  for (const r of json.data ?? []) {
    const name = typeof r.name === "string" ? r.name.trim() : "";
    if (name) out.push({ name });
  }
  return out;
}

export type ERPNextOfferTermOption = { name: string };

/** Offer Term master list (Department, Notice Period, …). */
export async function fetchERPNextOfferTerms(): Promise<ERPNextOfferTermOption[] | null> {
  const config = getERPConfig();
  if (!config) return null;

  const url = new URL(
    "/api/resource/Offer Term",
    config.baseUrl.endsWith("/") ? config.baseUrl : `${config.baseUrl}/`,
  );
  url.searchParams.set("fields", JSON.stringify(["name"]));
  url.searchParams.set("limit_page_length", "200");
  url.searchParams.set("order_by", "name asc");

  const res = await fetch(url.toString(), {
    headers: {
      Authorization: `token ${config.apiKey}:${config.apiSecret}`,
      Accept: "application/json",
    },
    cache: "no-store",
  });
  if (!res.ok) return null;
  const json = (await res.json()) as { data?: Array<{ name?: string }> };
  const out: ERPNextOfferTermOption[] = [];
  for (const r of json.data ?? []) {
    const name = typeof r.name === "string" ? r.name.trim() : "";
    if (name) out.push({ name });
  }
  return out;
}

export type ERPNextJobOfferTermTemplateRow = {
  offer_term: string;
  value: string;
};

/** Child rows from a Job Offer Term Template. */
export async function fetchERPNextJobOfferTermTemplateRows(
  templateName: string,
): Promise<ERPNextJobOfferTermTemplateRow[] | null> {
  const config = getERPConfig();
  const trimmed = templateName.trim();
  if (!config || !trimmed) return null;

  const url = new URL(
    `/api/resource/Job Offer Term Template/${encodeURIComponent(trimmed)}`,
    config.baseUrl.endsWith("/") ? config.baseUrl : `${config.baseUrl}/`,
  );

  const res = await fetch(url.toString(), {
    headers: {
      Authorization: `token ${config.apiKey}:${config.apiSecret}`,
      Accept: "application/json",
    },
    cache: "no-store",
  });
  if (!res.ok) return null;

  const json = (await res.json()) as {
    data?: { offer_terms?: Array<{ offer_term?: string; value?: string }> };
  };
  const out: ERPNextJobOfferTermTemplateRow[] = [];
  for (const row of json.data?.offer_terms ?? []) {
    const offer_term = typeof row.offer_term === "string" ? row.offer_term.trim() : "";
    const value = typeof row.value === "string" ? row.value.trim() : "";
    if (offer_term) out.push({ offer_term, value });
  }
  return out;
}

/** HTML/text body from a Terms and Conditions document. */
export async function fetchERPNextTermsAndConditionsBody(
  docName: string,
): Promise<string | null> {
  const config = getERPConfig();
  const trimmed = docName.trim();
  if (!config || !trimmed) return null;

  const url = new URL(
    `/api/resource/Terms and Conditions/${encodeURIComponent(trimmed)}`,
    config.baseUrl.endsWith("/") ? config.baseUrl : `${config.baseUrl}/`,
  );
  url.searchParams.set("fields", JSON.stringify(["terms"]));

  const res = await fetch(url.toString(), {
    headers: {
      Authorization: `token ${config.apiKey}:${config.apiSecret}`,
      Accept: "application/json",
    },
    cache: "no-store",
  });
  if (!res.ok) return null;

  const json = (await res.json()) as { data?: { terms?: string } };
  const terms = json.data?.terms;
  return typeof terms === "string" ? terms : null;
}

export type ERPNextDesignationRow = {
  name: string;
  designation?: string;
  description?: string;
};

type ERPNextDesignationListResponse = {
  data?: ERPNextDesignationRow[];
};

function parseERPNextDesignationListRows(
  rows: Array<{ name?: string; designation?: string; description?: string }>,
): ERPNextDesignationRow[] {
  const out: ERPNextDesignationRow[] = [];
  for (const r of rows) {
    const name = typeof r.name === "string" ? r.name.trim() : "";
    if (!name) continue;
    const designationField =
      typeof r.designation === "string" && r.designation.trim() ?
        r.designation.trim()
      : name;
    out.push({
      name,
      designation: designationField,
      description: typeof r.description === "string" ? r.description.trim() : undefined,
    });
  }
  return out;
}

async function fetchERPNextDesignationListWithHeaders(
  headers: Record<string, string>,
  fields: string[],
): Promise<ERPNextDesignationRow[] | null> {
  const baseUrl = getERPNextSiteBaseUrl();
  if (!baseUrl) return null;

  const url = new URL(
    "/api/resource/Designation",
    baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`,
  );
  url.searchParams.set("fields", JSON.stringify(fields));
  url.searchParams.set("limit_page_length", "500");
  url.searchParams.set("order_by", "name asc");

  const res = await fetch(url.toString(), {
    headers: { Accept: "application/json", ...headers },
    cache: "no-store",
  });
  if (!res.ok) return null;
  const json = (await res.json()) as ERPNextDesignationListResponse;
  return parseERPNextDesignationListRows(json.data ?? []);
}

/**
 * Lists Designation records for job opening / offer pickers.
 * HRMS Designation uses `name` as the title (no separate `designation` column on many sites).
 */
export async function fetchERPNextDesignations(opts?: {
  frappeSessionCookie?: string | null;
}): Promise<ERPNextDesignationRow[] | null> {
  const fieldSets = [
    ["name", "description"],
    ["name"],
  ] as const;

  const cookie = opts?.frappeSessionCookie?.trim();
  if (cookie) {
    for (const fields of fieldSets) {
      const rows = await fetchERPNextDesignationListWithHeaders({ Cookie: cookie }, [...fields]);
      if (rows !== null) return rows;
    }
  }

  const config = getERPConfig();
  if (!config) return null;

  const authHeaders = {
    Authorization: `token ${config.apiKey}:${config.apiSecret}`,
  };
  for (const fields of fieldSets) {
    const rows = await fetchERPNextDesignationListWithHeaders(authHeaders, [...fields]);
    if (rows !== null) return rows;
  }
  return null;
}

export async function createERPNextDesignation(input: {
  designation: string;
  description?: string;
}): Promise<string> {
  const config = getERPConfig();
  if (!config) throw new Error("Recruitment backend is not configured.");

  const title = input.designation.trim();
  if (!title) throw new Error("Designation title is required.");

  const payload: Record<string, string> = { designation: title };
  if (input.description?.trim()) payload.description = input.description.trim();

  const endpoint = new URL(
    "/api/resource/Designation",
    config.baseUrl.endsWith("/") ? config.baseUrl : `${config.baseUrl}/`,
  );
  const res = await fetch(endpoint.toString(), {
    method: "POST",
    headers: {
      Authorization: `token ${config.apiKey}:${config.apiSecret}`,
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
    cache: "no-store",
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(humanMessageFromFrappeApiError(text, res.status));
  }
  const json = (await res.json()) as ERPNextCreateResponse;
  if (!json.data?.name) throw new Error("Could not create designation.");
  return json.data.name;
}

/** Lists Employment Type link targets for job openings. */
export async function fetchERPNextEmploymentTypes(): Promise<{ name: string }[] | null> {
  const config = getERPConfig();
  if (!config) return null;

  const url = new URL(
    "/api/resource/Employment Type",
    config.baseUrl.endsWith("/") ? config.baseUrl : `${config.baseUrl}/`,
  );
  url.searchParams.set("fields", JSON.stringify(["name"]));
  url.searchParams.set("limit_page_length", "200");
  url.searchParams.set("order_by", "name asc");

  const res = await fetch(url.toString(), {
    headers: {
      Authorization: `token ${config.apiKey}:${config.apiSecret}`,
      Accept: "application/json",
    },
    cache: "no-store",
  });
  if (!res.ok) return null;
  const json = (await res.json()) as ERPNextInterviewTypeListResponse;
  const rows = json.data ?? [];
  return rows
    .map((r) => (typeof r.name === "string" ? { name: r.name } : null))
    .filter((r): r is { name: string } => r !== null);
}
