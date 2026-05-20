import type { Metadata } from "next";
import { PUBLIC_CAREERS_BRAND } from "@/lib/careers-site";

export const metadata: Metadata = {
  title: {
    default: `Careers — ${PUBLIC_CAREERS_BRAND.shortLabel}`,
    template: `%s — ${PUBLIC_CAREERS_BRAND.shortLabel} Careers`,
  },
  description: `Explore current opportunities at ${PUBLIC_CAREERS_BRAND.label}.`,
};

export default function CareersLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col bg-white font-sans text-slate-900">{children}</div>
  );
}
