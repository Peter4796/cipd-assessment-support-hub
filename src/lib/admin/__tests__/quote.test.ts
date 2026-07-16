import { describe, expect, it } from "vitest";
import { quoteUrgency, recommendQuoteForLead } from "@/lib/admin/quote";

// Fixed reference date: 16 July 2026 (local).
const today = new Date(2026, 6, 16);

describe("recommendQuoteForLead — owner's representative scenarios", () => {
  it("Level 3 assessment guidance (2,000 words, no deadline)", () => {
    const q = recommendQuoteForLead(
      { level: "3", supportType: "assessment_guidance", wordCount: 2000 },
      today
    );
    // (60 + 2×30) × 1.00 × 0.90 × 1.00 = 108 → $110
    expect(q).toMatchObject({ currency: "USD", mid: 110, low: 100, high: 125, urgency: "standard", minimumApplied: false });
  });

  it("Level 5 draft review (3,500 words, no deadline)", () => {
    const q = recommendQuoteForLead(
      { level: "5", supportType: "draft_review", wordCount: 3500 },
      today
    );
    // (60 + 3.5×30) × 0.70 = 115.5 → $115
    expect(q).toMatchObject({ mid: 115, low: 105, high: 130, minimumApplied: false });
  });

  it("Level 5 resubmission (3,000 words, 5-day deadline)", () => {
    const q = recommendQuoteForLead(
      { level: "5", supportType: "resubmission", wordCount: 3000, deadline: "2026-07-21" },
      today
    );
    // (60 + 3×30) × 0.85 × 1.00 × 1.10 = 140.25 → $140
    expect(q).toMatchObject({ mid: 140, low: 125, high: 160, urgency: "4_7d" });
  });

  it("Level 7 assessment guidance (4,000 words, no deadline)", () => {
    const q = recommendQuoteForLead(
      { level: "7", supportType: "assessment_guidance", wordCount: 4000 },
      today
    );
    // (60 + 4×30) × 1.00 × 1.25 = 225 → $225
    expect(q).toMatchObject({ mid: 225, low: 205, high: 260 });
  });

  it("tutor-feedback-only request (no word count, 2-day deadline) — minimum floor", () => {
    const q = recommendQuoteForLead(
      { level: "5", supportType: "feedback_interpretation", deadline: "2026-07-18" },
      today
    );
    // 60 × 0.45 × 1.00 × 1.25 = 33.75 < $35 minimum → floored
    expect(q).toMatchObject({ mid: 35, low: 35, high: 40, urgency: "1_3d", minimumApplied: true });
  });

  it("Harvard-referencing-only request (3,000 words, no deadline)", () => {
    const q = recommendQuoteForLead(
      { level: "5", supportType: "harvard_referencing", wordCount: 3000 },
      today
    );
    // (60 + 3×30) × 0.40 = 60 → $60 (above the $30 minimum)
    expect(q).toMatchObject({ mid: 60, low: 55, high: 70, minimumApplied: false });
  });
});

describe("recommendQuoteForLead — model behaviour", () => {
  it("applies the owner's level multipliers (0.90 / 1.00 / 1.25)", () => {
    const at = (level: "3" | "5" | "7") =>
      recommendQuoteForLead({ level, supportType: "assessment_guidance", wordCount: 4000 }, today).mid;
    expect(at("5")).toBe(180); // (60+120)×1.00
    expect(at("3")).toBe(160); // ×0.90 = 162 → 160
    expect(at("7")).toBe(225); // ×1.25
  });

  it("applies urgency multipliers, treating overdue as maximally urgent", () => {
    const withDeadline = (deadline?: string) =>
      recommendQuoteForLead(
        { level: "5", supportType: "assessment_guidance", wordCount: 4000, deadline },
        today
      );
    expect(withDeadline("2026-07-16").urgency).toBe("under_24h"); // due today
    expect(withDeadline("2026-07-10").urgency).toBe("under_24h"); // overdue
    expect(withDeadline("2026-07-19").urgency).toBe("1_3d");
    expect(withDeadline("2026-07-23").urgency).toBe("4_7d");
    expect(withDeadline("2026-07-24").urgency).toBe("standard");
    expect(withDeadline(undefined).urgency).toBe("standard");
    expect(withDeadline("2026-07-16").mid).toBe(250); // 180 × 1.40 = 252 → 250
  });

  it("every support type respects its minimum", () => {
    const minimums: Array<[string, number]> = [
      ["assessment_guidance", 60],
      ["draft_review", 50],
      ["resubmission", 60],
      ["feedback_interpretation", 35],
      ["harvard_referencing", 30],
    ];
    for (const [supportType, minimum] of minimums) {
      const q = recommendQuoteForLead(
        { level: "3", supportType: supportType as never, wordCount: 0 },
        today
      );
      expect(q.mid).toBeGreaterThanOrEqual(minimum);
    }
  });

  it("quoteUrgency handles missing deadlines", () => {
    expect(quoteUrgency(undefined, today)).toBe("standard");
  });
});
