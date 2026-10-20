import { isAdmin } from "@/lib/auth";
import { listEnquiries } from "@/lib/packages";
import type { EnquiryKind, EnquiryStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

/** Cells starting with = + - @ (or tab/CR) are prefixed with a quote so spreadsheets do not run them as formulas. */
function csvCell(value: string | number | null | undefined): string {
  let s = value == null ? "" : String(value);
  if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

const STATUSES = ["new", "contacted", "booked", "lost"];
const KINDS = ["enquiry", "callback"];

export async function GET(request: Request): Promise<Response> {
  if (!(await isAdmin())) return new Response("Unauthorized", { status: 401 });
  const sp = new URL(request.url).searchParams;
  const status = sp.get("status") ?? "";
  const kind = sp.get("kind") ?? "";
  const rows = await listEnquiries({
    status: STATUSES.includes(status) ? (status as EnquiryStatus) : undefined,
    kind: KINDS.includes(kind) ? (kind as EnquiryKind) : undefined,
  });
  const head = ["Received", "Kind", "Name", "Phone", "Email", "Package", "Travel date", "Adults", "Children", "Message", "Status"];
  const lines = [head.map(csvCell).join(",")];
  for (const e of rows) {
    lines.push([e.createdAt.slice(0, 10), e.kind, e.name, e.phone, e.email, e.packageTitle, e.travelDate, e.adults, e.children, e.message, e.status].map(csvCell).join(","));
  }
  return new Response("﻿" + lines.join("\r\n") + "\r\n", {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="enquiries.csv"',
      "Cache-Control": "no-store",
    },
  });
}
