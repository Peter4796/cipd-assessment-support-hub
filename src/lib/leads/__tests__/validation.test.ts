import { describe, expect, it } from "vitest";
import {
  normaliseEmail,
  normaliseLevel,
  normaliseUnitCode,
  normaliseWhatsapp,
  normaliseWordCount,
  validateLeadInput,
  validateSubscriberInput,
} from "@/lib/leads/validation";

const OLD_ENOUGH = Date.now() - 60_000; // passes the time gate

const validLead = {
  name: "Amira Hassan",
  email: "Amira.H@Example.com",
  level: "5",
  supportType: "resubmission",
  unitCode: "5hr01",
  wordCount: "3,500 words",
  deadline: "2026-07-20",
  whatsapp: "+971 50 123 4567",
  message: "Referred on AC 2.1, need help interpreting the feedback.",
  startedAt: OLD_ENOUGH,
  context: { sourcePage: "/cipd-units/5hr01", sourcePageType: "unit" },
};

describe("validateLeadInput", () => {
  it("accepts and normalises a valid lead", () => {
    const r = validateLeadInput(validLead);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.value.email).toBe("amira.h@example.com"); // lowercased
    expect(r.value.unitCode).toBe("5HR01"); // uppercased
    expect(r.value.wordCount).toBe(3500); // parsed from "3,500 words"
    expect(r.value.level).toBe("5");
    expect(r.value.acquisition.sourcePageType).toBe("unit");
  });

  it("rejects non-object payloads", () => {
    expect(validateLeadInput(null)).toMatchObject({ ok: false, error: "invalid_payload" });
    expect(validateLeadInput("hi")).toMatchObject({ ok: false, error: "invalid_payload" });
  });

  it("rejects missing/invalid required fields with specific codes", () => {
    expect(validateLeadInput({ ...validLead, name: "" })).toMatchObject({ ok: false, error: "invalid_name" });
    expect(validateLeadInput({ ...validLead, email: "not-an-email" })).toMatchObject({ ok: false, error: "invalid_email" });
    expect(validateLeadInput({ ...validLead, level: "9" })).toMatchObject({ ok: false, error: "invalid_level" });
    expect(validateLeadInput({ ...validLead, supportType: "essay_writing" })).toMatchObject({ ok: false, error: "invalid_support_type" });
  });

  it("trips the honeypot", () => {
    expect(validateLeadInput({ ...validLead, website: "http://spam.example" })).toMatchObject({ ok: false, error: "rejected" });
  });

  it("trips the time gate for instant submits", () => {
    expect(validateLeadInput({ ...validLead, startedAt: Date.now() })).toMatchObject({ ok: false, error: "too_fast" });
  });

  it("sanitises hostile context rather than rejecting it", () => {
    const r = validateLeadInput({
      ...validLead,
      context: {
        sourcePage: "javascript:alert(1)",
        sourcePageType: "admin<script>",
        utmSource: "<img src=x>",
      },
    });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.value.acquisition.sourcePage).toBe("/"); // non-path collapsed
    expect(r.value.acquisition.sourcePageType).toBe("other"); // unknown type collapsed
  });

  it("drops an invalid optional whatsapp instead of failing", () => {
    const r = validateLeadInput({ ...validLead, whatsapp: "abc" });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.value.whatsapp).toBeUndefined();
  });

  it("caps oversized messages", () => {
    const r = validateLeadInput({ ...validLead, message: "x".repeat(20_000) });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.value.message!.length).toBeLessThanOrEqual(5000);
  });
});

describe("validateSubscriberInput", () => {
  it("accepts a valid subscriber", () => {
    const r = validateSubscriberInput({
      email: "reader@example.com",
      resource: "cipd-assessment-planning-checklist",
      startedAt: OLD_ENOUGH,
    });
    expect(r.ok).toBe(true);
  });
  it("requires a valid email and resource", () => {
    expect(
      validateSubscriberInput({ email: "nope", resource: "x", startedAt: OLD_ENOUGH })
    ).toMatchObject({ ok: false, error: "invalid_email" });
    expect(
      validateSubscriberInput({ email: "a@b.co", resource: "", startedAt: OLD_ENOUGH })
    ).toMatchObject({ ok: false, error: "invalid_resource" });
  });
  it("trips the honeypot", () => {
    expect(
      validateSubscriberInput({ email: "a@b.co", resource: "r", website: "spam", startedAt: OLD_ENOUGH })
    ).toMatchObject({ ok: false, error: "rejected" });
  });
});

describe("primitives", () => {
  it("normaliseEmail", () => {
    expect(normaliseEmail(" User@Site.COM ")).toBe("user@site.com");
    expect(normaliseEmail("bad@@x")).toBeNull();
  });
  it("normaliseLevel", () => {
    expect(normaliseLevel("Level 7")).toBe("7");
    expect(normaliseLevel("4")).toBeNull();
  });
  it("normaliseUnitCode tolerates unknown-but-plausible codes", () => {
    expect(normaliseUnitCode("5os01")).toBe("5OS01");
    expect(normaliseUnitCode("")).toBeUndefined();
  });
  it("normaliseWhatsapp canonicalises valid international numbers to E.164", () => {
    expect(normaliseWhatsapp("+44 7912 345678")).toBe("+447912345678"); // UK
    expect(normaliseWhatsapp("+971 50 123 4567")).toBe("+971501234567"); // UAE
    expect(normaliseWhatsapp("+254 712 345678")).toBe("+254712345678"); // Kenya
    expect(normaliseWhatsapp("+1 (415) 555-2671")).toBe("+14155552671"); // US
    expect(normaliseWhatsapp("+234 803 123 4567")).toBe("+2348031234567"); // Nigeria
    expect(normaliseWhatsapp("+49 151 23456789")).toBe("+4915123456789"); // Germany
  });
  it("normaliseWhatsapp rejects garbage", () => {
    expect(normaliseWhatsapp("123")).toBeUndefined();
    expect(normaliseWhatsapp("++++")).toBeUndefined();
    expect(normaliseWhatsapp("abc")).toBeUndefined();
    expect(normaliseWhatsapp("+999999")).toBeUndefined();
    expect(normaliseWhatsapp("")).toBeUndefined();
  });
  it("normaliseWhatsapp keeps plausible legacy input it cannot parse (capture-first)", () => {
    // Old cached clients could submit national digits with no country signal;
    // an unparsed-but-plausible number is kept rather than silently dropped.
    expect(normaliseWhatsapp("0712345678")).toBe("0712345678");
  });
  it("normaliseWordCount parses text and caps", () => {
    expect(normaliseWordCount("about 3,500 words")).toBe(3500);
    expect(normaliseWordCount(9e9)).toBe(100000);
    expect(normaliseWordCount("none")).toBeUndefined();
  });
});
