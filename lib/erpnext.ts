import type { CompanyId } from "@/lib/companies";

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
    applicantSource,
  };
}

export function hasERPNextConfig(): boolean {
  return getERPConfig() !== null;
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

  const baseApplicant = {
    applicant_name: input.applicantName,
    email_id: input.email,
    phone_number: input.phone || undefined,
    country: input.country || undefined,
    cover_letter: input.coverLetter || undefined,
    status: "Open",
    ...sourceFields,
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
