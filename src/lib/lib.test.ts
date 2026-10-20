import { describe, expect, it } from "vitest";
import { computeSlabs, DEFAULT_SLABS } from "./cancellation";
import { addDays, formatDate } from "./dates";
import { emiPerMonth, formatINR } from "./money";

describe("money", () => {
  it("groups digits the Indian way", () => {
    expect(formatINR(125000)).toBe("₹1,25,000");
    expect(formatINR(16000)).toBe("₹16,000");
  });
  it("matches the reference EMI figures to within ₹2", () => {
    const ref: [number, number][] = [[16000, 1558], [17000, 1655], [22000, 2142], [22637, 2204]];
    for (const [price, emi] of ref) expect(Math.abs(emiPerMonth(price) - emi)).toBeLessThanOrEqual(2);
  });
});

describe("dates", () => {
  it("adds days without timezone drift", () => {
    expect(addDays("2026-11-01", -121)).toBe("2026-07-03");
    expect(formatDate("2026-11-01")).toBe("01 Nov 2026");
  });
});

describe("cancellation slabs", () => {
  const slabs = computeSlabs(DEFAULT_SLABS, "2026-11-01", 16000);
  const find = (percent: number) => slabs.find((s) => s.percent === percent)!;
  it("reproduces the reference table for a 1 Nov 2026 departure at ₹16,000", () => {
    expect(find(40)).toMatchObject({ amount: 6400, startDate: "2026-09-17", endDate: "2026-10-01" });
    expect(find(75)).toMatchObject({ amount: 12000, startDate: "2026-10-17", endDate: "2026-10-26" });
    expect(find(100)).toMatchObject({ amount: 16000, startDate: "2026-10-27", endDate: "2026-11-01" });
    expect(find(10)).toMatchObject({ amount: 1600, endDate: "2026-07-03" });
  });
  it("lists the earliest slab first and covers every day with no gap", () => {
    expect(slabs[0].percent).toBe(10);
    for (let i = 1; i < slabs.length; i++) expect(addDays(slabs[i - 1].endDate, 1)).toBe(slabs[i].startDate);
  });
});
