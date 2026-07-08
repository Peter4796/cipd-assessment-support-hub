"use client";

import { useState } from "react";

export function Accordion({ items }: { items: { question: string; answer: string }[] }) {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div className="mx-auto max-w-3xl divide-y divide-mist-200 overflow-hidden rounded-3xl border border-mist-200 bg-white">
      {items.map((item, i) => {
        const isOpen = open === i;
        return (
          <div key={item.question}>
            <button
              type="button"
              onClick={() => setOpen(isOpen ? null : i)}
              className="flex w-full items-center justify-between gap-4 px-5 py-5 text-left transition-colors hover:bg-mist-50 sm:px-6"
              aria-expanded={isOpen}
            >
              <span className="text-base font-semibold text-navy-900">{item.question}</span>
              <span
                className={`flex h-7 w-7 flex-none items-center justify-center rounded-full border transition-all ${
                  isOpen
                    ? "border-gold-400 bg-gold-500 text-navy-900"
                    : "border-mist-300 text-navy-500"
                }`}
              >
                <svg viewBox="0 0 24 24" className={`h-4 w-4 transition-transform ${isOpen ? "rotate-45" : ""}`} fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round">
                  <path d="M12 5v14M5 12h14" />
                </svg>
              </span>
            </button>
            <div
              className={`grid transition-all duration-200 ease-out ${
                isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
              }`}
            >
              <div className="overflow-hidden">
                <p className="px-5 pb-5 text-[15px] leading-relaxed text-navy-600 sm:px-6">
                  {item.answer}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
