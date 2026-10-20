"use server";

import { z } from "zod";
import { createEnquiry } from "@/lib/packages";
import { todayISO } from "@/lib/dates";

export type EnquiryField = "name" | "phone" | "email" | "travelDate" | "adults" | "children" | "message";

export interface EnquiryState {
  ok: boolean;
  message?: string;
  errors?: Partial<Record<EnquiryField, string>>;
  /** Submitted values, echoed back so the form can keep what the visitor typed. */
  values?: Record<string, string>;
}

function normalisePhone(raw: string): string {
  let v = raw.replace(/[\s()-]/g, "");
  if (v.startsWith("+91")) v = v.slice(3);
  else if (v.startsWith("0091")) v = v.slice(4);
  else if (v.length === 12 && v.startsWith("91")) v = v.slice(2);
  else if (v.length === 11 && v.startsWith("0")) v = v.slice(1);
  return v;
}

const name = z.string().trim().min(2, "Please enter your name (at least 2 characters)").max(80, "Name can be at most 80 characters");
const phone = z
  .string()
  .transform(normalisePhone)
  .refine((v) => /^[6-9]\d{9}$/.test(v), "Enter a valid 10-digit Indian mobile number");
const packageId = z.string().regex(/^\d{1,9}$/).optional();

const callbackSchema = z.object({ name, phone, packageId });

const enquirySchema = callbackSchema.extend({
  email: z
    .string()
    .trim()
    .max(120, "Email is too long")
    .refine((v) => v === "" || z.email().safeParse(v).success, "Enter a valid email address"),
  travelDate: z
    .string()
    .trim()
    .refine((v) => v === "" || (/^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(v + "T00:00:00Z"))), "Enter a valid date")
    .refine((v) => v === "" || v >= todayISO(), "Travel date cannot be in the past"),
  adults: z.coerce.number("Enter number of adults").int("Enter a whole number").min(1, "At least 1 adult").max(20, "At most 20 adults"),
  children: z.coerce.number("Enter number of children").int("Enter a whole number").min(0, "Cannot be negative").max(20, "At most 20 children"),
  message: z.string().trim().max(1000, "Message can be at most 1000 characters"),
});

const GENERIC_ERROR = "Sorry, we could not send your message. Please try again or call us.";

function text(fd: FormData, key: string): string {
  const v = fd.get(key);
  return typeof v === "string" ? v : "";
}

async function handle(kind: "enquiry" | "callback", fd: FormData): Promise<EnquiryState> {
  const values: Record<string, string> = {};
  for (const k of ["name", "phone", "email", "travelDate", "adults", "children", "message"]) values[k] = text(fd, k);

  try {
    // Honeypot: real visitors never see or fill this field.
    if (text(fd, "website") !== "") return { ok: false, message: GENERIC_ERROR, values };

    const raw = {
      name: text(fd, "name"),
      phone: text(fd, "phone"),
      packageId: text(fd, "packageId") || undefined,
      email: text(fd, "email"),
      travelDate: text(fd, "travelDate"),
      adults: text(fd, "adults") || "0",
      children: text(fd, "children") || "0",
      message: text(fd, "message"),
    };
    const parsed = kind === "callback" ? callbackSchema.safeParse(raw) : enquirySchema.safeParse(raw);
    if (!parsed.success) {
      const errors: EnquiryState["errors"] = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as EnquiryField | "packageId";
        if (key !== "packageId" && !errors[key]) errors[key] = issue.message;
      }
      return { ok: false, message: "Please fix the highlighted fields.", errors, values };
    }

    const d = parsed.data as z.infer<typeof enquirySchema>;
    await createEnquiry({
      kind,
      packageId: d.packageId ? Number(d.packageId) : null,
      name: d.name,
      phone: `+91${d.phone}`,
      email: kind === "enquiry" ? d.email || null : null,
      travelDate: kind === "enquiry" ? d.travelDate || null : null,
      adults: kind === "enquiry" ? d.adults : null,
      children: kind === "enquiry" ? d.children : null,
      message: kind === "enquiry" ? d.message || null : null,
    });

    // TODO(resend): email the enquiry to BRAND.enquiryEmail once Resend is wired up.

    return { ok: true, message: kind === "callback" ? "Thanks, we will call you back soon." : "Thanks, we have your message and will get back to you soon." };
  } catch {
    return { ok: false, message: GENERIC_ERROR, values };
  }
}

export async function submitEnquiry(_prev: EnquiryState, formData: FormData): Promise<EnquiryState> {
  return handle("enquiry", formData);
}

export async function submitCallback(_prev: EnquiryState, formData: FormData): Promise<EnquiryState> {
  return handle("callback", formData);
}
