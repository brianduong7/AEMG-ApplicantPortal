import {
  fetchERPNextJobApplicants,
  fetchERPNextJobOpeningsForRequisition,
} from "@/lib/erpnext";

export type LinkedOpeningSummary = {
  docName: string;
  title: string;
  status: string;
  published: boolean;
  applicantCount: number;
};

export async function linkedOpeningSummariesForRequisition(
  requisitionDocName: string,
): Promise<LinkedOpeningSummary[]> {
  const openings = await fetchERPNextJobOpeningsForRequisition(requisitionDocName);
  if (!openings?.length) return [];

  const summaries = await Promise.all(
    openings.map(async (row) => {
      const docName = row.name?.trim() ?? "";
      const applicants =
        docName ?
          ((await fetchERPNextJobApplicants({ jobOpeningDocName: docName, limit: 500 })) ?? [])
        : [];
      return {
        docName,
        title: row.job_title?.trim() || row.designation?.trim() || docName || "—",
        status: row.status?.trim() || "—",
        published: row.publish === 1,
        applicantCount: applicants.length,
      };
    }),
  );

  return summaries;
}
