import { Answers, OrganizationProfile, questions } from "@/data/assessment";
import { AssessmentScore } from "@/features/scoring/scoring";
import { Recommendation } from "@/features/recommendations/recommendations";
import { buildBddkCompliance } from "@/features/compliance/bddk";

export type ReportLanguage = "tr" | "en";

const englishRecommendations: Record<string, Partial<Recommendation>> = {
  "DEVSECOPS-SAST-GATE-001": { title: "SAST findings should drive release decisions", description: "Security scan results do not sufficiently influence merge or release decisions.", recommendation: "Implement blocking quality gates with risk thresholds, exceptions, SLA and remediation tracking.", expectedImpact: "Prevents high-risk vulnerabilities from moving into production." },
  "DEVSECOPS-DAST-001": { title: "DAST capability should be introduced", description: "Dynamic security testing is not consistently performed for web and API applications.", recommendation: "Integrate OWASP ZAP or an enterprise DAST tool into the pipeline after test environment deployment.", expectedImpact: "Detects runtime security issues before release." },
  "DEVSECOPS-SCA-001": { title: "SCA and dependency risk management should be established", description: "Open-source dependency, CVE and license risks are not sufficiently visible.", recommendation: "Connect Snyk, Mend, Nexus IQ or Dependabot-based SCA controls to release gates.", expectedImpact: "Prevents critical CVE and license risks from reaching production." },
  "DEVSECOPS-SECRET-001": { title: "Secret scanning should be mandatory", description: "Secret leakage controls are missing across repositories and pull requests.", recommendation: "Apply GitLeaks, GitGuardian or GitHub Secret Scanning as PR and scheduled scans; define rotation flow.", expectedImpact: "Reduces credential leakage and lateral movement risk." },
  "CD-APPROVAL-001": { title: "Production approval gate should be established", description: "There is no auditable approval mechanism for production deployments.", recommendation: "Make Jira, ITSM or pipeline approval gates mandatory with audit trail evidence.", expectedImpact: "Prevents unauthorized and uncontrolled production changes." },
  "CD-ROLLBACK-001": { title: "Rollback strategy should be tested", description: "Rollback flow is not clearly defined or proven.", recommendation: "Add rollback runbooks, automation and regular exercises for each critical service.", expectedImpact: "Reduces recovery time during deployment failures." },
  "OBS-MON-001": { title: "Monitoring standard should be established", description: "Critical services lack consistent metric and alert visibility.", recommendation: "Standardize Prometheus/Grafana or the current APM stack with dashboards and alert severity model.", expectedImpact: "Reduces incident detection and response time." },
  "OBS-LOG-001": { title: "Centralized log management should be established", description: "Logs are not centrally visible for correlation and audit purposes.", recommendation: "Apply a common log standard and retention policy using OpenSearch, ELK, Splunk or Loki.", expectedImpact: "Accelerates RCA and audit processes." },
  "OBS-SLO-001": { title: "SLO and alerting model should be clarified", description: "Alert severity, action ownership and SLO targets are not sufficiently defined for critical services.", recommendation: "Define SLI/SLO, escalation, alert ownership and an error-budget approach for critical services.", expectedImpact: "Reduces alert noise and clarifies response priorities." },
  "SCM-PR-001": { title: "Pull Request policy should be mandatory", description: "Review and policy enforcement are insufficient for code changes.", recommendation: "Mandate minimum reviewers, status checks and branch protection for all critical repositories.", expectedImpact: "Runs quality and security controls before merge." },
  "TEST-API-001": { title: "API test automation should be strengthened", description: "API and integration tests are not sufficiently used in pipeline decisions.", recommendation: "Design API and contract test suites as pipeline gates for critical services.", expectedImpact: "Detects integration defects earlier in test environments." },
  "GOV-AUDIT-001": { title: "Audit evidence should be automated", description: "Build, test, approval and deployment evidence is not centralized or repeatable.", recommendation: "Establish a standard reporting flow that collects evidence from pipeline, SCM, ITSM and security tools.", expectedImpact: "Shortens audit preparation time and increases reliability." }
};

const englishCategoryNames: Record<string, string> = {
  org: "Organizational Scope and Operating Model",
  sdlc: "Demand and SDLC Management",
  scm: "Source Code and Change Control",
  ci: "CI and Quality Gates",
  cd: "CD and Environment Promotion",
  release: "Release and Change Management",
  devsecops: "DevSecOps and Application Security",
  test: "Test Strategy and Automation",
  infrastructure: "Infrastructure, Continuity and IaC",
  k8s: "Container and Kubernetes Security",
  observability: "Observability and Service Health",
  ops: "Operations and Incident Management",
  governance: "Governance, Access and Audit Evidence"
};

export function buildExecutiveSummary(profile: OrganizationProfile, score: AssessmentScore, recommendations: Recommendation[]) {
  const priorityItems = recommendations.slice(0, 4).map((item) => item.title);
  const criticalCount = recommendations.filter((item) => item.severity === "Critical").length;
  const focus = priorityItems.length > 0 ? priorityItems.join(", ") : "kritik açık aksiyon bulunmamaktadır";

  return `${profile.companyName} için yapılan SDLC & DevSecOps Assessment sonucunda genel skor ${score.overallScore}/100 (${score.maturityLevel}) olarak hesaplanmıştır. Öncelikli iyileştirme alanları ${focus} başlıklarında yoğunlaşmaktadır. ${criticalCount > 0 ? `${criticalCount} kritik bulgu için ilk fazda sahiplik, onay mekanizması ve kanıt takibi oluşturulmalıdır.` : "Kritik seviyede bulgu üretilmemiştir; mevcut iyileştirme planı ölçülebilir kalite kapıları ve düzenli denetim kanıtlarıyla güçlendirilmelidir."} Rapor, danışman incelemesi için aynı token üzerinde hazırlanmıştır.`;
}

export function buildReportInsightBullets(profile: OrganizationProfile, score: AssessmentScore, recommendations: Recommendation[], language: ReportLanguage = "tr") {
  const focusAreas = [...score.categoryScores].sort((a, b) => a.score - b.score).slice(0, 3).map((item) => item.category.name);
  const localizedFocusAreas = [...score.categoryScores].sort((a, b) => a.score - b.score).slice(0, 3).map((item) => categoryName(item.category.id, item.category.name, language));
  const translated = recommendations.map((item) => translateRecommendation(item, language));
  const topActions = translated.slice(0, 3).map((item) => item.title);
  const criticalCount = recommendations.filter((item) => item.severity === "Critical").length;

  if (language === "en") {
    const financeSignal = profile.sector === "Finance" && profile.industrySubtype === "Bank"
      ? "Because the profile is Finance / Bank, the BDDK technical control alignment matrix is generated automatically from assessment answers."
      : "Regulatory alignment is evaluated when it is applicable to the selected sector and assessment scope.";
    return [
      `${profile.companyName} is assessed at ${score.overallScore}/100; the main focus areas are ${localizedFocusAreas.join(", ") || "completed control areas"}.`,
      topActions.length > 0 ? `The first action wave should focus on ${topActions.join(", ")}; these actions improve release reliability, evidence maturity and security gate maturity.` : "No critical action stands out; current maturity should be maintained through regular measurement, evidence and release metrics.",
      criticalCount > 0 ? `${criticalCount} critical finding(s) should be tracked with owner, target date and validation evidence in the same backlog. ${financeSignal}` : `Critical findings are low; the improvement plan can be phased at P2/P3 level. ${financeSignal}`
    ];
  }

  const financeSignal = profile.sector === "Finance" && profile.industrySubtype === "Bank"
    ? "Banka profili nedeniyle BDDK teknik kontrol uyum matrisi mevcut assessment cevaplarından otomatik üretilir."
    : "Mevzuat uyum çıktısı seçilen sektör ve assessment kapsamına göre uygulanabilir olduğunda ayrıca değerlendirilir.";
  return [
    `${profile.companyName} için genel skor ${score.overallScore}/100 seviyesinde; öncelikli odak alanları ${focusAreas.join(", ") || "tamamlanan kontrol alanları"} olarak öne çıkıyor.`,
    topActions.length > 0 ? `İlk aksiyon dalgası ${topActions.join(", ")} başlıklarına odaklanmalı; bu aksiyonlar release güvenilirliği, evidence ve security gate olgunluğunu doğrudan etkiler.` : "Öne çıkan kritik aksiyon bulunmuyor; mevcut olgunluk düzenli ölçüm, evidence ve release metrikleriyle korunmalıdır.",
    criticalCount > 0 ? `${criticalCount} kritik bulgu için sahiplik, hedef tarih ve doğrulama kanıtı aynı backlog üzerinden takip edilmelidir. ${financeSignal}` : `Kritik bulgu sayısı düşük; iyileştirme planı P2/P3 seviyesinde fazlandırılabilir. ${financeSignal}`
  ];
}

export function buildReportPayload(profile: OrganizationProfile, score: AssessmentScore, recommendations: Recommendation[], answers: Answers, language: ReportLanguage = "tr") {
  const lowestCategories = [...score.categoryScores].sort((a, b) => a.score - b.score).slice(0, 5);
  const compliance = buildBddkCompliance(profile, answers);
  const insightBullets = buildReportInsightBullets(profile, score, recommendations, language);
  const answerRows = questions.map((question) => ({
    code: question.code,
    categoryId: question.categoryId,
    question: language === "en" ? `${categoryName(question.categoryId, question.categoryId, language)} / ${question.code}` : question.text,
    answer: answers[question.id] ?? "",
    note: answers[`${question.id}_note`] ?? ""
  }));

  return {
    generatedAt: new Date().toISOString(),
    organization: profile,
    score,
    compliance,
    language,
    insightBullets,
    lowestCategories,
    recommendations: recommendations.map((item) => translateRecommendation(item, language)),
    answers: answerRows
  };
}

export function generateMarkdownReport(profile: OrganizationProfile, score: AssessmentScore, recommendations: Recommendation[], answers: Answers, language: ReportLanguage = "tr") {
  const payload = buildReportPayload(profile, score, recommendations, answers, language);
  const copy = reportCopy(language);
  const formatAnswer = (value: Answers[string]) => Array.isArray(value) ? value.join(", ") : String(value ?? "-");
  const answerLines = payload.answers.map((answer) => `| ${answer.code} | ${answer.question} | ${formatAnswer(answer.answer)} | ${formatAnswer(answer.note)} |`);
  const complianceText = payload.compliance.active
    ? `${copy.complianceSignal}: ${payload.compliance.overallStatus}\n\n${payload.compliance.controls.map((control) => `- ${control.source} ${control.article} - ${control.title}: ${control.status} (${control.score}/100). ${copy.openSignals}: ${control.gaps.length > 0 ? control.gaps.join(", ") : copy.noLowSignal}`).join("\n")}\n\n${copy.note}: ${payload.compliance.disclaimer}`
    : payload.compliance.disclaimer;

  return `# ${profile.companyName} ${copy.title}

## ${copy.executive}

- ${copy.overallScore}: ${score.overallScore}/100
- ${copy.maturityLevel}: ${score.maturityLevel}
- ${copy.completion}: ${score.completion}%
- ${copy.criticalApps}: ${profile.criticalApplicationCount}

## ${copy.insight}

${payload.insightBullets.map((item) => `- ${item}`).join("\n")}

## ${copy.lowest}

${payload.lowestCategories.map((item) => `- ${categoryName(item.category.id, item.category.name, language)}: ${item.score}/100 (${item.risk})`).join("\n")}

## ${copy.recommendations}

${payload.recommendations.map((item) => `### ${item.title}

- ${copy.category}: ${item.category}
- ${copy.severity}: ${item.severity}
- ${copy.priority}: ${item.priority}
- ${copy.phase}: ${item.phase}
- ${copy.recommendation}: ${item.recommendation}
- ${copy.expectedImpact}: ${item.expectedImpact}
`).join("\n")}

## ${copy.compliance}

${complianceText}

## ${copy.answers}

| Code | Question | Answer | Note |
|---|---|---|---|
${answerLines.join("\n")}
`;
}

export function generateHtmlReport(profile: OrganizationProfile, score: AssessmentScore, recommendations: Recommendation[], answers: Answers, language: ReportLanguage = "tr") {
  const payload = buildReportPayload(profile, score, recommendations, answers, language);
  const copy = reportCopy(language);
  const formatAnswer = (value: Answers[string]) => Array.isArray(value) ? value.join(", ") : String(value ?? "-");

  return `<!doctype html>
<html lang="${language}">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(profile.companyName)} ${escapeHtml(copy.title)}</title>
  <style>
    :root { color: #172331; background: #f6f8fb; font-family: Arial, Helvetica, sans-serif; }
    body { margin: 0; padding: 32px; }
    main { max-width: 1120px; margin: 0 auto; background: #fff; border: 1px solid #d8e1e8; border-radius: 8px; overflow: hidden; }
    header { padding: 32px; background: #101923; color: #fff; }
    section { padding: 24px 32px; border-top: 1px solid #e4eaf0; }
    h1, h2, h3 { margin: 0; }
    h1 { font-size: 28px; line-height: 1.2; }
    h2 { margin-bottom: 16px; font-size: 18px; }
    h3 { font-size: 15px; }
    p { color: #5e6b7a; line-height: 1.6; }
    .meta { margin-top: 12px; color: rgba(255,255,255,.72); }
    .summary { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; }
    .metric, .finding { border: 1px solid #d8e1e8; border-radius: 6px; padding: 14px; }
    .label { color: #5e6b7a; font-size: 12px; font-weight: 700; }
    .value { margin-top: 6px; font-size: 22px; font-weight: 700; }
    .grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; }
    th, td { border: 1px solid #d8e1e8; padding: 9px; text-align: left; vertical-align: top; }
    th { background: #f6f8fb; }
    .status { display: inline-block; border-radius: 999px; padding: 4px 8px; background: #eef6f4; color: #0f766e; font-size: 11px; font-weight: 700; }
    @media (max-width: 760px) { body { padding: 12px; } .summary, .grid { grid-template-columns: 1fr; } header, section { padding: 20px; } }
  </style>
</head>
<body>
  <main>
    <header>
      <h1>${escapeHtml(profile.companyName)} ${escapeHtml(copy.title)}</h1>
      <div class="meta">${escapeHtml(copy.generatedAt)} ${escapeHtml(payload.generatedAt)}</div>
    </header>
    <section>
      <h2>${escapeHtml(copy.executive)}</h2>
      <div class="summary">
        <div class="metric"><div class="label">${escapeHtml(copy.overallScore)}</div><div class="value">${score.overallScore}/100</div></div>
        <div class="metric"><div class="label">${escapeHtml(copy.maturityLevel)}</div><div class="value">${escapeHtml(score.maturityLevel)}</div></div>
        <div class="metric"><div class="label">${escapeHtml(copy.completion)}</div><div class="value">${score.completion}%</div></div>
        <div class="metric"><div class="label">${escapeHtml(copy.criticalApps)}</div><div class="value">${profile.criticalApplicationCount}</div></div>
      </div>
    </section>
    <section>
      <h2>${escapeHtml(copy.insight)}</h2>
      <div class="grid">
        ${payload.insightBullets.map((item, index) => `<div class="finding"><h3>${escapeHtml(copy.insightLabel)} ${index + 1}</h3><p>${escapeHtml(item)}</p></div>`).join("")}
      </div>
    </section>
    <section>
      <h2>${escapeHtml(copy.compliance)}</h2>
      ${payload.compliance.active ? `
        <p>${escapeHtml(payload.compliance.disclaimer)}</p>
        <div class="summary">
          <div class="metric"><div class="label">Overall Signal</div><div class="value">${escapeHtml(payload.compliance.overallStatus)}</div></div>
          <div class="metric"><div class="label">Aligned</div><div class="value">${payload.compliance.alignedCount}</div></div>
          <div class="metric"><div class="label">Partial</div><div class="value">${payload.compliance.partialCount}</div></div>
          <div class="metric"><div class="label">Gap</div><div class="value">${payload.compliance.gapCount}</div></div>
        </div>
        <table style="margin-top:16px">
          <thead><tr><th>Regulation</th><th>${escapeHtml(copy.control)}</th><th>${escapeHtml(copy.status)}</th><th>${escapeHtml(copy.evidence)}</th></tr></thead>
          <tbody>
            ${payload.compliance.controls.map((control) => `<tr><td>${escapeHtml(control.source)}<br/>${escapeHtml(control.article)}</td><td>${escapeHtml(control.title)}<br/><small>${escapeHtml(control.summary)}</small></td><td><span class="status">${escapeHtml(control.status)}</span><br/>${control.score}/100</td><td>${escapeHtml(control.evidence.join(", "))}<br/><small>${escapeHtml(control.gaps.length > 0 ? `${copy.openSignals}: ${control.gaps.join(", ")}` : copy.noLowSignal)}</small></td></tr>`).join("")}
          </tbody>
        </table>
      ` : `<p>${escapeHtml(payload.compliance.disclaimer)}</p>`}
    </section>
    <section>
      <h2>${escapeHtml(copy.lowest)}</h2>
      <div class="grid">
        ${payload.lowestCategories.map((item) => `<div class="finding"><h3>${escapeHtml(categoryName(item.category.id, item.category.name, language))}</h3><p>${item.score}/100 · ${escapeHtml(item.risk)}</p></div>`).join("")}
      </div>
    </section>
    <section>
      <h2>${escapeHtml(copy.recommendations)}</h2>
      <div class="grid">
        ${payload.recommendations.map((item) => `<div class="finding"><h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(item.recommendation)}</p><p>${escapeHtml(item.severity)} · ${escapeHtml(item.priority)} · ${escapeHtml(item.phase)} · ${escapeHtml(item.effort)}</p></div>`).join("")}
      </div>
    </section>
    <section>
      <h2>${escapeHtml(copy.answers)}</h2>
      <table>
        <thead><tr><th>Code</th><th>Question</th><th>Answer</th><th>Note</th></tr></thead>
        <tbody>
          ${payload.answers.map((answer) => `<tr><td>${escapeHtml(answer.code)}</td><td>${escapeHtml(answer.question)}</td><td>${escapeHtml(formatAnswer(answer.answer))}</td><td>${escapeHtml(formatAnswer(answer.note))}</td></tr>`).join("")}
        </tbody>
      </table>
    </section>
  </main>
</body>
</html>`;
}

function translateRecommendation(item: Recommendation, language: ReportLanguage): Recommendation {
  if (language === "tr") return item;
  const translatedCategory = categoryName(item.id.startsWith("CAT-") ? item.id.replace("CAT-", "").replace("-001", "").toLowerCase() : "", item.category, language);
  if (item.id.startsWith("CAT-")) {
    return {
      ...item,
      category: translatedCategory,
      title: `${translatedCategory} maturity should be improved`,
      description: `${translatedCategory} is below the target enterprise maturity level.`,
      recommendation: "Define minimum standard, measurement metric, ownership and a 90-day improvement plan for this category.",
      expectedImpact: "Makes category-level risks visible and manageable."
    };
  }
  return { ...item, category: translatedCategory, ...englishRecommendations[item.id] };
}

function categoryName(categoryId: string, fallback: string, language: ReportLanguage) {
  if (language === "tr") return fallback;
  return englishCategoryNames[categoryId] ?? fallback;
}

function reportCopy(language: ReportLanguage) {
  if (language === "en") {
    return {
      title: "SDLC & DevSecOps Assessment Report",
      generatedAt: "Generated at",
      executive: "Executive Summary",
      insight: "Summary Insights",
      insightLabel: "Key point",
      lowest: "Lowest Categories",
      recommendations: "Recommendations",
      compliance: "Regulatory Alignment",
      complianceSignal: "BDDK technical signal",
      answers: "Answers",
      overallScore: "Overall Score",
      maturityLevel: "Maturity Level",
      completion: "Completion",
      criticalApps: "Critical Applications",
      category: "Category",
      severity: "Severity",
      priority: "Priority",
      phase: "Phase",
      recommendation: "Recommendation",
      expectedImpact: "Expected Impact",
      control: "Control",
      status: "Status",
      evidence: "Article Reference / Evidence",
      openSignals: "Open signals",
      noLowSignal: "No low signal identified",
      note: "Note"
    };
  }
  return {
    title: "SDLC & DevSecOps Assessment Report",
    generatedAt: "Oluşturulma zamanı",
    executive: "Executive Summary",
    insight: "Yorum Özeti",
    insightLabel: "Öne çıkan",
    lowest: "Lowest Categories",
    recommendations: "Recommendations",
    compliance: "Mevzuat Uyum",
    complianceSignal: "BDDK uyum sinyali",
    answers: "Answers",
    overallScore: "Overall Score",
    maturityLevel: "Maturity Level",
    completion: "Completion",
    criticalApps: "Critical Applications",
    category: "Category",
    severity: "Severity",
    priority: "Priority",
    phase: "Phase",
    recommendation: "Recommendation",
    expectedImpact: "Expected Impact",
    control: "Kontrol",
    status: "Durum",
    evidence: "Madde Karşılığı / Kanıt",
    openSignals: "Açık sinyaller",
    noLowSignal: "Düşük skor sinyali bulunmadı",
    note: "Not"
  };
}

function escapeHtml(value: string | number) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
