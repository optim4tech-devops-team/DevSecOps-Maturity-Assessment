import { NextResponse } from "next/server";
import { getAssessmentByToken } from "@/lib/db";
import { calculateAssessment } from "@/features/scoring/scoring";
import { generateRecommendations, Recommendation } from "@/features/recommendations/recommendations";

const priorityMap: Record<Recommendation["priority"], string> = {
  P1: "Highest",
  P2: "High",
  P3: "Medium"
};

const issueTypeMap: Record<Recommendation["severity"], string> = {
  Critical: "Task",
  High: "Task",
  Medium: "Story",
  Low: "Story"
};

function csvCell(value: string | number | undefined) {
  const text = String(value ?? "");
  return `"${text.replaceAll("\"", "\"\"")}"`;
}

function buildJiraCsv(companyName: string, recommendations: Recommendation[]) {
  const header = ["Summary", "Issue Type", "Priority", "Labels", "Description", "Acceptance Criteria", "Epic Link"];
  const rows = recommendations.map((item) => [
    item.title,
    issueTypeMap[item.severity],
    priorityMap[item.priority],
    `assessment,${item.category.toLowerCase().replaceAll(" ", "-")},${item.phase.toLowerCase().replaceAll(" ", "-")}`,
    [
      `Customer: ${companyName}`,
      `Category: ${item.category}`,
      `Severity: ${item.severity}`,
      `Phase: ${item.phase}`,
      `Finding: ${item.description}`,
      `Recommendation: ${item.recommendation}`,
      `Expected impact: ${item.expectedImpact}`,
      `Effort: ${item.effort}`
    ].join("\n"),
    `Control owner assigned\nTarget phase confirmed\nRemediation evidence attached`,
    `${companyName} Assessment Remediation`
  ]);

  return [header, ...rows].map((row) => row.map(csvCell).join(",")).join("\n");
}

export async function GET(_: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const record = await getAssessmentByToken(token);
  if (!record) return NextResponse.json({ message: "Assessment not found" }, { status: 404 });

  const score = record.score ?? calculateAssessment(record.answers);
  const recommendations = record.recommendations ?? generateRecommendations(record.answers, score.categoryScores);
  const fileName = `${record.organization.companyName.replaceAll(" ", "-").toLowerCase()}-jira-issues.csv`;

  return new NextResponse(buildJiraCsv(record.organization.companyName, recommendations), {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="${fileName}"`
    }
  });
}
