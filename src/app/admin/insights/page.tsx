/**
 * Acquisition insights (AI Discovery P0) — commercial attribution from
 * first-party CONVERSION records only: subscribers and enquiries grouped by
 * derived channel + source (src/lib/leads/acquisition.ts). Deliberately NOT
 * traffic analytics: the database holds no visit/session counts, Vercel
 * Analytics cannot be joined to first-party attribution, and this page
 * never pretends otherwise. Percentages render only at n >= 5 so tiny
 * samples are not dressed up as statistics. Raw attribution stays raw:
 * classification happens at render time.
 */

import Link from "next/link";
import { isDbConfigured } from "@/lib/db/client";
import { listLeadAcquisition } from "@/lib/db/leads";
import { listSubscriberAcquisition } from "@/lib/db/subscribers";
import { classifyAcquisition, type AcquisitionChannel } from "@/lib/leads/acquisition";

export const dynamic = "force-dynamic";

const MIN_N_FOR_RATES = 5;

type Row = {
  channel: AcquisitionChannel;
  source: string;
  subscribers: number;
  leads: number;
  highIntent: number;
  quotes: number;
  quotedByCurrency: Map<string, number>;
  paidClients: number;
  paidByCurrency: Map<string, number>;
};

const CHANNEL_ORDER: AcquisitionChannel[] = [
  "AI Assistant",
  "Organic Search",
  "Paid Search",
  "Social",
  "Referral",
  "Other",
  "Direct / Unknown",
];

function money(byCurrency: Map<string, number>): string {
  if (byCurrency.size === 0) return "—";
  return Array.from(byCurrency.entries()).map(([c, v]) => `${c} ${v.toLocaleString()}`).join(" + ");
}

function rate(numerator: number, denominator: number): string {
  if (denominator < MIN_N_FOR_RATES) return "—";
  return `${Math.round((numerator / denominator) * 100)}%`;
}

export default async function AcquisitionInsightsPage() {
  if (!isDbConfigured()) {
    return (
      <div className="rounded-3xl border border-mist-200 bg-white p-10 text-center">
        <h1 className="text-lg font-bold text-navy-900">Database not configured</h1>
      </div>
    );
  }

  const [leadRows, subRows] = await Promise.all([
    listLeadAcquisition(),
    listSubscriberAcquisition(),
  ]);

  const rows = new Map<string, Row>();
  const rowFor = (c: { channel: AcquisitionChannel; source?: string }): Row => {
    const key = `${c.channel}|${c.source ?? ""}`;
    let row = rows.get(key);
    if (!row) {
      row = {
        channel: c.channel,
        source: c.source ?? "",
        subscribers: 0,
        leads: 0,
        highIntent: 0,
        quotes: 0,
        quotedByCurrency: new Map(),
        paidClients: 0,
        paidByCurrency: new Map(),
      };
      rows.set(key, row);
    }
    return row;
  };

  for (const s of subRows) {
    rowFor(classifyAcquisition(s)).subscribers += 1;
  }
  for (const l of leadRows) {
    const row = rowFor(classifyAcquisition(l));
    row.leads += 1;
    if (l.classification === "HIGH_INTENT" || l.classification === "PRIORITY") row.highIntent += 1;
    if (l.quotedAmount != null) {
      row.quotes += 1;
      const cur = l.quoteCurrency ?? "USD";
      row.quotedByCurrency.set(cur, (row.quotedByCurrency.get(cur) ?? 0) + l.quotedAmount);
    }
    const isClient = l.paidAmount != null || l.paymentConfirmedAt != null;
    if (isClient) {
      row.paidClients += 1;
      if (l.paidAmount != null) {
        const cur = l.paidCurrency ?? "USD";
        row.paidByCurrency.set(cur, (row.paidByCurrency.get(cur) ?? 0) + l.paidAmount);
      }
    }
  }

  const sorted = Array.from(rows.values()).sort(
    (a, b) =>
      CHANNEL_ORDER.indexOf(a.channel) - CHANNEL_ORDER.indexOf(b.channel) ||
      b.leads - a.leads ||
      b.subscribers - a.subscribers
  );
  const totals = {
    subscribers: subRows.length,
    leads: leadRows.length,
  };

  const th = "px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wider text-navy-400";
  const td = "px-3 py-2.5 text-sm text-navy-800";

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-navy-900">Acquisition insights</h1>
          <p className="mt-1 text-sm text-navy-600">
            Conversion records only ({totals.subscribers} subscriber{totals.subscribers === 1 ? "" : "s"},{" "}
            {totals.leads} lead{totals.leads === 1 ? "" : "s"}), grouped by derived channel from
            first-party attribution. Not site traffic: visit counts live in Vercel Analytics and
            cannot be reliably joined, so they are not shown. Rates appear only at n ≥ {MIN_N_FOR_RATES}.
          </p>
        </div>
        <Link
          href="/admin"
          className="rounded-xl border border-mist-300 bg-white px-4 py-2 text-sm font-semibold text-navy-700 hover:border-gold-400 hover:text-gold-600"
        >
          All leads →
        </Link>
      </div>

      <div className="mt-6 overflow-x-auto rounded-2xl border border-mist-200 bg-white shadow-soft">
        <table className="w-full min-w-[860px] border-collapse">
          <thead className="border-b border-mist-200 bg-mist-50">
            <tr>
              <th className={th}>Channel</th>
              <th className={th}>Source</th>
              <th className={th}>Subscribers</th>
              <th className={th}>Leads</th>
              <th className={th}>High intent</th>
              <th className={th}>Quotes</th>
              <th className={th}>Quoted value</th>
              <th className={th}>Clients</th>
              <th className={th}>Paid revenue</th>
              <th className={th}>Lead→quote</th>
              <th className={th}>Lead→client</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-mist-100">
            {sorted.map((r) => (
              <tr key={`${r.channel}|${r.source}`} className={r.channel === "AI Assistant" ? "bg-teal-50/40" : undefined}>
                <td className={`${td} font-semibold`}>{r.channel}</td>
                <td className={td}>{r.source || "—"}</td>
                <td className={td}>{r.subscribers || "—"}</td>
                <td className={td}>{r.leads || "—"}</td>
                <td className={td}>{r.highIntent || "—"}</td>
                <td className={td}>{r.quotes || "—"}</td>
                <td className={td}>{money(r.quotedByCurrency)}</td>
                <td className={td}>{r.paidClients || "—"}</td>
                <td className={td}>{money(r.paidByCurrency)}</td>
                <td className={td}>{rate(r.quotes, r.leads)}</td>
                <td className={td}>{rate(r.paidClients, r.leads)}</td>
              </tr>
            ))}
            {sorted.length === 0 && (
              <tr>
                <td className={`${td} text-navy-500`} colSpan={11}>
                  No conversion records yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <p className="mt-4 text-xs text-navy-400">
        Channel and source are derived at render time; the raw utm_source, utm_medium, referrer and
        landing-page values on each record are never modified. AI Assistant rows are classified only
        on evidence-backed signals (ChatGPT, Copilot, Perplexity); assistants with no reliable
        signal appear under Organic, Referral or Direct rather than being guessed.
      </p>
    </div>
  );
}
