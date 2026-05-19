import { getApplicantCandidateStrict } from "@/lib/applicant-candidate";
import { greetingNameFromProfile } from "@/lib/hr-display-name";

/** First name for applicant portal greetings (from Candidate full name in ERPNext). */
export async function getApplicantGreetingName(email: string): Promise<string> {
  const candidate = await getApplicantCandidateStrict();
  return greetingNameFromProfile(candidate?.full_name, email);
}
