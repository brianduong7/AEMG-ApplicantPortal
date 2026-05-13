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
};

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
  creation?: string;
  cover_letter?: string;
  resume_attachment?: string;
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

type ERPNextInterviewTypeRow = { name?: string };

type ERPNextInterviewTypeListResponse = {
  data?: ERPNextInterviewTypeRow[];
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

  const fields = [
    "name",
    "applicant_name",
    "email_id",
    "phone_number",
    "status",
    openingField,
    "creation",
  ];

  const url = new URL(
    "/api/resource/Job Applicant",
    config.baseUrl.endsWith("/") ? config.baseUrl : `${config.baseUrl}/`,
  );
  url.searchParams.set("fields", JSON.stringify(fields));
  if (filters.length) {
    url.searchParams.set("filters", JSON.stringify(filters));
  }
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
  const json = (await res.json()) as ERPNextApplicantListResponse;
  return json.data ?? [];
}

export async function fetchERPNextJobApplicantByName(
  name: string,
): Promise<ERPNextJobApplicantRow | null> {
  const config = getERPConfig();
  const trimmed = name.trim();
  if (!config || !trimmed) return null;

  const fields = [
    "name",
    "applicant_name",
    "email_id",
    "phone_number",
    "status",
    config.jobApplicantOpeningField,
    "creation",
    "cover_letter",
    "resume_attachment",
  ];

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

export type ERPNextInterviewRow = {
  name?: string;
  job_applicant?: string;
  job_opening?: string;
  status?: string;
  scheduled_on?: string;
  from_time?: string;
  to_time?: string;
  interview_type?: string;
};

type ERPNextInterviewListResponse = {
  data?: ERPNextInterviewRow[];
};

/** All interviews (no filters). */
export async function fetchERPNextInterviewsForHr(): Promise<ERPNextInterviewRow[] | null> {
  const config = getERPConfig();
  if (!config) return null;

  const fields = [
    "name",
    "job_applicant",
    "job_opening",
    "status",
    "scheduled_on",
    "from_time",
    "to_time",
    "interview_type",
  ];

  const url = new URL(
    "/api/resource/Interview",
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
  const json = (await res.json()) as ERPNextInterviewListResponse;
  return json.data ?? [];
}

export async function fetchERPNextInterviewTypes(): Promise<{ name: string }[] | null> {
  const config = getERPConfig();
  if (!config) return null;

  const url = new URL(
    "/api/resource/Interview Type",
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

export async function createERPNextInterview(input: {
  jobApplicantName: string;
  scheduledOn: string;
  fromTime: string;
  toTime: string;
  interviewType?: string;
  interviewerUser?: string;
}): Promise<string> {
  const config = getERPConfig();
  if (!config) throw new Error("ERPNext config missing");

  const interviewType =
    input.interviewType?.trim() || getDefaultInterviewTypeName();
  if (!interviewType) {
    throw new Error(
      "Interview Type is required. Set ERPNEXT_DEFAULT_INTERVIEW_TYPE or pick a type in the form.",
    );
  }

  const interviewDetails =
    input.interviewerUser?.trim() ?
      [{ interviewer: input.interviewerUser.trim() }]
    : [];

  const payload: Record<string, unknown> = {
    job_applicant: input.jobApplicantName.trim(),
    interview_type: interviewType,
    status: "Pending",
    scheduled_on: input.scheduledOn.trim(),
    from_time: input.fromTime.trim(),
    to_time: input.toTime.trim(),
    interview_details: interviewDetails,
  };

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
    throw new Error(`(${res.status}) ${text.slice(0, 280)}`);
  }
  const json = (await res.json()) as ERPNextCreateResponse;
  if (!json.data?.name) throw new Error("ERPNext did not return Interview id");
  return json.data.name;
}
