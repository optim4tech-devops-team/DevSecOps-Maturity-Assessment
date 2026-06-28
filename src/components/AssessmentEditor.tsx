"use client";

import { useEffect, useMemo, useState } from "react";
import { Answers, categories, defaultAnswers, defaultProfile, OrganizationProfile, questions } from "@/data/assessment";
import { calculateAssessment } from "@/features/scoring/scoring";

export function AssessmentEditor({ token, initialProfile, initialAnswers, onSaved, compact = false }: { token: string; initialProfile?: OrganizationProfile; initialAnswers?: Answers; onSaved?: () => Promise<void>; compact?: boolean }) {
  const [profile, setProfile] = useState(initialProfile ?? defaultProfile);
  const [answers, setAnswers] = useState<Answers>(initialAnswers ?? defaultAnswers);
  const [stepIndex, setStepIndex] = useState(0);
  const [furthestStep, setFurthestStep] = useState(() => getInitialFurthestStep(initialAnswers ?? defaultAnswers));
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "completed" | "error">("idle");
  const [saveMessage, setSaveMessage] = useState("");
  const wizardCategories = categories.filter((category) => questions.some((question) => question.categoryId === category.id));
  const currentCategory = wizardCategories[stepIndex];
  const categoryQuestions = questions.filter((question) => question.categoryId === currentCategory.id);
  const score = useMemo(() => calculateAssessment(answers), [answers]);
  const isFirstStep = stepIndex === 0;
  const isLastStep = stepIndex === wizardCategories.length - 1;
  const answeredInStep = categoryQuestions.filter((question) => isAnswered(answers[question.id])).length;
  const stepCompletion = categoryQuestions.length === 0 ? 100 : Math.round((answeredInStep / categoryQuestions.length) * 100);
  const currentStepRequiredAnswered = categoryQuestions.filter((question) => question.required).every((question) => isAnswered(answers[question.id]));
  const allRequiredAnswered = questions.filter((question) => question.required).every((question) => isAnswered(answers[question.id]));

  useEffect(() => {
    const nextAnswers = initialAnswers ?? defaultAnswers;
    setProfile(initialProfile ?? defaultProfile);
    setAnswers(nextAnswers);
    setStepIndex(0);
    setFurthestStep(getInitialFurthestStep(nextAnswers));
    setSaveState("idle");
    setSaveMessage("");
  }, [token]);

  async function save(status = "InProgress") {
    setSaveState("saving");
    setSaveMessage(status === "Completed" ? "Assessment tamamlanıyor..." : "Draft kaydediliyor...");
    try {
      const response = await fetch(`/api/assessments/token/${token}`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ organization: profile, answers, status })
      });
      if (!response.ok) throw new Error("Save failed");
      await onSaved?.();
      setSaveState(status === "Completed" ? "completed" : "saved");
      setSaveMessage(status === "Completed" ? "Assessment tamamlandı. Sonuçlar panelde güncellendi." : `Draft kaydedildi. Adım ${stepIndex + 1}/${wizardCategories.length}.`);
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
      setSaveMessage("Assessment tamamlandı. Grafikler, öneriler ve roadmap hazır.");
    } catch {
      setSaveState("error");
      setSaveMessage("Tamamlama sırasında hata oluştu. Draft kaydedildi, tekrar Complete deneyebilirsiniz.");
    }
  }

  async function saveAndNext() {
    if (!currentStepRequiredAnswered) {
      setSaveState("error");
      setSaveMessage("Bu adımı geçmek için zorunlu soruların tamamını yanıtlayın.");
      return;
    }
    const saved = await save();
    if (saved) {
      const next = Math.min(wizardCategories.length - 1, stepIndex + 1);
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
    <div className="panel min-w-0 p-3 sm:p-4">
      <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold">Assessment wizard</h2>
          <p className="mt-1 text-xs text-muted">Müşteri profilini güncelleyip sıralı kategori akışı ile assessment cevaplarını tamamlayın.</p>
        </div>
        <span className="w-fit shrink-0 rounded bg-wash px-2 py-1 text-xs font-semibold text-muted">{score.completion}% complete</span>
      </div>

      <section className="mb-4 overflow-hidden rounded-md border border-[#c8d9e6] bg-[#f6fbff]">
        <div className="border-b border-[#d7e6f0] bg-white/80 px-3 py-2">
          <div className="text-sm font-semibold text-ink">Customer information</div>
          <p className="mt-0.5 text-xs leading-5 text-muted">Bu bilgiler rapor başlığı, export dosyaları ve assessment kapsamı için kullanılır.</p>
        </div>
        <div className="grid grid-cols-1 gap-3 p-3 md:grid-cols-2 xl:grid-cols-4">
          <ProfileTextField label="Customer name" value={profile.companyName} onChange={(value) => setProfile({ ...profile, companyName: value })} />
          <ProfileTextField label="Sector" value={profile.sector} onChange={(value) => setProfile({ ...profile, sector: value })} />
          <ProfileNumberField label="Employees" value={profile.employeeCount} onChange={(value) => setProfile({ ...profile, employeeCount: value })} />
          <ProfileNumberField label="Developers" value={profile.developerCount} onChange={(value) => setProfile({ ...profile, developerCount: value })} />
          <ProfileNumberField label="DevOps engineers" value={profile.devopsEngineerCount} onChange={(value) => setProfile({ ...profile, devopsEngineerCount: value })} />
          <ProfileNumberField label="Applications" value={profile.applicationCount} onChange={(value) => setProfile({ ...profile, applicationCount: value })} />
          <ProfileNumberField label="Production apps" value={profile.productionApplicationCount} onChange={(value) => setProfile({ ...profile, productionApplicationCount: value })} />
          <ProfileNumberField label="Critical apps" value={profile.criticalApplicationCount} onChange={(value) => setProfile({ ...profile, criticalApplicationCount: value })} />
          <ProfileTextField label="Cloud provider" value={profile.cloudProvider} onChange={(value) => setProfile({ ...profile, cloudProvider: value })} wide />
          <ProfileTextField label="Kubernetes usage" value={profile.kubernetesUsage} onChange={(value) => setProfile({ ...profile, kubernetesUsage: value })} />
          <ProfileTextField label="Source control" value={profile.sourceControlTool} onChange={(value) => setProfile({ ...profile, sourceControlTool: value })} />
          <ProfileTextField label="CI/CD tool" value={profile.cicdTool} onChange={(value) => setProfile({ ...profile, cicdTool: value })} />
          <ProfileTextField label="ITSM tool" value={profile.itsmTool} onChange={(value) => setProfile({ ...profile, itsmTool: value })} />
          <ProfileTextField label="Security tools" value={profile.securityTools} onChange={(value) => setProfile({ ...profile, securityTools: value })} wide />
          <ProfileTextField label="Monitoring tools" value={profile.monitoringTools} onChange={(value) => setProfile({ ...profile, monitoringTools: value })} wide />
        </div>
      </section>

      <div className="mb-4 flex snap-x gap-2 overflow-x-auto pb-1">
        {wizardCategories.map((category, index) => {
          const active = index === stepIndex;
          const done = getCategoryCompletion(category.id, answers) === 100;
          const locked = index > furthestStep;
          return (
            <button
              key={category.id}
              type="button"
              disabled={locked}
              onClick={() => {
                setSaveState("idle");
                setSaveMessage("");
                setStepIndex(index);
              }}
              className={`focus-ring min-h-[58px] min-w-[136px] snap-start rounded-md border px-2 py-2 text-left text-[11px] font-semibold leading-4 disabled:cursor-not-allowed disabled:opacity-45 sm:min-w-[156px] ${active ? "border-teal bg-teal text-white" : done ? "border-teal/25 bg-teal/5 text-ink" : "border-line bg-white text-muted"}`}
            >
              <span className="block text-[10px] opacity-70">{locked ? "Locked" : `Step ${index + 1}`}</span>
              <span className="line-clamp-2">{category.name}</span>
            </button>
          );
        })}
      </div>

      <div className="mb-3 rounded-md border border-line bg-wash p-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="text-sm font-semibold text-ink">{currentCategory.name}</div>
            <p className="mt-1 text-xs leading-5 text-muted">{currentCategory.description}</p>
          </div>
          <span className="shrink-0 rounded bg-white px-2 py-1 text-xs font-semibold text-muted">{answeredInStep}/{categoryQuestions.length}</span>
        </div>
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white">
          <div className="h-full rounded-full bg-teal transition-all" style={{ width: `${stepCompletion}%` }} />
        </div>
      </div>

      <div className={`${compact ? "max-h-[460px] overflow-auto pr-1" : "space-y-3"} ${compact ? "space-y-3" : ""}`}>
        {categoryQuestions.map((question) => <QuestionInput key={question.id} questionId={question.id} answers={answers} setAnswers={setAnswers} compact={compact} />)}
      </div>

      {saveMessage ? (
        <div className={`mt-4 rounded-md border px-3 py-2 text-xs font-medium ${saveState === "error" ? "border-danger/30 bg-red-50 text-danger" : saveState === "completed" ? "border-teal/30 bg-teal/5 text-teal" : "border-line bg-wash text-muted"}`}>
          {saveMessage}
        </div>
      ) : null}

      <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
        <button type="button" onClick={goBack} disabled={isFirstStep || saveState === "saving"} className="focus-ring rounded-md border border-line px-3 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-40">Back</button>
        {!isLastStep ? (
          <button type="button" onClick={saveAndNext} disabled={saveState === "saving" || !currentStepRequiredAnswered} className="focus-ring rounded-md bg-teal px-3 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60">{saveState === "saving" ? "Saving..." : "Save & next"}</button>
        ) : (
          <button type="button" onClick={complete} disabled={saveState === "saving" || !allRequiredAnswered} className="focus-ring rounded-md bg-ink px-3 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50">{saveState === "saving" ? "Completing..." : "Complete assessment"}</button>
        )}
      </div>
      <div className="mt-2">
        <button type="button" onClick={() => save()} disabled={saveState === "saving"} className="focus-ring w-full rounded-md border border-line px-3 py-2 text-xs font-semibold text-muted disabled:cursor-wait disabled:opacity-60">Save draft without moving</button>
        {!currentStepRequiredAnswered && !isLastStep ? <p className="mt-2 text-xs leading-5 text-danger">Sonraki adıma geçmek için bu kategorideki zorunlu sorular yanıtlanmalı.</p> : null}
        {isLastStep && !allRequiredAnswered ? <p className="mt-2 text-xs leading-5 text-danger">Complete için zorunlu soruların tamamı yanıtlanmalı.</p> : null}
      </div>
    </div>
  );
}

function ProfileTextField({ label, value, onChange, wide = false }: { label: string; value: string; onChange: (value: string) => void; wide?: boolean }) {
  return (
    <label className={`text-xs font-semibold text-muted ${wide ? "xl:col-span-2" : ""}`}>
      {label}
      <input
        className="focus-ring mt-1 h-10 w-full rounded-md border border-[#cbd9e4] bg-white px-3 text-sm font-medium text-ink shadow-[0_1px_2px_rgba(16,24,40,0.03)]"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function ProfileNumberField({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  return (
    <label className="text-xs font-semibold text-muted">
      {label}
      <input
        type="number"
        min={0}
        className="focus-ring mt-1 h-10 w-full rounded-md border border-[#cbd9e4] bg-white px-3 text-sm font-medium text-ink shadow-[0_1px_2px_rgba(16,24,40,0.03)]"
        value={Number.isFinite(value) ? value : 0}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </label>
  );
}

function QuestionInput({ questionId, answers, setAnswers, compact }: { questionId: string; answers: Answers; setAnswers: (answers: Answers) => void; compact: boolean }) {
  const question = questions.find((item) => item.id === questionId)!;
  const value = answers[question.id];
  const multiValue = Array.isArray(value) ? value : typeof value === "string" && value ? [value] : [];
  const noteKey = `${question.id}_note`;
  const note = String(answers[noteKey] ?? "");

  return (
    <div className="min-w-0 rounded-md border border-line p-3">
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
        <select className="focus-ring w-full rounded-md border border-line bg-white px-3 py-2 text-sm" value={String(value ?? "")} onChange={(event) => setAnswers({ ...answers, [question.id]: event.target.value })}>
          <option value="">Seçiniz</option>
          {question.options?.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select>
      )}
      <label className="mt-3 block text-xs font-semibold text-muted">
        Assessment note / evidence hint
        <textarea
          className="focus-ring mt-1 min-h-[68px] w-full resize-y rounded-md border border-line px-3 py-2 text-sm text-ink"
          placeholder="Görüşme notu, kanıt linki, tool kapsamı veya istisna bilgisi..."
          value={note}
          onChange={(event) => setAnswers({ ...answers, [noteKey]: event.target.value })}
        />
      </label>
    </div>
  );
}

function isAnswered(value: Answers[string]) {
  if (Array.isArray(value)) return value.length > 0;
  return value !== undefined && value !== "";
}

function getCategoryCompletion(categoryId: string, answers: Answers) {
  const categoryQuestions = questions.filter((question) => question.categoryId === categoryId);
  if (categoryQuestions.length === 0) return 100;
  const answered = categoryQuestions.filter((question) => isAnswered(answers[question.id])).length;
  return Math.round((answered / categoryQuestions.length) * 100);
}

function getInitialFurthestStep(answers: Answers) {
  const wizardCategories = categories.filter((category) => questions.some((question) => question.categoryId === category.id));
  const firstIncomplete = wizardCategories.findIndex((category) => getCategoryCompletion(category.id, answers) < 100);
  if (firstIncomplete === -1) return Math.max(0, wizardCategories.length - 1);
  return firstIncomplete;
}
