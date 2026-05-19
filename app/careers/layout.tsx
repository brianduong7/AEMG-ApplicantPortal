import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    default: "Careers — AEMG",
    template: "%s — AEMG Careers",
  },
  description: "Explore current opportunities at AEMG Education.",
};

export default function CareersLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-dvh bg-white font-sans text-slate-900">{children}</div>;
}
