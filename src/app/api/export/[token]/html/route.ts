import { NextResponse } from "next/server";
import { getAssessmentByToken } from "@/lib/db";
import { calculateAssessment } from "@/features/scoring/scoring";
import { generateRecommendations } from "@/features/recommendations/recommendations";
import { generateHtmlReport, ReportLanguage } from "@/features/reports/report";

export async function GET(request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const language = getLanguage(request);
  const record = await getAssessmentByToken(token);
  if (!record) return NextResponse.json({ message: "Assessment not found" }, { status: 404 });

  const score = record.score ?? calculateAssessment(record.answers);
  const recommendations = record.recommendations ?? generateRecommendations(record.answers, score.categoryScores);

  return new NextResponse(generateHtmlReport(record.organization, score, recommendations, record.answers, language), {
    headers: {
      "content-type": "text/html; charset=utf-8"
    }
  });
}

function getLanguage(request: Request): ReportLanguage {
  const value = new URL(request.url).searchParams.get("lang");
  return value === "en" ? "en" : "tr";
}
