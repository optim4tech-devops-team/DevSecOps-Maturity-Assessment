import { createServer } from "node:http";
import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { Pool } from "pg";

const port = Number(process.env.BACKEND_PORT || process.env.PORT || 3001);
const memoryStore = new Map();
let pool;

const __dirname = dirname(fileURLToPath(import.meta.url));
const assessmentBank = JSON.parse(readFileSync(resolve(__dirname, "../src/data/assessment-bank.json"), "utf8"));
const { categories, questions } = assessmentBank;

const defaultProfile = {
  companyName: "Optim4Tech Demo",
  sector: "Technology",
  employeeCount: 420,
  developerCount: 85,
  devopsEngineerCount: 9,
  applicationCount: 72,
  productionApplicationCount: 38,
  criticalApplicationCount: 11,
  cloudProvider: "Hybrid / Kubernetes",
  kubernetesUsage: "Production",
  sourceControlTool: "GitHub / Azure DevOps",
  cicdTool: "GitHub Actions / Azure Pipelines",
  itsmTool: "Jira Service Management",
  securityTools: "SonarQube, Trivy",
  monitoringTools: "Prometheus, Grafana, Loki"
};

const defaultAnswers = Object.fromEntries(questions.map((question) => {
  if (question.type === "numeric") return [question.id, 0];
  if (question.type === "tool" || question.type === "multi") return [question.id, []];
  return [question.id, ""];
}));

function getPool() {
  if (!process.env.DATABASE_URL) return undefined;
  pool ??= new Pool({ connectionString: process.env.DATABASE_URL });
  return pool;
}

async function ensureSchema() {
  const db = getPool();
  if (!db) return;
  await db.query(`
    create table if not exists assessments (
      id uuid primary key,
      token text not null unique,
      status text not null,
      organization jsonb not null,
      answers jsonb not null,
      score jsonb,
      recommendations jsonb,
      ai_summary text,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now(),
      completed_at timestamptz
    )
  `);
}

function rowToRecord(row) {
  return {
    id: row.id,
    token: row.token,
    status: row.status,
    organization: row.organization,
    answers: row.answers,
    score: row.score ?? undefined,
    recommendations: row.recommendations ?? undefined,
    aiSummary: row.ai_summary ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    completedAt: row.completed_at ?? undefined
  };
}

function newToken() {
  return randomUUID().replaceAll("-", "");
}

async function createAssessment(organization = {}) {
  await ensureSchema();
  const record = {
    id: randomUUID(),
    token: newToken(),
    status: "Draft",
    organization: { ...defaultProfile, ...organization },
    answers: defaultAnswers,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  const db = getPool();
  if (!db) {
    memoryStore.set(record.token, record);
    return record;
  }
  await db.query(
    "insert into assessments (id, token, status, organization, answers) values ($1, $2, $3, $4, $5)",
    [record.id, record.token, record.status, JSON.stringify(record.organization), JSON.stringify(record.answers)]
  );
  return record;
}

async function listAssessments() {
  await ensureSchema();
  const db = getPool();
  if (!db) return [...memoryStore.values()].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  const result = await db.query("select * from assessments order by updated_at desc limit 100");
  return result.rows.map(rowToRecord);
}

async function getAssessmentByToken(accessToken) {
  await ensureSchema();
  const db = getPool();
  if (!db) return memoryStore.get(accessToken);
  const result = await db.query("select * from assessments where token = $1", [accessToken]);
  return result.rows[0] ? rowToRecord(result.rows[0]) : undefined;
}

async function updateAssessmentByToken(accessToken, patch) {
  const existing = await getAssessmentByToken(accessToken);
  if (!existing) return undefined;
  const next = {
    ...existing,
    ...patch,
    organization: patch.organization ? { ...existing.organization, ...patch.organization } : existing.organization,
    answers: patch.answers ? { ...existing.answers, ...patch.answers } : existing.answers,
    updatedAt: new Date().toISOString(),
    completedAt: patch.status === "Completed" ? new Date().toISOString() : existing.completedAt
  };
  const db = getPool();
  if (!db) {
    memoryStore.set(accessToken, next);
    return next;
  }
  const result = await db.query(
    `update assessments
     set status = $2, organization = $3, answers = $4, score = $5, recommendations = $6, ai_summary = $7,
         updated_at = now(), completed_at = case when $2 = 'Completed' then now() else completed_at end
     where token = $1
     returning *`,
    [
      accessToken,
      next.status,
      JSON.stringify(next.organization),
      JSON.stringify(next.answers),
      next.score ? JSON.stringify(next.score) : null,
      next.recommendations ? JSON.stringify(next.recommendations) : null,
      next.aiSummary ?? null
    ]
  );
  return rowToRecord(result.rows[0]);
}

async function deleteAssessmentByToken(accessToken) {
  await ensureSchema();
  const db = getPool();
  if (!db) return memoryStore.delete(accessToken);
  const result = await db.query("delete from assessments where token = $1", [accessToken]);
  return (result.rowCount ?? 0) > 0;
}

function getMaturityLevel(score) {
  if (score <= 20) return "Level 1 - Initial";
  if (score <= 40) return "Level 2 - Developing";
  if (score <= 60) return "Level 3 - Defined";
  if (score <= 80) return "Level 4 - Managed";
  return "Level 5 - Optimized";
}

function getQuestionScore(question, value) {
  if (question.type === "numeric" || question.type === "text") return 0;
  if (!question.options || value === undefined || value === "") return 0;
  if (Array.isArray(value)) {
    if (value.length === 0) return 0;
    const selected = question.options.filter((option) => value.includes(option.value));
    return Math.min(5, selected.reduce((max, option) => Math.max(max, option.score), 0));
  }
  return question.options.find((option) => option.value === value)?.score ?? 0;
}

function calculateAssessment(answers) {
  const categoryScores = categories.map((category) => {
    const categoryQuestions = questions.filter((question) => question.categoryId === category.id && question.type !== "numeric" && question.type !== "text");
    const answered = categoryQuestions.filter((question) => {
      const value = answers[question.id];
      return Array.isArray(value) ? value.length > 0 : value !== undefined && value !== "";
    }).length;
    const weighted = categoryQuestions.reduce((sum, question) => sum + getQuestionScore(question, answers[question.id]) * question.weight, 0);
    const max = categoryQuestions.reduce((sum, question) => sum + 5 * question.weight, 0);
    const score = max === 0 ? 0 : Math.round((weighted / max) * 100);
    return {
      category,
      score,
      level: getMaturityLevel(score),
      answered,
      total: categoryQuestions.length,
      risk: score < 30 ? "Critical" : score < 50 ? "High" : score < 70 ? "Medium" : "Low"
    };
  });
  const weightedOverall = categoryScores.reduce((sum, item) => sum + item.score * item.category.weight, 0);
  const totalWeight = categories.reduce((sum, category) => sum + category.weight, 0);
  const totalQuestions = questions.filter((question) => question.type !== "numeric" && question.type !== "text").length;
  const answered = questions.filter((question) => {
    if (question.type === "numeric" || question.type === "text") return false;
    const value = answers[question.id];
    return Array.isArray(value) ? value.length > 0 : value !== undefined && value !== "";
  }).length;
  const overallScore = Math.round(weightedOverall / totalWeight);
  return { overallScore, maturityLevel: getMaturityLevel(overallScore), categoryScores, completion: Math.round((answered / totalQuestions) * 100) };
}

const isNone = (value) => {
  if (Array.isArray(value)) return value.length === 0 || value.includes("None") || value.includes("none") || value.includes("no");
  return value === "None" || value === "none" || value === "no" || value === undefined;
};

function answerScore(answers, questionId) {
  const question = questions.find((item) => item.id === questionId);
  return question ? getQuestionScore(question, answers[questionId]) : 0;
}

function lowScore(answers, questionId, threshold = 3) {
  return answerScore(answers, questionId) < threshold;
}

function generateRecommendations(answers, categoryScores) {
  const rules = [
    [lowScore(answers, "sec_sast_tool", 3), { id: "DEVSECOPS-SAST-001", category: "DevSecOps", severity: "High", priority: "P1", title: "SAST çözümü standardize edilmeli", description: "Statik kod güvenlik analizi kurumsal standart olarak görünmüyor.", recommendation: "SonarQube, Semgrep veya kurumsal SAST aracı PR aşamasında quality gate ile zorunlu hale getirilmeli.", phase: "Phase 2", expectedImpact: "Kod seviyesindeki kritik açıkların merge öncesi yakalanması", effort: "Medium" }],
    [lowScore(answers, "sec_sast_gate", 4), { id: "DEVSECOPS-SAST-GATE-001", category: "DevSecOps", severity: "High", priority: "P1", title: "SAST bulguları karar mekanizmasına bağlanmalı", description: "Güvenlik tarama sonuçları merge veya release kararını yeterince etkilemiyor.", recommendation: "Risk eşiği, exception, SLA ve remediation takibi olan bloklayıcı quality gate modeli kurulmalı.", phase: "Phase 2", expectedImpact: "Yüksek riskli açıkların üretime taşınmasının engellenmesi", effort: "Medium" }],
    [lowScore(answers, "sec_dast_tool", 3), { id: "DEVSECOPS-DAST-001", category: "DevSecOps", severity: "High", priority: "P1", title: "DAST çözümü devreye alınmalı", description: "Web ve API uygulamaları için dinamik güvenlik taraması yapılmamaktadır.", recommendation: "OWASP ZAP veya kurumsal DAST aracı test ortamı deploy sonrası pipeline'a entegre edilmeli.", phase: "Phase 2", expectedImpact: "Release öncesi runtime güvenlik açıklarının tespit edilmesi", effort: "Medium" }],
    [lowScore(answers, "sec_sca_tool", 4), { id: "DEVSECOPS-SCA-001", category: "DevSecOps", severity: "High", priority: "P1", title: "SCA ve dependency risk yönetimi kurulmalı", description: "Açık kaynak bağımlılıkları CVE ve lisans açısından görünür değil.", recommendation: "Snyk, Mend, Nexus IQ veya Dependabot tabanlı SCA süreci release gate ile bağlanmalı.", phase: "Phase 2", expectedImpact: "Kritik CVE ve lisans risklerinin üretime taşınmasının engellenmesi", effort: "Medium" }],
    [lowScore(answers, "sec_secret_scan", 4), { id: "DEVSECOPS-SECRET-001", category: "DevSecOps", severity: "Critical", priority: "P1", title: "Secret scanning zorunlu hale getirilmeli", description: "Repository ve PR süreçlerinde secret sızıntısı kontrolü eksik.", recommendation: "GitLeaks, GitGuardian veya GitHub Secret Scanning PR ve scheduled scan olarak uygulanmalı; rotation süreci tanımlanmalı.", phase: "Phase 1", expectedImpact: "Credential sızıntısı ve lateral movement riskinin azaltılması", effort: "Low" }],
    [lowScore(answers, "sec_container_scan", 4), { id: "DEVSECOPS-CONTAINER-001", category: "DevSecOps", severity: "High", priority: "P1", title: "Container image scanning eklenmeli", description: "Container imajları üretime çıkmadan önce CVE açısından taranmıyor.", recommendation: "Trivy, Aqua veya Prisma taraması registry ve pipeline aşamasında gate olarak uygulanmalı.", phase: "Phase 2", expectedImpact: "Kritik image CVE'lerinin deploy öncesi durdurulması", effort: "Medium" }],
    [lowScore(answers, "cd_prod_approval", 4), { id: "CD-APPROVAL-001", category: "CD & Deployment", severity: "Critical", priority: "P1", title: "Production approval gate kurulmalı", description: "Production deploy için denetlenebilir onay mekanizması yok.", recommendation: "Jira, ITSM veya pipeline approval gate audit trail ile zorunlu hale getirilmeli.", phase: "Phase 1", expectedImpact: "Yetkisiz ve kontrolsüz production değişikliklerinin önlenmesi", effort: "Low" }],
    [lowScore(answers, "cd_rollback", 4), { id: "CD-ROLLBACK-001", category: "CD & Deployment", severity: "High", priority: "P1", title: "Rollback stratejisi test edilmeli", description: "Rollback süreci tanımlı veya kanıtlanmış değil.", recommendation: "Her kritik servis için rollback runbook, otomasyon ve düzenli tatbikat eklenmeli.", phase: "Phase 1", expectedImpact: "Deployment hatalarında toparlanma süresinin kısalması", effort: "Medium" }],
    [isNone(answers.obs_monitoring), { id: "OBS-MON-001", category: "Observability", severity: "Critical", priority: "P1", title: "Monitoring standardı oluşturulmalı", description: "Kritik servislerin metrik ve alarm görünürlüğü eksik.", recommendation: "Prometheus/Grafana veya mevcut APM standardize edilerek dashboard ve alert severity modeli tanımlanmalı.", phase: "Phase 1", expectedImpact: "Incident tespit ve müdahale süresinin düşmesi", effort: "Medium" }],
    [lowScore(answers, "obs_logging", 4), { id: "OBS-LOG-001", category: "Observability", severity: "High", priority: "P2", title: "Merkezi log yönetimi kurulmalı", description: "Loglar korelasyon ve denetim için merkezi görünür değil.", recommendation: "OpenSearch, ELK, Splunk veya Loki ile ortak log standardı ve retention politikası uygulanmalı.", phase: "Phase 2", expectedImpact: "RCA ve audit süreçlerinin hızlanması", effort: "Medium" }],
    [lowScore(answers, "obs_slo_alerting", 4), { id: "OBS-SLO-001", category: "Observability", severity: "High", priority: "P2", title: "SLO ve alarm modeli netleştirilmeli", description: "Alarm severity, aksiyon ve SLO hedefleri kritik servislerde yeterince tanımlı değil.", recommendation: "Kritik servisler için SLI/SLO, escalation, alert ownership ve error budget yaklaşımı oluşturulmalı.", phase: "Phase 2", expectedImpact: "Alarm gürültüsünün azalması ve müdahale önceliğinin netleşmesi", effort: "Medium" }],
    [lowScore(answers, "scm_pr_policy", 4), { id: "SCM-PR-001", category: "Source Control Management", severity: "High", priority: "P1", title: "Pull Request policy zorunlu olmalı", description: "Kod değişikliklerinde review ve policy enforcement eksik.", recommendation: "Minimum reviewer, status check ve branch protection tüm kritik repolarda zorunlu hale getirilmeli.", phase: "Phase 1", expectedImpact: "Kalite ve güvenlik kontrollerinin merge öncesi işletilmesi", effort: "Low" }],
    [lowScore(answers, "test_api_automation", 3), { id: "TEST-API-001", category: "Test Automation", severity: "High", priority: "P2", title: "API test otomasyonu güçlendirilmeli", description: "API ve entegrasyon testleri pipeline kararlarında yeterince kullanılmıyor.", recommendation: "Kritik servisler için API/contract test setleri pipeline gate olarak tasarlanmalı.", phase: "Phase 2", expectedImpact: "Entegrasyon hatalarının test ortamında erken yakalanması", effort: "Medium" }],
    [lowScore(answers, "architecture_api_gateway", 3), { id: "ARCH-API-001", category: "Mimari ve Entegrasyon", severity: "Medium", priority: "P2", title: "API yönetimi merkezi hale getirilmeli", description: "Servis çağrıları ve dış entegrasyonlar merkezi policy ile yönetilmiyor.", recommendation: "API Gateway, authentication, rate limit, logging ve tüketici bazlı görünürlük için referans mimari oluşturulmalı.", phase: "Phase 2", expectedImpact: "Entegrasyon risklerinin ve servisler arası bağımlılıkların azalması", effort: "High" }],
    [lowScore(answers, "gov_audit_evidence", 4), { id: "GOV-AUDIT-001", category: "Governance", severity: "Medium", priority: "P2", title: "Audit evidence otomatikleştirilmeli", description: "Build, test, onay ve deployment kanıtları merkezi ve tekrar üretilebilir değil.", recommendation: "Pipeline, SCM, ITSM ve güvenlik araçlarından evidence toplayan standart raporlama akışı kurulmalı.", phase: "Phase 3", expectedImpact: "Denetim hazırlık süresinin kısalması ve güvenilirlik artışı", effort: "Medium" }]
  ];
  const generated = rules.filter(([condition]) => condition).map(([, recommendation]) => recommendation);
  const lowCategories = categoryScores
    .filter((item) => item.score > 0 && item.score < 45)
    .slice(0, 4)
    .map((item) => ({
      id: `CAT-${item.category.id.toUpperCase()}-001`,
      category: item.category.name,
      severity: item.score < 30 ? "Critical" : "High",
      priority: item.score < 30 ? "P1" : "P2",
      title: `${item.category.name} olgunluğu yükseltilmeli`,
      description: `${item.category.name} kategorisi ${item.score}/100 skorunda ve kurumsal hedefin altında.`,
      recommendation: "Kategori için minimum standart, ölçüm metriği, sahiplik ve 90 günlük iyileştirme planı oluşturulmalı.",
      phase: item.score < 30 ? "Phase 1" : "Phase 2",
      expectedImpact: "Kategori bazlı risklerin görünür ve yönetilebilir hale gelmesi",
      effort: "Medium"
    }));
  return [...generated, ...lowCategories].slice(0, 10);
}

function fallbackSummary(payload) {
  const topGaps = payload.gaps.slice(0, 3).join(", ") || "kritik gap bulunmadı";
  return `${payload.companyName} için genel olgunluk skoru ${payload.overallScore}/100 (${payload.maturityLevel}). Öncelikli iyileştirme alanları: ${topGaps}. İlk 30 günde production approval, rollback, PR policy ve temel güvenlik tarama kontrolleri net sahiplik ve ölçülebilir gate'ler ile ele alınmalıdır.`;
}

function turkishPrompt(payload) {
  return `Sadece Türkçe yanıt ver. Markdown başlıkları kullanma. 5-7 cümlelik kısa bir executive summary yaz.
Şirket: ${payload.companyName}
Genel skor: ${payload.overallScore}/100
Olgunluk seviyesi: ${payload.maturityLevel}
Öncelikli gap'ler: ${payload.gaps.join("; ") || "Yok"}
Öneriler: ${payload.recommendations.join("; ") || "Yok"}
Çıktı formatı: Önce mevcut durum, sonra en kritik 3 aksiyon, sonra beklenen etki. Genel pazarlama dili kullanma.`;
}

function cleanSummary(summary) {
  return summary.replace(/<think>[\s\S]*?<\/think>/gi, "").replace(/^\s*(Executive Summary|Özet|Sonuç)\s*:?\s*/i, "").trim();
}

async function generateAiSummary(payload) {
  const baseUrl = process.env.LOCAL_AI_BASE_URL;
  const model = process.env.LOCAL_AI_MODEL ?? "qwen3:4b";
  if (!baseUrl) return { summary: fallbackSummary(payload), provider: "fallback" };
  const normalizedBaseUrl = baseUrl.replace(/\/$/, "");
  try {
    const response = await fetch(`${normalizedBaseUrl}/api/chat`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        model,
        stream: false,
        messages: [
          { role: "system", content: "Sadece Türkçe yazan, kısa ve aksiyon odaklı DevOps/DevSecOps assessment danışmanısın. İngilizce başlık veya madde kullanma." },
          { role: "user", content: turkishPrompt(payload) }
        ]
      })
    });
    if (!response.ok) throw new Error(`ollama chat returned ${response.status}`);
    const data = await response.json();
    const summary = cleanSummary(data.message?.content?.trim() || "") || fallbackSummary(payload);
    return { summary, provider: "local-ai" };
  } catch (error) {
    return { summary: fallbackSummary(payload), provider: "fallback", warning: error instanceof Error ? error.message : "AI request failed" };
  }
}

function generateMarkdownReport(profile, score, recommendations, answers) {
  const topCategories = [...score.categoryScores].sort((a, b) => a.score - b.score).slice(0, 5);
  const formatAnswer = (value) => Array.isArray(value) ? value.join(", ") : String(value ?? "-");
  const answerLines = questions.map((question) => `| ${question.code} | ${question.text} | ${formatAnswer(answers[question.id])} | ${formatAnswer(answers[`${question.id}_note`])} |`);
  return `# ${profile.companyName} DevOps & DevSecOps Maturity Report

## Executive Summary

- Overall Score: ${score.overallScore}/100
- Maturity Level: ${score.maturityLevel}
- Completion: ${score.completion}%
- Critical Applications: ${profile.criticalApplicationCount}

## Lowest Categories

${topCategories.map((item) => `- ${item.category.name}: ${item.score}/100 (${item.risk})`).join("\n")}

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

async function readJson(request) {
  const chunks = [];
  for await (const chunk of request) chunks.push(chunk);
  if (chunks.length === 0) return {};
  return JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}");
}

function sendJson(response, body, status = 200) {
  const payload = JSON.stringify(body);
  response.writeHead(status, { "content-type": "application/json; charset=utf-8", "content-length": Buffer.byteLength(payload) });
  response.end(payload);
}

function sendText(response, body, headers = {}) {
  response.writeHead(200, { "content-type": "text/plain; charset=utf-8", ...headers });
  response.end(body);
}

function notFound(response) {
  sendJson(response, { message: "Not found" }, 404);
}

async function handleRequest(request, response) {
  const url = new URL(request.url ?? "/", "http://assessment-backend");
  const path = url.pathname;

  try {
    if (request.method === "GET" && path === "/healthz") return sendJson(response, { ok: true, service: "assessment-backend" });

    if (request.method === "POST" && path === "/api/auth/login") {
      const { username, password } = await readJson(request);
      const expectedUser = process.env.ADMIN_USERNAME ?? "admin";
      const expectedPass = process.env.ADMIN_PASSWORD ?? "Optim4Tech@2026!";
      if (username === expectedUser && password === expectedPass) return sendJson(response, { ok: true, token: "assessment-admin-session-v2" });
      return sendJson(response, { ok: false, message: "Invalid credentials" }, 401);
    }

    if (request.method === "GET" && path === "/api/assessments") return sendJson(response, await listAssessments());

    if (request.method === "POST" && path === "/api/assessments") {
      const body = await readJson(request);
      return sendJson(response, await createAssessment(body.organization ?? {}), 201);
    }

    const tokenMatch = path.match(/^\/api\/assessments\/token\/([^/]+)$/);
    if (tokenMatch && request.method === "GET") {
      const record = await getAssessmentByToken(tokenMatch[1]);
      return record ? sendJson(response, record) : sendJson(response, { message: "Assessment not found" }, 404);
    }
    if (tokenMatch && request.method === "PUT") {
      const body = await readJson(request);
      const score = calculateAssessment(body.answers);
      const recommendations = generateRecommendations(body.answers, score.categoryScores);
      const record = await updateAssessmentByToken(tokenMatch[1], {
        organization: body.organization,
        answers: body.answers,
        score,
        recommendations,
        status: body.status ?? "InProgress"
      });
      return record ? sendJson(response, record) : sendJson(response, { message: "Assessment not found" }, 404);
    }
    if (tokenMatch && request.method === "DELETE") {
      const deleted = await deleteAssessmentByToken(tokenMatch[1]);
      return deleted ? sendJson(response, { ok: true }) : sendJson(response, { message: "Assessment not found" }, 404);
    }

    const completeMatch = path.match(/^\/api\/assessments\/token\/([^/]+)\/complete$/);
    if (completeMatch && request.method === "POST") {
      const existing = await getAssessmentByToken(completeMatch[1]);
      if (!existing) return sendJson(response, { message: "Assessment not found" }, 404);
      const score = calculateAssessment(existing.answers);
      const recommendations = generateRecommendations(existing.answers, score.categoryScores);
      return sendJson(response, await updateAssessmentByToken(completeMatch[1], { score, recommendations, status: "Completed" }));
    }

    const exportMatch = path.match(/^\/api\/export\/([^/]+)\/markdown$/);
    if (exportMatch && request.method === "GET") {
      const record = await getAssessmentByToken(exportMatch[1]);
      if (!record) return sendJson(response, { message: "Assessment not found" }, 404);
      const score = record.score ?? calculateAssessment(record.answers);
      const recommendations = record.recommendations ?? generateRecommendations(record.answers, score.categoryScores);
      const filename = `${record.organization.companyName.replaceAll(" ", "-").toLowerCase()}-assessment.md`;
      return sendText(response, generateMarkdownReport(record.organization, score, recommendations, record.answers), {
        "content-type": "text/markdown; charset=utf-8",
        "content-disposition": `attachment; filename="${filename}"`
      });
    }

    if (request.method === "POST" && path === "/api/ai-summary") {
      const payload = await readJson(request);
      const result = await generateAiSummary(payload);
      await updateAssessmentByToken(payload.token, { aiSummary: result.summary });
      return sendJson(response, result);
    }

    return notFound(response);
  } catch (error) {
    return sendJson(response, { message: error instanceof Error ? error.message : "Internal server error" }, 500);
  }
}

await ensureSchema();
createServer(handleRequest).listen(port, "0.0.0.0", () => {
  console.log(`assessment-backend listening on ${port}`);
});
