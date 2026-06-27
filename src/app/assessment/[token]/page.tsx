"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AssessmentEditor } from "@/components/AssessmentEditor";
import { AssessmentRecord } from "@/lib/types";
import { calculateAssessment } from "@/features/scoring/scoring";
import { ScoreDonut } from "@/components/Charts";
import { DeliveryFlow } from "@/components/DeliveryFlow";

export default function PublicAssessmentPage({ params }: { params: Promise<{ token: string }> }) {
  const [token, setToken] = useState("");
  const [record, setRecord] = useState<AssessmentRecord | null>(null);

  async function loadAssessment(accessToken: string) {
    const response = await fetch(`/api/assessments/token/${accessToken}`);
    setRecord(await response.json());
  }

  useEffect(() => {
    params.then(({ token }) => {
      setToken(token);
      void loadAssessment(token);
    });
  }, [params]);

  if (!record) return <main className="grid min-h-screen place-items-center bg-wash text-sm text-muted">Assessment yükleniyor...</main>;
  const score = record.score ?? calculateAssessment(record.answers);

  return (
    <main className="min-h-screen bg-wash">
      <header className="border-b border-line bg-white px-4 py-4 sm:px-6">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h1 className="text-lg font-semibold text-ink">{record.organization.companyName} SDLC & DevSecOps Assessment</h1>
            <p className="text-sm text-muted">Enterprise Assessment Platform üzerindeki bu token sadece kurumunuza özeldir. Cevaplarınızı kaydedip tamamlayabilirsiniz.</p>
          </div>
          <Link href="/" className="text-sm font-semibold text-teal">Admin</Link>
        </div>
      </header>
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-4 p-3 sm:p-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <section className="space-y-4">
          <DeliveryFlow record={record} compact />
          <AssessmentEditor token={token} initialProfile={record.organization} initialAnswers={record.answers} onSaved={() => loadAssessment(token)} />
        </section>
        <aside className="space-y-4">
          <div className="panel p-4">
            <h2 className="text-sm font-semibold">Current score</h2>
            <ScoreDonut score={score.overallScore} />
            <div className="text-center text-sm font-semibold">{score.maturityLevel}</div>
          </div>
          <div className="panel p-4">
            <h2 className="mb-3 text-sm font-semibold">Status</h2>
            <div className="rounded-md bg-wash p-3 text-sm text-muted">{record.status}</div>
          </div>
        </aside>
      </div>
    </main>
  );
}
