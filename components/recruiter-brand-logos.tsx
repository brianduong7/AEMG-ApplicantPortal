import Image from "next/image";
import { COMPANIES } from "@/lib/companies";

type Props = {
  /** Sidebar width vs auth card */
  layout?: "sidebar" | "auth";
};

export function RecruiterBrandLogos({ layout = "auth" }: Props) {
  const compact = layout === "sidebar";
  const imgClass = compact
    ? "h-8 w-auto max-w-[105px] object-contain"
    : "h-12 w-auto max-w-[150px] object-contain";

  return (
    <div
      className={`flex items-center justify-center ${compact ? "gap-2" : "gap-5"}`}
      aria-label="AIFE and AEMG logos"
    >
      <Image
        src={COMPANIES.aife.logoSrc}
        alt="AIFE"
        width={220}
        height={72}
        className={imgClass}
        priority
      />
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
