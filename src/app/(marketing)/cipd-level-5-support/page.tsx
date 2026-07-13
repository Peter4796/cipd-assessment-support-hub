import type { Metadata } from "next";
import { LevelPage } from "@/components/LevelPage";
import { getLevel } from "@/content/levels";

const level = getLevel("cipd-level-5-support")!;

export const metadata: Metadata = {
  title: "CIPD Level 5 Assignment Guidance (Associate Diploma)",
  description:
    "CIPD Level 5 assignment guidance for HR officers, advisors and people managers in the UK and UAE: evidence-based practice, applied analysis, referencing and resubmission support.",
  alternates: { canonical: "/cipd-level-5-support" },
};

export default function Page() {
  return <LevelPage level={level} />;
}
