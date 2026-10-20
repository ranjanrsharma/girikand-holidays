import { BRAND } from "./config";
import type { NewEnquiry } from "./packages";

export interface OutgoingEmail { from: string; to: string; subject: string; text: string; replyTo?: string }

/** Plain-text email for staff when an enquiry or call-back request arrives. */
export function buildEnquiryEmail(e: NewEnquiry & { packageTitle?: string | null }, to: string, from: string): OutgoingEmail {
  const clean = (v: string) => v.replace(/[\r\n]+/g, " ").trim(); // keep user text out of headers
  const kind = e.kind === "callback" ? "Call-back request" : "Enquiry";
  const lines = [
    `${kind} from the website`,
    "",
    `Name: ${e.name}`,
    `Phone: ${e.phone}`,
    e.email ? `Email: ${e.email}` : null,
    e.packageTitle ? `Package: ${e.packageTitle}` : null,
    e.travelDate ? `Travel date: ${e.travelDate}` : null,
    e.adults != null ? `Adults: ${e.adults}` : null,
    e.children != null ? `Children: ${e.children}` : null,
    e.message ? `\nMessage:\n${e.message}` : null,
  ].filter((l): l is string => l !== null);
  return {
    from,
    to,
    subject: clean(`${kind}: ${e.name}${e.packageTitle ? ` - ${e.packageTitle}` : ""}`).slice(0, 150),
    text: lines.join("\n"),
    replyTo: e.email || undefined,
  };
}

/** Sends through Resend. Does nothing (and says so in the server log) when RESEND_API_KEY is not set. Never throws: a failed email must not lose the enquiry, which is already saved. */
export async function sendEmail(mail: OutgoingEmail): Promise<boolean> {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.warn("RESEND_API_KEY is not set; enquiry email skipped.");
    return false;
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: mail.from, to: [mail.to], subject: mail.subject, text: mail.text, reply_to: mail.replyTo }),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) console.error("Resend rejected the email:", res.status, (await res.text()).slice(0, 300));
    return res.ok;
  } catch (err) {
    console.error("Could not reach Resend:", err instanceof Error ? err.message : err);
    return false;
  }
}

export const emailFrom = () => process.env.EMAIL_FROM ?? `${BRAND.name} <onboarding@resend.dev>`;
