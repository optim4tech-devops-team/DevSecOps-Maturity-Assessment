import { Answers, OrganizationProfile } from "@/data/assessment";
import { AssessmentScore, CategoryScore } from "@/features/scoring/scoring";
import { buildRoadmap, Recommendation } from "@/features/recommendations/recommendations";
import { buildBddkCompliance } from "@/features/compliance/bddk";
import { buildReportInsightBullets, ReportLanguage } from "@/features/reports/report";

type PdfPage = {
  width: number;
  height: number;
  ops: string[];
};

type PdfDoc = {
  pages: PdfPage[];
  page: PdfPage;
};

type RGB = readonly [number, number, number];

const pageWidth = 1190;
const pageHeight = 842;
const navy: RGB = [6, 24, 52];
const deepBlue: RGB = [17, 55, 104];
const blue: RGB = [37, 99, 179];
const cyan: RGB = [35, 160, 185];
const green: RGB = [63, 166, 75];
const amber: RGB = [238, 157, 34];
const red: RGB = [226, 67, 56];
const purple: RGB = [102, 67, 181];
const slate: RGB = [77, 91, 111];
const line: RGB = [207, 217, 228];
const softLine: RGB = [230, 235, 241];
const wash: RGB = [246, 248, 251];
const panel: RGB = [252, 253, 255];
const ink: RGB = [20, 32, 48];
const reportBrand = "Optim4Tech Advisory";
const reportClassification = "Confidential";
const reportVersion = "Assessment Pack v1.0";

export function generateExecutivePdfReport(profile: OrganizationProfile, score: AssessmentScore, recommendations: Recommendation[], answers: Answers, language: ReportLanguage = "tr") {
  const doc = createDoc();
  const sortedCategories = [...score.categoryScores].sort((a, b) => b.score - a.score);
  const lowCategories = [...score.categoryScores].sort((a, b) => a.score - b.score).slice(0, 5);
  const roadmap = buildRoadmap(recommendations);
  const compliance = buildBddkCompliance(profile, answers);
  const evidenceCount = Object.values(answers).filter((value) => {
    if (Array.isArray(value)) return value.length > 0;
    return value !== undefined && value !== null && String(value).trim() !== "" && String(value) !== "0";
  }).length;

  drawCoverPage(doc, profile, score, recommendations, lowCategories, evidenceCount, language);
  addPage(doc);
  drawMaturityPage(doc, profile, score, sortedCategories, lowCategories, language);
  addPage(doc);
  drawRecommendationsPage(doc, profile, score, recommendations, language);
  addPage(doc);
  drawRoadmapPage(doc, profile, score, recommendations, roadmap, language);
  if (compliance.active) {
    addPage(doc);
    drawCompliancePage(doc, profile, compliance, language);
  }

  return Buffer.from(renderPdf(doc));
}

function drawCoverPage(doc: PdfDoc, profile: OrganizationProfile, score: AssessmentScore, recommendations: Recommendation[], lowCategories: CategoryScore[], evidenceCount: number, language: ReportLanguage) {
  const copy = pdfCopy(language);
  drawShell(doc, copy.coverTitle, copy.coverSubtitle, 1, language);
  fill(doc, 0, 640, pageWidth, 202, ...navy);
  fill(doc, 0, 640, pageWidth, 202, 4, 18, 40);
  fill(doc, 0, 640, 322, 202, 8, 38, 78);
  fill(doc, 0, 640, pageWidth, 7, ...cyan);
  fill(doc, 56, 802, 118, 18, ...cyan);
  text(doc, reportClassification.toUpperCase(), 68, 808, 7.5, "bold", 255, 255, 255);
  text(doc, reportBrand, 192, 807, 8.5, "bold", 190, 220, 235);
  text(doc, profile.companyName, 56, 776, 30, "bold", 255, 255, 255);
  text(doc, copy.coverSubtitle, 56, 738, 20, "bold", 177, 232, 240);
  wrapText(doc, buildExecutiveVerdict(profile, score, recommendations, language), 56, 704, 610, 13, 18, "regular", 232, 240, 248, 2);
  drawCoverMetadata(doc, profile, 56, 644);

  drawScoreDial(doc, 908, 724, 76, score.overallScore, scoreLabel(score.overallScore));
  drawMaturityLegend(doc, 1010, 776);

  drawKpiCard(doc, 56, 514, 238, 92, copy.overallScore, `%${score.overallScore}`, scoreLabel(score.overallScore), scoreColor(score.overallScore));
  drawKpiCard(doc, 316, 514, 238, 92, copy.maturityLevel, levelShort(score.maturityLevel), copy.assessmentClassification, blue);
  drawKpiCard(doc, 576, 514, 238, 92, copy.openRecommendations, String(recommendations.length), copy.prioritizedActions, severityColor(recommendations[0]?.severity));
  drawKpiCard(doc, 836, 514, 238, 92, copy.answeredEvidence, String(evidenceCount), copy.collectedInputs, purple);

  drawPanel(doc, 56, 298, 508, 178, copy.executivePriorities);
  recommendations.slice(0, 3).forEach((item, index) => {
    const y = 418 - index * 46;
    drawPill(doc, 88, y + 3, 42, 18, item.priority, priorityColor(item.priority));
    text(doc, item.title, 148, y + 7, 12, "bold", ...ink);
    wrapText(doc, item.expectedImpact || item.description, 148, y - 10, 360, 9.5, 12, "regular", ...slate, 2);
  });

  drawPanel(doc, 608, 298, 526, 178, copy.riskConcentration);
  lowCategories.forEach((item, index) => {
    const y = 418 - index * 28;
    text(doc, compactName(item.category.name), 640, y + 2, 10.2, "bold", ...ink);
    drawProgressBar(doc, 850, y, 202, 10, item.score, scoreColor(item.score));
    text(doc, `%${item.score}`, 1066, y - 1, 9.8, "bold", ...ink);
  });

  drawPanel(doc, 56, 108, 1078, 150, copy.assessmentScope);
  drawProfileGrid(doc, profile, 88, 204);
  drawFooterNote(doc, copy.localGenerationNote);
}

function drawMaturityPage(doc: PdfDoc, profile: OrganizationProfile, score: AssessmentScore, categories: CategoryScore[], lowCategories: CategoryScore[], language: ReportLanguage) {
  const copy = pdfCopy(language);
  drawShell(doc, copy.maturityScorecard, `${profile.companyName} - ${copy.domainView}`, 2, language);

  drawPanel(doc, 56, 560, 326, 176, "Score interpretation");
  drawScoreDial(doc, 216, 648, 58, score.overallScore, scoreLabel(score.overallScore));
  const maturityNarrative = language === "tr"
    ? `Platform ${score.maturityLevel} seviyesindedir. Odak, düşük skorlu alanlarda ölçülebilir kanıt ve otomasyonun güçlendirilmesidir.`
    : `The platform is assessed at ${score.maturityLevel}. Focus should remain on measurable evidence and automation in lower scoring domains.`;
  wrapText(doc, maturityNarrative, 84, 596, 248, 10.2, 13.5, "regular", ...slate, 4);

  drawPanel(doc, 414, 560, 720, 176, "Top maturity domains");
  categories.slice(0, 5).forEach((item, index) => {
    const x = 440 + index * 136;
    drawVerticalScore(doc, x, 594, 76, item.score, compactName(item.category.name));
  });

  drawPanel(doc, 56, 278, 508, 236, "Domain score distribution");
  categories.slice(0, 10).forEach((item, index) => {
    const y = 456 - index * 18.5;
    text(doc, compactName(item.category.name), 84, y + 2, 9.3, "bold", ...ink);
    drawProgressBar(doc, 284, y, 206, 9, item.score, scoreColor(item.score));
    text(doc, `%${item.score}`, 506, y - 1, 9.2, "bold", ...ink);
  });

  drawPanel(doc, 608, 278, 526, 236, "Improvement focus");
  lowCategories.slice(0, 5).forEach((item, index) => {
    const y = 450 - index * 38;
    drawRiskBand(doc, 632, y - 2, item.score);
    text(doc, compactName(item.category.name), 710, y + 5, 10.8, "bold", ...ink);
    wrapText(doc, item.category.description || "Target operating model and evidence maturity should be improved.", 710, y - 10, 338, 8.2, 9.6, "regular", ...slate, 1);
  });

  drawPanel(doc, 56, 106, 1078, 126, "Operating model signal");
  drawGovernanceBand(doc, 84, 168, score);
  drawSignalCard(doc, 84, 112, "Release control", findScore(categories, "release"), "Approval, rollback and evidence controls");
  drawSignalCard(doc, 344, 112, "CI quality", findScore(categories, "ci"), "Build, test and quality gate automation");
  drawSignalCard(doc, 604, 112, "Security posture", findScore(categories, "devsecops"), "SAST, SCA, DAST, secret and runtime controls");
  drawSignalCard(doc, 864, 112, "Observability", findScore(categories, "observability"), "Monitoring, logging, SLO and incident visibility");
}

function drawRecommendationsPage(doc: PdfDoc, profile: OrganizationProfile, score: AssessmentScore, recommendations: Recommendation[], language: ReportLanguage) {
  const copy = pdfCopy(language);
  drawShell(doc, copy.recommendations, `${profile.companyName} - ${copy.prioritizedBacklog}`, 3, language);
  const insightBullets = buildReportInsightBullets(profile, score, recommendations, language);

  drawPanel(doc, 56, 596, 1078, 140, copy.summaryInsights);
  drawDecisionBadge(doc, 84, 626, score);
  insightBullets.forEach((item, index) => {
    const y = 682 - index * 32;
    circle(doc, 194, y - 4, 5, ...cyan);
    wrapText(doc, item, 210, y, 614, 9.8, 12.2, "regular", ...ink, 2);
  });
  drawKpiCard(doc, 864, 624, 112, 58, "P1", String(recommendations.filter((item) => item.priority === "P1").length), "Immediate", red);
  drawKpiCard(doc, 994, 624, 112, 58, "P2/P3", String(recommendations.filter((item) => item.priority !== "P1").length), "Planned", amber);

  drawPanel(doc, 56, 124, 1078, 426, "Prioritized action register");
  drawTableHeader(doc, 80, 486);
  recommendations.slice(0, 8).forEach((item, index) => {
    drawRecommendationRow(doc, item, 80, 448 - index * 40, index);
  });

  drawFooterNote(doc, "Reports menu can also export the same action register as Jira issue CSV for backlog creation.");
}

function drawRoadmapPage(doc: PdfDoc, profile: OrganizationProfile, score: AssessmentScore, recommendations: Recommendation[], roadmap: ReturnType<typeof buildRoadmap>, language: ReportLanguage) {
  const copy = pdfCopy(language);
  drawShell(doc, copy.roadmapTitle, `${profile.companyName} - ${copy.executionPlan}`, 4, language);

  drawPanel(doc, 56, 558, 1078, 178, "Assessment delivery flow");
  drawDeliveryFlow(doc, 92, 642);

  drawPanel(doc, 56, 248, 1078, 264, "90 day roadmap");
  roadmap.forEach((phase, index) => {
    drawRoadmapColumn(doc, 90 + index * 348, 270, 306, 190, phase, index);
  });

  drawPanel(doc, 56, 106, 516, 96, "Release governance");
  wrapText(doc, "Every completed assessment keeps the same token. When scoring is completed, the report status changes to processing; users can refresh later and download the PDF when it is ready.", 84, 150, 422, 10.8, 15, "regular", ...slate, 4);

  drawPanel(doc, 618, 106, 516, 96, "Generation approach");
  wrapText(doc, "PDF creation runs inside the application without an external AI dependency. A separate PDF pod can be introduced later only if branded HTML rendering, custom fonts or large batch generation becomes necessary.", 646, 150, 422, 10.8, 15, "regular", ...slate, 4);

  text(doc, `Board signal: %${score.overallScore} - ${scoreLabel(score.overallScore)}`, 56, 62, 12, "bold", ...navy);
  text(doc, `Open recommendation count: ${recommendations.length}`, 888, 62, 12, "bold", ...navy);
}

function drawCompliancePage(doc: PdfDoc, profile: OrganizationProfile, compliance: ReturnType<typeof buildBddkCompliance>, language: ReportLanguage) {
  const copy = pdfCopy(language);
  drawShell(doc, copy.regulatoryAlignment, `${profile.companyName} - BDDK technical control signal`, 5, language);

  drawPanel(doc, 56, 602, 1078, 134, "Mevzuat uyum özeti");
  drawKpiCard(doc, 84, 630, 186, 58, "Overall signal", compliance.overallStatus, "Technical control view", compliance.overallStatus === "Gap" ? red : compliance.overallStatus === "Partial" ? amber : green);
  drawKpiCard(doc, 292, 630, 128, 58, "Aligned", String(compliance.alignedCount), "Strong signal", green);
  drawKpiCard(doc, 442, 630, 128, 58, "Partial", String(compliance.partialCount), "Needs evidence", amber);
  drawKpiCard(doc, 592, 630, 128, 58, "Gap", String(compliance.gapCount), "Control gap", red);
  wrapText(doc, compliance.disclaimer, 760, 674, 330, 9.8, 13, "regular", ...slate, 4);

  drawPanel(doc, 56, 106, 1078, 450, "BDDK kontrol matrisi");
  fill(doc, 84, 498, 1022, 28, ...deepBlue);
  text(doc, "Mevzuat", 98, 508, 9, "bold", 255, 255, 255);
  text(doc, "Kontrol", 220, 508, 9, "bold", 255, 255, 255);
  text(doc, "Durum", 630, 508, 9, "bold", 255, 255, 255);
  text(doc, "Kanıt / açık alan", 740, 508, 9, "bold", 255, 255, 255);

  compliance.controls.slice(0, 8).forEach((control, index) => {
    const y = 458 - index * 44;
    fill(doc, 84, y, 1022, 40, index % 2 === 0 ? 255 : 248, index % 2 === 0 ? 255 : 250, index % 2 === 0 ? 255 : 253);
    stroke(doc, 84, y, 1106, y, ...softLine);
    wrapText(doc, `${control.source}\n${control.article}`, 98, y + 26, 92, 7.8, 9.4, "bold", ...ink, 2);
    wrapText(doc, control.title, 220, y + 27, 362, 8.3, 9.8, "regular", ...ink, 2);
    drawPill(doc, 630, y + 13, 76, 16, control.status, statusColor(control.status));
    text(doc, `${control.score}/100`, 630, y + 5, 8, "bold", ...slate);
    const evidence = control.gaps.length > 0 ? `Açık sinyal: ${control.gaps.join(", ")}` : `Kanıt: ${control.evidence.slice(0, 2).join(", ")}`;
    wrapText(doc, evidence, 740, y + 27, 318, 8, 9.6, "regular", ...slate, 2);
  });

  drawFooterNote(doc, "BDDK section is generated from assessment answers; legal and audit teams should validate final regulatory interpretation.");
}

function createDoc(): PdfDoc {
  const page = { width: pageWidth, height: pageHeight, ops: [] };
  return { pages: [page], page };
}

function addPage(doc: PdfDoc) {
  const page = { width: pageWidth, height: pageHeight, ops: [] };
  doc.pages.push(page);
  doc.page = page;
}

function drawShell(doc: PdfDoc, title: string, subtitle: string, pageNumber: number, language: ReportLanguage = "tr") {
  const copy = pdfCopy(language);
  fill(doc, 0, 0, pageWidth, pageHeight, 255, 255, 255);
  fill(doc, 0, 778, pageWidth, 64, ...navy);
  fill(doc, 0, 778, 360, 64, 8, 37, 76);
  fill(doc, 0, 774, pageWidth, 4, ...cyan);
  text(doc, title, 56, 814, 17, "bold", 255, 255, 255);
  text(doc, subtitle, 56, 792, 10, "regular", 185, 218, 231);
  text(doc, reportBrand.toUpperCase(), 934, 814, 10.2, "bold", 255, 255, 255);
  text(doc, `${reportClassification} - ${reportVersion}`, 934, 792, 8.8, "regular", 185, 218, 231);
  text(doc, `Page ${pageNumber}`, 1084, 760, 8.8, "bold", ...slate);
  stroke(doc, 56, 86, 1134, 86, ...softLine);
  fill(doc, 0, 0, pageWidth, 38, 247, 249, 252);
  stroke(doc, 56, 38, 1134, 38, ...softLine);
  text(doc, `${reportClassification} - generated ${reportDateLabel()}`, 56, 18, 8.5, "bold", ...slate);
  text(doc, copy.footerPurpose, 742, 18, 8.5, "regular", ...slate);
}

function drawPanel(doc: PdfDoc, x: number, y: number, w: number, h: number, title: string) {
  fill(doc, x, y, w, h, ...panel);
  strokeRect(doc, x, y, w, h, ...line);
  fill(doc, x, y + h - 34, w, 34, ...wash);
  fill(doc, x, y + h - 34, 5, 34, ...cyan);
  stroke(doc, x, y + h - 34, x + w, y + h - 34, ...softLine);
  text(doc, title, x + 20, y + h - 22, 12, "bold", ...navy);
}

function drawKpiCard(doc: PdfDoc, x: number, y: number, w: number, h: number, label: string, value: string, helper: string, color: RGB) {
  const compact = h < 70;
  fill(doc, x, y, w, h, 255, 255, 255);
  strokeRect(doc, x, y, w, h, ...line);
  fill(doc, x, y, 6, h, ...color);
  text(doc, label, x + 22, y + h - (compact ? 16 : 24), compact ? 8.3 : 9.4, "bold", ...slate);
  text(doc, value, x + 22, y + (compact ? 24 : 31), value.length > 8 ? 18 : compact ? 18 : 22, "bold", ...navy);
  wrapText(doc, helper, x + 22, y + (compact ? 8 : 14), w - 40, compact ? 8.1 : 8.6, 9.8, "regular", ...slate, 2);
}

function drawScoreDial(doc: PdfDoc, x: number, y: number, radius: number, score: number, label: string) {
  circle(doc, x, y, radius, 230, 235, 241);
  circle(doc, x, y, radius - 14, ...scoreColor(score));
  circle(doc, x, y, radius - 30, ...navy);
  text(doc, `%${score}`, x - 31, y + 12, 24, "bold", 255, 255, 255);
  text(doc, label, x - Math.min(42, label.length * 3.2), y - 13, 10, "bold", 210, 232, 240);
}

function drawMaturityLegend(doc: PdfDoc, x: number, y: number) {
  [
    ["90-100", "Excellent", green],
    ["70-89", "Good", [132, 201, 82] as RGB],
    ["50-69", "Moderate", amber],
    ["30-49", "Needs improvement", [237, 110, 42] as RGB],
    ["0-29", "Weak", red]
  ].forEach(([range, label, color], index) => {
    const yy = y - index * 24;
    circle(doc, x, yy, 6, ...(color as RGB));
    text(doc, String(range), x + 18, yy - 3, 9.2, "bold", 255, 255, 255);
    text(doc, String(label), x + 78, yy - 3, 9.2, "regular", 235, 242, 248);
  });
}

function drawCoverMetadata(doc: PdfDoc, profile: OrganizationProfile, x: number, y: number) {
  const items = [
    ["Prepared for", profile.companyName],
    ["Prepared by", reportBrand],
    ["Report date", reportDateLabel()],
    ["Assessment module", "SDLC & DevSecOps"]
  ];
  items.forEach(([label, value], index) => {
    const xx = x + index * 148;
    fill(doc, xx, y, 130, 34, 9, 32, 62);
    strokeRect(doc, xx, y, 130, 34, 39, 70, 104);
    text(doc, label, xx + 8, y + 20, 7.4, "bold", 168, 200, 218);
    wrapText(doc, value, xx + 8, y + 8, 106, 8.1, 8.8, "bold", 255, 255, 255, 1);
  });
}

function drawProfileGrid(doc: PdfDoc, profile: OrganizationProfile, x: number, y: number) {
  const items = [
    ["Sector", profile.sector],
    ["Applications", `${profile.applicationCount} total / ${profile.productionApplicationCount} prod / ${profile.criticalApplicationCount} critical`],
    ["Engineering", `${profile.developerCount} developers / ${profile.devopsEngineerCount} DevOps engineers`],
    ["Cloud", `${profile.cloudProvider} - Kubernetes: ${profile.kubernetesUsage}`],
    ["Delivery tools", `${profile.sourceControlTool} + ${profile.cicdTool}`],
    ["Service management", profile.itsmTool],
    ["Security tools", profile.securityTools || "Not specified"],
    ["Monitoring", profile.monitoringTools || "Not specified"]
  ];
  items.forEach(([label, value], index) => {
    const col = index % 4;
    const row = Math.floor(index / 4);
    const xx = x + col * 260;
    const yy = y - row * 50;
    text(doc, label, xx, yy + 14, 8.5, "bold", ...slate);
    wrapText(doc, value, xx, yy - 4, 214, 9.6, 12, "bold", ...ink, 2);
  });
}

function drawGovernanceBand(doc: PdfDoc, x: number, y: number, score: AssessmentScore) {
  fill(doc, x, y, 1022, 24, 255, 255, 255);
  strokeRect(doc, x, y, 1022, 24, ...softLine);
  text(doc, "Executive control posture", x + 14, y + 8, 9.2, "bold", ...navy);
  text(doc, "Evidence", x + 226, y + 8, 8.8, "bold", ...slate);
  drawTinyStatus(doc, x + 280, y + 12, score.completion);
  text(doc, "Automation", x + 426, y + 8, 8.8, "bold", ...slate);
  drawTinyStatus(doc, x + 496, y + 12, score.overallScore);
  text(doc, "Risk governance", x + 646, y + 8, 8.8, "bold", ...slate);
  drawTinyStatus(doc, x + 744, y + 12, score.overallScore);
  text(doc, "Board-ready roadmap", x + 878, y + 8, 8.8, "bold", ...slate);
}

function drawDecisionBadge(doc: PdfDoc, x: number, y: number, score: AssessmentScore) {
  const color = scoreColor(score.overallScore);
  fill(doc, x, y, 86, 48, ...color);
  text(doc, "BOARD", x + 16, y + 29, 8, "bold", 255, 255, 255);
  text(doc, "SIGNAL", x + 15, y + 16, 8, "bold", 255, 255, 255);
  text(doc, scoreLabel(score.overallScore), x + 10, y + 5, 6.8, "bold", 255, 255, 255);
}

function drawTinyStatus(doc: PdfDoc, x: number, y: number, score: number) {
  const color = scoreColor(score);
  fill(doc, x, y - 4, 72, 8, 229, 235, 242);
  fill(doc, x, y - 4, Math.max(4, 72 * score / 100), 8, ...color);
  text(doc, `%${score}`, x + 82, y - 3, 8, "bold", ...ink);
}

function drawProgressBar(doc: PdfDoc, x: number, y: number, w: number, h: number, score: number, color: RGB) {
  fill(doc, x, y, w, h, 229, 235, 242);
  fill(doc, x, y, Math.max(4, w * score / 100), h, ...color);
}

function drawVerticalScore(doc: PdfDoc, x: number, y: number, h: number, score: number, label: string) {
  fill(doc, x, y, 48, h, 232, 237, 243);
  fill(doc, x, y, 48, Math.max(4, h * score / 100), ...scoreColor(score));
  text(doc, `%${score}`, x + 7, y + h + 18, 12.6, "bold", ...navy);
  wrapText(doc, label, x - 22, y - 16, 92, 8, 9.8, "bold", ...slate, 2);
}

function drawRiskBand(doc: PdfDoc, x: number, y: number, score: number) {
  const color = scoreColor(score);
  fill(doc, x, y, 56, 22, ...color);
  text(doc, `%${score}`, x + 13, y + 7, 9.8, "bold", 255, 255, 255);
}

function drawSignalCard(doc: PdfDoc, x: number, y: number, label: string, score: number, helper: string) {
  fill(doc, x, y, 220, 54, 255, 255, 255);
  strokeRect(doc, x, y, 220, 54, ...softLine);
  drawProgressBar(doc, x + 14, y + 13, 62, 8, score, scoreColor(score));
  text(doc, `%${score}`, x + 88, y + 8, 13.5, "bold", ...navy);
  text(doc, label, x + 14, y + 34, 9.6, "bold", ...ink);
  wrapText(doc, helper, x + 130, y + 32, 76, 7.5, 8.5, "regular", ...slate, 2);
}

function drawTableHeader(doc: PdfDoc, x: number, y: number) {
  fill(doc, x, y, 1018, 28, ...deepBlue);
  text(doc, "Priority", x + 14, y + 10, 9.3, "bold", 255, 255, 255);
  text(doc, "Finding", x + 112, y + 10, 9.3, "bold", 255, 255, 255);
  text(doc, "Recommended action", x + 466, y + 10, 9.3, "bold", 255, 255, 255);
  text(doc, "Phase", x + 854, y + 10, 9.3, "bold", 255, 255, 255);
  text(doc, "Effort", x + 936, y + 10, 9.3, "bold", 255, 255, 255);
}

function drawRecommendationRow(doc: PdfDoc, item: Recommendation, x: number, y: number, index: number) {
  fill(doc, x, y, 1018, 38, index % 2 === 0 ? 255 : 248, index % 2 === 0 ? 255 : 250, index % 2 === 0 ? 255 : 253);
  stroke(doc, x, y, x + 1018, y, ...softLine);
  drawPill(doc, x + 14, y + 11, 42, 16, item.priority, priorityColor(item.priority));
  drawPill(doc, x + 62, y + 11, 54, 16, item.severity, severityColor(item.severity));
  wrapText(doc, item.title, x + 132, y + 24, 294, 9.2, 10.8, "bold", ...ink, 2);
  wrapText(doc, item.recommendation, x + 466, y + 24, 336, 8.6, 10.6, "regular", ...slate, 2);
  text(doc, phaseLabel(item.phase), x + 858, y + 15, 9.2, "bold", ...ink);
  text(doc, item.effort, x + 940, y + 15, 9.2, "bold", ...ink);
}

function drawPill(doc: PdfDoc, x: number, y: number, w: number, h: number, label: string, color: RGB) {
  fill(doc, x, y, w, h, ...color);
  text(doc, label, x + 7, y + 5, 7.6, "bold", 255, 255, 255);
}

function drawDeliveryFlow(doc: PdfDoc, x: number, y: number) {
  const steps = [
    ["Assessment", "Responses and customer profile are completed"],
    ["Scoring", "Rule set calculates domain maturity"],
    ["Interpreting", "Report narrative is prepared"],
    ["PDF ready", "Executive deck can be downloaded"],
    ["Backlog", "CSV export can seed Jira issues"]
  ];
  steps.forEach(([title, body], index) => {
    const xx = x + index * 210;
    circle(doc, xx + 28, y, 26, ...(index < 2 ? blue : index === 2 ? amber : green));
    text(doc, String(index + 1), xx + 21, y - 6, 17, "bold", 255, 255, 255);
    text(doc, title, xx + 66, y + 10, 11.2, "bold", ...ink);
    wrapText(doc, body, xx + 66, y - 8, 116, 8.8, 10.5, "regular", ...slate, 2);
    if (index < steps.length - 1) {
      stroke(doc, xx + 154, y, xx + 194, y, ...line);
      text(doc, ">", xx + 174, y - 4, 10, "bold", ...slate);
    }
  });
}

function drawRoadmapColumn(doc: PdfDoc, x: number, y: number, w: number, h: number, phase: ReturnType<typeof buildRoadmap>[number], index: number) {
  const colors: RGB[] = [green, amber, purple];
  fill(doc, x, y, w, h, 255, 255, 255);
  strokeRect(doc, x, y, w, h, ...softLine);
  fill(doc, x, y + h - 40, w, 40, ...colors[index]);
  text(doc, phase.duration, x + 18, y + h - 18, 11.5, "bold", 255, 255, 255);
  text(doc, phase.title, x + 118, y + h - 18, 9.2, "bold", 255, 255, 255);
  const items = phase.items.length > 0 ? phase.items : [{ title: "No critical item assigned to this phase" }];
  items.slice(0, 5).forEach((item, itemIndex) => {
    const yy = y + h - 66 - itemIndex * 25;
    text(doc, "v", x + 18, yy, 8.8, "bold", ...colors[index]);
    wrapText(doc, item.title, x + 36, yy + 2, w - 56, 8.8, 10.6, "regular", ...ink, 2);
  });
}

function drawFooterNote(doc: PdfDoc, note: string) {
  text(doc, note, 56, 58, 9.2, "regular", ...slate);
}

function reportDateLabel() {
  return new Date().toLocaleDateString("tr-TR", { year: "numeric", month: "2-digit", day: "2-digit" });
}

function buildExecutiveVerdict(profile: OrganizationProfile, score: AssessmentScore, recommendations: Recommendation[], language: ReportLanguage) {
  const critical = recommendations.filter((item) => item.severity === "Critical").length;
  const p1 = recommendations.filter((item) => item.priority === "P1").length;
  if (language === "tr") {
    return `${profile.companyName} assessment sonucu ${score.overallScore}/100 genel skor ile ${score.maturityLevel} seviyesindedir. Rapor; delivery governance, kalite kapıları, güvenlik kontrolleri ve operasyonel evidence alanlarında ${p1} acil aksiyon ve ${critical} kritik risk temasını önceliklendirir.`;
  }
  return `${profile.companyName} assessment result indicates ${score.maturityLevel} maturity with an overall score of ${score.overallScore}/100. The report prioritizes ${p1} immediate actions and ${critical} critical risk themes across delivery governance, quality gates, security controls and operational evidence.`;
}

function buildDeterministicSummary(profile: OrganizationProfile, score: AssessmentScore, recommendations: Recommendation[]) {
  const top = recommendations.slice(0, 3).map((item) => item.title).join(", ");
  return `${profile.companyName} is assessed at ${score.maturityLevel} with an overall maturity score of ${score.overallScore}/100. Priority improvement areas are ${top || "not currently critical"}. The recommended operating model is to stabilize evidence, approval and rollback controls first, then expand automated security and quality gates, and finally mature governance reporting.`;
}

function findScore(categories: CategoryScore[], id: string) {
  return categories.find((item) => item.category.id === id)?.score ?? 0;
}

function scoreLabel(score: number) {
  if (score >= 90) return "EXCELLENT";
  if (score >= 70) return "GOOD";
  if (score >= 50) return "MODERATE";
  if (score >= 30) return "IMPROVE";
  return "WEAK";
}

function levelShort(level: string) {
  return level.replace("Level ", "L");
}

function phaseLabel(phase: Recommendation["phase"]) {
  if (phase === "Phase 1") return "0-30d";
  if (phase === "Phase 2") return "31-90d";
  return "90d+";
}

function scoreColor(score: number): RGB {
  if (score >= 70) return green;
  if (score >= 50) return amber;
  if (score >= 30) return [237, 110, 42];
  return red;
}

function priorityColor(priority?: Recommendation["priority"]): RGB {
  if (priority === "P1") return red;
  if (priority === "P2") return amber;
  return blue;
}

function severityColor(severity?: Recommendation["severity"]): RGB {
  if (severity === "Critical") return red;
  if (severity === "High") return [237, 110, 42];
  if (severity === "Medium") return amber;
  return blue;
}

function statusColor(status: string): RGB {
  if (status === "Aligned") return green;
  if (status === "Partial" || status === "EvidenceRequired") return amber;
  if (status === "Gap") return red;
  return slate;
}

function pdfCopy(language: ReportLanguage) {
  if (language === "en") {
    return {
      coverTitle: "Executive Assessment Report",
      coverSubtitle: "SDLC, DevOps and DevSecOps maturity assessment",
      overallScore: "Overall score",
      maturityLevel: "Maturity level",
      assessmentClassification: "Assessment classification",
      openRecommendations: "Open recommendations",
      prioritizedActions: "Prioritized actions",
      answeredEvidence: "Answered evidence",
      collectedInputs: "Collected assessment inputs",
      executivePriorities: "Executive priorities",
      riskConcentration: "Primary risk concentration",
      assessmentScope: "Assessment scope",
      localGenerationNote: "Report is generated from local assessment data and deterministic rule outputs. No external service is required for PDF creation.",
      maturityScorecard: "Maturity Scorecard",
      domainView: "domain based maturity view",
      recommendations: "Recommendations",
      prioritizedBacklog: "prioritized improvement backlog",
      summaryInsights: "Summary insights",
      roadmapTitle: "Roadmap & Delivery Model",
      executionPlan: "phased execution plan",
      regulatoryAlignment: "Regulatory Alignment",
      footerPurpose: "This document is intended for executive assessment and planning use."
    };
  }
  return {
    coverTitle: "Yönetici Assessment Raporu",
    coverSubtitle: "SDLC, DevOps ve DevSecOps olgunluk değerlendirmesi",
    overallScore: "Genel skor",
    maturityLevel: "Olgunluk seviyesi",
    assessmentClassification: "Assessment sınıflandırması",
    openRecommendations: "Açık öneriler",
    prioritizedActions: "Öncelikli aksiyonlar",
    answeredEvidence: "Yanıtlanan kanıt",
    collectedInputs: "Toplanan assessment girdileri",
    executivePriorities: "Yönetici öncelikleri",
    riskConcentration: "Ana risk yoğunlaşması",
    assessmentScope: "Assessment kapsamı",
    localGenerationNote: "Rapor yerel assessment verisi ve deterministik kural çıktılarıyla oluşturulur. PDF üretimi için dış servis zorunlu değildir.",
    maturityScorecard: "Olgunluk Skor Kartı",
    domainView: "alan bazlı olgunluk görünümü",
    recommendations: "Öneriler",
    prioritizedBacklog: "önceliklendirilmiş iyileştirme backlog'u",
    summaryInsights: "Yorum özeti",
    roadmapTitle: "Yol Haritası ve Teslim Modeli",
    executionPlan: "fazlandırılmış uygulama planı",
    regulatoryAlignment: "Mevzuat Uyum",
    footerPurpose: "Bu doküman yönetici değerlendirmesi ve planlama amacıyla hazırlanmıştır."
  };
}

function compactName(value: string) {
  return value
    .replace("Organizasyon ve ", "")
    .replace("Yönetimi", "Yonetimi")
    .replace("Kaynak Kod", "Kod")
    .replace("İzleme, Log ve Gözlemlenebilirlik", "Observability")
    .replace("DevSecOps ve Güvenlik", "DevSecOps")
    .replace("Altyapı ve Cloud Hazırlığı", "Infrastructure & Cloud");
}

function fill(doc: PdfDoc, x: number, y: number, w: number, h: number, r: number, g: number, b: number) {
  doc.page.ops.push(`${rgb(r, g, b)} rg ${num(x)} ${num(y)} ${num(w)} ${num(h)} re f`);
}

function strokeRect(doc: PdfDoc, x: number, y: number, w: number, h: number, r: number, g: number, b: number) {
  doc.page.ops.push(`${rgb(r, g, b)} RG 0.8 w ${num(x)} ${num(y)} ${num(w)} ${num(h)} re S`);
}

function stroke(doc: PdfDoc, x1: number, y1: number, x2: number, y2: number, r: number, g: number, b: number) {
  doc.page.ops.push(`${rgb(r, g, b)} RG 0.8 w ${num(x1)} ${num(y1)} m ${num(x2)} ${num(y2)} l S`);
}

function circle(doc: PdfDoc, x: number, y: number, radius: number, r: number, g: number, b: number) {
  const c = radius * 0.5522847498;
  doc.page.ops.push(`${rgb(r, g, b)} rg ${num(x)} ${num(y + radius)} m ${num(x + c)} ${num(y + radius)} ${num(x + radius)} ${num(y + c)} ${num(x + radius)} ${num(y)} c ${num(x + radius)} ${num(y - c)} ${num(x + c)} ${num(y - radius)} ${num(x)} ${num(y - radius)} c ${num(x - c)} ${num(y - radius)} ${num(x - radius)} ${num(y - c)} ${num(x - radius)} ${num(y)} c ${num(x - radius)} ${num(y + c)} ${num(x - c)} ${num(y + radius)} ${num(x)} ${num(y + radius)} c f`);
}

function text(doc: PdfDoc, value: string, x: number, y: number, size: number, weight: "regular" | "bold", r: number, g: number, b: number) {
  const font = weight === "bold" ? "F2" : "F1";
  doc.page.ops.push(`BT ${rgb(r, g, b)} rg /${font} ${num(size)} Tf ${num(x)} ${num(y)} Td (${pdfText(value)}) Tj ET`);
}

function wrapText(doc: PdfDoc, value: string, x: number, y: number, width: number, size: number, lineHeight: number, weight: "regular" | "bold", r: number, g: number, b: number, maxLines = 5) {
  const words = toPdfSafe(value).split(/\s+/).filter(Boolean);
  const maxChars = Math.max(8, Math.floor(width / (size * 0.5)));
  const lines: string[] = [];
  let lineText = "";
  words.forEach((word) => {
    const next = lineText ? `${lineText} ${word}` : word;
    if (next.length > maxChars) {
      if (lineText) lines.push(lineText);
      lineText = word;
    } else {
      lineText = next;
    }
  });
  if (lineText) lines.push(lineText);
  const visibleLines = lines.slice(0, maxLines);
  if (lines.length > maxLines && visibleLines.length > 0) {
    const lastIndex = visibleLines.length - 1;
    const last = visibleLines[lastIndex];
    visibleLines[lastIndex] = last.length > 3 ? `${last.slice(0, Math.max(1, maxChars - 3)).trim()}...` : last;
  }
  visibleLines.forEach((line, index) => text(doc, line, x, y - index * lineHeight, size, weight, r, g, b));
}

function renderPdf(doc: PdfDoc) {
  const objects: string[] = [];
  objects.push("<< /Type /Catalog /Pages 2 0 R >>");
  objects.push(`<< /Type /Pages /Kids [${doc.pages.map((_, index) => `${3 + index * 2} 0 R`).join(" ")}] /Count ${doc.pages.length} >>`);

  doc.pages.forEach((page, index) => {
    const pageObj = 3 + index * 2;
    const contentObj = pageObj + 1;
    const stream = page.ops.join("\n");
    objects.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${page.width} ${page.height}] /Resources << /Font << /F1 ${3 + doc.pages.length * 2} 0 R /F2 ${4 + doc.pages.length * 2} 0 R >> >> /Contents ${contentObj} 0 R >>`);
    objects.push(`<< /Length ${Buffer.byteLength(stream)} >>\nstream\n${stream}\nendstream`);
  });

  objects.push("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");
  objects.push("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>");

  const chunks = ["%PDF-1.4\n"];
  const offsets = [0];
  objects.forEach((object, index) => {
    offsets.push(Buffer.byteLength(chunks.join("")));
    chunks.push(`${index + 1} 0 obj\n${object}\nendobj\n`);
  });
  const xrefOffset = Buffer.byteLength(chunks.join(""));
  chunks.push(`xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`);
  offsets.slice(1).forEach((offset) => chunks.push(`${String(offset).padStart(10, "0")} 00000 n \n`));
  chunks.push(`trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`);
  return chunks.join("");
}

function rgb(r: number, g: number, b: number) {
  return `${num(r / 255)} ${num(g / 255)} ${num(b / 255)}`;
}

function num(value: number) {
  return Number(value.toFixed(3));
}

function pdfText(value: string) {
  return toPdfSafe(value).replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

function toPdfSafe(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/İ/g, "I")
    .replace(/ı/g, "i")
    .replace(/Ğ/g, "G")
    .replace(/ğ/g, "g")
    .replace(/Ü/g, "U")
    .replace(/ü/g, "u")
    .replace(/Ş/g, "S")
    .replace(/ş/g, "s")
    .replace(/Ö/g, "O")
    .replace(/ö/g, "o")
    .replace(/Ç/g, "C")
    .replace(/ç/g, "c")
    .replace(/[^\x20-\x7E]/g, " ");
}
