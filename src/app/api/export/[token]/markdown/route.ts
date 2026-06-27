import { NextResponse } from "next/server";
import { getAssessmentByToken } from "@/lib/db";
import { calculateAssessment } from "@/features/scoring/scoring";
import { generateRecommendations } from "@/features/recommendations/recommendations";
import { generateMarkdownReport } from "@/features/reports/report";

export async function GET(_: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const record = await getAssessmentByToken(token);
  if (!record) return NextResponse.json({ message: "Assessment not found" }, { status: 404 });
  const score = record.score ?? calculateAssessment(record.answers);
  const recommendations = record.recommendations ?? generateRecommendations(record.answers, score.categoryScores);
  return new NextResponse(generateMarkdownReport(record.organization, score, recommendations, record.answers), {
    headers: {
      "content-type": "text/markdown; charset=utf-8",
      "content-disposition": `attachment; filename="${record.organization.companyName.replaceAll(" ", "-").toLowerCase()}-assessment.md"`
    }
  });
}
