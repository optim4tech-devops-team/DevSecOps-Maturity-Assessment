"use client";

import { Dispatch, SetStateAction, useEffect, useMemo, useState } from "react";
import { Answers, categories, defaultAnswers, defaultProfile, OrganizationProfile, questions } from "@/data/assessment";
import { calculateAssessment } from "@/features/scoring/scoring";

type ProfileOption = {
  label: string;
  value: string;
  numericValue?: number;
  hint?: string;
};

type BaseProfileQuestion = {
  id: keyof OrganizationProfile;
  label: string;
  description: string;
  required?: boolean;
  showWhen?: (profile: OrganizationProfile) => boolean;
};

type TextProfileQuestion = BaseProfileQuestion & {
  type: "text";
  placeholder?: string;
};

type ChoiceProfileQuestion = BaseProfileQuestion & {
  type: "single" | "multi";
  options: ProfileOption[];
};

type ProfileQuestion = TextProfileQuestion | ChoiceProfileQuestion;

const sectorOptions = optionList(["Finance", "Information Technology", "Telecom", "Public", "Retail", "Manufacturing", "Energy", "Healthcare", "Other"]);
const financeSubtypeOptions = optionList(["Bank", "Insurance", "FinTech", "Payment Institution", "Leasing / Factoring", "Other"]);
const employeeOptions = rangeOptions([
  ["0-50", 25],
  ["51-250", 150],
  ["251-1000", 625],
  ["1001-5000", 2500],
  ["5000+", 5000]
]);
const developerOptions = rangeOptions([
  ["0-10", 5],
  ["11-30", 20],
  ["31-100", 65],
  ["101-250", 175],
  ["250+", 250]
]);
const devopsOptions = rangeOptions([
  ["0-2", 1],
  ["3-8", 5],
  ["9-20", 14],
  ["21-50", 35],
  ["50+", 50]
]);
const applicationOptions = rangeOptions([
  ["0-5", 3],
  ["6-20", 13],
  ["21-50", 35],
  ["51-100", 75],
  ["100+", 100]
]);
const productionAppOptions = rangeOptions([
  ["0-5", 3],
  ["6-20", 13],
  ["21-50", 35],
  ["51-100", 75],
  ["100+", 100]
]);
const criticalAppOptions = rangeOptions([
  ["0-2", 1],
  ["3-10", 6],
  ["11-25", 18],
  ["26-50", 38],
  ["50+", 50]
]);
const cloudOptions = optionList(["On-premise", "Hybrid / Kubernetes", "AWS", "Azure", "Google Cloud", "Multi-cloud", "Private Cloud", "Other"]);
const kubernetesOptions = optionList(["Kullanılmıyor", "Kubernetes", "OpenShift", "Tanzu", "AKS", "EKS", "GKE", "Production OpenShift"]);
const sourceControlOptions = optionList(["GitHub", "GitLab", "Azure DevOps", "Bitbucket", "Gitea", "SVN", "Kullanılmıyor"]);
const cicdOptions = optionList(["Azure Pipelines", "GitHub Actions", "GitLab CI", "Jenkins", "Tekton", "Argo CD", "OpenShift Pipelines", "Kullanılmıyor"]);
const itsmOptions = optionList(["Jira Service Management", "ServiceNow", "ManageEngine", "Azure Boards", "Email / Manual", "Kullanılmıyor"]);
const securityToolOptions = optionList([
  "SonarQube",
  "Fortify",
  "Checkmarx",
  "Veracode",
  "Snyk",
  "Mend",
  "Trivy",
  "Red Hat ACS",
  "Quay",
  "Prisma Cloud",
  "Aqua Security",
  "Wiz",
  "GitGuardian",
  "Nexus IQ",
  "Anchore",
  "Clair",
  "Harbor"
]);
const monitoringToolOptions = optionList(["Prometheus", "Grafana", "Loki", "ELK", "Splunk", "Datadog", "New Relic", "Dynatrace", "AppDynamics", "Azure Monitor"]);

const profileQuestions: ProfileQuestion[] = [
  { id: "companyName", type: "text", label: "Müşteri adı", description: "Rapor başlığı ve token ekranında görünecek kurum adı.", required: true, placeholder: "Örn. Abdurrahman Karataş A.Ş." },
  { id: "sector", type: "single", label: "Sektör", description: "Rapor kapsamı ve olası regülasyon eşleşmesi için kullanılır.", required: true, options: sectorOptions },
  { id: "industrySubtype", type: "single", label: "Finans alt tipi", description: "Banka seçilirse BDDK uyum matrisi mevcut assessment cevaplarından otomatik çıkarılır.", required: true, showWhen: (profile) => profile.sector === "Finance", options: financeSubtypeOptions },
  { id: "employeeCount", type: "single", label: "Yaklaşık çalışan sayısı", description: "Kurum ölçeğini aralık olarak belirtin.", required: true, options: employeeOptions },
  { id: "developerCount", type: "single", label: "Yaklaşık geliştirici sayısı", description: "SDLC kapsamındaki mühendislik kapasitesi.", required: true, options: developerOptions },
  { id: "devopsEngineerCount", type: "single", label: "Yaklaşık DevOps/platform ekibi", description: "Platform ve otomasyon sahipliğini değerlendirmek için kullanılır.", required: true, options: devopsOptions },
  { id: "applicationCount", type: "single", label: "Yaklaşık uygulama sayısı", description: "Toplam uygulama portföyünü aralık olarak seçin.", required: true, options: applicationOptions },
  { id: "productionApplicationCount", type: "single", label: "Production uygulama sayısı", description: "Canlıda çalışan uygulama kapsamı.", required: true, options: productionAppOptions },
  { id: "criticalApplicationCount", type: "single", label: "Kritik uygulama sayısı", description: "Regülasyon, SLA veya müşteri etkisi yüksek uygulamalar.", required: true, options: criticalAppOptions },
  { id: "cloudProvider", type: "single", label: "Altyapı / cloud modeli", description: "Ana çalışma ortamı veya hibrit model.", required: true, options: cloudOptions },
  { id: "kubernetesUsage", type: "single", label: "Kubernetes / container platformu", description: "OpenShift, Kubernetes veya yönetilen servis kullanımını seçin.", required: true, options: kubernetesOptions },
  { id: "sourceControlTool", type: "multi", label: "Source control kullanımı", description: "Aktif kullanılan repository ve issue kaynaklarını seçin.", required: true, options: sourceControlOptions },
  { id: "cicdTool", type: "multi", label: "CI/CD ve deployment araçları", description: "Pipeline, GitOps ve release otomasyonu araçları.", required: true, options: cicdOptions },
  { id: "itsmTool", type: "multi", label: "Talep / değişiklik yönetimi", description: "Jira issue export gibi rapor üretim yöntemleri bu seçimlerden beslenebilir.", options: itsmOptions },
  { id: "securityTools", type: "multi", label: "Security tool kapsamı", description: "Seçilen araçlar ileride NVD Technology Exposure Watch kontrolüne dahil edilir.", options: securityToolOptions },
  { id: "monitoringTools", type: "multi", label: "Observability araçları", description: "Log, metrik, trace ve alarm kapsamındaki araçlar.", options: monitoringToolOptions }
];

export function AssessmentEditor({ token, initialProfile, initialAnswers, onSaved, compact = false }: { token: string; initialProfile?: OrganizationProfile; initialAnswers?: Answers; onSaved?: () => Promise<void>; compact?: boolean }) {
  const [profile, setProfile] = useState<OrganizationProfile>(normalizeProfile(initialProfile ?? defaultProfile));
  const [answers, setAnswers] = useState<Answers>(initialAnswers ?? defaultAnswers);
  const [stepIndex, setStepIndex] = useState(0);
  const [furthestStep, setFurthestStep] = useState(() => getInitialFurthestStep(initialAnswers ?? defaultAnswers, initialProfile ?? defaultProfile));
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "completed" | "error">("idle");
  const [saveMessage, setSaveMessage] = useState("");
  const wizardCategories = categories.filter((category) => questions.some((question) => question.categoryId === category.id));
  const totalSteps = wizardCategories.length + 1;
  const isProfileStep = stepIndex === 0;
  const currentCategory = wizardCategories[stepIndex - 1];
  const categoryQuestions = isProfileStep ? [] : questions.filter((question) => question.categoryId === currentCategory.id);
  const visibleProfileQuestions = profileQuestions.filter((question) => !question.showWhen || question.showWhen(profile));
  const score = useMemo(() => calculateAssessment(answers), [answers]);
  const isFirstStep = stepIndex === 0;
  const isLastStep = stepIndex === totalSteps - 1;
  const profileCompletion = getProfileCompletion(profile);
  const answeredInStep = isProfileStep ? visibleProfileQuestions.filter((question) => isProfileAnswered(profile, question)).length : categoryQuestions.filter((question) => isAnswered(answers[question.id])).length;
  const questionCount = isProfileStep ? visibleProfileQuestions.length : categoryQuestions.length;
  const stepCompletion = questionCount === 0 ? 100 : Math.round((answeredInStep / questionCount) * 100);
  const currentStepRequiredAnswered = isProfileStep
    ? visibleProfileQuestions.filter((question) => question.required).every((question) => isProfileAnswered(profile, question))
    : categoryQuestions.filter((question) => question.required).every((question) => isAnswered(answers[question.id]));
  const allRequiredAnswered = getRequiredProfileQuestions(profile).every((question) => isProfileAnswered(profile, question)) && questions.filter((question) => question.required).every((question) => isAnswered(answers[question.id]));

  useEffect(() => {
    const nextAnswers = initialAnswers ?? defaultAnswers;
    const nextProfile = normalizeProfile(initialProfile ?? defaultProfile);
    setProfile(nextProfile);
    setAnswers(nextAnswers);
    setStepIndex(0);
    setFurthestStep(getInitialFurthestStep(nextAnswers, nextProfile));
    setSaveState("idle");
    setSaveMessage("");
  }, [token]);

  async function save(status = "InProgress") {
    setSaveState("saving");
    setSaveMessage(status === "Completed" ? "Assessment tamamlanıyor..." : "Taslak kaydediliyor...");
    try {
      const response = await fetch(`/api/assessments/token/${token}`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ organization: profile, answers, status })
      });
      if (!response.ok) throw new Error("Save failed");
      await onSaved?.();
      setSaveState(status === "Completed" ? "completed" : "saved");
      setSaveMessage(status === "Completed" ? "Assessment tamamlandı. Sonuçlar ve rapor ekranları güncellendi." : `Taslak kaydedildi. Adım ${stepIndex + 1}/${totalSteps}.`);
      return true;
    } catch {
      setSaveState("error");
      setSaveMessage("Kaydetme sırasında hata oluştu. Lütfen tekrar deneyin.");
      return false;
    }
  }

  async function complete() {
    const saved = await save("Completed");
    if (!saved) return;
    try {
      const response = await fetch(`/api/assessments/token/${token}/complete`, { method: "POST" });
      if (!response.ok) throw new Error("Complete failed");
      await onSaved?.();
      setSaveState("completed");
      setSaveMessage("Assessment tamamlandı. Sonuçlar, öneriler, roadmap ve rapor çıktıları hazırlandı.");
    } catch {
      setSaveState("error");
      setSaveMessage("Tamamlama sırasında hata oluştu. Taslak kaydedildi, tekrar Complete deneyebilirsiniz.");
    }
  }

  async function saveAndNext() {
    if (!currentStepRequiredAnswered) {
      setSaveState("error");
      setSaveMessage(isProfileStep ? "Profil adımındaki zorunlu alanları tamamlayın." : "Bu adımı geçmek için zorunlu soruların tamamını yanıtlayın.");
      return;
    }
    const saved = await save();
    if (saved) {
      const next = Math.min(totalSteps - 1, stepIndex + 1);
      setFurthestStep((furthest) => Math.max(furthest, next));
      setStepIndex(next);
    }
  }

  function goBack() {
    setSaveState("idle");
    setSaveMessage("");
    setStepIndex((current) => Math.max(0, current - 1));
  }

  return (
    <div className="panel min-w-0 overflow-hidden">
      <div className="border-b border-[#dbe6ef] bg-[linear-gradient(135deg,#ffffff_0%,#f1f8fb_58%,#eaf4f1_100%)] p-4 sm:p-5">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
          <div className="min-w-0">
            <div className="text-xs font-semibold uppercase tracking-wide text-teal">SDLC & DevSecOps assessment</div>
            <h2 className="mt-1 text-lg font-semibold leading-tight text-ink">Assessment workspace</h2>
            <p className="mt-1 max-w-3xl text-sm leading-6 text-muted">Profil, kontrol soruları, sonuçlar ve PDF çıktısı aynı token üzerinde izlenir. Profil verileri serbest metin yerine seçenekli kurumsal sorularla toplanır.</p>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            <Metric label="Completion" value={`${score.completion}%`} />
            <Metric label="Profile" value={`${profileCompletion}%`} />
            <Metric label="Score" value={`${score.overallScore}/100`} />
          </div>
        </div>
      </div>

      <div className="grid min-h-[620px] grid-cols-1 lg:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="border-b border-[#dbe6ef] bg-[#f7fafc] p-3 lg:border-b-0 lg:border-r">
          <div className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted">Akış</div>
          <div className="flex gap-2 overflow-x-auto pb-1 lg:block lg:space-y-2 lg:overflow-visible lg:pb-0">
            <StepButton label="Organization profile" index={0} active={isProfileStep} locked={false} done={profileCompletion === 100} completion={profileCompletion} onClick={() => selectStep(0)} />
            {wizardCategories.map((category, index) => {
              const realIndex = index + 1;
              return (
                <StepButton
                  key={category.id}
                  label={category.name}
                  index={realIndex}
                  active={stepIndex === realIndex}
                  locked={realIndex > furthestStep}
                  done={getCategoryCompletion(category.id, answers) === 100}
                  completion={getCategoryCompletion(category.id, answers)}
                  onClick={() => selectStep(realIndex)}
                />
              );
            })}
          </div>
        </aside>

        <section className="min-w-0 p-3 sm:p-4">
          <div className="mb-4 rounded-md border border-line bg-wash p-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <div className="text-sm font-semibold text-ink">{isProfileStep ? "Organization profile" : currentCategory.name}</div>
                <p className="mt-1 text-xs leading-5 text-muted">{isProfileStep ? "Müşteri adı, sektör, ölçek, platform ve tool kapsamı seçenekli olarak alınır." : currentCategory.description}</p>
              </div>
              <span className="shrink-0 rounded bg-white px-2 py-1 text-xs font-semibold text-muted">{answeredInStep}/{questionCount}</span>
            </div>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white">
              <div className="h-full rounded-full bg-teal transition-all" style={{ width: `${stepCompletion}%` }} />
            </div>
          </div>

          {isProfileStep ? (
            <div className={`${compact ? "max-h-[460px] overflow-auto pr-1" : ""} grid grid-cols-1 gap-3 xl:grid-cols-2`}>
              {visibleProfileQuestions.map((question) => <ProfileQuestionCard key={String(question.id)} question={question} profile={profile} setProfile={setProfile} />)}
            </div>
          ) : (
            <div className={`${compact ? "max-h-[460px] overflow-auto pr-1" : "space-y-3"} ${compact ? "space-y-3" : ""}`}>
              {categoryQuestions.map((question) => <QuestionInput key={question.id} questionId={question.id} answers={answers} setAnswers={setAnswers} compact={compact} />)}
            </div>
          )}

          {profile.sector === "Finance" && profile.industrySubtype === "Bank" && isProfileStep ? (
            <div className="mt-4 rounded-md border border-[#b9d9c8] bg-[#f0faf4] px-3 py-3 text-xs leading-5 text-[#266044]">
              Banka profili seçildi. BDDK uyum çıktısı ayrı soru sormadan mevcut assessment cevaplarıyla rapor tarafında eşleştirilecek.
            </div>
          ) : null}

          {saveMessage ? (
            <div className={`mt-4 rounded-md border px-3 py-2 text-xs font-medium ${saveState === "error" ? "border-danger/30 bg-red-50 text-danger" : saveState === "completed" ? "border-teal/30 bg-teal/5 text-teal" : "border-line bg-wash text-muted"}`}>
              {saveMessage}
            </div>
          ) : null}

          <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
            <button type="button" onClick={goBack} disabled={isFirstStep || saveState === "saving"} className="focus-ring rounded-md border border-line px-3 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-40">Geri</button>
            {!isLastStep ? (
              <button type="button" onClick={saveAndNext} disabled={saveState === "saving" || !currentStepRequiredAnswered} className="focus-ring rounded-md bg-teal px-3 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60">{saveState === "saving" ? "Kaydediliyor..." : "Kaydet ve ilerle"}</button>
            ) : (
              <button type="button" onClick={complete} disabled={saveState === "saving" || !allRequiredAnswered} className="focus-ring rounded-md bg-ink px-3 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50">{saveState === "saving" ? "Tamamlanıyor..." : "Assessment'ı tamamla"}</button>
            )}
          </div>
          <div className="mt-2">
            <button type="button" onClick={() => save()} disabled={saveState === "saving"} className="focus-ring w-full rounded-md border border-line px-3 py-2 text-xs font-semibold text-muted disabled:cursor-wait disabled:opacity-60">Bulunduğum adımı taslak kaydet</button>
            {!currentStepRequiredAnswered && !isLastStep ? <p className="mt-2 text-xs leading-5 text-danger">Sonraki adıma geçmek için bu adımdaki zorunlu alanlar tamamlanmalı.</p> : null}
            {isLastStep && !allRequiredAnswered ? <p className="mt-2 text-xs leading-5 text-danger">Complete için profil ve zorunlu assessment sorularının tamamı yanıtlanmalı.</p> : null}
          </div>
        </section>
      </div>
    </div>
  );

  function selectStep(index: number) {
    if (index > furthestStep) return;
    setSaveState("idle");
    setSaveMessage("");
    setStepIndex(index);
  }
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-[104px] rounded-md border border-white/80 bg-white/75 px-3 py-2 shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
      <div className="text-[10px] font-semibold uppercase tracking-wide text-muted">{label}</div>
      <div className="mt-1 text-sm font-semibold text-ink">{value}</div>
    </div>
  );
}

function StepButton({ label, index, active, locked, done, completion, onClick }: { label: string; index: number; active: boolean; locked: boolean; done: boolean; completion: number; onClick: () => void }) {
  return (
    <button
      type="button"
      disabled={locked}
      onClick={onClick}
      className={`focus-ring min-h-[74px] min-w-[188px] rounded-md border px-3 py-2 text-left transition disabled:cursor-not-allowed disabled:opacity-45 lg:w-full ${active ? "border-teal bg-teal text-white shadow-[0_10px_22px_rgba(15,159,143,0.16)]" : done ? "border-[#b9d9c8] bg-[#f0faf4] text-ink" : "border-line bg-white text-muted hover:border-[#a9bdcc]"}`}
    >
      <span className="block text-[10px] font-semibold uppercase tracking-wide opacity-70">{locked ? "Locked" : `Step ${index + 1}`}</span>
      <span className="mt-1 block text-xs font-semibold leading-4">{label}</span>
      <span className={`mt-2 block h-1 overflow-hidden rounded-full ${active ? "bg-white/20" : "bg-wash"}`}>
        <span className={`block h-full rounded-full ${active ? "bg-white" : "bg-teal"}`} style={{ width: `${completion}%` }} />
      </span>
    </button>
  );
}

function ProfileQuestionCard({ question, profile, setProfile }: { question: ProfileQuestion; profile: OrganizationProfile; setProfile: Dispatch<SetStateAction<OrganizationProfile>> }) {
  const rawValue = profile[question.id];

  return (
    <div className="rounded-md border border-line bg-white p-3 shadow-[0_1px_2px_rgba(16,24,40,0.03)]">
      <div className="mb-3">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold leading-5 text-ink">{question.label}</h3>
          {question.required ? <span className="rounded bg-[#e9f7f5] px-1.5 py-0.5 text-[10px] font-semibold text-teal">Required</span> : null}
        </div>
        <p className="mt-1 text-xs leading-5 text-muted">{question.description}</p>
      </div>

      {question.type === "text" ? (
        <input
          className="focus-ring h-11 w-full rounded-md border border-[#cbd9e4] bg-white px-3 text-sm font-medium text-ink shadow-[0_1px_2px_rgba(16,24,40,0.03)]"
          placeholder={question.placeholder}
          value={String(rawValue ?? "")}
          onChange={(event) => setProfile((current) => ({ ...current, [question.id]: event.target.value }))}
        />
      ) : (
        <div className={`grid gap-2 ${question.type === "multi" ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1 sm:grid-cols-2"}`}>
          {question.options.map((option) => {
            const selected = question.type === "multi" ? splitTools(String(rawValue ?? "")).includes(option.value) : valueMatches(rawValue, option);
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => updateProfileQuestion(question, option, setProfile)}
                className={`focus-ring min-h-[44px] rounded-md border px-3 py-2 text-left text-xs font-semibold leading-4 transition ${selected ? "border-teal bg-teal text-white shadow-[0_8px_18px_rgba(15,159,143,0.14)]" : "border-line bg-[#fbfdff] text-ink hover:border-[#9bb1c2]"}`}
              >
                {option.label}
                {option.hint ? <span className="mt-1 block text-[11px] font-medium opacity-75">{option.hint}</span> : null}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function QuestionInput({ questionId, answers, setAnswers, compact }: { questionId: string; answers: Answers; setAnswers: (answers: Answers) => void; compact: boolean }) {
  const question = questions.find((item) => item.id === questionId)!;
  const value = answers[question.id];
  const multiValue = Array.isArray(value) ? value : typeof value === "string" && value ? [value] : [];
  const noteKey = `${question.id}_note`;
  const note = String(answers[noteKey] ?? "");

  return (
    <div className="min-w-0 rounded-md border border-line bg-white p-3 shadow-[0_1px_2px_rgba(16,24,40,0.03)]">
      <div className="mb-2 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="break-words text-sm font-semibold leading-5 text-ink">{question.text}</div>
          <div className="mt-1 flex flex-wrap gap-1 text-[11px] font-medium text-muted">
            <span className="rounded bg-wash px-2 py-1">{question.code}</span>
            <span className="rounded bg-wash px-2 py-1">Weight {question.weight}</span>
            {question.required ? <span className="rounded bg-wash px-2 py-1">Required</span> : null}
          </div>
        </div>
      </div>
      {question.type === "numeric" ? (
        <input type="number" className="focus-ring w-full rounded-md border border-line px-3 py-2 text-sm" value={Number(value ?? 0)} onChange={(event) => setAnswers({ ...answers, [question.id]: Number(event.target.value) })} />
      ) : question.type === "multi" || question.type === "tool" ? (
        <div className={`grid gap-2 ${compact ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-2 xl:grid-cols-3"}`}>
          {question.options?.map((option) => {
            const selected = multiValue.includes(option.value);
            return <button key={option.value} type="button" onClick={() => {
              const isNoneOption = option.value === "None" || option.value === "none";
              const withoutNone = multiValue.filter((item) => item !== "None" && item !== "none");
              const next = selected
                ? multiValue.filter((item) => item !== option.value)
                : isNoneOption
                  ? [option.value]
                  : [...withoutNone, option.value];
              setAnswers({ ...answers, [question.id]: next });
            }} className={`focus-ring min-h-10 rounded-md border px-2 py-2 text-left text-xs leading-4 ${selected ? "border-teal bg-teal text-white" : "border-line bg-white"}`}>{option.label}</button>;
          })}
        </div>
      ) : (
        <div className={`grid gap-2 ${compact ? "grid-cols-1" : "grid-cols-1 xl:grid-cols-2"}`}>
          {question.options?.map((option) => {
            const selected = String(value ?? "") === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => setAnswers({ ...answers, [question.id]: option.value })}
                className={`focus-ring min-h-[52px] rounded-md border px-3 py-2 text-left text-xs font-medium leading-4 transition ${selected ? "border-teal bg-teal text-white shadow-[0_8px_18px_rgba(15,159,143,0.14)]" : "border-line bg-[#fbfdff] text-ink hover:border-[#9bb1c2]"}`}
              >
                <span className="block">{option.label}</span>
                <span className={`mt-1 inline-flex rounded px-1.5 py-0.5 text-[10px] font-semibold ${selected ? "bg-white/16 text-white" : "bg-wash text-muted"}`}>Skor {option.score}/5</span>
              </button>
            );
          })}
        </div>
      )}
      <details className="mt-3 rounded-md border border-dashed border-line bg-[#fbfdff] px-3 py-2">
        <summary className="cursor-pointer text-xs font-semibold text-muted">Opsiyonel kanıt / görüşme notu</summary>
        <textarea
          className="focus-ring mt-2 min-h-[68px] w-full resize-y rounded-md border border-line px-3 py-2 text-sm text-ink"
          placeholder="Kanıt linki, tool kapsamı, istisna veya kısa görüşme notu..."
          value={note}
          onChange={(event) => setAnswers({ ...answers, [noteKey]: event.target.value })}
        />
      </details>
    </div>
  );
}

function updateProfileQuestion(question: ChoiceProfileQuestion, option: ProfileOption, setProfile: Dispatch<SetStateAction<OrganizationProfile>>) {
  setProfile((current) => {
    if (question.type === "multi") {
      const currentItems = splitTools(String(current[question.id] ?? ""));
      const selected = currentItems.includes(option.value);
      const nextItems = selected ? currentItems.filter((item) => item !== option.value) : [...currentItems.filter((item) => item !== "Kullanılmıyor"), option.value];
      const normalized = option.value === "Kullanılmıyor" ? "Kullanılmıyor" : nextItems.join(", ");
      return { ...current, [question.id]: normalized };
    }

    const nextValue = typeof current[question.id] === "number" && option.numericValue !== undefined ? option.numericValue : option.value;
    const next = { ...current, [question.id]: nextValue };
    if (question.id === "sector" && option.value !== "Finance") next.industrySubtype = "";
    return next;
  });
}

function normalizeProfile(profile: OrganizationProfile): OrganizationProfile {
  return {
    ...defaultProfile,
    ...profile,
    industrySubtype: profile.industrySubtype ?? ""
  };
}

function isAnswered(value: Answers[string]) {
  if (Array.isArray(value)) return value.length > 0;
  return value !== undefined && value !== "";
}

function isProfileAnswered(profile: OrganizationProfile, question: ProfileQuestion) {
  const value = profile[question.id];
  if (typeof value === "number") return Number.isFinite(value) && value > 0;
  return String(value ?? "").trim().length > 0;
}

function getRequiredProfileQuestions(profile: OrganizationProfile) {
  return profileQuestions.filter((question) => question.required && (!question.showWhen || question.showWhen(profile)));
}

function getProfileCompletion(profile: OrganizationProfile) {
  const visible = profileQuestions.filter((question) => !question.showWhen || question.showWhen(profile));
  if (visible.length === 0) return 100;
  const answered = visible.filter((question) => isProfileAnswered(profile, question)).length;
  return Math.round((answered / visible.length) * 100);
}

function getCategoryCompletion(categoryId: string, answers: Answers) {
  const categoryQuestions = questions.filter((question) => question.categoryId === categoryId);
  if (categoryQuestions.length === 0) return 100;
  const answered = categoryQuestions.filter((question) => isAnswered(answers[question.id])).length;
  return Math.round((answered / categoryQuestions.length) * 100);
}

function getInitialFurthestStep(answers: Answers, profile: OrganizationProfile) {
  const wizardCategories = categories.filter((category) => questions.some((question) => question.categoryId === category.id));
  if (getRequiredProfileQuestions(normalizeProfile(profile)).some((question) => !isProfileAnswered(profile, question))) return 0;
  const firstIncomplete = wizardCategories.findIndex((category) => getCategoryCompletion(category.id, answers) < 100);
  if (firstIncomplete === -1) return wizardCategories.length;
  return firstIncomplete + 1;
}

function optionList(items: string[]): ProfileOption[] {
  return items.map((item) => ({ label: item, value: item }));
}

function rangeOptions(items: Array<[string, number]>): ProfileOption[] {
  return items.map(([label, numericValue]) => ({ label, value: label, numericValue }));
}

function splitTools(value: string) {
  return value.split(",").map((item) => item.trim()).filter(Boolean);
}

function valueMatches(rawValue: string | number | undefined, option: ProfileOption) {
  if (typeof rawValue === "number" && option.numericValue !== undefined) return rawValue === option.numericValue;
  return String(rawValue ?? "") === option.value;
}
