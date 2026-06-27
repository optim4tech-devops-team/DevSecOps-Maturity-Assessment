import { NextResponse } from "next/server";
import { calculateAssessment } from "@/features/scoring/scoring";
import { generateRecommendations } from "@/features/recommendations/recommendations";
import { getAssessmentByToken, updateAssessmentByToken } from "@/lib/db";

export async function POST(_: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const existing = await getAssessmentByToken(token);
  if (!existing) return NextResponse.json({ message: "Assessment not found" }, { status: 404 });
  const score = calculateAssessment(existing.answers);
  const recommendations = generateRecommendations(existing.answers, score.categoryScores);
  const record = await updateAssessmentByToken(token, { score, recommendations, status: "Completed" });
  return NextResponse.json(record);
}
