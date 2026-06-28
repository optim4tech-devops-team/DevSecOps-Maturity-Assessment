"use client";

import { useEffect, useState } from "react";
import { Activity, AlertTriangle, BarChart3, Clipboard, Clock3, Download, Eye, FileDown, FileText, KeyRound, Lock, LogOut, Plus, RefreshCcw, Route, ShieldCheck, Sparkles, Trash2, TrendingUp, User } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { AssessmentRecord } from "@/lib/types";
import { calculateAssessment } from "@/features/scoring/scoring";
import { buildRoadmap, generateRecommendations } from "@/features/recommendations/recommendations";
import { CategoryBars, MaturityRadar, ScoreDonut } from "@/components/Charts";
import { AssessmentEditor } from "@/components/AssessmentEditor";
import { DeliveryFlow } from "@/components/DeliveryFlow";

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || (typeof window !== "undefined" ? window.location.origin : "");
const adminSessionToken = "assessment-admin-session-v2";
type WorkspaceView = "customers" | "profile" | "assessment" | "results" | "recommendations" | "roadmap" | "reports" | "summary";

const motionTokens = {
  duration: { fast: 0.18, normal: 0.28 },
  easing: { smooth: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  distance: { sm: 8, md: 14 }
};

const navigationItems: Array<{ id: WorkspaceView; label: string; icon: typeof BarChart3 }> = [
  { id: "customers", label: "Customers", icon: User },
  { id: "profile", label: "Organization Profile", icon: User },
  { id: "assessment", label: "Assessment", icon: Clipboard },
  { id: "results", label: "Results", icon: BarChart3 },
  { id: "recommendations", label: "Recommendations", icon: AlertTriangle },
  { id: "roadmap", label: "Roadmap", icon: Route },
  { id: "reports", label: "Reports", icon: FileText },
  { id: "summary", label: "Summary", icon: Sparkles }
];

export default function Home() {
  const reduceMotion = useReducedMotion();
  const [loggedIn, setLoggedIn] = useState(false);
  const [login, setLogin] = useState({ username: "admin", password: "" });
  const [loginError, setLoginError] = useState("");
  const [newCompany, setNewCompany] = useState({ companyName: "New Customer", sector: "Technology" });
  const [assessments, setAssessments] = useState<AssessmentRecord[]>([]);
  const [selectedToken, setSelectedToken] = useState<string>("");
  const [activeView, setActiveView] = useState<WorkspaceView>("results");
  const selected = assessments.find((item) => item.token === selectedToken);

  useEffect(() => {
    if (window.localStorage.getItem("assessment-admin-session") === adminSessionToken) {
      setLoggedIn(true);
    }
  }, []);

  async function loadAssessments() {
    const response = await fetch("/api/assessments");
    const data = await response.json();
    setAssessments(data);
    setSelectedToken((current) => current || data[0]?.token || "");
  }

  useEffect(() => {
    if (loggedIn) void loadAssessments();
  }, [loggedIn]);

  async function doLogin() {
    setLoginError("");
    const response = await fetch("/api/auth/login", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(login) });
    if (response.ok) {
      const data = await response.json();
      window.localStorage.setItem("assessment-admin-session", data.token ?? adminSessionToken);
      setLoggedIn(true);
      setLogin((current) => ({ ...current, password: "" }));
    } else {
      window.localStorage.removeItem("assessment-admin-session");
      setLoginError("Kullanıcı adı veya şifre hatalı.");
    }
  }

  function logout() {
    window.localStorage.removeItem("assessment-admin-session");
    setLoggedIn(false);
    setAssessments([]);
    setSelectedToken("");
    setLogin({ username: "admin", password: "" });
  }

  async function createLink() {
    const response = await fetch("/api/assessments", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ organization: newCompany }) });
    const record = await response.json();
    await loadAssessments();
    setSelectedToken(record.token);
    setNewCompany({ companyName: `Customer ${assessments.length + 2}`, sector: "Technology" });
  }

  async function deleteSelectedAssessment() {
    if (!selectedToken) return;
    const selectedAssessment = assessments.find((item) => item.token === selectedToken);
    const confirmed = window.confirm(`${selectedAssessment?.organization.companyName ?? "Selected customer"} kaydı silinsin mi?`);
    if (!confirmed) return;

    const response = await fetch(`/api/assessments/token/${selectedToken}`, { method: "DELETE" });
    if (!response.ok) return;
    const nextAssessments = assessments.filter((item) => item.token !== selectedToken);
    setAssessments(nextAssessments);
    setSelectedToken(nextAssessments[0]?.token ?? "");
  }

  if (!loggedIn) {
    return (
      <main className="grid min-h-screen bg-[#f7f9fb] text-ink lg:grid-cols-[46vw_1fr]">
        <section className="login-brand-panel relative isolate overflow-hidden bg-[#0b141c] px-6 py-8 text-white sm:px-10 lg:min-h-screen lg:px-14 lg:py-12">
          <div className="login-grid absolute inset-0 opacity-70" />
          <div className="login-signal login-signal-a" />
          <div className="login-signal login-signal-b" />
          <div className="relative z-10 flex min-h-[520px] flex-col lg:min-h-full">
            <div className="flex items-center gap-4">
              <div className="grid h-12 w-12 place-items-center rounded-md border border-white/14 bg-white/7 text-white shadow-[0_12px_32px_rgba(0,0,0,0.22)]">
                <ShieldCheck size={27} strokeWidth={2.3} />
              </div>
              <div>
                <div className="text-lg font-semibold leading-tight tracking-[0.01em]">Optim4Tech</div>
                <div className="text-xs font-medium text-white/52">Assessment workspace</div>
              </div>
            </div>

            <div className="mt-12 max-w-xl lg:mt-16">
              <p className="mb-7 text-base font-semibold text-teal">Enterprise Assessment Platform</p>
              <h1 className="max-w-[560px] text-[44px] font-semibold leading-[1.05] tracking-normal text-white sm:text-[56px] lg:text-[58px]">
                Assessment Command Center
              </h1>
              <div className="mt-6 h-0.5 w-14 bg-teal" />
              <p className="mt-6 max-w-[520px] text-lg leading-8 text-white/72">Assessment module catalog for SDLC, Kubernetes, network security and infrastructure domains.</p>
            </div>

            <div className="mt-8 grid max-w-[420px] gap-4">
              {[
                { icon: BarChart3, label: "Weighted scoring", value: "Ready", tone: "text-teal" },
                { icon: TrendingUp, label: "Roadmap engine", value: "Active", tone: "text-[#5da8ff]" },
                { icon: FileText, label: "Report export", value: "Online", tone: "text-[#44d5ad]" }
              ].map((item) => (
                <div key={item.label} className="grid grid-cols-[54px_1fr] items-center gap-5">
                  <div className="grid h-[54px] w-[54px] place-items-center rounded-md border border-white/14 bg-white/[0.035] text-teal shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
                    <item.icon size={24} strokeWidth={1.9} className={item.tone} />
                  </div>
                  <div>
                    <div className="text-base font-semibold text-white">{item.label}</div>
                    <div className={`mt-1 flex items-center gap-2 text-sm font-medium ${item.tone}`}>
                      <span className="h-2 w-2 rounded-full bg-current" />
                      {item.value}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pointer-events-none absolute bottom-0 right-0 h-44 w-44 border-b border-r border-[#1f7bff]/25" />
        </section>

        <section className="flex min-h-screen items-center justify-center px-5 py-10 sm:px-8">
          <form
            className="w-full max-w-[450px] rounded-lg border border-[#d8e1e8] bg-white/95 px-7 py-8 shadow-[0_22px_70px_rgba(11,20,28,0.08)] sm:px-9 sm:py-9"
            onSubmit={(event) => {
              event.preventDefault();
              void doLogin();
            }}
          >
            <div className="mb-8 text-center">
              <div className="mx-auto mb-6 grid h-[84px] w-[84px] place-items-center rounded-full bg-[#e8edf3] text-[#0d1720]">
                <KeyRound size={35} strokeWidth={2.2} />
              </div>
              <h2 className="text-[30px] font-semibold leading-tight text-[#14202a]">Admin Login</h2>
              <p className="mt-3 text-base text-[#627080]">Yetkili panel erişimi</p>
            </div>
            <label className="mb-5 block text-sm font-semibold text-[#172331]">
              Username
              <span className="relative mt-2 block">
                <User className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#728194]" size={18} />
                <input className="focus-ring h-12 w-full rounded-md border border-[#cdd7e1] bg-white px-4 pl-11 text-[15px] font-medium text-[#182634] shadow-[0_1px_2px_rgba(16,24,40,0.03)]" value={login.username} onChange={(event) => setLogin({ ...login, username: event.target.value })} />
              </span>
            </label>
            <label className="mb-6 block text-sm font-semibold text-[#172331]">
              Password
              <span className="relative mt-2 block">
                <Lock className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#728194]" size={18} />
                <input type="password" placeholder="Password" className="focus-ring h-12 w-full rounded-md border border-[#cdd7e1] bg-white px-4 pl-11 pr-11 text-[15px] font-medium text-[#182634] shadow-[0_1px_2px_rgba(16,24,40,0.03)]" value={login.password} onChange={(event) => setLogin({ ...login, password: event.target.value })} />
                <Eye className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[#728194]" size={18} />
              </span>
            </label>
            {loginError ? <div className="mb-4 rounded-md border border-danger/25 bg-red-50 px-3 py-2 text-sm text-danger">{loginError}</div> : null}
            <button type="submit" className="focus-ring flex h-14 w-full items-center justify-center gap-3 rounded-md bg-[#101923] px-4 text-base font-semibold text-white shadow-[0_14px_30px_rgba(16,25,35,0.18)] transition hover:bg-[#162636]"><Lock size={20} /> Login</button>
            <div className="mt-8 text-center text-sm leading-5 text-[#5e6b7a]">Optim4Tech assessment workspace</div>
          </form>
        </section>
      </main>
    );
  }

  return (
    <main className="grid min-h-screen grid-cols-1 bg-[linear-gradient(180deg,#eef6fb_0%,#f7f9fc_42%,#f5f7f9_100%)] lg:grid-cols-[252px_minmax(0,1fr)]">
      <aside className="hidden border-r border-[#17314f] bg-[linear-gradient(180deg,#07182d_0%,#102642_54%,#07131f_100%)] px-4 py-5 text-white lg:block">
        <div className="mb-8 flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-md bg-[#20b7a7] shadow-[0_12px_30px_rgba(32,183,167,0.24)]"><ShieldCheck size={20} /></div>
          <div>
            <div className="text-sm font-semibold leading-tight">Assessment Center</div>
            <div className="text-xs text-white/60">SDLC & DevSecOps module</div>
          </div>
        </div>
        <div className="mb-4 rounded-md border border-white/10 bg-white/[0.045] p-3">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-white/45">Workspace</div>
          <div className="mt-1 text-sm font-semibold text-white">Customer delivery</div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
            <div className="h-full w-3/4 rounded-full bg-[#20b7a7]" />
          </div>
        </div>
        {navigationItems.map((item) => (
          <motion.button
            key={item.id}
            type="button"
            onClick={() => setActiveView(item.id)}
            whileHover={reduceMotion ? undefined : { x: 2 }}
            whileTap={reduceMotion ? undefined : { scale: 0.98 }}
            transition={{ duration: motionTokens.duration.fast, ease: motionTokens.easing.smooth }}
            className={`focus-ring mb-1 flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm transition ${activeView === item.id ? "bg-[#20b7a7] text-white shadow-[0_10px_22px_rgba(32,183,167,0.20)]" : "text-white/70 hover:bg-white/8 hover:text-white"}`}
          >
            <item.icon size={15} />
            {item.label}
          </motion.button>
        ))}
      </aside>
      <section className="min-w-0">
        <header className="flex flex-col gap-3 border-b border-[#d6e4ee] bg-white/92 px-4 py-3 shadow-[0_1px_0_rgba(255,255,255,0.75)] backdrop-blur xl:flex-row xl:items-center xl:justify-between xl:px-5">
          <div className="min-w-0">
            <h1 className="text-base font-semibold text-ink">Enterprise Assessment Platform</h1>
            <p className="text-xs text-muted">Aktif modül: SDLC & DevSecOps. Platform Kubernetes, ağ güvenliği ve altyapı assessment modülleriyle genişletilebilir.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select className="focus-ring min-w-[210px] rounded-md border border-[#cbd9e4] bg-white px-3 py-2 text-sm font-semibold text-ink shadow-[0_1px_2px_rgba(16,24,40,0.04)]" value={selectedToken} onChange={(event) => setSelectedToken(event.target.value)}>
              {assessments.map((item) => <option key={item.token} value={item.token}>{item.organization.companyName}</option>)}
            </select>
            <button onClick={loadAssessments} className="focus-ring rounded-md border border-[#cbd9e4] bg-white p-2 text-ink shadow-[0_1px_2px_rgba(16,24,40,0.04)]"><RefreshCcw size={16} /></button>
            <button onClick={logout} className="focus-ring flex items-center gap-2 rounded-md border border-[#cbd9e4] bg-white px-3 py-2 text-sm font-semibold text-ink shadow-[0_1px_2px_rgba(16,24,40,0.04)]"><LogOut size={16} /> Logout</button>
          </div>
        </header>
        <nav className="border-b border-line bg-white px-3 py-2 lg:hidden">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {navigationItems.map((item) => (
              <motion.button
                key={item.id}
                type="button"
                onClick={() => setActiveView(item.id)}
                whileTap={reduceMotion ? undefined : { scale: 0.98 }}
                transition={{ duration: motionTokens.duration.fast, ease: motionTokens.easing.smooth }}
                className={`focus-ring flex shrink-0 items-center gap-2 rounded-md border px-3 py-2 text-xs font-semibold ${activeView === item.id ? "border-teal bg-teal text-white" : "border-line bg-white text-muted"}`}
              >
                <item.icon size={14} />
                {item.label}
              </motion.button>
            ))}
          </div>
        </nav>
        {selected ? <AdminWorkspace record={selected} activeView={activeView} onSaved={loadAssessments} newCompany={newCompany} setNewCompany={setNewCompany} createLink={createLink} deleteSelectedAssessment={deleteSelectedAssessment} /> : (
          <div className="p-4">
            <div className="panel grid min-h-[320px] place-items-center p-8 text-center">
              <div>
                <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-md bg-teal/10 text-teal"><Plus size={22} /></div>
                <h2 className="text-base font-semibold text-ink">Henüz customer assessment yok</h2>
                <p className="mt-2 text-sm text-muted">Yeni müşteri linki oluşturup assessment akışını başlatabilirsiniz.</p>
                <div className="mx-auto mt-5 grid max-w-md grid-cols-1 gap-2 text-left sm:grid-cols-2">
                  <input className="focus-ring rounded-md border border-line px-3 py-2 text-sm" value={newCompany.companyName} onChange={(event) => setNewCompany({ ...newCompany, companyName: event.target.value })} placeholder="Company name" />
                  <input className="focus-ring rounded-md border border-line px-3 py-2 text-sm" value={newCompany.sector} onChange={(event) => setNewCompany({ ...newCompany, sector: event.target.value })} placeholder="Sector" />
                </div>
                <button onClick={createLink} className="focus-ring mt-3 inline-flex items-center gap-2 rounded-md bg-teal px-3 py-2 text-sm font-semibold text-white"><Plus size={16} /> Create customer</button>
              </div>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}

function AdminWorkspace({
  record,
  activeView,
  onSaved,
  newCompany,
  setNewCompany,
  createLink,
  deleteSelectedAssessment
}: {
  record: AssessmentRecord;
  activeView: WorkspaceView;
  onSaved: () => Promise<void>;
  newCompany: { companyName: string; sector: string };
  setNewCompany: (value: { companyName: string; sector: string }) => void;
  createLink: () => Promise<void>;
  deleteSelectedAssessment: () => Promise<void>;
}) {
  const reduceMotion = useReducedMotion();
  const score = record.score ?? calculateAssessment(record.answers);
  const recommendations = record.recommendations ?? generateRecommendations(record.answers, score.categoryScores);
  const roadmap = buildRoadmap(recommendations);
  const publicLink = `${baseUrl}/assessment/${record.token}`;
  const reportReady = record.reportStatus === "Ready";
  const reportProcessing = record.reportStatus === "Processing";
  const lowestCategories = [...score.categoryScores].sort((a, b) => a.score - b.score).slice(0, 4);
  const criticalRecommendations = recommendations.filter((item) => item.severity === "Critical").length;

  return (
    <div className="space-y-4 p-3 sm:p-4">
      <DeliveryFlow record={record} recommendationCount={recommendations.length} />
      <AnimatePresence mode="wait">
        <motion.section
          key={activeView}
          initial={{ opacity: 0, y: reduceMotion ? 0 : motionTokens.distance.sm }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: reduceMotion ? 0 : -motionTokens.distance.sm }}
          transition={{ duration: reduceMotion ? 0.1 : motionTokens.duration.normal, ease: motionTokens.easing.smooth }}
          className="space-y-4"
        >
        {activeView === "customers" ? (
          <CustomersView
            record={record}
            publicLink={publicLink}
            score={score}
            recommendationCount={recommendations.length}
            newCompany={newCompany}
            setNewCompany={setNewCompany}
            createLink={createLink}
            deleteSelectedAssessment={deleteSelectedAssessment}
            onSaved={onSaved}
          />
        ) : null}
        {activeView === "results" ? (
          <>
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-4">
              <MetricTile label="Overall score" value={`${score.overallScore}/100`} detail={score.maturityLevel} />
              <MetricTile label="Completion" value={`${score.completion}%`} detail="Answered control coverage" />
              <MetricTile label="Critical findings" value={`${criticalRecommendations}`} detail="Immediate governance focus" />
              <MetricTile label="Report status" value={reportReady ? "Ready" : reportProcessing ? "Yorumlanıyor" : "Not started"} detail={reportReady ? "PDF can be downloaded" : "Generated after completion"} />
            </div>
            <div className="grid grid-cols-1 gap-4 2xl:grid-cols-[280px_minmax(0,1fr)_minmax(0,1fr)]">
              <div className="panel p-4">
                <h2 className="text-sm font-semibold">Overall maturity</h2>
                <ScoreDonut score={score.overallScore} />
                <div className="text-center text-sm font-semibold">{score.maturityLevel}</div>
              </div>
              <div className="panel p-4">
                <h2 className="text-sm font-semibold">Category score</h2>
                <CategoryBars scores={score.categoryScores} />
              </div>
              <div className="panel p-4">
                <h2 className="text-sm font-semibold">Radar</h2>
                <MaturityRadar scores={score.categoryScores} />
              </div>
            </div>
            <div className="panel p-4">
              <h2 className="mb-3 text-sm font-semibold">Lowest scoring domains</h2>
              <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                {lowestCategories.map((item) => <DomainGap key={item.category.id} name={item.category.name} score={item.score} risk={item.risk} />)}
              </div>
            </div>
          </>
        ) : null}
        {activeView === "recommendations" ? <RecommendationsView recommendations={recommendations} /> : null}
        {activeView === "roadmap" ? <RoadmapView roadmap={roadmap} /> : null}
        {activeView === "reports" ? <ReportsView record={record} reportReady={reportReady} reportProcessing={reportProcessing} onRefresh={onSaved} /> : null}
        {activeView === "summary" ? <AISummaryView record={record} reportReady={reportReady} reportProcessing={reportProcessing} /> : null}
        {activeView === "assessment" || activeView === "profile" ? (
          <AssessmentEditor token={record.token} initialProfile={record.organization} initialAnswers={record.answers} onSaved={onSaved} />
        ) : null}
        </motion.section>
      </AnimatePresence>
    </div>
  );
}

function MetricTile({ label, value, detail }: { label: string; value: string; detail?: string }) {
  return (
    <div className="rounded-md border border-[#d5e1ea] bg-white p-3 shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
      <div className="text-xs font-semibold text-muted">{label}</div>
      <div className="mt-1 text-xl font-semibold text-ink">{value}</div>
      {detail ? <div className="mt-1 text-xs leading-5 text-muted">{detail}</div> : null}
    </div>
  );
}

function CustomersView({
  record,
  publicLink,
  score,
  recommendationCount,
  newCompany,
  setNewCompany,
  createLink,
  deleteSelectedAssessment,
  onSaved
}: {
  record: AssessmentRecord;
  publicLink: string;
  score: ReturnType<typeof calculateAssessment>;
  recommendationCount: number;
  newCompany: { companyName: string; sector: string };
  setNewCompany: (value: { companyName: string; sector: string }) => void;
  createLink: () => Promise<void>;
  deleteSelectedAssessment: () => Promise<void>;
  onSaved: () => Promise<void>;
}) {
  const [selectedProfile, setSelectedProfile] = useState({
    companyName: record.organization.companyName,
    sector: record.organization.sector
  });
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");

  useEffect(() => {
    setSelectedProfile({
      companyName: record.organization.companyName,
      sector: record.organization.sector
    });
    setSaveState("idle");
  }, [record.token, record.organization.companyName, record.organization.sector]);

  async function copyLink() {
    await navigator.clipboard.writeText(publicLink);
  }

  async function saveSelectedCustomer() {
    setSaveState("saving");
    const response = await fetch(`/api/assessments/token/${record.token}`, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        organization: selectedProfile,
        answers: record.answers,
        status: record.status === "Draft" ? "InProgress" : record.status
      })
    });
    if (!response.ok) {
      setSaveState("error");
      return;
    }
    await onSaved();
    setSaveState("saved");
  }

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-md border border-[#bfd4e5] bg-[linear-gradient(135deg,#09213d_0%,#123f6d_58%,#0aa394_100%)] p-5 text-white shadow-[0_18px_45px_rgba(9,33,61,0.16)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-white/60">Selected customer</div>
            <h2 className="mt-2 text-2xl font-semibold leading-tight">{record.organization.companyName}</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-white/72">{record.organization.sector} assessment token yönetimi, müşteri bilgisi düzenleme ve rapor linkleri bu ekrandan yürütülür.</p>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="rounded-md border border-white/15 bg-white/10 px-4 py-3">
              <div className="text-xl font-semibold">{score.completion}%</div>
              <div className="text-[11px] font-semibold text-white/62">Completion</div>
            </div>
            <div className="rounded-md border border-white/15 bg-white/10 px-4 py-3">
              <div className="text-xl font-semibold">{score.overallScore}</div>
              <div className="text-[11px] font-semibold text-white/62">Score</div>
            </div>
            <div className="rounded-md border border-white/15 bg-white/10 px-4 py-3">
              <div className="text-xl font-semibold">{recommendationCount}</div>
              <div className="text-[11px] font-semibold text-white/62">Actions</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[420px_minmax(0,1fr)_320px]">
        <div className="panel overflow-hidden">
          <div className="border-b border-[#d8e5ee] bg-[#f3f9fc] px-4 py-3">
            <h2 className="text-sm font-semibold text-ink">Create customer token</h2>
            <p className="mt-1 text-xs leading-5 text-muted">Yeni müşteri için private assessment linki oluşturun.</p>
          </div>
          <div className="space-y-3 p-4">
            <label className="text-xs font-semibold text-muted">
              Company name
              <input className="focus-ring mt-1 h-11 w-full rounded-md border border-[#cbd9e4] px-3 text-sm font-medium text-ink" value={newCompany.companyName} onChange={(event) => setNewCompany({ ...newCompany, companyName: event.target.value })} />
            </label>
            <label className="text-xs font-semibold text-muted">
              Sector
              <input className="focus-ring mt-1 h-11 w-full rounded-md border border-[#cbd9e4] px-3 text-sm font-medium text-ink" value={newCompany.sector} onChange={(event) => setNewCompany({ ...newCompany, sector: event.target.value })} />
            </label>
            <motion.button
              onClick={() => void createLink()}
              whileTap={{ scale: 0.98 }}
              transition={{ duration: motionTokens.duration.fast, ease: motionTokens.easing.smooth }}
              className="focus-ring flex h-11 w-full items-center justify-center gap-2 rounded-md bg-teal px-3 text-sm font-semibold text-white shadow-[0_10px_22px_rgba(15,159,143,0.22)]"
            >
              <Plus size={16} /> Create token link
            </motion.button>
          </div>
        </div>

        <div className="panel overflow-hidden">
          <div className="flex flex-col gap-2 border-b border-[#d8e5ee] bg-white px-4 py-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h3 className="text-sm font-semibold text-ink">Edit selected customer</h3>
              <p className="mt-1 text-xs leading-5 text-muted">Bu alan seçili token üzerindeki müşteri bilgisini günceller.</p>
            </div>
            <span className="w-fit rounded-md bg-[#edf7f6] px-2 py-1 text-xs font-semibold text-teal">{record.status}</span>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
              <label className="text-xs font-semibold text-muted">
                Customer name
                <input className="focus-ring mt-1 h-11 w-full rounded-md border border-[#cbd9e4] px-3 text-sm font-medium text-ink" value={selectedProfile.companyName} onChange={(event) => setSelectedProfile({ ...selectedProfile, companyName: event.target.value })} />
              </label>
              <label className="text-xs font-semibold text-muted">
                Sector
                <input className="focus-ring mt-1 h-11 w-full rounded-md border border-[#cbd9e4] px-3 text-sm font-medium text-ink" value={selectedProfile.sector} onChange={(event) => setSelectedProfile({ ...selectedProfile, sector: event.target.value })} />
              </label>
            </div>
            <div className="mt-4 rounded-md border border-[#d8e5ee] bg-[#f7fafc] p-3">
              <div className="mb-2 flex items-center justify-between gap-3">
                <div className="text-xs font-semibold text-muted">Active customer link</div>
                <button onClick={copyLink} className="focus-ring flex items-center gap-1 rounded-md border border-[#cbd9e4] bg-white px-2 py-1 text-xs font-semibold text-ink"><Clipboard size={13} /> Copy</button>
              </div>
              <div className="break-all text-xs leading-5 text-ink">{publicLink}</div>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <button onClick={() => void saveSelectedCustomer()} disabled={saveState === "saving"} className="focus-ring rounded-md bg-ink px-4 py-2 text-sm font-semibold text-white disabled:cursor-wait disabled:opacity-60">{saveState === "saving" ? "Saving..." : "Save customer"}</button>
              <button onClick={() => void deleteSelectedAssessment()} className="focus-ring flex items-center gap-2 rounded-md border border-danger/25 bg-red-50 px-3 py-2 text-sm font-semibold text-danger"><Trash2 size={16} /> Delete selected</button>
              {saveState === "saved" ? <span className="text-xs font-semibold text-teal">Saved</span> : null}
              {saveState === "error" ? <span className="text-xs font-semibold text-danger">Kaydedilemedi</span> : null}
            </div>
          </div>
        </div>

        <div className="panel overflow-hidden">
          <div className="border-b border-[#d8e5ee] bg-[#f3f9fc] px-4 py-3">
            <h3 className="text-sm font-semibold">Assessment summary</h3>
          </div>
          <div className="grid grid-cols-2 gap-2 p-4">
            <MetricTile label="Status" value={record.status} />
            <MetricTile label="Completion" value={`${score.completion}%`} />
            <MetricTile label="Score" value={`${score.overallScore}/100`} />
            <MetricTile label="Findings" value={`${recommendationCount}`} />
          </div>
        </div>
      </div>
    </div>
  );
}

function DomainGap({ name, score, risk }: { name: string; score: number; risk: string }) {
  return (
    <div className="rounded-md border border-line p-3">
      <div className="mb-2 flex items-center justify-between gap-3">
        <div className="text-sm font-semibold text-ink">{name}</div>
        <span className="rounded bg-wash px-2 py-1 text-xs font-semibold text-muted">{risk}</span>
      </div>
      <div className="h-2 rounded-full bg-wash">
        <div className={`h-2 rounded-full ${score < 40 ? "bg-danger" : score < 70 ? "bg-amber" : "bg-teal"}`} style={{ width: `${Math.max(score, 4)}%` }} />
      </div>
      <div className="mt-2 text-xs font-semibold text-muted">{score}/100</div>
    </div>
  );
}

function RecommendationsView({ recommendations }: { recommendations: ReturnType<typeof generateRecommendations> }) {
  const grouped = ["Critical", "High", "Medium", "Low"].map((severity) => ({
    severity,
    items: recommendations.filter((item) => item.severity === severity)
  })).filter((group) => group.items.length > 0);

  return (
    <div className="panel p-4">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold">Recommendations</h2>
          <p className="mt-1 text-xs leading-5 text-muted">Bulgular risk seviyesi, faz ve beklenen etki bilgisiyle danışman aksiyon listesine dönüştürülür.</p>
        </div>
        <span className="rounded bg-wash px-2 py-1 text-xs font-semibold text-muted">{recommendations.length} action</span>
      </div>
      <div className="space-y-4">
        {grouped.map((group) => (
          <div key={group.severity}>
            <h3 className="mb-2 text-xs font-semibold uppercase text-muted">{group.severity}</h3>
            <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
              {group.items.map((item) => <div key={item.id} className="rounded-md border border-line p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-ink">{item.title}</div>
                    <div className="mt-1 text-xs font-medium text-muted">{item.category} · {item.priority} · {item.phase} · {item.effort}</div>
                  </div>
                  <span className={`rounded px-2 py-1 text-xs font-semibold ${item.severity === "Critical" ? "bg-red-50 text-danger" : "bg-amber/10 text-amber"}`}>{item.severity}</span>
                </div>
                <p className="mt-2 text-xs leading-5 text-muted">{item.recommendation}</p>
                <div className="mt-2 rounded bg-wash px-2 py-1 text-xs text-muted">{item.expectedImpact}</div>
              </div>)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function RoadmapView({ roadmap }: { roadmap: ReturnType<typeof buildRoadmap> }) {
  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
      {roadmap.map((phase) => <div key={phase.phase} className="panel p-4">
        <div className="mb-4">
          <div className="text-xs font-semibold text-muted">{phase.duration}</div>
          <h2 className="mt-1 text-sm font-semibold text-ink">{phase.phase}: {phase.title}</h2>
        </div>
        <div className="space-y-3">
          {phase.items.length > 0 ? phase.items.map((item) => <div key={item.id} className="rounded-md border border-line p-3">
            <div className="text-sm font-semibold text-ink">{item.title}</div>
            <p className="mt-1 text-xs leading-5 text-muted">{item.recommendation}</p>
          </div>) : <div className="rounded-md border border-dashed border-line p-3 text-sm text-muted">Bu faz için otomatik aksiyon oluşmadı.</div>}
        </div>
      </div>)}
    </div>
  );
}

function ReportsView({ record, reportReady, reportProcessing, onRefresh }: { record: AssessmentRecord; reportReady: boolean; reportProcessing: boolean; onRefresh: () => Promise<void> }) {
  const readyAt = record.reportReadyAt ? new Date(record.reportReadyAt).toLocaleString("tr-TR") : "";
  return (
    <div className="space-y-4">
      <div className="panel p-4">
        <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h2 className="text-sm font-semibold">Reports</h2>
            <p className="mt-1 text-xs leading-5 text-muted">PDF çıktısı assessment tamamlandıktan sonra aynı token üzerinde hazırlanır. Hazır olunca indirme aktif hale gelir.</p>
          </div>
          <button onClick={() => void onRefresh()} className="focus-ring flex w-fit items-center gap-2 rounded-md border border-line bg-white px-3 py-2 text-xs font-semibold text-ink"><RefreshCcw size={14} /> Durumu kontrol et</button>
        </div>
        {reportProcessing ? (
          <div className="mb-4 rounded-md border border-amber/30 bg-amber/10 p-4">
            <div className="flex items-center gap-3">
              <span className="h-3 w-3 animate-pulse rounded-full bg-amber" />
              <div>
                <div className="text-sm font-semibold text-ink">PDF rapor hazırlanıyor</div>
                <div className="mt-1 text-xs leading-5 text-muted">Rapor yorumlanıyor ve PDF hazırlanıyor. Tahmini hazır olma zamanı: {readyAt || "assessment tamamlandıktan sonra planlanır"}.</div>
              </div>
            </div>
          </div>
        ) : null}
        {!reportProcessing && !reportReady ? (
          <div className="mb-4 rounded-md border border-line bg-wash p-4 text-sm text-muted">PDF rapor assessment tamamlandıktan sonra hazırlanacaktır.</div>
        ) : null}
        {reportReady ? (
          <div className="mb-4 rounded-md border border-teal/30 bg-teal/5 p-4 text-sm font-semibold text-teal">PDF rapor hazır. Executive PDF kartından indirebilirsiniz.</div>
        ) : null}
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          <ReportAction icon={FileText} title="HTML preview" description="Canlı rapor önizlemesi" href={`/api/export/${record.token}/html`} />
          <ReportAction icon={FileDown} title="Markdown export" description="Danışman düzenlemesi için metin çıktı" href={`/api/export/${record.token}/markdown`} />
          <ReportAction icon={Activity} title="JSON export" description="Skor, cevap ve öneri verisi" href={`/api/export/${record.token}/json`} />
          <ReportAction icon={Clipboard} title="Jira issue export" description="Önerileri Jira import CSV formatında indir" href={`/api/export/${record.token}/jira`} />
          <ReportAction icon={Download} title="Executive PDF" description={reportReady ? "Yorum ve PDF hazır" : reportProcessing ? "Yorumlanıyor, lütfen daha sonra tekrar kontrol edin" : "Assessment tamamlandıktan sonra hazırlanır"} href={reportReady ? `/api/export/${record.token}/pdf` : undefined} disabled={!reportReady} busy={reportProcessing} />
        </div>
      </div>
    </div>
  );
}

function ReportAction({ icon: Icon, title, description, href, disabled, busy }: { icon: typeof FileText; title: string; description: string; href?: string; disabled?: boolean; busy?: boolean }) {
  const content = (
    <div className={`rounded-md border border-line p-4 ${disabled ? "bg-wash opacity-70" : "bg-white hover:border-teal/50"}`}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="grid h-9 w-9 place-items-center rounded-md bg-teal/10 text-teal"><Icon size={18} /></div>
        {busy ? <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-amber" /> : null}
      </div>
      <div className="text-sm font-semibold text-ink">{title}</div>
      <p className="mt-1 text-xs leading-5 text-muted">{description}</p>
    </div>
  );
  return href ? <a className="focus-ring rounded-md" href={href} target={title.includes("HTML") ? "_blank" : undefined}>{content}</a> : content;
}

function AISummaryView({ record, reportReady, reportProcessing }: { record: AssessmentRecord; reportReady: boolean; reportProcessing: boolean }) {
  const readyAt = record.reportReadyAt ? new Date(record.reportReadyAt).toLocaleString("tr-TR") : "";
  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
      <div className="panel p-4">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold">Summary</h2>
            <p className="mt-1 text-xs leading-5 text-muted">Assessment tamamlandıktan sonra aynı token üzerinde yorumlama başlar. Sayfa yenilendiğinde hazır durumdaysa özet ve PDF indirme aktif olur.</p>
          </div>
          <span className={`rounded px-2 py-1 text-xs font-semibold ${reportReady ? "bg-teal/10 text-teal" : reportProcessing ? "bg-amber/10 text-amber" : "bg-wash text-muted"}`}>
            {reportReady ? "Ready" : reportProcessing ? "Processing" : "Not started"}
          </span>
        </div>
        <div className="rounded-md border border-line bg-wash p-4 text-sm leading-6 text-ink">
          {record.aiSummary ?? (reportProcessing ? `Yorumlanıyor. Tahmini hazır olma zamanı: ${readyAt}.` : "Complete assessment sonrası yorumlama ve PDF hazırlama süreci başlar.")}
        </div>
      </div>
      <div className="panel p-4">
        <h3 className="mb-3 text-sm font-semibold">PDF readiness</h3>
        <div className="space-y-3">
          <div className="flex items-center gap-3 rounded-md border border-line p-3">
            <Clock3 className={reportReady ? "text-teal" : "text-amber"} size={18} />
            <div>
              <div className="text-sm font-semibold">{reportReady ? "PDF hazır" : reportProcessing ? "PDF hazırlanıyor" : "Henüz başlamadı"}</div>
              <div className="text-xs text-muted">{record.reportGeneratedAt ? new Date(record.reportGeneratedAt).toLocaleString("tr-TR") : readyAt || "Complete sonrası planlanır"}</div>
            </div>
          </div>
          {reportReady ? <a href={`/api/export/${record.token}/pdf`} className="focus-ring flex w-full items-center justify-center gap-2 rounded-md bg-ink px-3 py-2 text-sm font-semibold text-white"><Download size={16} /> Download PDF</a> : <button disabled className="flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-md border border-line bg-wash px-3 py-2 text-sm font-semibold text-muted">{reportProcessing ? <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-amber" /> : null} {reportProcessing ? "PDF preparing" : "PDF not ready"}</button>}
        </div>
      </div>
    </div>
  );
}
