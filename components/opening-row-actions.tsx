import Link from "next/link";
import { IconEye, IconPencil, IconUsers } from "@/components/icons";

type Props = {
  openingId: string;
  canEdit?: boolean;
  /** View opening only (no edit or applicants shortcuts). */
  viewOnly?: boolean;
};

export function OpeningRowActions({ openingId, canEdit = true, viewOnly = false }: Props) {
  const viewHref = `/staff/openings/${encodeURIComponent(openingId)}`;
  const editHref = `/staff/openings/${encodeURIComponent(openingId)}/edit`;
  const applicantsHref = `/staff/applicants?opening=${encodeURIComponent(openingId)}`;

  const btn =
    "inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 hover:text-[#0d4f6e]";

  return (
    <div className="flex items-center justify-end gap-1.5">
      <Link href={viewHref} className={btn} title="View opening" aria-label="View opening">
        <IconEye />
      </Link>
      {!viewOnly && canEdit ?
        <Link href={editHref} className={btn} title="Edit opening" aria-label="Edit opening">
          <IconPencil />
        </Link>
      : null}
      {!viewOnly ?
        <Link
          href={applicantsHref}
          className={btn}
          title="View applicants"
          aria-label="View applicants"
        >
          <IconUsers />
        </Link>
      : null}
    </div>
  );
}
