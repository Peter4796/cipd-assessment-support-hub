import type { Metadata } from "next";
import { LevelPage } from "@/components/LevelPage";
import { getLevel } from "@/content/levels";

const level = getLevel("cipd-level-7-support")!;

export const metadata: Metadata = {
  title: "CIPD Level 7 Assessment Review (Advanced Diploma)",
  description:
    "CIPD Level 7 assessment review for senior and strategic HR professionals in the UK and UAE: critical analysis, strategic thinking, academic depth, referencing and resubmission support.",
  alternates: { canonical: "/cipd-level-7-support" },
};

export default function Page() {
  return <LevelPage level={level} />;
}
