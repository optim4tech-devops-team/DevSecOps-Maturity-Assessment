import { NextResponse } from "next/server";
import { calculateAssessment } from "@/features/scoring/scoring";
import { generateRecommendations } from "@/features/recommendations/recommendations";
import { getAssessmentByToken, startReportGeneration, updateAssessmentByToken } from "@/lib/db";

export async function POST(_: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const existing = await getAssessmentByToken(token);
  if (!existing) return NextResponse.json({ message: "Assessment not found" }, { status: 404 });
  const score = calculateAssessment(existing.answers);
  const recommendations = generateRecommendations(existing.answers, score.categoryScores);
  await updateAssessmentByToken(token, { score, recommendations, status: "Completed" });
  const delayMinutes = Number(process.env.REPORT_READY_DELAY_MINUTES ?? 15);
  const record = await startReportGeneration(token, Number.isFinite(delayMinutes) ? delayMinutes : 15);
  return NextResponse.json(record);
}
