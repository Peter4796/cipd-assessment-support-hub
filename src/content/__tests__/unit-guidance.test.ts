import { describe, expect, it } from "vitest";
import { getUnitGuidance, unitGuidance } from "@/content/unit-guidance";
import { units } from "@/content/units";

describe("unit guidance corpus", () => {
  it("covers every unit in units.ts", () => {
    for (const unit of units) {
      expect(unitGuidance[unit.code], unit.code).toBeDefined();
    }
    // And nothing orphaned pointing at units that do not exist.
    const codes = new Set(units.map((u) => u.code));
    for (const code of Object.keys(unitGuidance)) {
      expect(codes.has(code), code).toBe(true);
    }
  });

  it("every unit has substantive guidance", () => {
    for (const [code, g] of Object.entries(unitGuidance)) {
      expect(g.demonstrate.length, code).toBeGreaterThanOrEqual(3);
      expect(g.criteriaTips.length, code).toBeGreaterThanOrEqual(2);
      expect(g.faqs.length, code).toBeGreaterThanOrEqual(3);
      for (const faq of g.faqs) {
        expect(faq.question.length, code).toBeGreaterThan(10);
        expect(faq.answer.length, code).toBeGreaterThan(60);
      }
    }
  });

  it("copy rules: no em-dashes, no verbatim CIPD criteria references", () => {
    const text = JSON.stringify(unitGuidance);
    expect(text).not.toContain("—");
    // Original guidance never cites official criterion identifiers as if
    // quoting the brief (e.g. "AC 1.2"): that text belongs to CIPD.
    expect(text).not.toMatch(/\bAC ?\d+\.\d+\b/);
    expect(text).not.toMatch(/\bLO ?\d+\b/);
  });

  it("resolves level command verbs per unit", () => {
    expect(getUnitGuidance("5CO01")!.verbs.map((v) => v.verb)).toContain("Analyse");
    expect(getUnitGuidance("7co03")!.verbs.map((v) => v.verb)).toContain("Critically evaluate");
    expect(getUnitGuidance("3CO01")!.verbs.map((v) => v.verb)).toContain("Explain");
    expect(getUnitGuidance("9XX99")).toBeUndefined();
  });
});
