import { describe, expect, it } from "vitest";
import {
  classify,
  deadlinePoints,
  scoreLead,
  wordCountPoints,
  classificationLabel,
} from "@/lib/leads/scoring";

// Fixed clock for deterministic deadline banding
const NOW = new Date("2026-07-13T12:00:00");

describe("deadlinePoints", () => {
  it("returns 0 with no deadline", () => {
    expect(deadlinePoints(undefined, NOW)).toBe(0);
  });
  it("returns 0 for malformed deadlines", () => {
    expect(deadlinePoints("not-a-date", NOW)).toBe(0);
  });
  it("treats today and overdue as <24h (+20)", () => {
    expect(deadlinePoints("2026-07-13", NOW)).toBe(20);
    expect(deadlinePoints("2026-07-10", NOW)).toBe(20);
  });
  it("bands 1–3 days as +15 (inclusive boundaries)", () => {
    expect(deadlinePoints("2026-07-14", NOW)).toBe(15); // 1 day
    expect(deadlinePoints("2026-07-16", NOW)).toBe(15); // 3 days
  });
  it("bands 4–7 days as +10 (inclusive boundaries)", () => {
    expect(deadlinePoints("2026-07-17", NOW)).toBe(10); // 4 days
    expect(deadlinePoints("2026-07-20", NOW)).toBe(10); // 7 days
  });
  it("bands >7 days as +5", () => {
    expect(deadlinePoints("2026-07-21", NOW)).toBe(5); // 8 days
    expect(deadlinePoints("2026-12-01", NOW)).toBe(5);
  });
});

describe("wordCountPoints", () => {
  it("handles absent and zero", () => {
    expect(wordCountPoints(undefined)).toBe(0);
    expect(wordCountPoints(0)).toBe(0);
  });
  it("bands at exact boundaries", () => {
    expect(wordCountPoints(1)).toBe(5);
    expect(wordCountPoints(1999)).toBe(5);
    expect(wordCountPoints(2000)).toBe(10);
    expect(wordCountPoints(3999)).toBe(10);
    expect(wordCountPoints(4000)).toBe(15);
    expect(wordCountPoints(5999)).toBe(15);
    expect(wordCountPoints(6000)).toBe(20);
    expect(wordCountPoints(12000)).toBe(20);
  });
});

describe("classify (boundary values)", () => {
  it("0–20 is LOW_INTENT", () => {
    expect(classify(0)).toBe("LOW_INTENT");
    expect(classify(20)).toBe("LOW_INTENT");
  });
  it("21–40 is WARM", () => {
    expect(classify(21)).toBe("WARM");
    expect(classify(40)).toBe("WARM");
  });
  it("41–60 is HIGH_INTENT", () => {
    expect(classify(41)).toBe("HIGH_INTENT");
    expect(classify(60)).toBe("HIGH_INTENT");
  });
  it("61+ is PRIORITY", () => {
    expect(classify(61)).toBe("PRIORITY");
    expect(classify(95)).toBe("PRIORITY");
  });
});

describe("scoreLead", () => {
  it("reproduces the spec example: L5 resubmission, 3 days, ~3k words, unit + WhatsApp = 70 PRIORITY", () => {
    const result = scoreLead(
      {
        level: "5", // +15
        supportType: "resubmission", // +20
        deadline: "2026-07-16", // 3 days → +15
        wordCount: 3000, // +10
        unitCode: "5HR01", // +5
        whatsapp: "+44 7700 900123", // +5
        message: "short", // < 40 chars → 0
      },
      NOW
    );
    expect(result.score).toBe(70);
    expect(result.classification).toBe("PRIORITY");
  });

  it("scores a minimal low-intent lead", () => {
    const result = scoreLead(
      { level: "3", supportType: "assessment_guidance" }, // 5 + 5
      NOW
    );
    expect(result.score).toBe(10);
    expect(result.classification).toBe("LOW_INTENT");
  });

  it("awards the detailed-message bonus at 40+ chars", () => {
    const base = { level: "3", supportType: "assessment_guidance" } as const;
    const short = scoreLead({ ...base, message: "help please" }, NOW);
    const detailed = scoreLead(
      { ...base, message: "I have received assessor feedback on AC 2.1 and 2.3 and need help interpreting it." },
      NOW
    );
    expect(detailed.score - short.score).toBe(5);
  });

  it("caps at the theoretical maximum (95)", () => {
    const result = scoreLead(
      {
        level: "7",
        supportType: "resubmission",
        deadline: "2026-07-13",
        wordCount: 8000,
        unitCode: "7CO04",
        whatsapp: "+971501234567",
        message: "A long, detailed message about the assessment context and the feedback received.",
      },
      NOW
    );
    expect(result.score).toBe(95);
    expect(result.classification).toBe("PRIORITY");
  });
});

describe("classificationLabel", () => {
  it("humanises the enum", () => {
    expect(classificationLabel("LOW_INTENT")).toBe("LOW INTENT");
    expect(classificationLabel("PRIORITY")).toBe("PRIORITY");
  });
});
