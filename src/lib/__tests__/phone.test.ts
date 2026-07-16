import { describe, expect, it } from "vitest";
import {
  countryOptions,
  detectDefaultCountry,
  filterCountries,
  flagEmoji,
} from "@/lib/phone";
import { isValidPhoneNumber } from "react-phone-number-input";
import { parsePhoneNumberFromString } from "libphonenumber-js";

const options = countryOptions();
const byCountry = (iso: string) => options.find((o) => o.country === iso);

describe("country dataset", () => {
  it("ships the complete international dataset, not a hardcoded shortlist", () => {
    expect(options.length).toBeGreaterThan(200);
  });

  it("includes the key client countries with correct dial codes", () => {
    expect(byCountry("GB")).toMatchObject({ name: "United Kingdom", callingCode: "44" });
    expect(byCountry("AE")).toMatchObject({ name: "United Arab Emirates", callingCode: "971" });
    expect(byCountry("KE")).toMatchObject({ name: "Kenya", callingCode: "254" });
    expect(byCountry("NG")).toMatchObject({ name: "Nigeria", callingCode: "234" });
    expect(byCountry("US")).toMatchObject({ name: "United States", callingCode: "1" });
    expect(byCountry("DE")).toMatchObject({ name: "Germany", callingCode: "49" });
    expect(byCountry("CA")).toMatchObject({ callingCode: "1" });
    expect(byCountry("AU")).toMatchObject({ callingCode: "61" });
  });

  it("is sorted by country name", () => {
    const names = options.map((o) => o.name);
    expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b)));
  });
});

describe("flagEmoji", () => {
  it("renders regional-indicator flags", () => {
    expect(flagEmoji("KE")).toBe("🇰🇪");
    expect(flagEmoji("GB")).toBe("🇬🇧");
    expect(flagEmoji("ae")).toBe("🇦🇪");
  });
});

describe("detectDefaultCountry (browser locale defaults)", () => {
  it("uses the region subtag of the first language that has one", () => {
    expect(detectDefaultCountry(["en-KE"])).toBe("KE");
    expect(detectDefaultCountry(["en-GB", "en"])).toBe("GB");
    expect(detectDefaultCountry(["ar-AE"])).toBe("AE");
    expect(detectDefaultCountry(["de", "en-US"])).toBe("US");
    expect(detectDefaultCountry(["en-NG"])).toBe("NG");
  });

  it("handles casing and underscore variants", () => {
    expect(detectDefaultCountry(["en-gb"])).toBe("GB");
    expect(detectDefaultCountry(["sw_KE"])).toBe("KE");
  });

  it("falls back to GB (+44) without a reliable signal", () => {
    expect(detectDefaultCountry([])).toBe("GB");
    expect(detectDefaultCountry(["en"])).toBe("GB");
    expect(detectDefaultCountry(["en-XZ"])).toBe("GB"); // unknown region
  });
});

describe("filterCountries (searchable selector)", () => {
  it("matches by country name", () => {
    expect(filterCountries(options, "kenya").map((o) => o.country)).toEqual(["KE"]);
    expect(filterCountries(options, "united arab").map((o) => o.country)).toEqual(["AE"]);
    const kingdom = filterCountries(options, "kingdom").map((o) => o.country);
    expect(kingdom).toContain("GB");
  });

  it("matches by ISO code", () => {
    expect(filterCountries(options, "KE").map((o) => o.country)).toContain("KE");
    expect(filterCountries(options, "ng").map((o) => o.country)).toContain("NG");
    expect(filterCountries(options, "gb").map((o) => o.country)).toContain("GB");
  });

  it("matches by dial code with or without +", () => {
    expect(filterCountries(options, "+254").map((o) => o.country)).toEqual(["KE"]);
    expect(filterCountries(options, "254").map((o) => o.country)).toEqual(["KE"]);
    expect(filterCountries(options, "+234").map((o) => o.country)).toEqual(["NG"]);
    expect(filterCountries(options, "+44").map((o) => o.country)).toContain("GB");
    expect(filterCountries(options, "+1").map((o) => o.country)).toContain("US");
  });

  it("returns everything for an empty query and nothing for garbage", () => {
    expect(filterCountries(options, "")).toHaveLength(options.length);
    expect(filterCountries(options, "zzzzzz")).toHaveLength(0);
  });
});

describe("national input → E.164 (library behaviour pinned per country)", () => {
  const cases: Array<[string, string, string]> = [
    ["KE", "0712345678", "+254712345678"], // trunk zero stripped — the Kenyan bug
    ["KE", "712345678", "+254712345678"],
    ["GB", "07912345678", "+447912345678"],
    ["AE", "0501234567", "+971501234567"],
    ["US", "4155552671", "+14155552671"],
    ["NG", "08031234567", "+2348031234567"],
    ["DE", "015123456789", "+4915123456789"],
  ];
  it.each(cases)("%s national %s → %s", (country, national, e164) => {
    const parsed = parsePhoneNumberFromString(national, country as never);
    expect(parsed?.number).toBe(e164);
    expect(parsed?.isValid()).toBe(true);
  });

  it("full international input parses regardless of selected country (country switching)", () => {
    // A user with GB selected pasting a Kenyan number must not get +44 garbage.
    const parsed = parsePhoneNumberFromString("+254712345678", "GB");
    expect(parsed?.country).toBe("KE");
    expect(parsed?.number).toBe("+254712345678");
  });
});

describe("validation (libphonenumber rules)", () => {
  it("accepts the owner's valid examples", () => {
    for (const number of ["+447912345678", "+971501234567", "+254712345678", "+14155552671"]) {
      expect(isValidPhoneNumber(number)).toBe(true);
    }
  });

  it("rejects the owner's invalid examples", () => {
    for (const number of ["123", "++++", "abc123", "+999999"]) {
      expect(isValidPhoneNumber(number)).toBe(false);
    }
  });
});
