import { NextResponse } from "next/server";
import { estimateQuote } from "@/lib/portal/quote";
import type { CipdLevel } from "@/lib/portal/types";

/**
 * Automated quote endpoint.
 *
 * POST /api/quote
 * body: { level: "3"|"5"|"7", wordCount: number, helpType: string, deadline: "YYYY-MM-DD" }
 * → returns an indicative estimate.
 *
 * This is a real, deployable serverless endpoint (no external deps). In production you
 * could also persist the enquiry here and trigger an email (Resend) / WhatsApp notification.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const level = String(body.level ?? "5") as CipdLevel;
    const wordCount = Number(body.wordCount ?? 0);
    const helpType = String(body.helpType ?? "Draft review & improvement");
    const today = new Date().toISOString().slice(0, 10);
    const deadline = typeof body.deadline === "string" && body.deadline ? body.deadline : today;

    if (!["3", "5", "7"].includes(level)) {
      return NextResponse.json({ error: "Invalid level" }, { status: 400 });
    }

    const estimate = estimateQuote({ level, wordCount, helpType, deadline, today });
    return NextResponse.json({ estimate });
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}
