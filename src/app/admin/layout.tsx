import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { default: "Staff area", template: "%s | Staff area" },
  robots: { index: false, follow: false },
};

// No login check here on purpose: /admin/login lives under this layout. Protected pages call requireAdmin() themselves.
export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-ink-50 text-ink-900">{children}</div>;
}
