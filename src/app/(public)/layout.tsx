import type { Metadata } from "next";
import type { ReactNode } from "react";
import { EnquiryProvider } from "@/components/public/EnquiryProvider";
import { SiteFooter } from "@/components/public/SiteFooter";
import { SiteHeader } from "@/components/public/SiteHeader";
import { BRAND } from "@/lib/config";

export const metadata: Metadata = {
  title: { default: `${BRAND.name} | ${BRAND.tagline}`, template: `%s | ${BRAND.name}` },
  description: "Customized family holiday packages across India, planned around your dates, budget and pace. Send an enquiry and we will call you back.",
};

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <EnquiryProvider email={BRAND.enquiryEmail}>
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded focus:bg-white focus:p-2">Skip to content</a>
      <div className="relative">
        <SiteHeader />
      </div>
      <main id="main" className="flex-1">{children}</main>
      <SiteFooter />
    </EnquiryProvider>
  );
}
