import { NextResponse } from "next/server";
import { getAssessmentByToken } from "@/lib/db";
import { calculateAssessment } from "@/features/scoring/scoring";
import { generateRecommendations, Recommendation } from "@/features/recommendations/recommendations";
import { ReportLanguage } from "@/features/reports/report";

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

function buildJiraCsv(companyName: string, recommendations: Recommendation[], language: ReportLanguage) {
  const header = ["Summary", "Issue Type", "Priority", "Labels", "Description", "Acceptance Criteria", "Epic Link"];
  const rows = recommendations.map((item) => {
    const copy = recommendationCopy(item, language);
    return [
    copy.title,
    issueTypeMap[item.severity],
    priorityMap[item.priority],
    `assessment,${item.category.toLowerCase().replaceAll(" ", "-")},${item.phase.toLowerCase().replaceAll(" ", "-")}`,
      descriptionCopy(companyName, item, copy, language),
      acceptanceCriteriaCopy(language),
      `${companyName} Assessment Remediation`
    ];
  });

  return [header, ...rows].map((row) => row.map(csvCell).join(",")).join("\n");
}

export async function GET(request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const record = await getAssessmentByToken(token);
  if (!record) return NextResponse.json({ message: "Assessment not found" }, { status: 404 });

  const language = getLanguage(request);
  const score = record.score ?? calculateAssessment(record.answers);
  const recommendations = record.recommendations ?? generateRecommendations(record.answers, score.categoryScores);
  const fileName = `${record.organization.companyName.replaceAll(" ", "-").toLowerCase()}-jira-issues-${language}.csv`;

  return new NextResponse(buildJiraCsv(record.organization.companyName, recommendations, language), {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="${fileName}"`
    }
  });
}

function getLanguage(request: Request): ReportLanguage {
  const lang = new URL(request.url).searchParams.get("lang");
  return lang === "en" ? "en" : "tr";
}

type JiraRecommendationCopy = Pick<Recommendation, "title" | "description" | "recommendation" | "expectedImpact">;

const englishRecommendationCopy: Record<string, JiraRecommendationCopy> = {
  "DEVSECOPS-SAST-GATE-001": {
    title: "SAST findings must be connected to release decisions",
    description: "Security scan results do not sufficiently influence merge or release decisions.",
    recommendation: "Establish a blocking quality gate model with risk thresholds, exceptions, SLA and remediation tracking.",
    expectedImpact: "Prevent high-risk vulnerabilities from being promoted to production."
  },
  "DEVSECOPS-DAST-001": {
    title: "DAST capability should be introduced",
    description: "Dynamic security testing is not performed for web and API applications.",
    recommendation: "Integrate OWASP ZAP or an enterprise DAST tool into the pipeline after test environment deployment.",
    expectedImpact: "Detect runtime security issues before release."
  },
  "DEVSECOPS-SCA-001": {
    title: "SCA and dependency risk management should be established",
    description: "Open source dependencies are not visible for CVE and license risk.",
    recommendation: "Connect Snyk, Mend, Nexus IQ or Dependabot based SCA checks to the release gate.",
    expectedImpact: "Prevent critical CVE and license risks from being promoted to production."
  },
  "DEVSECOPS-SECRET-001": {
    title: "Secret scanning must be mandatory",
    description: "Secret leakage controls are missing in repository and PR workflows.",
    recommendation: "Run GitLeaks, GitGuardian or GitHub Secret Scanning on PR and scheduled scans; define the rotation process.",
    expectedImpact: "Reduce credential leakage and lateral movement risk."
  },
  "CD-APPROVAL-001": {
    title: "Production approval gate should be established",
    description: "There is no auditable approval mechanism for production deployment.",
    recommendation: "Make Jira, ITSM or pipeline approval gates mandatory with audit trail.",
    expectedImpact: "Prevent unauthorized and uncontrolled production changes."
  },
  "CD-ROLLBACK-001": {
    title: "Rollback strategy should be tested",
    description: "Rollback process is not clearly defined or evidenced.",
    recommendation: "Add rollback runbook, automation and regular exercises for each critical service.",
    expectedImpact: "Reduce recovery time during deployment failures."
  },
  "OBS-MON-001": {
    title: "Monitoring standard should be established",
    description: "Critical services lack metric and alarm visibility.",
    recommendation: "Standardize Prometheus/Grafana or the current APM platform and define dashboard and alert severity model.",
    expectedImpact: "Reduce incident detection and response time."
  },
  "OBS-LOG-001": {
    title: "Centralized log management should be established",
    description: "Logs are not centrally visible for correlation and audit.",
    recommendation: "Implement a common log standard and retention policy with OpenSearch, ELK, Splunk or Loki.",
    expectedImpact: "Accelerate RCA and audit processes."
  },
  "OBS-SLO-001": {
    title: "SLO and alerting model should be clarified",
    description: "Alert severity, ownership and SLO targets are not sufficiently defined for critical services.",
    recommendation: "Define SLI/SLO, escalation, alert ownership and error budget approach for critical services.",
    expectedImpact: "Reduce alert noise and clarify response priority."
  },
  "SCM-PR-001": {
    title: "Pull Request policy should be mandatory",
    description: "Review and policy enforcement are missing for code changes.",
    recommendation: "Require minimum reviewers, status checks and branch protection for all critical repositories.",
    expectedImpact: "Run quality and security controls before merge."
  },
  "TEST-API-001": {
    title: "API test automation should be strengthened",
    description: "API and integration tests are not used sufficiently in pipeline decisions.",
    recommendation: "Design API/contract test suites as pipeline gates for critical services.",
    expectedImpact: "Detect integration failures earlier in test environments."
  },
  "GOV-AUDIT-001": {
    title: "Audit evidence should be automated",
    description: "Build, test, approval and deployment evidence is not centralized and reproducible.",
    recommendation: "Create a standard evidence reporting flow from pipeline, SCM, ITSM and security tools.",
    expectedImpact: "Reduce audit preparation time and increase reliability."
  }
};

function recommendationCopy(item: Recommendation, language: ReportLanguage): JiraRecommendationCopy {
  if (language === "tr") return item;
  if (englishRecommendationCopy[item.id]) return englishRecommendationCopy[item.id];
  return {
    title: `${item.category} maturity should be improved`,
    description: `${item.category} is below the enterprise target maturity level.`,
    recommendation: "Define minimum standards, measurable ownership, evidence model and a 90-day improvement plan for this category.",
    expectedImpact: "Make category-level risks visible and manageable."
  };
}

function descriptionCopy(companyName: string, item: Recommendation, copy: JiraRecommendationCopy, language: ReportLanguage) {
  if (language === "en") {
    return [
      `Customer: ${companyName}`,
      `Category: ${item.category}`,
      `Severity: ${item.severity}`,
      `Phase: ${item.phase}`,
      `Finding: ${copy.description}`,
      `Recommendation: ${copy.recommendation}`,
      `Expected impact: ${copy.expectedImpact}`,
      `Effort: ${item.effort}`
    ].join("\n");
  }
  return [
    `Müşteri: ${companyName}`,
    `Kategori: ${item.category}`,
    `Kritiklik: ${item.severity}`,
    `Faz: ${item.phase}`,
    `Bulgu: ${copy.description}`,
    `Öneri: ${copy.recommendation}`,
    `Beklenen etki: ${copy.expectedImpact}`,
    `Efor: ${item.effort}`
  ].join("\n");
}

function acceptanceCriteriaCopy(language: ReportLanguage) {
  if (language === "en") return "Control owner assigned\nTarget phase confirmed\nRemediation evidence attached";
  return "Kontrol sahibi atandı\nHedef faz onaylandı\nİyileştirme kanıtı eklendi";
}
