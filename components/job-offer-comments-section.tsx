import { ApplicantDetailSection } from "@/components/applicant-detail-section";
import { DocumentCommentBlock } from "@/components/document-comment-block";
import { JobOfferCommentForm } from "@/components/job-offer-comment-form";
import type { ERPNextCommentRow } from "@/lib/erpnext";

type Props = {
  offerDocName: string;
  comments: ERPNextCommentRow[];
};

export function JobOfferCommentsSection({ offerDocName, comments }: Props) {
  const deskComments = comments.filter(
    (row) => (row.comment_type?.trim() || "Comment") === "Comment",
  );

  return (
    <ApplicantDetailSection
      title="Comments"
      description="Internal notes and reference details for this job offer. Visible to staff in the portal and on the offer in your recruitment system."
    >
      {deskComments.length === 0 ?
        <p className="text-sm text-slate-600">No comments yet.</p>
      : <ul className="flex flex-col gap-3">
          {deskComments.map((row) => (
            <li key={row.name ?? row.creation}>
              <DocumentCommentBlock row={row} />
            </li>
          ))}
        </ul>
      }
      <JobOfferCommentForm offerDocName={offerDocName} />
    </ApplicantDetailSection>
  );
}
