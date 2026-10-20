import type { Metadata } from "next";
import Image from "next/image";
import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Log in", robots: { index: false, follow: false } };

export default async function LoginPage() {
  if (await isAdmin()) redirect("/admin");
  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-4 py-10">
      <div className="rounded-lg border border-ink-200 bg-white p-6 shadow-sm">
        <Image src="/brand/girikand-logo.png" alt="Girikand Holidays" width={160} height={48} className="mb-4 h-10 w-auto" priority />
        <h1 className="mb-4 text-xl font-semibold">Staff log in</h1>
        <LoginForm />
      </div>
    </main>
  );
}
