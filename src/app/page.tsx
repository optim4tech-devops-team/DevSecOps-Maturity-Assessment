"use client";

import { useEffect, useState } from "react";
import { Activity, BarChart3, CheckCircle2, Clipboard, Eye, FileDown, FileText, KeyRound, Lock, LogOut, Plus, RefreshCcw, ShieldCheck, Trash2, TrendingUp, User } from "lucide-react";
import { AssessmentRecord } from "@/lib/types";
import { calculateAssessment } from "@/features/scoring/scoring";
import { buildRoadmap, generateRecommendations } from "@/features/recommendations/recommendations";
import { CategoryBars, MaturityRadar, ScoreDonut } from "@/components/Charts";
import { AssessmentEditor } from "@/components/AssessmentEditor";

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || (typeof window !== "undefined" ? window.location.origin : "");
const adminSessionToken = "assessment-admin-session-v2";

const deliveryFlow = [
  {
    title: "Token link",
    description: "Customer assessment linki paylaşılır.",
    output: "Public form",
    icon: Clipboard
  },
  {
    title: "Assessment",
    description: "Müşteri veya danışman soruları doldurur.",
    output: "Answers + score",
    icon: CheckCircle2
  },
  {
    title: "Portal review",
    description: "Skor, grafik, gap ve roadmap panelde yorumlanır.",
    output: "Live dashboard",
    icon: BarChart3
  },
  {
    title: "Final report",
    description: "Danışman onaylı çıktı resmi teslim dokümanı olur.",
    output: "PDF / Markdown",
    icon: FileDown
  }
];

export default function Home() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [login, setLogin] = useState({ username: "admin", password: "" });
  const [loginError, setLoginError] = useState("");
  const [newCompany, setNewCompany] = useState({ companyName: "New Customer", sector: "Technology" });
  const [assessments, setAssessments] = useState<AssessmentRecord[]>([]);
  const [selectedToken, setSelectedToken] = useState<string>("");
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
              <p className="mb-7 text-base font-semibold text-teal">DevSecOps Maturity Platform</p>
              <h1 className="max-w-[560px] text-[44px] font-semibold leading-[1.05] tracking-normal text-white sm:text-[56px] lg:text-[58px]">
                Assessment Admin Console
              </h1>
              <div className="mt-6 h-0.5 w-14 bg-teal" />
              <p className="mt-6 max-w-[520px] text-lg leading-8 text-white/72">Global DevOps & DevSecOps maturity assessments</p>
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
    <main className="grid min-h-screen grid-cols-1 bg-wash lg:grid-cols-[240px_minmax(0,1fr)]">
      <aside className="hidden border-r border-line bg-ink px-4 py-5 text-white lg:block">
        <div className="mb-8 flex items-center gap-3">
          <div className="grid h-9 w-9 place-items-center rounded-md bg-teal"><ShieldCheck size={19} /></div>
          <div>
            <div className="text-sm font-semibold leading-tight">DevSecOps</div>
            <div className="text-xs text-white/60">Maturity Platform</div>
          </div>
        </div>
        {["Organization Profile", "Assessment", "Results", "Recommendations", "Roadmap", "Reports", "Executive Report"].map((item, index) => (
          <div key={item} className={`mb-1 rounded-md px-3 py-2 text-sm ${index === 2 ? "bg-white/12 text-white" : "text-white/70"}`}>{item}</div>
        ))}
      </aside>
      <section className="min-w-0">
        <header className="flex flex-col gap-3 border-b border-line bg-white px-4 py-3 xl:flex-row xl:items-center xl:justify-between xl:px-5">
          <div className="min-w-0">
            <h1 className="text-base font-semibold text-ink">Global DevOps & DevSecOps Maturity Assessment Platform</h1>
            <p className="text-xs text-muted">Token link ile müşteri assessment doldurma, skor, öneri, roadmap ve AI summary.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select className="focus-ring min-w-[190px] rounded-md border border-line bg-white px-3 py-2 text-sm" value={selectedToken} onChange={(event) => setSelectedToken(event.target.value)}>
              {assessments.map((item) => <option key={item.token} value={item.token}>{item.organization.companyName}</option>)}
            </select>
            <button onClick={createLink} className="focus-ring flex items-center gap-2 rounded-md bg-teal px-3 py-2 text-sm font-semibold text-white"><Plus size={16} /> New link</button>
            <button onClick={deleteSelectedAssessment} disabled={!selectedToken} className="focus-ring rounded-md border border-line bg-white p-2 text-danger disabled:cursor-not-allowed disabled:opacity-40" title="Delete selected customer"><Trash2 size={16} /></button>
            <button onClick={loadAssessments} className="focus-ring rounded-md border border-line bg-white p-2 text-ink"><RefreshCcw size={16} /></button>
            <button onClick={logout} className="focus-ring flex items-center gap-2 rounded-md border border-line bg-white px-3 py-2 text-sm font-semibold text-ink"><LogOut size={16} /> Logout</button>
          </div>
        </header>
        {selected ? <AdminWorkspace record={selected} onSaved={loadAssessments} newCompany={newCompany} setNewCompany={setNewCompany} createLink={createLink} /> : (
          <div className="p-4">
            <div className="panel grid min-h-[320px] place-items-center p-8 text-center">
              <div>
                <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-md bg-teal/10 text-teal"><Plus size={22} /></div>
                <h2 className="text-base font-semibold text-ink">Henüz customer assessment yok</h2>
                <p className="mt-2 text-sm text-muted">Yeni müşteri linki oluşturup assessment akışını başlatabilirsiniz.</p>
                <button onClick={createLink} className="focus-ring mt-5 inline-flex items-center gap-2 rounded-md bg-teal px-3 py-2 text-sm font-semibold text-white"><Plus size={16} /> New link</button>
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
  onSaved,
  newCompany,
  setNewCompany,
  createLink
}: {
  record: AssessmentRecord;
  onSaved: () => Promise<void>;
  newCompany: { companyName: string; sector: string };
  setNewCompany: (value: { companyName: string; sector: string }) => void;
  createLink: () => Promise<void>;
}) {
  const score = record.score ?? calculateAssessment(record.answers);
  const recommendations = record.recommendations ?? generateRecommendations(record.answers, score.categoryScores);
  const roadmap = buildRoadmap(recommendations);
  const publicLink = `${baseUrl}/assessment/${record.token}`;

  async function copyLink() {
    await navigator.clipboard.writeText(publicLink);
  }

  return (
    <div className="grid grid-cols-1 gap-4 p-3 sm:p-4 xl:grid-cols-[360px_minmax(0,1fr)]">
      <section className="space-y-4">
        <div className="panel p-4">
          <h2 className="mb-3 text-sm font-semibold">Create customer assessment</h2>
          <div className="grid grid-cols-1 gap-2">
            <input className="focus-ring rounded-md border border-line px-3 py-2 text-sm" value={newCompany.companyName} onChange={(event) => setNewCompany({ ...newCompany, companyName: event.target.value })} placeholder="Company name" />
            <input className="focus-ring rounded-md border border-line px-3 py-2 text-sm" value={newCompany.sector} onChange={(event) => setNewCompany({ ...newCompany, sector: event.target.value })} placeholder="Sector" />
            <button onClick={createLink} className="focus-ring flex items-center justify-center gap-2 rounded-md bg-teal px-3 py-2 text-sm font-semibold text-white"><Plus size={16} /> Create token link</button>
          </div>
        </div>
        <div className="panel p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold">Customer token link</h2>
            <span className="rounded bg-wash px-2 py-1 text-xs text-muted">{record.status}</span>
          </div>
          <div className="mb-3 break-all rounded-md border border-line bg-wash p-3 text-xs text-muted">{publicLink}</div>
          <button onClick={copyLink} className="focus-ring flex w-full items-center justify-center gap-2 rounded-md bg-ink px-3 py-2 text-sm font-semibold text-white"><Clipboard size={16} /> Copy customer link</button>
        </div>
        <AssessmentEditor token={record.token} initialProfile={record.organization} initialAnswers={record.answers} onSaved={onSaved} compact />
      </section>
      <section className="space-y-4">
        <DeliveryFlow record={record} recommendationCount={recommendations.length} />
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
        <div className="grid grid-cols-1 gap-4 2xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="panel p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold">Top gaps & recommendations</h2>
              <div className="flex flex-wrap items-center gap-2">
                <a href={`/api/export/${record.token}/html`} target="_blank" className="focus-ring flex items-center gap-2 rounded-md border border-line px-3 py-2 text-sm font-semibold"><FileText size={16} /> HTML</a>
                <a href={`/api/export/${record.token}/pdf`} className="focus-ring flex items-center gap-2 rounded-md border border-line px-3 py-2 text-sm font-semibold"><FileDown size={16} /> PDF</a>
                <a href={`/api/export/${record.token}/markdown`} className="focus-ring flex items-center gap-2 rounded-md border border-line px-3 py-2 text-sm font-semibold"><FileDown size={16} /> Markdown</a>
                <a href={`/api/export/${record.token}/json`} className="focus-ring flex items-center gap-2 rounded-md border border-line px-3 py-2 text-sm font-semibold"><Activity size={16} /> JSON</a>
              </div>
            </div>
            <div className="space-y-2">
              {recommendations.map((item) => <div key={item.id} className="rounded-md border border-line p-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm font-semibold">{item.title}</div>
                  <span className={`rounded px-2 py-1 text-xs font-semibold ${item.severity === "Critical" ? "bg-red-50 text-danger" : "bg-amber/10 text-amber"}`}>{item.severity}</span>
                </div>
                <p className="mt-1 text-xs leading-5 text-muted">{item.recommendation}</p>
              </div>)}
            </div>
          </div>
          <div className="space-y-4">
            <div className="panel p-4">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-semibold">Executive report</h2>
                <a href={`/api/export/${record.token}/pdf`} className="focus-ring rounded-md bg-ink px-3 py-2 text-xs font-semibold text-white">PDF</a>
              </div>
              <p className="text-sm leading-6 text-muted">{record.aiSummary ?? "PDF rapor dış servise bağlı olmadan skor, gap, güvenlik detayı, SDLC akışı ve roadmap verilerinden üretilir."}</p>
            </div>
            <div className="panel p-4">
              <h2 className="mb-3 text-sm font-semibold">Roadmap timeline</h2>
              <div className="space-y-3">
                {roadmap.map((phase) => <div key={phase.phase} className="border-l-2 border-teal pl-3">
                  <div className="text-sm font-semibold">{phase.phase}: {phase.title}</div>
                  <div className="text-xs text-muted">{phase.duration} · {phase.items.length} action</div>
                </div>)}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function DeliveryFlow({ record, recommendationCount }: { record: AssessmentRecord; recommendationCount: number }) {
  const completedIndex = record.status === "Completed" ? 2 : record.status === "InProgress" ? 1 : 0;

  return (
    <div className="panel p-4">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold">Assessment delivery flow</h2>
          <p className="mt-1 text-xs leading-5 text-muted">Portal canlı analiz ekranıdır; final çıktı müşteriyle PDF/Markdown rapor olarak paylaşılır.</p>
        </div>
        <span className="rounded bg-wash px-2 py-1 text-xs font-semibold text-muted">{record.status}</span>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 2xl:grid-cols-4">
        {deliveryFlow.map((step, index) => {
          const active = index <= completedIndex || (index === 2 && recommendationCount > 0);
          return (
            <div key={step.title} className={`rounded-md border p-3 ${active ? "border-teal/35 bg-teal/5" : "border-line bg-white"}`}>
              <div className={`mb-3 grid h-8 w-8 place-items-center rounded-md ${active ? "bg-teal text-white" : "bg-wash text-muted"}`}>
                <step.icon size={16} />
              </div>
              <div className="text-sm font-semibold text-ink">{step.title}</div>
              <p className="mt-1 min-h-[40px] text-xs leading-5 text-muted">{step.description}</p>
              <div className="mt-2 rounded bg-white px-2 py-1 text-xs font-semibold text-muted">{step.output}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
