import { randomUUID, timingSafeEqual } from "node:crypto";
import { SignJWT, jwtVerify } from "jose";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { getDb } from "./db";

const COOKIE = "admin_session";
const MAX_AGE = 60 * 60 * 12;
export const MAX_LOGIN_FAILURES = 3;
export const LOCKOUT_MINUTES = 15;
const GLOBAL_MAX_FAILURES = 30; // across all addresses, so rotating IPs does not bypass the limit

function secret() {
  const s = process.env.SESSION_SECRET ?? (process.env.NODE_ENV === "production" ? "" : "dev-only-secret-change-me-please-32chars");
  if (s.length < 32) throw new Error("SESSION_SECRET must be set to at least 32 characters");
  return new TextEncoder().encode(s);
}

function same(a: string, b: string) {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

/** Staff login is one admin account taken from ADMIN_EMAIL and ADMIN_PASSWORD (dev defaults in .env.example). */
export function checkCredentials(email: string, password: string): boolean {
  const e = process.env.ADMIN_EMAIL ?? "admin@example.com";
  const p = process.env.ADMIN_PASSWORD ?? (process.env.NODE_ENV === "production" ? "" : "admin123");
  return p.length > 0 && same(email.trim().toLowerCase(), e.toLowerCase()) && same(password, p);
}

/** Call from a server action after checkCredentials succeeds. Stores the session server-side so it can be revoked. */
export async function startAdminSession(): Promise<void> {
  const db = await getDb();
  const sid = randomUUID();
  await db.query(`DELETE FROM admin_sessions WHERE expires_at < now()`);
  await db.query(`INSERT INTO admin_sessions (id, expires_at) VALUES ($1, now() + ($2 || ' seconds')::interval)`, [sid, String(MAX_AGE)]);
  const token = await new SignJWT({ role: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setJti(sid)
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(secret());
  (await cookies()).set(COOKIE, token, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: MAX_AGE });
}

/** Revokes this session on the server (a copied cookie stops working) and clears the cookie. */
export async function endAdminSession(): Promise<void> {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (token) {
    try {
      const { payload } = await jwtVerify(token, secret());
      if (payload.jti) await (await getDb()).query(`DELETE FROM admin_sessions WHERE id = $1`, [payload.jti]);
    } catch {
      // expired or invalid token: nothing to revoke
    }
  }
  jar.delete(COOKIE);
}

export async function isAdmin(): Promise<boolean> {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return false;
  try {
    const { payload } = await jwtVerify(token, secret());
    if (!payload.jti) return false;
    const rows = await (await getDb()).query(`SELECT 1 FROM admin_sessions WHERE id = $1 AND expires_at > now()`, [payload.jti]);
    return rows.length > 0;
  } catch {
    return false;
  }
}

/** Best-effort client address for the lockout (first entry of x-forwarded-for, set by the host). */
export async function clientIp(): Promise<string> {
  const h = await headers();
  return (h.get("x-forwarded-for")?.split(",")[0] ?? h.get("x-real-ip") ?? "unknown").trim().slice(0, 64);
}

/** Minutes left on a lockout for this address (0 when not locked). Failed attempts are not recorded while locked. */
export async function loginLockMinutes(ip: string): Promise<number> {
  const db = await getDb();
  const window = `${LOCKOUT_MINUTES} minutes`;
  const mine = await db.query<{ n: number; last: string }>(
    `SELECT count(*)::int AS n, max(at)::text AS last FROM login_failures WHERE ip = $1 AND at > now() - $2::interval`, [ip, window]);
  const all = await db.query<{ n: number }>(`SELECT count(*)::int AS n FROM login_failures WHERE at > now() - $1::interval`, [window]);
  if (mine[0].n < MAX_LOGIN_FAILURES && all[0].n < GLOBAL_MAX_FAILURES) return 0;
  const left = await db.query<{ m: number }>(
    `SELECT ceil(extract(epoch FROM (max(at) + $2::interval - now())) / 60)::int AS m FROM login_failures WHERE ($3 OR ip = $1) AND at > now() - $2::interval`,
    [ip, window, all[0].n >= GLOBAL_MAX_FAILURES]);
  return Math.max(1, left[0]?.m ?? LOCKOUT_MINUTES);
}

export async function recordLoginFailure(ip: string): Promise<void> {
  const db = await getDb();
  await db.query(`DELETE FROM login_failures WHERE at < now() - interval '1 day'`);
  await db.query(`INSERT INTO login_failures (ip) VALUES ($1)`, [ip]);
}

export async function clearLoginFailures(ip: string): Promise<void> {
  await (await getDb()).query(`DELETE FROM login_failures WHERE ip = $1`, [ip]);
}

/** Use at the top of every admin page AND every admin server action: a layout alone does not protect actions. */
export async function requireAdmin(): Promise<void> {
  if (!(await isAdmin())) redirect("/admin/login");
}
