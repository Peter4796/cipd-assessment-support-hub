"use client";

/**
 * International WhatsApp/phone field — shared by the assessment funnel and
 * the contact-page enquiry form.
 *
 * Built on react-phone-number-input + libphonenumber-js (Google's numbering
 * metadata): every recognised country, as-you-type national formatting,
 * trunk-prefix handling (Kenyan "0712 345678" → +254712345678), paste of
 * full international numbers, and E.164 output. No custom phone-format
 * logic lives here — only the searchable country selector UI, which the
 * library delegates via `countrySelectComponent`.
 *
 * The emitted value is always E.164 (e.g. "+254712345678") or "" — exactly
 * what the lead API stores and what wa.me links need.
 *
 * Accessibility: the country selector follows the WAI-ARIA combobox
 * pattern — trigger button with aria-expanded, search box with
 * role="combobox" + aria-activedescendant, options with role="option",
 * full arrow/Enter/Escape keyboard support, focus returned to the trigger.
 */

import {
  forwardRef,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type InputHTMLAttributes,
} from "react";
import PhoneInput, { type Country } from "react-phone-number-input";
import {
  countryOptions,
  detectDefaultCountry,
  filterCountries,
  flagEmoji,
} from "@/lib/phone";

/** Mirrors the shared form-field styling used across the site's forms. */
const fieldCls =
  "w-full rounded-xl border border-mist-300 bg-white px-3.5 py-3 text-base text-navy-900 placeholder:text-navy-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20";

const TelInput = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function TelInput(props, ref) {
    return <input {...props} ref={ref} type="tel" className={fieldCls} />;
  }
);

type CountrySelectProps = {
  value?: Country;
  onChange: (value?: Country) => void;
  disabled?: boolean;
  readOnly?: boolean;
};

function CountryCombobox({ value, onChange, disabled, readOnly }: CountrySelectProps) {
  const listboxId = useId();
  const options = useMemo(countryOptions, []);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [highlight, setHighlight] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const selected = options.find((o) => o.country === value);
  const filtered = useMemo(() => filterCountries(options, query), [options, query]);

  const openList = () => {
    if (disabled || readOnly) return;
    setQuery("");
    const idx = options.findIndex((o) => o.country === value);
    setHighlight(idx >= 0 ? idx : 0);
    setOpen(true);
  };

  const close = (refocus = true) => {
    setOpen(false);
    if (refocus) buttonRef.current?.focus();
  };

  const select = (country: Country) => {
    onChange(country);
    close();
  };

  // Focus the search box when the list opens; keep highlight in view.
  useEffect(() => {
    if (open) searchRef.current?.focus();
  }, [open]);
  useEffect(() => {
    if (!open) return;
    listRef.current
      ?.querySelector(`[data-index="${highlight}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, [open, highlight]);

  // Close on outside interaction.
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) close(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  const onSearchKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlight((h) => Math.min(h + 1, filtered.length - 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlight((h) => Math.max(h - 1, 0));
        break;
      case "Home":
        e.preventDefault();
        setHighlight(0);
        break;
      case "End":
        e.preventDefault();
        setHighlight(filtered.length - 1);
        break;
      case "Enter": {
        e.preventDefault();
        const option = filtered[highlight];
        if (option) select(option.country);
        break;
      }
      case "Escape":
        e.preventDefault();
        close();
        break;
      case "Tab":
        close(false);
        break;
    }
  };

  return (
    <div ref={rootRef} className="relative flex-none">
      <button
        ref={buttonRef}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={
          selected
            ? `Phone country: ${selected.name} (+${selected.callingCode})`
            : "Choose phone country"
        }
        onClick={() => (open ? close() : openList())}
        className={`${fieldCls} flex w-auto items-center gap-1.5 whitespace-nowrap`}
      >
        <span aria-hidden="true">{selected ? flagEmoji(selected.country) : "🌐"}</span>
        <span>{selected ? `+${selected.callingCode}` : "—"}</span>
        <svg aria-hidden="true" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 text-navy-400">
          <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.17l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
        </svg>
      </button>

      {open && (
        <div className="absolute left-0 z-30 mt-1.5 w-[19rem] max-w-[calc(100vw-3rem)] rounded-xl border border-mist-200 bg-white p-2 shadow-lg">
          <input
            ref={searchRef}
            role="combobox"
            aria-expanded="true"
            aria-controls={listboxId}
            aria-activedescendant={
              filtered[highlight] ? `${listboxId}-${filtered[highlight].country}` : undefined
            }
            aria-autocomplete="list"
            aria-label="Search countries by name, code or dial code"
            className={`${fieldCls} px-3 py-2 text-sm`}
            placeholder="Search: Kenya, KE or +254"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setHighlight(0);
            }}
            onKeyDown={onSearchKeyDown}
          />
          <ul
            ref={listRef}
            id={listboxId}
            role="listbox"
            aria-label="Countries"
            className="mt-1.5 max-h-64 overflow-y-auto overscroll-contain"
          >
            {filtered.length === 0 && (
              <li className="px-3 py-2.5 text-sm text-navy-500">No matching country.</li>
            )}
            {filtered.map((o, i) => (
              <li
                key={o.country}
                id={`${listboxId}-${o.country}`}
                data-index={i}
                role="option"
                aria-selected={o.country === value}
                onPointerDown={(e) => {
                  e.preventDefault(); // select before the outside-close handler
                  select(o.country);
                }}
                onMouseMove={() => setHighlight(i)}
                className={`flex min-h-[44px] cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm ${
                  i === highlight ? "bg-mist-100 text-navy-900" : "text-navy-800"
                } ${o.country === value ? "font-semibold" : ""}`}
              >
                <span aria-hidden="true" className="text-base">{flagEmoji(o.country)}</span>
                <span className="flex-1 truncate">{o.name}</span>
                <span className="text-navy-500">+{o.callingCode}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

type PhoneNumberFieldProps = {
  id: string;
  /** E.164 value ("+254712345678") or "". */
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
};

export function PhoneNumberField({
  id,
  value,
  onChange,
  disabled,
  placeholder = "Your WhatsApp number",
}: PhoneNumberFieldProps) {
  // Locale detection runs client-side only; rendering the library input
  // after mount keeps server and client markup identical (no hydration
  // mismatch when the detected country differs from the fallback).
  const [defaultCountry, setDefaultCountry] = useState<Country | null>(null);
  useEffect(() => {
    const languages =
      navigator.languages && navigator.languages.length > 0
        ? navigator.languages
        : [navigator.language];
    setDefaultCountry(detectDefaultCountry(languages));
  }, []);

  if (!defaultCountry) {
    return (
      <input
        id={id}
        type="tel"
        className={fieldCls}
        placeholder={placeholder}
        autoComplete="tel"
        disabled
      />
    );
  }

  return (
    <PhoneInput
      id={id}
      // No `international` lock: national digits format against the selected
      // country, while a pasted/typed "+254…" switches into international
      // mode and re-detects the country automatically. Users never need to
      // type "+" — the country selector supplies the dial code — but a full
      // international number must never produce a wrong-country value.
      initialValueFormat="national"
      // Deterministic caret: smartCaret's DOM caret restoration is documented
      // by the library as glitchy with some mobile IMEs (and broke under
      // synthetic input during testing). With it off, formatting still
      // happens as you type; the caret simply follows the native editing
      // pipeline — stable on every browser and keyboard.
      smartCaret={false}
      defaultCountry={defaultCountry}
      value={value || undefined}
      onChange={(v) => onChange(v ?? "")}
      disabled={disabled}
      placeholder={placeholder}
      autoComplete="tel"
      className="flex gap-2"
      inputComponent={TelInput}
      countrySelectComponent={CountryCombobox}
    />
  );
}
