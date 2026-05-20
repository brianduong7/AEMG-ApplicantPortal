import { redirect } from "next/navigation";

/** Legacy path — offers are listed under My Offer. */
export default function ApplicantJobOffersRedirect() {
  redirect("/applicant/my-offers");
}
