"use server";

import { getJobById } from "@/lib/jobs";
import {
  createERPNextJobApplicant,
  uploadResumeForJobApplicant,
} from "@/lib/erpnext";
import { getSession } from "@/lib/session";

export type ApplicationState = {
  error?: string;
  success?: boolean;
  jobTitle?: string;
} | null;

const EMAIL_RE =
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Allows common phone formats when provided. */
const PHONE_RE = /^[\d\s+\-().]{7,20}$/;

const MAX_RESUME_BYTES = 5 * 1024 * 1024;
const ALLOWED_RESUME_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

export async function submitApplication(
  _prev: ApplicationState,
  formData: FormData,
): Promise<ApplicationState> {
  const session = await getSession();
  if (!session) {
    return { error: "Your session has expired. Please sign in again." };
  }

  const jobId = String(formData.get("jobOpening") ?? "").trim();
  const applicantName = String(formData.get("applicantName") ?? "").trim();
  const email = String(formData.get("emailAddress") ?? "").trim();
  const phoneRaw = String(formData.get("phoneNumber") ?? "").trim();
  const country = String(formData.get("country") ?? "").trim();

  const job = await getJobById(jobId);
  if (!job) {
    return { error: "Please select a valid job opening." };
  }

  if (!applicantName) {
    return { error: "Applicant name is required." };
  }

  if (!email || !EMAIL_RE.test(email)) {
    return { error: "A valid email address is required." };
  }

  if (phoneRaw && !PHONE_RE.test(phoneRaw)) {
    return {
      error: "Enter a valid phone number, or leave it blank.",
    };
  }

  const resume = formData.get("resume");
  if (!(resume instanceof File) || resume.size === 0) {
    return { error: "Resume attachment is required." };
  }

  if (resume.size > MAX_RESUME_BYTES) {
    return { error: "Resume must be 5 MB or smaller." };
  }

  const mime = resume.type.trim();
  if (mime && !ALLOWED_RESUME_TYPES.has(mime)) {
    return {
      error: "Resume must be a PDF or Word document (.pdf, .doc, .docx).",
    };
  }

  const lower = resume.name.toLowerCase();
  if (!lower.endsWith(".pdf") && !lower.endsWith(".doc") && !lower.endsWith(".docx")) {
    return {
      error: "Resume must use a .pdf, .doc, or .docx file extension.",
    };
  }

  try {
    const applicantId = await createERPNextJobApplicant({
      applicantName,
      email,
      phone: phoneRaw,
      country,
      jobCode: job.id,
    });
    await uploadResumeForJobApplicant({
      applicantId,
      file: resume,
    });
  } catch (err) {
    console.error("[submitApplication] ERPNext error:", err);
    if (process.env.NODE_ENV === "development" && err instanceof Error) {
      return {
        error: `Could not submit to ERPNext: ${err.message}`,
      };
    }
    return { error: "Could not submit to ERPNext right now. Please try again." };
  }

  return { success: true, jobTitle: job.title };
}
