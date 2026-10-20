"use server";

import { redirect } from "next/navigation";
import {
  checkCredentials, clearLoginFailures, clientIp, loginLockMinutes, recordLoginFailure, startAdminSession,
} from "@/lib/auth";

export interface LoginState { error: string | null }

const lockedMessage = (minutes: number) =>
  `Too many failed attempts. Try again in ${minutes} minute${minutes === 1 ? "" : "s"}.`;

export async function loginAction(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const ip = await clientIp();

  const locked = await loginLockMinutes(ip);
  if (locked > 0) return { error: lockedMessage(locked) };

  if (email.length > 200 || password.length > 200 || !checkCredentials(email, password)) {
    await recordLoginFailure(ip);
    await new Promise((r) => setTimeout(r, 800)); // slow down guessing
    const nowLocked = await loginLockMinutes(ip);
    return { error: nowLocked > 0 ? lockedMessage(nowLocked) : "Wrong email or password" };
  }
  await clearLoginFailures(ip);
  await startAdminSession();
  redirect("/admin");
}
