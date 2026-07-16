/**
 * Phone input helpers — pure functions shared by the international phone
 * field (client) and its tests. All numbering intelligence (formatting,
 * validation, trunk-prefix handling, E.164) comes from libphonenumber-js via
 * react-phone-number-input; nothing here re-implements phone rules. These
 * helpers only cover presentation (emoji flags), locale-based country
 * detection and country-list search.
 */

import {
  getCountries,
  getCountryCallingCode,
  isSupportedCountry,
  type Country,
} from "react-phone-number-input";
import en from "react-phone-number-input/locale/en";

export type CountryOption = {
  country: Country;
  name: string;
  callingCode: string; // without "+"
};

/** ISO 3166-1 alpha-2 → emoji flag via regional indicator symbols. */
export function flagEmoji(country: string): string {
  return country
    .toUpperCase()
    .replace(/./g, (ch) => String.fromCodePoint(0x1f1a5 + ch.charCodeAt(0)));
}

/**
 * The complete supported-country dataset: every country in libphonenumber's
 * metadata (~245), with English names and calling codes, sorted by name.
 */
export function countryOptions(): CountryOption[] {
  return getCountries()
    .map((country) => ({
      country,
      name: en[country] ?? country,
      callingCode: getCountryCallingCode(country),
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Pick a default country from browser locale/language region subtags
 * (e.g. "en-KE" → KE, "ar-AE" → AE). First language carrying a region
 * supported by the phone metadata wins; otherwise fall back to GB (+44).
 */
export function detectDefaultCountry(
  languages: readonly string[],
  fallback: Country = "GB"
): Country {
  for (const lang of languages) {
    const region = lang?.match(/[-_]([A-Za-z]{2})(?:$|[-_])/)?.[1]?.toUpperCase();
    if (region && isSupportedCountry(region)) return region as Country;
  }
  return fallback;
}

/**
 * Filter the country list by user query: country name (substring),
 * ISO code (prefix, e.g. "KE"), or dial code with or without "+"
 * (prefix, e.g. "+254", "254").
 */
export function filterCountries(options: CountryOption[], query: string): CountryOption[] {
  const q = query.trim().toLowerCase();
  if (!q) return options;
  const dialQuery = q.replace(/^\+/, "");
  const isDial = /^\d+$/.test(dialQuery) && dialQuery.length > 0;
  return options.filter((o) => {
    if (o.name.toLowerCase().includes(q)) return true;
    if (o.country.toLowerCase().startsWith(q)) return true;
    if (isDial && o.callingCode.startsWith(dialQuery)) return true;
    return false;
  });
}
