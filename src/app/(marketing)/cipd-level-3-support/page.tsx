import type { Metadata } from "next";
import { LevelPage } from "@/components/LevelPage";
import { getLevel } from "@/content/levels";

const level = getLevel("cipd-level-3-support")!;

export const metadata: Metadata = {
  title: "CIPD Level 3 Assessment Support (Foundation)",
  description:
    "Supportive CIPD Level 3 assessment support for HR assistants and new people-practice learners in the UK, the Gulf and worldwide: brief analysis, structure, referencing and resubmission help.",
  alternates: { canonical: "/cipd-level-3-support" },
};

export default function Page() {
  return <LevelPage level={level} />;
}
