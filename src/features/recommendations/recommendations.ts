import { Answers, questions } from "@/data/assessment";
import { CategoryScore, getQuestionScore } from "@/features/scoring/scoring";

export type Recommendation = {
  id: string;
  category: string;
  severity: "Low" | "Medium" | "High" | "Critical";
  priority: "P1" | "P2" | "P3";
  title: string;
  description: string;
  recommendation: string;
  phase: "Phase 1" | "Phase 2" | "Phase 3";
  expectedImpact: string;
  effort: "Low" | "Medium" | "High";
};

const isNone = (value: unknown) => {
  if (Array.isArray(value)) return value.length === 0 || value.includes("None") || value.includes("none") || value.includes("no");
  return value === "None" || value === "none" || value === "no" || value === undefined;
};

const answerScore = (answers: Answers, questionId: string) => {
  const question = questions.find((item) => item.id === questionId);
  return question ? getQuestionScore(question, answers[questionId]) : 0;
};

const lowScore = (answers: Answers, questionId: string, threshold = 3) => answerScore(answers, questionId) < threshold;

export function generateRecommendations(answers: Answers, categoryScores: CategoryScore[]): Recommendation[] {
  const rules: Array<[boolean, Recommendation]> = [
    [lowScore(answers, "sec_sast_tool", 3), {
      id: "DEVSECOPS-SAST-001", category: "DevSecOps", severity: "High", priority: "P1", title: "SAST çözümü standardize edilmeli", description: "Statik kod güvenlik analizi kurumsal standart olarak görünmüyor.", recommendation: "SonarQube, Semgrep veya kurumsal SAST aracı PR aşamasında quality gate ile zorunlu hale getirilmeli.", phase: "Phase 2", expectedImpact: "Kod seviyesindeki kritik açıkların merge öncesi yakalanması", effort: "Medium"
    }],
    [lowScore(answers, "sec_sast_gate", 4), {
      id: "DEVSECOPS-SAST-GATE-001", category: "DevSecOps", severity: "High", priority: "P1", title: "SAST bulguları karar mekanizmasına bağlanmalı", description: "Güvenlik tarama sonuçları merge veya release kararını yeterince etkilemiyor.", recommendation: "Risk eşiği, exception, SLA ve remediation takibi olan bloklayıcı quality gate modeli kurulmalı.", phase: "Phase 2", expectedImpact: "Yüksek riskli açıkların üretime taşınmasının engellenmesi", effort: "Medium"
    }],
    [lowScore(answers, "sec_dast_tool", 3), {
      id: "DEVSECOPS-DAST-001", category: "DevSecOps", severity: "High", priority: "P1", title: "DAST çözümü devreye alınmalı", description: "Web ve API uygulamaları için dinamik güvenlik taraması yapılmamaktadır.", recommendation: "OWASP ZAP veya kurumsal DAST aracı test ortamı deploy sonrası pipeline'a entegre edilmeli.", phase: "Phase 2", expectedImpact: "Release öncesi runtime güvenlik açıklarının tespit edilmesi", effort: "Medium"
    }],
    [lowScore(answers, "sec_sca_tool", 4), {
      id: "DEVSECOPS-SCA-001", category: "DevSecOps", severity: "High", priority: "P1", title: "SCA ve dependency risk yönetimi kurulmalı", description: "Açık kaynak bağımlılıkları CVE ve lisans açısından görünür değil.", recommendation: "Snyk, Mend, Nexus IQ veya Dependabot tabanlı SCA süreci release gate ile bağlanmalı.", phase: "Phase 2", expectedImpact: "Kritik CVE ve lisans risklerinin üretime taşınmasının engellenmesi", effort: "Medium"
    }],
    [lowScore(answers, "sec_secret_scan", 4), {
      id: "DEVSECOPS-SECRET-001", category: "DevSecOps", severity: "Critical", priority: "P1", title: "Secret scanning zorunlu hale getirilmeli", description: "Repository ve PR süreçlerinde secret sızıntısı kontrolü eksik.", recommendation: "GitLeaks, GitGuardian veya GitHub Secret Scanning PR ve scheduled scan olarak uygulanmalı; rotation süreci tanımlanmalı.", phase: "Phase 1", expectedImpact: "Credential sızıntısı ve lateral movement riskinin azaltılması", effort: "Low"
    }],
    [lowScore(answers, "sec_container_scan", 4), {
      id: "DEVSECOPS-CONTAINER-001", category: "DevSecOps", severity: "High", priority: "P1", title: "Container image scanning eklenmeli", description: "Container imajları üretime çıkmadan önce CVE açısından taranmıyor.", recommendation: "Trivy, Aqua veya Prisma taraması registry ve pipeline aşamasında gate olarak uygulanmalı.", phase: "Phase 2", expectedImpact: "Kritik image CVE'lerinin deploy öncesi durdurulması", effort: "Medium"
    }],
    [lowScore(answers, "cd_prod_approval", 4), {
      id: "CD-APPROVAL-001", category: "CD & Deployment", severity: "Critical", priority: "P1", title: "Production approval gate kurulmalı", description: "Production deploy için denetlenebilir onay mekanizması yok.", recommendation: "Jira, ITSM veya pipeline approval gate audit trail ile zorunlu hale getirilmeli.", phase: "Phase 1", expectedImpact: "Yetkisiz ve kontrolsüz production değişikliklerinin önlenmesi", effort: "Low"
    }],
    [lowScore(answers, "cd_rollback", 4), {
      id: "CD-ROLLBACK-001", category: "CD & Deployment", severity: "High", priority: "P1", title: "Rollback stratejisi test edilmeli", description: "Rollback süreci tanımlı veya kanıtlanmış değil.", recommendation: "Her kritik servis için rollback runbook, otomasyon ve düzenli tatbikat eklenmeli.", phase: "Phase 1", expectedImpact: "Deployment hatalarında toparlanma süresinin kısalması", effort: "Medium"
    }],
    [isNone(answers.obs_monitoring), {
      id: "OBS-MON-001", category: "Observability", severity: "Critical", priority: "P1", title: "Monitoring standardı oluşturulmalı", description: "Kritik servislerin metrik ve alarm görünürlüğü eksik.", recommendation: "Prometheus/Grafana veya mevcut APM standardize edilerek dashboard ve alert severity modeli tanımlanmalı.", phase: "Phase 1", expectedImpact: "Incident tespit ve müdahale süresinin düşmesi", effort: "Medium"
    }],
    [lowScore(answers, "obs_logging", 4), {
      id: "OBS-LOG-001", category: "Observability", severity: "High", priority: "P2", title: "Merkezi log yönetimi kurulmalı", description: "Loglar korelasyon ve denetim için merkezi görünür değil.", recommendation: "OpenSearch, ELK, Splunk veya Loki ile ortak log standardı ve retention politikası uygulanmalı.", phase: "Phase 2", expectedImpact: "RCA ve audit süreçlerinin hızlanması", effort: "Medium"
    }],
    [lowScore(answers, "obs_slo_alerting", 4), {
      id: "OBS-SLO-001", category: "Observability", severity: "High", priority: "P2", title: "SLO ve alarm modeli netleştirilmeli", description: "Alarm severity, aksiyon ve SLO hedefleri kritik servislerde yeterince tanımlı değil.", recommendation: "Kritik servisler için SLI/SLO, escalation, alert ownership ve error budget yaklaşımı oluşturulmalı.", phase: "Phase 2", expectedImpact: "Alarm gürültüsünün azalması ve müdahale önceliğinin netleşmesi", effort: "Medium"
    }],
    [lowScore(answers, "scm_pr_policy", 4), {
      id: "SCM-PR-001", category: "Source Control Management", severity: "High", priority: "P1", title: "Pull Request policy zorunlu olmalı", description: "Kod değişikliklerinde review ve policy enforcement eksik.", recommendation: "Minimum reviewer, status check ve branch protection tüm kritik repolarda zorunlu hale getirilmeli.", phase: "Phase 1", expectedImpact: "Kalite ve güvenlik kontrollerinin merge öncesi işletilmesi", effort: "Low"
    }],
    [lowScore(answers, "test_api_automation", 3), {
      id: "TEST-API-001", category: "Test Automation", severity: "High", priority: "P2", title: "API test otomasyonu güçlendirilmeli", description: "API ve entegrasyon testleri pipeline kararlarında yeterince kullanılmıyor.", recommendation: "Kritik servisler için API/contract test setleri pipeline gate olarak tasarlanmalı.", phase: "Phase 2", expectedImpact: "Entegrasyon hatalarının test ortamında erken yakalanması", effort: "Medium"
    }],
    [lowScore(answers, "architecture_api_gateway", 3), {
      id: "ARCH-API-001", category: "Mimari ve Entegrasyon", severity: "Medium", priority: "P2", title: "API yönetimi merkezi hale getirilmeli", description: "Servis çağrıları ve dış entegrasyonlar merkezi policy ile yönetilmiyor.", recommendation: "API Gateway, authentication, rate limit, logging ve tüketici bazlı görünürlük için referans mimari oluşturulmalı.", phase: "Phase 2", expectedImpact: "Entegrasyon risklerinin ve servisler arası bağımlılıkların azalması", effort: "High"
    }],
    [lowScore(answers, "gov_audit_evidence", 4), {
      id: "GOV-AUDIT-001", category: "Governance", severity: "Medium", priority: "P2", title: "Audit evidence otomatikleştirilmeli", description: "Build, test, onay ve deployment kanıtları merkezi ve tekrar üretilebilir değil.", recommendation: "Pipeline, SCM, ITSM ve güvenlik araçlarından evidence toplayan standart raporlama akışı kurulmalı.", phase: "Phase 3", expectedImpact: "Denetim hazırlık süresinin kısalması ve güvenilirlik artışı", effort: "Medium"
    }]
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
    } satisfies Recommendation));

  return [...generated, ...lowCategories].slice(0, 10);
}

export function buildRoadmap(recommendations: Recommendation[]) {
  return (["Phase 1", "Phase 2", "Phase 3"] as const).map((phase) => ({
    phase,
    title: phase === "Phase 1" ? "Foundation" : phase === "Phase 2" ? "Automation & Security" : "Advanced Governance & Optimization",
    duration: phase === "Phase 1" ? "0-30 gün" : phase === "Phase 2" ? "31-90 gün" : "90+ gün",
    items: recommendations.filter((item) => item.phase === phase)
  }));
}
