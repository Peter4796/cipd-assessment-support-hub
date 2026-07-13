import { describe, expect, it } from "vitest";
import {
  attachmentPoints,
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

describe("classify (P1 boundary values)", () => {
  it("0–25 is LOW_INTENT", () => {
    expect(classify(0)).toBe("LOW_INTENT");
    expect(classify(25)).toBe("LOW_INTENT");
  });
  it("26–55 is WARM", () => {
    expect(classify(26)).toBe("WARM");
    expect(classify(55)).toBe("WARM");
  });
  it("56–90 is HIGH_INTENT", () => {
    expect(classify(56)).toBe("HIGH_INTENT");
    expect(classify(90)).toBe("HIGH_INTENT");
  });
  it("91+ is PRIORITY", () => {
    expect(classify(91)).toBe("PRIORITY");
    expect(classify(147)).toBe("PRIORITY");
  });
});

describe("scoreLead", () => {
  it("scores the P0 spec example at 70 (now HIGH_INTENT under P1 thresholds)", () => {
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
    expect(result.classification).toBe("HIGH_INTENT");
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

  it("scores a complete P0-style lead (no attachments) at 95 = PRIORITY", () => {
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

describe("P1 scoring additions", () => {
  it("attachmentPoints: brief +15, draft +10, feedback +15 only for resubmissions", () => {
    expect(attachmentPoints(["ASSESSMENT_BRIEF"], false)).toEqual({ brief: 15, draft: 0, feedback: 0 });
    expect(attachmentPoints(["EXISTING_DRAFT"], false)).toEqual({ brief: 0, draft: 10, feedback: 0 });
    expect(attachmentPoints(["TUTOR_FEEDBACK"], true)).toEqual({ brief: 0, draft: 0, feedback: 15 });
    expect(attachmentPoints(["TUTOR_FEEDBACK"], false)).toEqual({ brief: 0, draft: 0, feedback: 0 });
    expect(attachmentPoints(undefined, true)).toEqual({ brief: 0, draft: 0, feedback: 0 });
  });

  it("provider +2 and referred criteria +5 (resubmission only) and review +5", () => {
    const base = { level: "3", supportType: "assessment_guidance" } as const;
    expect(scoreLead({ ...base, provider: "ICS Learn" }, NOW).score).toBe(12);
    expect(scoreLead({ ...base, referredCriteria: "AC 2.1" }, NOW).score).toBe(10); // not resub → no bonus
    expect(
      scoreLead({ ...base, submissionType: "resubmission", referredCriteria: "AC 2.1" }, NOW).score
    ).toBe(15);
    expect(scoreLead({ ...base, reachedReview: true }, NOW).score).toBe(15);
  });
});

describe("P1 persona distribution", () => {
  it("new Level 3 informational enquiry stays LOW_INTENT", () => {
    const r = scoreLead({ level: "3", supportType: "assessment_guidance" }, NOW);
    expect(r.score).toBe(10);
    expect(r.classification).toBe("LOW_INTENT");
  });

  it("partial Level 5 enquiry without files is WARM/HIGH border territory", () => {
    // L5(15) + guidance(5) + 30d deadline(5) + 2k words(10) = 35 → WARM
    const r = scoreLead(
      { level: "5", supportType: "assessment_guidance", deadline: "2026-08-12", wordCount: 2000 },
      NOW
    );
    expect(r.score).toBe(35);
    expect(r.classification).toBe("WARM");
  });

  it("complete Level 5 assessment enquiry with brief is HIGH_INTENT", () => {
    // 15+10+10(6d)+10+5+5+5 + brief 15 + review 5 = 80
    const r = scoreLead(
      {
        level: "5",
        supportType: "draft_review",
        deadline: "2026-07-19",
        wordCount: 3500,
        unitCode: "5CO01",
        whatsapp: "+44 7700 900123",
        message: "Here is a detailed description of exactly what I need help with.",
        attachmentCategories: ["ASSESSMENT_BRIEF"],
        reachedReview: true,
      },
      NOW
    );
    expect(r.score).toBe(80);
    expect(r.classification).toBe("HIGH_INTENT");
  });

  it("complete Level 5 resubmission with tutor feedback is PRIORITY", () => {
    // 15+20+15(3d)+10+5+5+5 + brief15 + feedback15 + criteria5 + review5 = 115
    const r = scoreLead(
      {
        level: "5",
        supportType: "resubmission",
        submissionType: "resubmission",
        deadline: "2026-07-16",
        wordCount: 3000,
        unitCode: "5HR01",
        whatsapp: "+971501234567",
        message: "Referred on two criteria, feedback attached, deadline is tight.",
        referredCriteria: "AC 2.1 and AC 3.2",
        attachmentCategories: ["ASSESSMENT_BRIEF", "TUTOR_FEEDBACK"],
        reachedReview: true,
      },
      NOW
    );
    expect(r.score).toBe(115);
    expect(r.classification).toBe("PRIORITY");
  });

  it("urgent complete Level 7 enquiry is PRIORITY", () => {
    // 20+5+20(today)+15+5+5+5 + brief15 + review5 = 95
    const r = scoreLead(
      {
        level: "7",
        supportType: "assessment_guidance",
        deadline: "2026-07-13",
        wordCount: 4500,
        unitCode: "7CO01",
        whatsapp: "+44 7700 900123",
        message: "Urgent support needed with critical analysis for this unit.",
        attachmentCategories: ["ASSESSMENT_BRIEF"],
        reachedReview: true,
      },
      NOW
    );
    expect(r.score).toBe(95);
    expect(r.classification).toBe("PRIORITY");
  });

  it("incomplete enquiry (missing brief) scores below its with-brief equivalent", () => {
    const base = {
      level: "5",
      supportType: "draft_review",
      deadline: "2026-07-19",
      wordCount: 3500,
      unitCode: "5CO01",
      reachedReview: true,
    } as const;
    const withBrief = scoreLead({ ...base, attachmentCategories: ["ASSESSMENT_BRIEF"] }, NOW);
    const without = scoreLead(base, NOW);
    expect(withBrief.score - without.score).toBe(15);
  });

  it("theoretical maximum is 147", () => {
    const r = scoreLead(
      {
        level: "7",
        supportType: "resubmission",
        submissionType: "resubmission",
        deadline: "2026-07-13",
        wordCount: 8000,
        unitCode: "7CO04",
        whatsapp: "+971501234567",
        message: "A long, detailed message about the assessment context and the feedback received.",
        provider: "Avado",
        referredCriteria: "AC 1.1, 2.2, 3.1",
        attachmentCategories: ["ASSESSMENT_BRIEF", "EXISTING_DRAFT", "TUTOR_FEEDBACK"],
        reachedReview: true,
      },
      NOW
    );
    expect(r.score).toBe(147);
    expect(r.classification).toBe("PRIORITY");
  });
});

describe("classificationLabel", () => {
  it("humanises the enum", () => {
    expect(classificationLabel("LOW_INTENT")).toBe("LOW INTENT");
    expect(classificationLabel("PRIORITY")).toBe("PRIORITY");
  });
});
