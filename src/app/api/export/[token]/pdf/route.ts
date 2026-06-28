import { NextResponse } from "next/server";
import { getAssessmentByToken } from "@/lib/db";
import { calculateAssessment } from "@/features/scoring/scoring";
import { generateRecommendations } from "@/features/recommendations/recommendations";
import { generateExecutivePdfReport } from "@/features/reports/pdf";
import { ReportLanguage } from "@/features/reports/report";

export async function GET(request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const language = getLanguage(request);
  const record = await getAssessmentByToken(token);
  if (!record) return NextResponse.json({ message: "Assessment not found" }, { status: 404 });
  if (record.reportStatus !== "Ready") {
    return NextResponse.json({
      message: "Executive report is not ready yet",
      reportStatus: record.reportStatus ?? "NotStarted",
      reportReadyAt: record.reportReadyAt
    }, { status: 409 });
  }

  const score = record.score ?? calculateAssessment(record.answers);
  const recommendations = record.recommendations ?? generateRecommendations(record.answers, score.categoryScores);
  const fileName = `${record.organization.companyName.replaceAll(" ", "-").toLowerCase()}-executive-report-${language}.pdf`;

  return new NextResponse(generateExecutivePdfReport(record.organization, score, recommendations, record.answers, language), {
    headers: {
      "content-type": "application/pdf",
      "content-disposition": `attachment; filename="${fileName}"`
    }
  });
}

function getLanguage(request: Request): ReportLanguage {
  const value = new URL(request.url).searchParams.get("lang");
  return value === "en" ? "en" : "tr";
}
