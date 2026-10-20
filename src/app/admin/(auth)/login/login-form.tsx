"use client";

import { useActionState } from "react";
import { loginAction, type LoginState } from "./actions";
import { btnPrimary, inputCls } from "@/components/admin/ui";

export function LoginForm() {
  const [state, action, pending] = useActionState<LoginState, FormData>(loginAction, { error: null });
  return (
    <form action={action} className="space-y-4">
      <div>
        <label htmlFor="email" className="mb-1 block text-sm font-medium">Email</label>
        <input id="email" name="email" type="email" autoComplete="username" required className={inputCls} />
      </div>
      <div>
        <label htmlFor="password" className="mb-1 block text-sm font-medium">Password</label>
        <input id="password" name="password" type="password" autoComplete="current-password" required className={inputCls} />
      </div>
      <div aria-live="polite">
        {state.error && <p role="alert" className="text-sm text-bad">{state.error}</p>}
      </div>
      <button type="submit" disabled={pending} className={`${btnPrimary} w-full`}>{pending ? "Signing in..." : "Log in"}</button>
    </form>
  );
}
