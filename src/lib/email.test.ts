import { describe, expect, it } from "vitest";
import { buildEnquiryEmail } from "./email";

describe("enquiry email", () => {
  const base = { kind: "enquiry" as const, name: "Asha\r\nBcc: evil@example.com", phone: "+919876543210", email: "a@example.com", adults: 2, children: 0, message: "Two rooms please" };
  it("keeps line breaks from user text out of the subject", () => {
    const mail = buildEnquiryEmail({ ...base, packageTitle: "Goa Beach Resort Getaway" }, "staff@example.com", "Girikand <hi@example.com>");
    expect(mail.subject).not.toMatch(/[\r\n]/);
    expect(mail.subject).toContain("Goa Beach Resort Getaway");
  });
  it("lists the details and sets reply-to for a visitor email", () => {
    const mail = buildEnquiryEmail(base, "staff@example.com", "Girikand <hi@example.com>");
    expect(mail.text).toContain("Phone: +919876543210");
    expect(mail.text).toContain("Two rooms please");
    expect(mail.replyTo).toBe("a@example.com");
    expect(mail.to).toBe("staff@example.com");
  });
  it("labels call-back requests", () => {
    expect(buildEnquiryEmail({ kind: "callback", name: "Ravi", phone: "+919000000000" }, "s@example.com", "f@example.com").subject).toMatch(/^Call-back request/);
  });
});
