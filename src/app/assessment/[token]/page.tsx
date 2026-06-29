"use client";

import { useEffect, useState } from "react";
import { Activity, AlertTriangle, BarChart3, Clipboard, Clock3, Download, FileDown, FileText, RefreshCcw, Route, ShieldCheck, Sparkles } from "lucide-react";
import { AssessmentEditor } from "@/components/AssessmentEditor";
import { AssessmentRecord } from "@/lib/types";
import { calculateAssessment } from "@/features/scoring/scoring";
import { buildRoadmap, generateRecommendations } from "@/features/recommendations/recommendations";
import { CategoryBars, ScoreDonut } from "@/components/Charts";
import { DeliveryFlow } from "@/components/DeliveryFlow";

type CustomerPortalView = "assessment" | "results" | "recommendations" | "roadmap" | "summary" | "reports";

const portalTabs: Array<{ id: CustomerPortalView; label: string; icon: typeof Clipboard }> = [
  { id: "assessment", label: "Assessment", icon: Clipboard },
  { id: "results", label: "Results", icon: BarChart3 },
  { id: "recommendations", label: "Recommendations", icon: AlertTriangle },
  { id: "roadmap", label: "Roadmap", icon: Route },
  { id: "summary", label: "Summary", icon: Sparkles },
  { id: "reports", label: "Reports", icon: FileText }
];

export default function PublicAssessmentPage({ params }: { params: Promise<{ token: string }> }) {
  const [token, setToken] = useState("");
  const [record, setRecord] = useState<AssessmentRecord | null>(null);
  const [loadError, setLoadError] = useState("");
  const [activeView, setActiveView] = useState<CustomerPortalView>("assessment");

  async function loadAssessment(accessToken: string) {
    setLoadError("");
    const response = await fetch(`/api/assessments/token/${accessToken}`);
    if (!response.ok) {
      setRecord(null);
      setLoadError("Token bulunamadı veya erişim geçersiz.");
      return;
    }
    const nextRecord = await response.json();
    setRecord(nextRecord);
    if (nextRecord.status === "Completed" && activeView === "assessment") setActiveView("results");
  }

  useEffect(() => {
    params.then(({ token }) => {
      setToken(token);
      void loadAssessment(token);
    });
  }, [params]);

  if (loadError) {
    return (
      <main className="grid min-h-screen place-items-center bg-wash px-4 text-center">
        <div className="panel max-w-md p-6">
          <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-md bg-red-50 text-danger"><ShieldCheck size={22} /></div>
          <h1 className="text-lg font-semibold text-ink">Token erişimi doğrulanamadı</h1>
          <p className="mt-2 text-sm leading-6 text-muted">{loadError}</p>
        </div>
      </main>
    );
  }

  if (!record) return <main className="grid min-h-screen place-items-center bg-wash text-sm text-muted">Assessment yükleniyor...</main>;

  const score = record.score ?? calculateAssessment(record.answers);
  const recommendations = record.recommendations ?? generateRecommendations(record.answers, score.categoryScores);
  const roadmap = buildRoadmap(recommendations);
  const reportReady = record.reportStatus === "Ready";
  const reportProcessing = record.reportStatus === "Processing";

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#eef6fb_0%,#f7f9fc_45%,#f5f7f9_100%)]">
      <header className="border-b border-[#d6e4ee] bg-white/94 px-4 py-4 shadow-[0_1px_0_rgba(255,255,255,0.8)] backdrop-blur sm:px-6">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="min-w-0">
            <div className="mb-2 flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-md bg-teal text-white shadow-[0_10px_24px_rgba(15,159,143,0.22)]">
                <ShieldCheck size={20} />
              </div>
              <div>
                <div className="text-xs font-semibold uppercase tracking-wide text-muted">Customer Token Portal</div>
                <h1 className="text-xl font-semibold leading-tight text-ink">{record.organization.companyName}</h1>
              </div>
            </div>
            <p className="max-w-3xl text-sm leading-6 text-muted">Bu token üzerinden assessment cevapları, sonuçlar, özet ve tüm rapor çıktıları görüntülenebilir. Ek müşteri kullanıcı adı/şifre akışı yerine güvenli token linki erişim anahtarı olarak kullanılır.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button onClick={() => void loadAssessment(token)} className="focus-ring flex items-center gap-2 rounded-md border border-[#cbd9e4] bg-white px-3 py-2 text-sm font-semibold text-ink"><RefreshCcw size={16} /> Refresh</button>
            <span className={`rounded-md px-3 py-2 text-sm font-semibold ${reportReady ? "bg-teal/10 text-teal" : reportProcessing ? "bg-amber/10 text-amber" : "bg-wash text-muted"}`}>
              {reportReady ? "PDF ready" : reportProcessing ? "Yorumlanıyor" : record.status}
            </span>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl p-3 sm:p-4">
        <div className="mb-4 overflow-hidden rounded-md border border-[#bfd4e5] bg-[linear-gradient(135deg,#09213d_0%,#123f6d_58%,#0aa394_100%)] p-5 text-white shadow-[0_18px_45px_rgba(9,33,61,0.16)]">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_420px] lg:items-end">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-white/58">Assessment workspace</div>
              <h2 className="mt-2 text-2xl font-semibold leading-tight">SDLC & DevSecOps Assessment</h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-white/72">Cevaplar tamamlandığında sonuçlar ve export çıktıları aynı token üzerinde erişilebilir kalır. PDF hazır değilse durum bilgisi gösterilir; hazır olduğunda download butonu açılır.</p>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <HeroStat label="Completion" value={`${score.completion}%`} />
              <HeroStat label="Score" value={`${score.overallScore}`} />
              <HeroStat label="Actions" value={`${recommendations.length}`} />
            </div>
          </div>
        </div>

        <DeliveryFlow record={record} compact />

        <nav className="my-4 flex gap-2 overflow-x-auto rounded-md border border-[#d6e4ee] bg-white p-2 shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
          {portalTabs.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveView(item.id)}
              className={`focus-ring flex shrink-0 items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold transition ${activeView === item.id ? "bg-teal text-white shadow-[0_8px_18px_rgba(15,159,143,0.18)]" : "text-muted hover:bg-wash hover:text-ink"}`}
            >
              <item.icon size={16} />
              {item.label}
            </button>
          ))}
        </nav>

        {activeView === "assessment" ? (
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
            <section className="space-y-4">
              <AssessmentEditor token={token} initialProfile={record.organization} initialAnswers={record.answers} onSaved={() => loadAssessment(token)} />
            </section>
            <CustomerSidePanel record={record} score={score} recommendations={recommendations.length} />
          </div>
        ) : null}

        {activeView === "results" ? (
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-[300px_minmax(0,1fr)]">
            <div className="panel p-4">
              <h2 className="text-sm font-semibold">Overall maturity</h2>
              <ScoreDonut score={score.overallScore} />
              <div className="text-center text-sm font-semibold">{score.maturityLevel}</div>
            </div>
            <div className="panel p-4">
              <h2 className="text-sm font-semibold">Category score</h2>
              <CategoryBars scores={score.categoryScores} />
            </div>
          </div>
        ) : null}

        {activeView === "recommendations" ? (
          <CustomerRecommendations recommendations={recommendations} />
        ) : null}

        {activeView === "roadmap" ? (
          <CustomerRoadmap roadmap={roadmap} />
        ) : null}

        {activeView === "summary" ? (
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
            <div className="panel p-4">
              <h2 className="text-sm font-semibold">Assessment summary</h2>
              <div className="mt-3 rounded-md border border-[#d8e5ee] bg-[#f7fafc] p-4 text-sm leading-6 text-ink">
                {record.aiSummary ?? (reportProcessing ? "Yorumlanıyor. Rapor hazır olduğunda bu alanda özet görüntülenecek." : "Assessment tamamlandıktan sonra summary ve PDF hazırlama süreci başlar.")}
              </div>
            </div>
            <CustomerPdfPanel record={record} reportReady={reportReady} reportProcessing={reportProcessing} />
          </div>
        ) : null}

        {activeView === "reports" ? (
          <CustomerReports record={record} reportReady={reportReady} reportProcessing={reportProcessing} onRefresh={() => loadAssessment(token)} />
        ) : null}
      </div>
    </main>
  );
}

function HeroStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-white/15 bg-white/10 px-4 py-3">
      <div className="text-xl font-semibold">{value}</div>
      <div className="text-[11px] font-semibold text-white/62">{label}</div>
    </div>
  );
}

function CustomerSidePanel({ record, score, recommendations }: { record: AssessmentRecord; score: ReturnType<typeof calculateAssessment>; recommendations: number }) {
  return (
    <aside className="space-y-4">
      <div className="panel p-4">
        <h2 className="text-sm font-semibold">Current score</h2>
        <ScoreDonut score={score.overallScore} />
        <div className="text-center text-sm font-semibold">{score.maturityLevel}</div>
      </div>
      <div className="panel p-4">
        <h2 className="mb-3 text-sm font-semibold">Token status</h2>
        <div className="space-y-2">
          <SideMetric label="Assessment" value={record.status} />
          <SideMetric label="Report" value={record.reportStatus ?? "NotStarted"} />
          <SideMetric label="Recommendations" value={String(recommendations)} />
        </div>
      </div>
    </aside>
  );
}

function SideMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-md border border-[#d8e5ee] bg-[#f7fafc] px-3 py-2">
      <span className="text-xs font-semibold text-muted">{label}</span>
      <span className="text-xs font-semibold text-ink">{value}</span>
    </div>
  );
}

function CustomerRecommendations({ recommendations }: { recommendations: ReturnType<typeof generateRecommendations> }) {
  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
      {recommendations.length > 0 ? recommendations.map((item) => (
        <div key={item.id} className="panel p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className={`rounded px-2 py-1 text-xs font-semibold ${item.priority === "P1" ? "bg-red-50 text-danger" : "bg-amber/10 text-amber"}`}>{item.priority}</span>
              <span className="rounded bg-wash px-2 py-1 text-xs font-semibold text-muted">{item.severity}</span>
            </div>
            <span className="text-xs font-semibold text-muted">{item.phase}</span>
          </div>
          <h2 className="text-sm font-semibold leading-5 text-ink">{item.title}</h2>
          <p className="mt-2 text-xs leading-5 text-muted">{item.recommendation}</p>
          <div className="mt-4 rounded-md border border-[#d8e5ee] bg-[#f7fafc] px-3 py-2 text-xs font-semibold text-ink">Effort: {item.effort}</div>
        </div>
      )) : (
        <div className="panel p-4 text-sm text-muted">Öncelikli aksiyon bulunmuyor.</div>
      )}
    </div>
  );
}

function CustomerRoadmap({ roadmap }: { roadmap: ReturnType<typeof buildRoadmap> }) {
  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
      {roadmap.map((phase) => (
        <div key={phase.phase} className="panel p-4">
          <div className="mb-4">
            <div className="text-xs font-semibold text-muted">{phase.duration}</div>
            <h2 className="mt-1 text-sm font-semibold text-ink">{phase.phase}: {phase.title}</h2>
          </div>
          <div className="space-y-3">
            {phase.items.length > 0 ? phase.items.map((item) => (
              <div key={item.id} className="rounded-md border border-[#d8e5ee] bg-white p-3">
                <div className="text-sm font-semibold text-ink">{item.title}</div>
                <p className="mt-1 text-xs leading-5 text-muted">{item.recommendation}</p>
              </div>
            )) : <div className="rounded-md border border-dashed border-[#d8e5ee] p-3 text-sm text-muted">Bu faz için otomatik aksiyon oluşmadı.</div>}
          </div>
        </div>
      ))}
    </div>
  );
}

function CustomerReports({ record, reportReady, reportProcessing, onRefresh }: { record: AssessmentRecord; reportReady: boolean; reportProcessing: boolean; onRefresh: () => Promise<void> }) {
  const readyAt = record.reportReadyAt ? new Date(record.reportReadyAt).toLocaleString("tr-TR") : "";
  return (
    <div className="space-y-4">
      <div className="panel p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h2 className="text-sm font-semibold">Reports</h2>
            <p className="mt-1 text-xs leading-5 text-muted">Platform içindeki rapor çıktıları müşteri token ekranında da aynı kapsamla erişilebilir. Türkçe ve İngilizce çıktılar ayrı linklerden indirilebilir.</p>
          </div>
          <button onClick={() => void onRefresh()} className="focus-ring flex w-fit items-center gap-2 rounded-md border border-[#cbd9e4] bg-white px-3 py-2 text-xs font-semibold text-ink"><RefreshCcw size={14} /> Durumu kontrol et</button>
        </div>
      </div>
      {reportProcessing ? (
        <div className="rounded-md border border-amber/30 bg-amber/10 p-4">
          <div className="flex items-center gap-3">
            <span className="h-3 w-3 animate-pulse rounded-full bg-amber" />
            <div>
              <div className="text-sm font-semibold text-ink">PDF rapor hazırlanıyor</div>
              <div className="mt-1 text-xs leading-5 text-muted">Yorumlanıyor. Tahmini hazır olma zamanı: {readyAt || "assessment tamamlandıktan sonra planlanır"}.</div>
            </div>
          </div>
        </div>
      ) : null}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[340px_minmax(0,1fr)]">
        <CustomerPdfPanel record={record} reportReady={reportReady} reportProcessing={reportProcessing} />
        <div className="panel p-4">
          <h3 className="mb-3 text-sm font-semibold">Data & working exports</h3>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <CustomerReportAction icon={FileText} title="HTML result - Türkçe" description="Canlı rapor önizlemesi" href={`/api/export/${record.token}/html?lang=tr`} />
            <CustomerReportAction icon={FileText} title="HTML result - English" description="English live report preview" href={`/api/export/${record.token}/html?lang=en`} />
            <CustomerReportAction icon={Activity} title="JSON result - Türkçe" description="Skor, cevap ve öneri verisi" href={`/api/export/${record.token}/json?lang=tr`} />
            <CustomerReportAction icon={Activity} title="JSON result - English" description="Score, answers and recommendations data" href={`/api/export/${record.token}/json?lang=en`} />
            <CustomerReportAction icon={FileDown} title="Markdown result - Türkçe" description="Metin formatında rapor çıktısı" href={`/api/export/${record.token}/markdown?lang=tr`} />
            <CustomerReportAction icon={FileDown} title="Markdown result - English" description="Editable English report output" href={`/api/export/${record.token}/markdown?lang=en`} />
            <CustomerReportAction icon={Clipboard} title="Jira issue export" description="Önerileri Jira import CSV olarak indir" href={`/api/export/${record.token}/jira`} />
            <CustomerReportAction icon={Clock3} title="Report status" description={record.reportGeneratedAt ? new Date(record.reportGeneratedAt).toLocaleString("tr-TR") : readyAt || "Henüz hazır değil"} />
          </div>
        </div>
      </div>
    </div>
  );
}

function CustomerPdfPanel({ record, reportReady, reportProcessing }: { record: AssessmentRecord; reportReady: boolean; reportProcessing: boolean }) {
  const readyAt = record.reportReadyAt ? new Date(record.reportReadyAt).toLocaleString("tr-TR") : "";
  return (
    <div className="panel p-4">
      <h3 className="text-sm font-semibold">Executive PDF</h3>
      <p className="mt-1 text-xs leading-5 text-muted">Aynı assessment verisinden Türkçe ve İngilizce PDF çıktıları üretilir.</p>
      <div className="mt-4 flex items-center gap-3 rounded-md border border-[#d8e5ee] bg-[#f7fafc] p-3">
        <Clock3 className={reportReady ? "text-teal" : "text-amber"} size={18} />
        <div>
          <div className="text-sm font-semibold">{reportReady ? "PDF hazır" : reportProcessing ? "PDF hazırlanıyor" : "Henüz başlamadı"}</div>
          <div className="text-xs text-muted">{record.reportGeneratedAt ? new Date(record.reportGeneratedAt).toLocaleString("tr-TR") : readyAt || "Complete sonrası planlanır"}</div>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-1 gap-2">
        {reportReady ? (
          <>
            <a href={`/api/export/${record.token}/pdf?lang=tr`} className="focus-ring flex w-full items-center justify-center gap-2 rounded-md bg-ink px-3 py-2 text-sm font-semibold text-white"><Download size={16} /> Türkçe PDF indir</a>
            <a href={`/api/export/${record.token}/pdf?lang=en`} className="focus-ring flex w-full items-center justify-center gap-2 rounded-md border border-line bg-white px-3 py-2 text-sm font-semibold text-ink"><Download size={16} /> English PDF download</a>
          </>
        ) : (
          <button disabled className="flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-md border border-line bg-wash px-3 py-2 text-sm font-semibold text-muted">
            {reportProcessing ? <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-amber" /> : null}
            {reportProcessing ? "Yorumlanıyor" : "PDF hazır değil"}
          </button>
        )}
      </div>
    </div>
  );
}

function CustomerReportAction({ icon: Icon, title, description, href, disabled, busy }: { icon: typeof FileText; title: string; description: string; href?: string; disabled?: boolean; busy?: boolean }) {
  const content = (
    <div className={`min-h-[132px] rounded-md border border-[#d8e5ee] p-4 transition ${disabled ? "bg-wash opacity-70" : "bg-white hover:border-teal/50 hover:shadow-[0_8px_22px_rgba(16,24,40,0.08)]"}`}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-md bg-teal/10 text-teal"><Icon size={18} /></div>
        {busy ? <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-amber" /> : null}
      </div>
      <div className="text-sm font-semibold text-ink">{title}</div>
      <p className="mt-1 text-xs leading-5 text-muted">{description}</p>
    </div>
  );
  return href ? <a className="focus-ring rounded-md" href={href} target={title.includes("HTML") ? "_blank" : undefined}>{content}</a> : content;
}
