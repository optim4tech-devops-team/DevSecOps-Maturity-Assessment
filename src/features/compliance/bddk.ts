import { Answers, OrganizationProfile } from "@/data/assessment";
import { getQuestionScore } from "@/features/scoring/scoring";
import { questions } from "@/data/assessment";

export type ComplianceStatus = "Aligned" | "Partial" | "Gap" | "EvidenceRequired" | "NotApplicable";

export type BddkControl = {
  id: string;
  source: "BDDK-34360" | "BDDK-39257";
  article: string;
  title: string;
  summary: string;
  questionIds: string[];
  evidence: string[];
  reportWeight: "High" | "Medium" | "Low";
};

export type BddkComplianceResult = {
  active: boolean;
  disclaimer: string;
  overallStatus: ComplianceStatus;
  alignedCount: number;
  partialCount: number;
  gapCount: number;
  evidenceRequiredCount: number;
  controls: Array<BddkControl & {
    status: ComplianceStatus;
    score: number;
    signals: string[];
    gaps: string[];
  }>;
};

const bddkControls: BddkControl[] = [
  {
    id: "bddk-34360-04-05",
    source: "BDDK-34360",
    article: "Madde 4-5",
    title: "BS yönetişimi, politika ve kontrol yapısı",
    summary: "Yönetim sorumluluğu, politika/prosedür seti, kontrol sahipliği ve kurumsal standartların işletilmesi.",
    questionIds: ["org_devops_ownership", "gov_audit_evidence", "gov_rbac_sod", "release_hotfix"],
    evidence: ["Politika/prosedür dokümanları", "Kontrol sahipliği matrisi", "Kurumsal standard evidence"],
    reportWeight: "High"
  },
  {
    id: "bddk-34360-06-07",
    source: "BDDK-34360",
    article: "Madde 6-7",
    title: "Varlık sınıflandırması ve BS risk yönetimi",
    summary: "Bilgi varlıklarının kritiklik sınıflandırması, risk etkisi ve iyileştirme takibinin ölçülebilir olması.",
    questionIds: ["org_critical_app_count", "release_calendar", "release_hotfix"],
    evidence: ["Uygulama envanteri", "Kritiklik kriterleri", "Risk/istisna kayıtları"],
    reportWeight: "High"
  },
  {
    id: "bddk-34360-11-13",
    source: "BDDK-34360",
    article: "Madde 11-13",
    title: "Erişim kontrolü, görev ayrılığı ve iz kayıtları",
    summary: "RBAC, approval, segregation of duties, audit log ve iz kayıtlarının denetlenebilirliği.",
    questionIds: ["cd_prod_approval", "gov_rbac_sod", "gov_audit_evidence", "obs_logging"],
    evidence: ["RBAC matrisi", "Approval kayıtları", "Audit log ve retention kanıtları"],
    reportWeight: "High"
  },
  {
    id: "bddk-34360-14-16",
    source: "BDDK-34360",
    article: "Madde 14-16",
    title: "Ağ, sistem güvenliği ve zafiyet yönetimi",
    summary: "Network/cluster güvenliği, hardening, SAST, DAST, SCA, secret ve container güvenlik kontrolleri.",
    questionIds: ["sec_sast_gate", "sec_dast_tool", "sec_sca_tool", "sec_secret_scan", "k8s_container_standard", "k8s_policy_admission"],
    evidence: ["Security scan çıktıları", "Policy/admission kayıtları", "Remediation SLA ve exception kayıtları"],
    reportWeight: "High"
  },
  {
    id: "bddk-34360-21-24",
    source: "BDDK-34360",
    article: "Madde 21-24",
    title: "Proje, geliştirme/test ve değişiklik yönetimi",
    summary: "SDLC talep kanalı, test/production ayrımı, değişiklik onayı, PR ve rollback izlenebilirliği.",
    questionIds: ["sdlc_demand_channel", "sdlc_dor_dod", "scm_branch_strategy", "scm_pr_policy", "ci_pipeline_as_code", "cd_deployment_automation", "release_calendar"],
    evidence: ["Jira/change kayıtları", "PR/review kayıtları", "Pipeline ve release evidence"],
    reportWeight: "High"
  },
  {
    id: "bddk-34360-26-28",
    source: "BDDK-34360",
    article: "Madde 26-28",
    title: "Operasyon, süreklilik ve dayanıklılık",
    summary: "Operasyonel izleme, incident, backup/restore, DR testleri, RTO/RPO ve SLO yönetimi.",
    questionIds: ["infra_backup_dr", "obs_monitoring", "obs_slo_alerting", "ops_incident", "ops_rca_learning"],
    evidence: ["DR test raporları", "Incident/RCA kayıtları", "SLO ve alarm kanıtları"],
    reportWeight: "Medium"
  },
  {
    id: "bddk-34360-29",
    source: "BDDK-34360",
    article: "Madde 29",
    title: "Dış hizmet ve sağlayıcı riskleri",
    summary: "Cloud, SaaS, CI/CD, güvenlik ve observability sağlayıcılarının risk ve kontrol kapsamına alınması.",
    questionIds: ["infra_iac", "gov_audit_evidence", "gov_rbac_sod"],
    evidence: ["Sağlayıcı envanteri", "Sözleşmesel kontrol listesi", "Dış hizmet risk değerlendirmesi"],
    reportWeight: "Medium"
  },
  {
    id: "bddk-39257-reporting",
    source: "BDDK-39257",
    article: "Madde 5-6, 24, 28-33, 38",
    title: "Denetim kanıtı, önemlilik ve bulgu takip yöntemi",
    summary: "Bulguların önemlilik, kontrol zayıflığı, kanıt seviyesi ve aksiyon sahipliği ile raporlanması.",
    questionIds: ["gov_audit_evidence", "release_hotfix", "ops_rca_learning"],
    evidence: ["Kanıt seti", "Bulgu takip listesi", "Aksiyon sahibi ve hedef tarih"],
    reportWeight: "Medium"
  }
];

const questionById = new Map(questions.map((question) => [question.id, question]));

export function buildBddkCompliance(profile: OrganizationProfile, answers: Answers): BddkComplianceResult {
  const active = profile.sector === "Finance" && profile.industrySubtype === "Bank";
  if (!active) {
    return {
      active: false,
      disclaimer: "BDDK uyum matrisi yalnızca Finance / Bank profili seçildiğinde mevcut assessment cevaplarından otomatik üretilir.",
      overallStatus: "NotApplicable",
      alignedCount: 0,
      partialCount: 0,
      gapCount: 0,
      evidenceRequiredCount: 0,
      controls: []
    };
  }

  const controls = bddkControls.map((control) => {
    const values = control.questionIds.map((questionId) => {
      const question = questionById.get(questionId);
      if (!question) return undefined;
      const answer = answers[questionId];
      const answered = Array.isArray(answer) ? answer.length > 0 : answer !== undefined && answer !== "";
      return { question, answered, score: getQuestionScore(question, answer) };
    }).filter((item): item is NonNullable<typeof item> => Boolean(item));

    const answered = values.filter((item) => item.answered);
    const average = values.length === 0 ? 0 : Math.round((values.reduce((sum, item) => sum + item.score, 0) / (values.length * 5)) * 100);
    const status: ComplianceStatus = answered.length === 0 ? "EvidenceRequired" : average >= 75 ? "Aligned" : average >= 45 ? "Partial" : "Gap";
    const lowSignals = values.filter((item) => item.score < 3).map((item) => item.question.code);

    return {
      ...control,
      status,
      score: average,
      signals: answered.slice(0, 4).map((item) => `${item.question.code}: ${item.score}/5`),
      gaps: lowSignals.length > 0 ? lowSignals : status === "EvidenceRequired" ? ["Kanıt veya cevap bulunmuyor"] : []
    };
  });

  const alignedCount = controls.filter((control) => control.status === "Aligned").length;
  const partialCount = controls.filter((control) => control.status === "Partial").length;
  const gapCount = controls.filter((control) => control.status === "Gap").length;
  const evidenceRequiredCount = controls.filter((control) => control.status === "EvidenceRequired").length;
  const overallStatus = gapCount > 0 ? "Gap" : partialCount > 0 || evidenceRequiredCount > 0 ? "Partial" : "Aligned";

  return {
    active,
    disclaimer: "Bu bölüm hukuki görüş değildir; BDDK 34360 ve 39257 başlıklarıyla teknik kontrol uyum sinyali üretir. Nihai mevzuat değerlendirmesi kurumun hukuk, uyum ve denetim fonksiyonlarıyla doğrulanmalıdır.",
    overallStatus,
    alignedCount,
    partialCount,
    gapCount,
    evidenceRequiredCount,
    controls
  };
}
