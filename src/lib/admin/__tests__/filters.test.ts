import { describe, expect, it } from "vitest";
import {
  daysUntilDeadline,
  isoDate,
  parseLeadFilters,
  urgencyDeadlineRange,
} from "@/lib/admin/filters";

describe("parseLeadFilters", () => {
  it("accepts valid values", () => {
    expect(
      parseLeadFilters({
        status: "QUOTE_SENT",
        classification: "PRIORITY",
        level: "7",
        urgency: "3d",
        q: "amina",
        sort: "deadline",
      })
    ).toEqual({
      status: "QUOTE_SENT",
      classification: "PRIORITY",
      level: "7",
      urgency: "3d",
      q: "amina",
      sort: "deadline",
    });
  });

  it("drops unknown or malformed values and defaults sort to newest", () => {
    expect(
      parseLeadFilters({
        status: "HACKED",
        classification: "banana",
        level: "9",
        urgency: "yesterday",
        sort: "chaos",
      })
    ).toEqual({ sort: "newest", q: undefined, status: undefined, classification: undefined, level: undefined, urgency: undefined });
  });

  it("takes the first value of repeated params", () => {
    expect(parseLeadFilters({ status: ["NEW", "LOST"] }).status).toBe("NEW");
  });

  it("caps and sanitises the search text (LIKE wildcards stripped)", () => {
    expect(parseLeadFilters({ q: "  %ami_na\\  " }).q).toBe("amina");
    expect(parseLeadFilters({ q: "x".repeat(200) }).q).toHaveLength(80);
    expect(parseLeadFilters({ q: "%%%" }).q).toBeUndefined();
  });
});

describe("urgencyDeadlineRange", () => {
  const today = new Date(2026, 6, 16); // 16 July 2026, local

  it("overdue: strictly before today", () => {
    expect(urgencyDeadlineRange("overdue", today)).toEqual({ before: "2026-07-16" });
  });

  it("3d: today through today+3", () => {
    expect(urgencyDeadlineRange("3d", today)).toEqual({
      from: "2026-07-16",
      to: "2026-07-19",
    });
  });

  it("7d: today through today+7 (includes the 3d set)", () => {
    expect(urgencyDeadlineRange("7d", today)).toEqual({
      from: "2026-07-16",
      to: "2026-07-23",
    });
  });

  it("later: strictly after today+7", () => {
    expect(urgencyDeadlineRange("later", today)).toEqual({ after: "2026-07-23" });
  });

  it("crosses month boundaries correctly", () => {
    expect(urgencyDeadlineRange("7d", new Date(2026, 6, 28)).to).toBe("2026-08-04");
  });
});

describe("date helpers", () => {
  it("isoDate formats local dates as YYYY-MM-DD", () => {
    expect(isoDate(new Date(2026, 0, 5))).toBe("2026-01-05");
  });

  it("daysUntilDeadline counts calendar days, negative when overdue", () => {
    const today = new Date(2026, 6, 16, 15, 30); // time of day must not matter
    expect(daysUntilDeadline("2026-07-16", today)).toBe(0);
    expect(daysUntilDeadline("2026-07-19", today)).toBe(3);
    expect(daysUntilDeadline("2026-07-14", today)).toBe(-2);
  });
});
