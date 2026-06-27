import { Answers, OrganizationProfile } from "@/data/assessment";
import { AssessmentScore, CategoryScore } from "@/features/scoring/scoring";
import { buildRoadmap, Recommendation } from "@/features/recommendations/recommendations";

type PdfPage = {
  width: number;
  height: number;
  ops: string[];
};

type PdfDoc = {
  pages: PdfPage[];
  page: PdfPage;
};

type RGB = readonly [number, number, number];

const pageWidth = 1190;
const pageHeight = 842;
const navy: RGB = [5, 25, 54];
const blue: RGB = [25, 92, 180];
const green: RGB = [70, 172, 56];
const amber: RGB = [245, 166, 35];
const red: RGB = [236, 76, 61];
const purple: RGB = [112, 55, 190];
const line: RGB = [204, 214, 224];
const wash: RGB = [246, 248, 251];
const ink: RGB = [20, 34, 52];

export function generateExecutivePdfReport(profile: OrganizationProfile, score: AssessmentScore, recommendations: Recommendation[], answers: Answers) {
  const doc = createDoc();
  const securityScores = getSecurityScores(score.categoryScores, recommendations);
  const orderedCategories = [...score.categoryScores].sort((a, b) => b.score - a.score);
  const lowestCategories = [...score.categoryScores].sort((a, b) => a.score - b.score).slice(0, 6);
  const roadmap = buildRoadmap(recommendations);
  const title = `${profile.companyName} SDLC & DEVSECOPS ASSESSMENT RAPORU`;

  fill(doc, 0, 0, pageWidth, pageHeight, 255, 255, 255);
  fill(doc, 0, 760, pageWidth, 82, ...navy);
  text(doc, title, 24, 810, 21, "bold", 255, 255, 255);
  text(doc, `${profile.sourceControlTool} + ${profile.cicdTool} + ${profile.itsmTool} ENTEGRE UCTAN UCA SDLC SURECI`, 24, 784, 13, "bold", 116, 218, 232);

  section(doc, 12, 330, 300, 410, "1. OLGUNLUK OZETI (ALAN BAZLI)");
  drawMaturityList(doc, orderedCategories.slice(0, 12), 28, 704, 258);
  drawMaturityList(doc, lowestCategories, 28, 444, 258, true);

  drawScoreBadge(doc, score.overallScore, score.maturityLevel, 884, 780);
  drawLegend(doc, 1010, 812);

  section(doc, 322, 330, 856, 410, "2. UCTAN UCA SDLC SURECI AKISI");
  drawSdlcFlow(doc, 340, 638);
  drawIntegrationStrip(doc, 340, 454);

  section(doc, 12, 70, 274, 240, "3. OLGUNLUK RADAR GRAFIGI");
  drawRadarApprox(doc, score.categoryScores, 42, 102, 210, 154);

  section(doc, 300, 70, 490, 240, "4. GUVENLIK (DEVSECOPS) OLGUNLUK DETAYI");
  drawSecurityDetail(doc, securityScores, 318, 258);

  section(doc, 802, 195, 376, 115, "5. OTOMATIK RELEASE YONETIMI");
  drawReleaseFlow(doc, 820, 238);

  section(doc, 802, 70, 376, 110, "6. HEDEF YOL HARITASI");
  drawRoadmap(doc, roadmap, 816, 145);

  fill(doc, 12, 8, 1180, 48, 255, 255, 255);
  stroke(doc, 12, 56, 1180, 56, ...line);
  text(doc, "7. GENEL DEGERLENDIRME", 24, 38, 11, "bold", ...ink);
  const summary = buildDeterministicSummary(profile, score, recommendations);
  wrapText(doc, summary, 210, 42, 570, 8.5, 10, "regular", ...ink);
  fill(doc, 746, 18, 262, 24, ...navy);
  fill(doc, 1008, 18, 122, 24, ...green);
  text(doc, "GENEL DEVOPS PLATFORM OLGUNLUK SKORU", 758, 27, 8, "bold", 255, 255, 255);
  text(doc, `%${score.overallScore} (${scoreLabel(score.overallScore)})`, 1022, 27, 10, "bold", 255, 255, 255);

  void answers;
  return Buffer.from(renderPdf(doc));
}

function createDoc(): PdfDoc {
  const page = { width: pageWidth, height: pageHeight, ops: [] };
  return { pages: [page], page };
}

function section(doc: PdfDoc, x: number, y: number, w: number, h: number, title: string) {
  if (h > 0) {
    fill(doc, x, y, w, h, 255, 255, 255);
    strokeRect(doc, x, y, w, h, ...line);
  }
  if (title) {
    fill(doc, x, y + h - 23, Math.min(w, 520), 23, ...navy);
    text(doc, title, x + 10, y + h - 15, 10, "bold", 255, 255, 255);
  }
}

function drawMaturityList(doc: PdfDoc, categories: CategoryScore[], x: number, top: number, barWidth: number, riskMode = false) {
  categories.forEach((item, index) => {
    const y = top - index * 18;
    const color: RGB = item.score >= 70 ? green : item.score >= 50 ? amber : red;
    text(doc, compactName(item.category.name), x + 20, y, 7.6, "bold", ...ink);
    fill(doc, x + 150, y - 4, barWidth * 0.62, 6, 232, 236, 241);
    fill(doc, x + 150, y - 4, Math.max(3, barWidth * 0.62 * item.score / 100), 6, ...color);
    text(doc, `%${item.score}`, x + 150 + barWidth * 0.62 + 8, y - 1, 7.4, "bold", ...ink);
    const mark = riskMode ? "!" : ">";
    text(doc, mark, x, y - 1, 10, "bold", ...color);
  });
}

function drawScoreBadge(doc: PdfDoc, score: number, level: string, x: number, y: number) {
  circle(doc, x, y, 58, 232, 236, 241);
  circle(doc, x, y, 46, ...green);
  circle(doc, x, y, 32, ...navy);
  text(doc, `%${score}`, x - 24, y + 6, 22, "bold", 255, 255, 255);
  text(doc, scoreLabel(score), x - 26, y - 13, 9, "bold", 255, 255, 255);
  text(doc, "Genel DevOps Platform Olgunlugu", x - 92, y + 44, 12, "bold", 255, 255, 255);
  text(doc, level.replace("Level ", "Seviye "), x - 54, y - 72, 8, "regular", ...ink);
}

function drawLegend(doc: PdfDoc, x: number, y: number) {
  [
    ["90-100%", "Mukemmel", green],
    ["70-89%", "Iyi", [135, 204, 72] as RGB],
    ["50-69%", "Orta", amber],
    ["30-49%", "Gelistirilmeli", [245, 120, 32] as RGB],
    ["0-29%", "Zayif", red]
  ].forEach(([range, label, color], index) => {
    const yy = y - index * 22;
    circle(doc, x, yy, 6, ...(color as RGB));
    text(doc, String(range), x + 14, yy - 3, 9, "bold", 255, 255, 255);
    text(doc, String(label), x + 80, yy - 3, 9, "bold", 255, 255, 255);
  });
}

function drawSdlcFlow(doc: PdfDoc, x: number, y: number) {
  const steps = [
    ["1. IS TALEBI", "Jira kaydi olusturulur."],
    ["2. GK & FEATURE", "Kartlar ve branch acilir."],
    ["3. GELISTIRME & PR", "Kod, PR ve peer review."],
    ["4. CI & BUILD", "Pipeline calisir, build basarili olur."],
    ["5. DEPLOYMENT DEV", "Dev ortamina otomatik deploy."],
    ["6. TEST", "Test ortamina otomatik deploy."],
    ["7. SECURITY APPROVAL", "Guv. onayi verilir."],
    ["8. PREP", "Prep ortamina deploy edilir."],
    ["9. ONAY SURECLERI", "Manager, PCAP ve hazirlik."],
    ["10. PROD RELEASE", "Release admin onaylar."],
    ["11. UAT & DONE", "UAT sonrasi DONE olur."]
  ];
  const stepW = 74;
  steps.forEach(([title, body], index) => {
    const xx = x + index * stepW;
    stroke(doc, xx + stepW - 8, y - 112, xx + stepW - 8, y + 42, 220, 226, 233);
    text(doc, title, xx + 2, y + 28, 7.6, "bold", ...(index < 6 ? blue : index < 8 ? amber : index < 10 ? purple : blue));
    drawIconBox(doc, xx + 24, y - 10, index);
    wrapText(doc, body, xx + 8, y - 42, 58, 7.2, 9, "bold", ...ink);
    if (index < steps.length - 1) {
      stroke(doc, xx + 58, y - 5, xx + 72, y - 5, ...navy);
      text(doc, ">", xx + 72, y - 8, 8, "bold", ...navy);
    }
  });
}

function drawIntegrationStrip(doc: PdfDoc, x: number, y: number) {
  strokeRect(doc, x - 10, y - 58, 816, 72, ...line);
  text(doc, "OTOMATIK INTEGRASYON & BILDIRIMLER", x + 270, y + 2, 8, "bold", ...navy);
  ["Jira Workflow", "Azure DevOps API", "Branch Policy", "Pipeline Olustur", "SonarQube", "Fortify", "Variable Groups", "Environment", "Service Connection", "RBAC", "ITSM / CMDB", "Bildirim"].forEach((label, index) => {
    const xx = x + index * 66;
    drawIconBox(doc, xx + 8, y - 28, index);
    wrapText(doc, label, xx - 2, y - 49, 54, 6.7, 8, "bold", ...ink);
    if (index < 11) stroke(doc, xx + 42, y - 18, xx + 52, y - 18, ...navy);
  });
}

function drawRadarApprox(doc: PdfDoc, categories: CategoryScore[], x: number, y: number, w: number, h: number) {
  const centerX = x + w / 2;
  const centerY = y + h / 2;
  const radius = 60;
  [1, 0.75, 0.5, 0.25].forEach((scale) => {
    strokeRect(doc, centerX - radius * scale, centerY - radius * scale, radius * scale * 2, radius * scale * 2, 230, 235, 241);
  });
  const key = ["sdlc", "ci", "release", "scm", "observability", "devsecops"];
  key.forEach((id, index) => {
    const angle = -Math.PI / 2 + (Math.PI * 2 * index) / key.length;
    const item = categories.find((category) => category.category.id === id);
    const value = item?.score ?? 0;
    const rx = centerX + Math.cos(angle) * radius;
    const ry = centerY + Math.sin(angle) * radius;
    const vx = centerX + Math.cos(angle) * radius * value / 100;
    const vy = centerY + Math.sin(angle) * radius * value / 100;
    stroke(doc, centerX, centerY, rx, ry, 220, 226, 233);
    circle(doc, vx, vy, 3, ...green);
    text(doc, `${compactName(item?.category.name ?? id)} %${value}`, rx - 34, ry - 5, 6.6, "bold", ...ink);
  });
  text(doc, "Mevcut Durum", x + 6, y + h - 18, 7, "bold", ...green);
  text(doc, "Hedef Durum", x + 92, y + h - 18, 7, "bold", ...blue);
}

function drawSecurityDetail(doc: PdfDoc, items: Array<{ name: string; score: number; notes: string[] }>, x: number, y: number) {
  items.forEach((item, index) => {
    const xx = x + index * 68;
    strokeRect(doc, xx - 4, y - 130, 64, 150, 226, 232, 238);
    text(doc, item.name, xx + 4, y + 4, 7, "bold", ...ink);
    circle(doc, xx + 28, y - 36, 22, 232, 236, 241);
    circle(doc, xx + 28, y - 36, 17, ...(item.score >= 60 ? green : red));
    circle(doc, xx + 28, y - 36, 12, 255, 255, 255);
    text(doc, `%${item.score}`, xx + 16, y - 39, 10, "bold", ...ink);
    item.notes.slice(0, 4).forEach((note, noteIndex) => {
      text(doc, item.score >= 60 ? "v" : "x", xx, y - 70 - noteIndex * 14, 7, "bold", ...(item.score >= 60 ? green : red));
      wrapText(doc, note, xx + 9, y - 70 - noteIndex * 14, 48, 5.8, 7, "regular", ...ink);
    });
  });
}

function drawReleaseFlow(doc: PdfDoc, x: number, y: number) {
  ["Release Admin", "Approval", "Azure DevOps", "Production Deploy", "Validation", "Done"].forEach((label, index) => {
    const xx = x + index * 61;
    circle(doc, xx + 16, y, 16, 255, 255, 255);
    circle(doc, xx + 16, y, 14, ...(index === 1 || index === 5 ? green : blue));
    circle(doc, xx + 16, y, 11, 255, 255, 255);
    text(doc, index === 1 || index === 5 ? "v" : String(index + 1), xx + 12, y - 4, 9, "bold", ...(index === 1 || index === 5 ? green : blue));
    wrapText(doc, label, xx - 2, y - 28, 46, 6.3, 8, "bold", ...ink);
    if (index < 5) stroke(doc, xx + 32, y, xx + 58, y, ...navy);
  });
}

function drawRoadmap(doc: PdfDoc, roadmap: ReturnType<typeof buildRoadmap>, x: number, y: number) {
  const colors: RGB[] = [green, amber, purple];
  roadmap.forEach((phase, index) => {
    const xx = x + index * 124;
    fill(doc, xx, y, 112, 22, ...colors[index]);
    text(doc, `${phase.duration}`, xx + 32, y + 13, 8, "bold", 255, 255, 255);
    text(doc, phase.title, xx + 14, y + 4, 6.5, "bold", 255, 255, 255);
    phase.items.slice(0, 3).forEach((item, itemIndex) => {
      text(doc, "v", xx + 2, y - 14 - itemIndex * 14, 7, "bold", ...colors[index]);
      wrapText(doc, item.title, xx + 12, y - 14 - itemIndex * 14, 92, 6.2, 8, "regular", ...ink);
    });
  });
}

function getSecurityScores(categoryScores: CategoryScore[], recommendations: Recommendation[]) {
  const devsecops = categoryScores.find((item) => item.category.id === "devsecops")?.score ?? 0;
  const securityNames = ["SAST", "DAST", "SCA", "Container", "Secret", "IaC", "Runtime"];
  return securityNames.map((name) => {
    const match = recommendations.find((item) => item.title.toLowerCase().includes(name.toLowerCase()) || item.id.toLowerCase().includes(name.toLowerCase()));
    const score = match ? Math.max(5, devsecops - 45) : devsecops;
    return {
      name,
      score,
      notes: match
        ? [match.description, match.recommendation, match.expectedImpact]
        : ["Standart tanimli", "Pipeline veya policy ile izleniyor", "Kanita dayali takip mevcut"]
    };
  });
}

function buildDeterministicSummary(profile: OrganizationProfile, score: AssessmentScore, recommendations: Recommendation[]) {
  const top = recommendations.slice(0, 3).map((item) => item.title).join(", ");
  return `${profile.companyName} icin SDLC sureci ${score.maturityLevel} seviyesinde degerlendirildi. En oncelikli iyilestirme alanlari: ${top || "kritik gap bulunmadi"}. Platformun ust olgunluk seviyesine cikmasi icin security gate, release kontrolu, gozlemlenebilirlik ve kanit yonetimi faz bazli uygulanmalidir.`;
}

function scoreLabel(score: number) {
  if (score >= 90) return "MUKEMMEL";
  if (score >= 70) return "IYI SEVIYE";
  if (score >= 50) return "ORTA";
  if (score >= 30) return "GELISTIRILMELI";
  return "ZAYIF";
}

function compactName(value: string) {
  return value
    .replace("Organizasyon ve ", "")
    .replace("Yönetimi", "Yonetimi")
    .replace("Kaynak Kod", "Kod")
    .replace("İzleme, Log ve Gözlemlenebilirlik", "Observability")
    .replace("DevSecOps ve Güvenlik", "DevSecOps")
    .replace("Altyapı ve Cloud Hazırlığı", "Altyapi & Cloud");
}

function drawIconBox(doc: PdfDoc, x: number, y: number, index: number) {
  const palette: RGB[] = [blue, [32, 156, 86], amber, purple, navy];
  fill(doc, x, y, 24, 24, ...palette[index % palette.length]);
  text(doc, index % 3 === 0 ? "<>" : index % 3 === 1 ? "v" : "^", x + 7, y + 8, 12, "bold", 255, 255, 255);
}

function fill(doc: PdfDoc, x: number, y: number, w: number, h: number, r: number, g: number, b: number) {
  doc.page.ops.push(`${rgb(r, g, b)} rg ${num(x)} ${num(y)} ${num(w)} ${num(h)} re f`);
}

function strokeRect(doc: PdfDoc, x: number, y: number, w: number, h: number, r: number, g: number, b: number) {
  doc.page.ops.push(`${rgb(r, g, b)} RG 0.8 w ${num(x)} ${num(y)} ${num(w)} ${num(h)} re S`);
}

function stroke(doc: PdfDoc, x1: number, y1: number, x2: number, y2: number, r: number, g: number, b: number) {
  doc.page.ops.push(`${rgb(r, g, b)} RG 0.8 w ${num(x1)} ${num(y1)} m ${num(x2)} ${num(y2)} l S`);
}

function circle(doc: PdfDoc, x: number, y: number, radius: number, r: number, g: number, b: number) {
  const c = radius * 0.5522847498;
  doc.page.ops.push(`${rgb(r, g, b)} rg ${num(x)} ${num(y + radius)} m ${num(x + c)} ${num(y + radius)} ${num(x + radius)} ${num(y + c)} ${num(x + radius)} ${num(y)} c ${num(x + radius)} ${num(y - c)} ${num(x + c)} ${num(y - radius)} ${num(x)} ${num(y - radius)} c ${num(x - c)} ${num(y - radius)} ${num(x - radius)} ${num(y - c)} ${num(x - radius)} ${num(y)} c ${num(x - radius)} ${num(y + c)} ${num(x - c)} ${num(y + radius)} ${num(x)} ${num(y + radius)} c f`);
}

function text(doc: PdfDoc, value: string, x: number, y: number, size: number, weight: "regular" | "bold", r: number, g: number, b: number) {
  const font = weight === "bold" ? "F2" : "F1";
  doc.page.ops.push(`BT ${rgb(r, g, b)} rg /${font} ${num(size)} Tf ${num(x)} ${num(y)} Td (${pdfText(value)}) Tj ET`);
}

function wrapText(doc: PdfDoc, value: string, x: number, y: number, width: number, size: number, lineHeight: number, weight: "regular" | "bold", r: number, g: number, b: number) {
  const words = toPdfSafe(value).split(/\s+/).filter(Boolean);
  const maxChars = Math.max(8, Math.floor(width / (size * 0.48)));
  const lines: string[] = [];
  let lineText = "";
  words.forEach((word) => {
    const next = lineText ? `${lineText} ${word}` : word;
    if (next.length > maxChars) {
      lines.push(lineText);
      lineText = word;
    } else {
      lineText = next;
    }
  });
  if (lineText) lines.push(lineText);
  lines.slice(0, 5).forEach((line, index) => text(doc, line, x, y - index * lineHeight, size, weight, r, g, b));
}

function renderPdf(doc: PdfDoc) {
  const objects: string[] = [];
  objects.push("<< /Type /Catalog /Pages 2 0 R >>");
  objects.push(`<< /Type /Pages /Kids [${doc.pages.map((_, index) => `${3 + index * 2} 0 R`).join(" ")}] /Count ${doc.pages.length} >>`);

  doc.pages.forEach((page, index) => {
    const pageObj = 3 + index * 2;
    const contentObj = pageObj + 1;
    const stream = page.ops.join("\n");
    objects.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${page.width} ${page.height}] /Resources << /Font << /F1 ${3 + doc.pages.length * 2} 0 R /F2 ${4 + doc.pages.length * 2} 0 R >> >> /Contents ${contentObj} 0 R >>`);
    objects.push(`<< /Length ${Buffer.byteLength(stream)} >>\nstream\n${stream}\nendstream`);
  });

  objects.push("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");
  objects.push("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>");

  const chunks = ["%PDF-1.4\n"];
  const offsets = [0];
  objects.forEach((object, index) => {
    offsets.push(Buffer.byteLength(chunks.join("")));
    chunks.push(`${index + 1} 0 obj\n${object}\nendobj\n`);
  });
  const xrefOffset = Buffer.byteLength(chunks.join(""));
  chunks.push(`xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`);
  offsets.slice(1).forEach((offset) => chunks.push(`${String(offset).padStart(10, "0")} 00000 n \n`));
  chunks.push(`trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`);
  return chunks.join("");
}

function rgb(r: number, g: number, b: number) {
  return `${num(r / 255)} ${num(g / 255)} ${num(b / 255)}`;
}

function num(value: number) {
  return Number(value.toFixed(3));
}

function pdfText(value: string) {
  return toPdfSafe(value).replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

function toPdfSafe(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/İ/g, "I")
    .replace(/ı/g, "i")
    .replace(/Ğ/g, "G")
    .replace(/ğ/g, "g")
    .replace(/Ü/g, "U")
    .replace(/ü/g, "u")
    .replace(/Ş/g, "S")
    .replace(/ş/g, "s")
    .replace(/Ö/g, "O")
    .replace(/ö/g, "o")
    .replace(/Ç/g, "C")
    .replace(/ç/g, "c")
    .replace(/[^\x20-\x7E]/g, " ");
}
