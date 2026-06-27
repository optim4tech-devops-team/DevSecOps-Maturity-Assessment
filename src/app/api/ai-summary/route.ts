import { NextResponse } from "next/server";
import { updateAssessmentByToken } from "@/lib/db";

type SummaryRequest = {
  token: string;
  companyName: string;
  overallScore: number;
  maturityLevel: string;
  gaps: string[];
  recommendations: string[];
};

function fallbackSummary(payload: SummaryRequest) {
  const topGaps = payload.gaps.slice(0, 3).join(", ") || "kritik gap bulunmadı";
  return `${payload.companyName} için genel olgunluk skoru ${payload.overallScore}/100 (${payload.maturityLevel}). Öncelikli iyileştirme alanları: ${topGaps}. İlk 30 günde production approval, rollback, PR policy ve temel güvenlik tarama kontrolleri net sahiplik ve ölçülebilir gate'ler ile ele alınmalıdır.`;
}

function turkishPrompt(payload: SummaryRequest) {
  return `Sadece Türkçe yanıt ver. Markdown başlıkları kullanma. 5-7 cümlelik kısa bir executive summary yaz.
Şirket: ${payload.companyName}
Genel skor: ${payload.overallScore}/100
Olgunluk seviyesi: ${payload.maturityLevel}
Öncelikli gap'ler: ${payload.gaps.join("; ") || "Yok"}
Öneriler: ${payload.recommendations.join("; ") || "Yok"}
Çıktı formatı: Önce mevcut durum, sonra en kritik 3 aksiyon, sonra beklenen etki. Genel pazarlama dili kullanma.`;
}

function cleanSummary(summary: string) {
  return summary
    .replace(/<think>[\s\S]*?<\/think>/gi, "")
    .replace(/^\s*(Executive Summary|Özet|Sonuç)\s*:?\s*/i, "")
    .trim();
}

export async function POST(request: Request) {
  const payload = (await request.json()) as SummaryRequest;
  const baseUrl = process.env.LOCAL_AI_BASE_URL;
  const model = process.env.LOCAL_AI_MODEL ?? "llama3.1";

  if (!baseUrl) {
    const summary = fallbackSummary(payload);
    await updateAssessmentByToken(payload.token, { aiSummary: summary });
    return NextResponse.json({ summary, provider: "fallback" });
  }

  try {
    const normalizedBaseUrl = baseUrl.replace(/\/$/, "");
    const response = await fetch(`${normalizedBaseUrl}/v1/chat/completions`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...(process.env.LOCAL_AI_API_KEY ? { authorization: `Bearer ${process.env.LOCAL_AI_API_KEY}` } : {})
      },
      body: JSON.stringify({
        model,
        temperature: 0.2,
        messages: [
          {
            role: "system",
            content: "Sadece Türkçe yazan, kısa ve aksiyon odaklı DevOps/DevSecOps assessment danışmanısın. İngilizce başlık veya madde kullanma."
          },
          {
            role: "user",
            content: turkishPrompt(payload)
          }
        ]
      })
    });
    let summary = "";
    if (response.ok) {
      const data = await response.json();
      summary = data.choices?.[0]?.message?.content?.trim() || "";
    } else {
      const ollamaResponse = await fetch(`${normalizedBaseUrl}/api/chat`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          model,
          stream: false,
          messages: [
            {
              role: "system",
              content: "Sadece Türkçe yazan, kısa ve aksiyon odaklı DevOps/DevSecOps assessment danışmanısın. İngilizce başlık veya madde kullanma."
            },
            { role: "user", content: turkishPrompt(payload) }
          ]
        })
      });
      if (ollamaResponse.ok) {
        const data = await ollamaResponse.json();
        summary = data.message?.content?.trim() || "";
      } else {
        const generateResponse = await fetch(`${normalizedBaseUrl}/api/generate`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            model,
            stream: false,
            prompt: turkishPrompt(payload)
          })
        });
        if (!generateResponse.ok) throw new Error(`local-ai returned ${response.status}; ollama chat returned ${ollamaResponse.status}; ollama generate returned ${generateResponse.status}`);
        const data = await generateResponse.json();
        summary = data.response?.trim() || "";
      }
    }
    summary = cleanSummary(summary) || fallbackSummary(payload);
    await updateAssessmentByToken(payload.token, { aiSummary: summary });
    return NextResponse.json({ summary, provider: "local-ai" });
  } catch (error) {
    const summary = fallbackSummary(payload);
    await updateAssessmentByToken(payload.token, { aiSummary: summary });
    return NextResponse.json({ summary, provider: "fallback", warning: error instanceof Error ? error.message : "AI request failed" });
  }
}
