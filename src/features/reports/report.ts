import { Answers, OrganizationProfile, questions } from "@/data/assessment";
import { AssessmentScore } from "@/features/scoring/scoring";
import { Recommendation } from "@/features/recommendations/recommendations";

export function buildReportPayload(profile: OrganizationProfile, score: AssessmentScore, recommendations: Recommendation[], answers: Answers) {
  const lowestCategories = [...score.categoryScores].sort((a, b) => a.score - b.score).slice(0, 5);
  const answerRows = questions.map((question) => ({
    code: question.code,
    categoryId: question.categoryId,
    question: question.text,
    answer: answers[question.id] ?? "",
    note: answers[`${question.id}_note`] ?? ""
  }));

  return {
    generatedAt: new Date().toISOString(),
    organization: profile,
    score,
    lowestCategories,
    recommendations,
    answers: answerRows
  };
}

export function generateMarkdownReport(profile: OrganizationProfile, score: AssessmentScore, recommendations: Recommendation[], answers: Answers) {
  const payload = buildReportPayload(profile, score, recommendations, answers);
  const formatAnswer = (value: Answers[string]) => Array.isArray(value) ? value.join(", ") : String(value ?? "-");
  const answerLines = payload.answers.map((answer) => `| ${answer.code} | ${answer.question} | ${formatAnswer(answer.answer)} | ${formatAnswer(answer.note)} |`);

  return `# ${profile.companyName} DevOps & DevSecOps Maturity Report

## Executive Summary

- Overall Score: ${score.overallScore}/100
- Maturity Level: ${score.maturityLevel}
- Completion: ${score.completion}%
- Critical Applications: ${profile.criticalApplicationCount}

## Lowest Categories

${payload.lowestCategories.map((item) => `- ${item.category.name}: ${item.score}/100 (${item.risk})`).join("\n")}

## Recommendations

${recommendations.map((item) => `### ${item.title}

- Category: ${item.category}
- Severity: ${item.severity}
- Priority: ${item.priority}
- Phase: ${item.phase}
- Recommendation: ${item.recommendation}
- Expected Impact: ${item.expectedImpact}
`).join("\n")}

## Answers

| Code | Question | Answer | Note |
|---|---|---|---|
${answerLines.join("\n")}
`;
}

export function generateHtmlReport(profile: OrganizationProfile, score: AssessmentScore, recommendations: Recommendation[], answers: Answers) {
  const payload = buildReportPayload(profile, score, recommendations, answers);
  const formatAnswer = (value: Answers[string]) => Array.isArray(value) ? value.join(", ") : String(value ?? "-");

  return `<!doctype html>
<html lang="tr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(profile.companyName)} DevOps & DevSecOps Maturity Report</title>
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
    @media (max-width: 760px) { body { padding: 12px; } .summary, .grid { grid-template-columns: 1fr; } header, section { padding: 20px; } }
  </style>
</head>
<body>
  <main>
    <header>
      <h1>${escapeHtml(profile.companyName)} DevOps & DevSecOps Maturity Report</h1>
      <div class="meta">Generated at ${escapeHtml(payload.generatedAt)}</div>
    </header>
    <section>
      <h2>Executive Summary</h2>
      <div class="summary">
        <div class="metric"><div class="label">Overall Score</div><div class="value">${score.overallScore}/100</div></div>
        <div class="metric"><div class="label">Maturity Level</div><div class="value">${escapeHtml(score.maturityLevel)}</div></div>
        <div class="metric"><div class="label">Completion</div><div class="value">${score.completion}%</div></div>
        <div class="metric"><div class="label">Critical Apps</div><div class="value">${profile.criticalApplicationCount}</div></div>
      </div>
    </section>
    <section>
      <h2>Lowest Categories</h2>
      <div class="grid">
        ${payload.lowestCategories.map((item) => `<div class="finding"><h3>${escapeHtml(item.category.name)}</h3><p>${item.score}/100 · ${escapeHtml(item.risk)}</p></div>`).join("")}
      </div>
    </section>
    <section>
      <h2>Recommendations</h2>
      <div class="grid">
        ${recommendations.map((item) => `<div class="finding"><h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(item.recommendation)}</p><p>${escapeHtml(item.severity)} · ${escapeHtml(item.priority)} · ${escapeHtml(item.phase)} · ${escapeHtml(item.effort)}</p></div>`).join("")}
      </div>
    </section>
    <section>
      <h2>Answers</h2>
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

function escapeHtml(value: string | number) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
