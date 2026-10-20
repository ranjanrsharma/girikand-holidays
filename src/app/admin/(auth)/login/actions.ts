"use server";

import { redirect } from "next/navigation";
import { checkCredentials, startAdminSession } from "@/lib/auth";

export interface LoginState { error: string | null }

export async function loginAction(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  if (email.length > 200 || password.length > 200 || !checkCredentials(email, password)) {
    await new Promise((r) => setTimeout(r, 800)); // slow down guessing
    return { error: "Wrong email or password" };
  }
  await startAdminSession();
  redirect("/admin");
}
