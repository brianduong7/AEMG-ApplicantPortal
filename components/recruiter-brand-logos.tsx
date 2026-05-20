import Image from "next/image";
import { COMPANIES } from "@/lib/companies";

type Props = {
  /** Sidebar width vs auth card */
  layout?: "sidebar" | "auth";
  /** Navy brand bar behind AIFE logo (staff sign-in) */
  aifeOnBrandBackground?: boolean;
};

export function RecruiterBrandLogos({
  layout = "auth",
  aifeOnBrandBackground = false,
}: Props) {
  const compact = layout === "sidebar";
  const imgClass = compact
    ? "h-8 w-auto max-w-[105px] object-contain"
    : "h-12 w-auto max-w-[150px] object-contain";

  const aifeLogo = (
    <Image
      src={COMPANIES.aife.logoSrc}
      alt="AIFE"
      width={220}
      height={72}
      className={imgClass}
      priority
    />
  );

  return (
    <div
      className={`flex items-center justify-center ${compact ? "gap-2" : "gap-5"}`}
      aria-label="AIFE and AEMG logos"
    >
      {aifeOnBrandBackground ?
        <span className="inline-flex rounded-md bg-[#0a1628] px-3 py-2">{aifeLogo}</span>
      : aifeLogo}
      <span className={`w-px shrink-0 bg-slate-200 ${compact ? "h-7" : "h-10"}`} aria-hidden />
      <Image
        src={COMPANIES.aemg.logoSrc}
        alt="AEMG"
        width={220}
        height={72}
        className={imgClass}
        priority
      />
    </div>
  );
}
