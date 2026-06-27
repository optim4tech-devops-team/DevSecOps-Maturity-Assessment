"use client";

import { BarChart3, CheckCircle2, Clipboard, FileDown } from "lucide-react";
import { AssessmentRecord } from "@/lib/types";

const deliveryFlow = [
  {
    title: "Token link",
    description: "Kurum için özel assessment linki paylaşılır.",
    output: "Public form",
    icon: Clipboard
  },
  {
    title: "Assessment",
    description: "Cevaplar aynı token üzerinde kaydedilir ve tamamlanır.",
    output: "Answers + score",
    icon: CheckCircle2
  },
  {
    title: "Consultant review",
    description: "Skor, gap, öneri ve yol haritası danışman ekranında yorumlanır.",
    output: "Review dashboard",
    icon: BarChart3
  },
  {
    title: "Final report",
    description: "AI yorumu ve PDF hazır olduğunda aynı token kaydından indirilir.",
    output: "PDF report",
    icon: FileDown
  }
];

export function DeliveryFlow({ record, recommendationCount = 0, compact = false }: { record: AssessmentRecord; recommendationCount?: number; compact?: boolean }) {
  const completedIndex = getCompletedIndex(record, recommendationCount);

  return (
    <div className="panel p-4">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold">Assessment delivery flow</h2>
          <p className="mt-1 text-xs leading-5 text-muted">
            {compact ? "Bu token üzerindeki assessment, danışman incelemesi ve PDF rapor akışı." : "Portal canlı analiz ekranıdır; final çıktı müşteriyle PDF/Markdown rapor olarak paylaşılır."}
          </p>
        </div>
        <span className="rounded bg-wash px-2 py-1 text-xs font-semibold text-muted">{record.reportStatus === "Ready" ? "Report Ready" : record.status}</span>
      </div>
      <div className={`grid grid-cols-1 gap-3 sm:grid-cols-2 ${compact ? "xl:grid-cols-2" : "2xl:grid-cols-4"}`}>
        {deliveryFlow.map((step, index) => {
          const active = index <= completedIndex;
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

function getCompletedIndex(record: AssessmentRecord, recommendationCount: number) {
  if (record.reportStatus === "Ready") return 3;
  if (record.reportStatus === "Processing" || record.status === "Completed") return 2;
  if (record.status === "InProgress" || recommendationCount > 0) return 1;
  return 0;
}
