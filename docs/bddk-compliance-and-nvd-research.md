# BDDK Uyum ve NVD Teknoloji Maruziyeti Araştırması

Tarih: 28.06.2026  
Kapsam: SDLC, DevOps, DevSecOps ve Kubernetes assessment sonuçlarının BDDK mevzuat uyumu ve seçilen teknoloji araçlarına ait NVD sinyalleri ile raporlanması.

## Karar Özeti

BDDK uyum bilgisi assessment ekranında ayrı soru seti olarak sorulmamalıdır. Kullanıcı Finance sektörünü ve banka alt tipini seçtiğinde, mevcut assessment cevapları BDDK kontrol maddeleriyle otomatik eşleştirilmelidir.

Uygulama raporunda ayrı bir `Mevzuat Uyum` başlığı olmalıdır. Bu başlık, mevcut cevaplara göre madde bazlı uyum sinyali, kanıt ihtiyacı ve açık alanları göstermelidir. Bu çıktı hukuki görüş değil, teknik kontrol uyum değerlendirmesi olarak etiketlenmelidir.

Seçilen tool'lar için NVD kontrolü ayrı bir `Technology Exposure Watch` başlığı altında verilmelidir. Versiyon bilgisi yoksa sonuçlar kesin zafiyet olarak değil, doğrulanması gereken ürün ailesi sinyali olarak raporlanmalıdır.

## Resmi Kaynaklar

1. Bankaların Bilgi Sistemleri ve Elektronik Bankacılık Hizmetleri Hakkında Yönetmelik  
   Resmi kaynak: https://www.mevzuat.gov.tr/mevzuat?MevzuatNo=34360&MevzuatTur=7&MevzuatTertip=5  
   Mevzuat No: 34360  
   Resmi Gazete: 15.03.2020 / 31069

2. Bilgi Sistemleri ve İş Süreçleri Bağımsız Denetimi Hakkında Yönetmelik  
   Resmi kaynak: https://www.mevzuat.gov.tr/mevzuat?MevzuatNo=39257&MevzuatTur=7&MevzuatTertip=5  
   Mevzuat No: 39257  
   Kullanım amacı: raporlama, önemlilik, kontrol zayıflığı, denetim kanıtı ve bağımsız denetim metodolojisi referansı.

3. NVD CVE API 2.0  
   Resmi API: https://services.nvd.nist.gov/rest/json/cves/2.0  
   Kullanım amacı: seçilen teknoloji araçları için CVE sinyali, CVSS, severity, referans ve etkilenen CPE/ürün ailesi bilgisini rapora eklemek.

## BDDK 34360 Kontrol Alanları ve Mevcut Assessment Eşleşmesi

| BDDK madde | Kontrol teması | Mevcut assessment kategorisi | Rapor yorumu |
| --- | --- | --- | --- |
| Madde 4 | Yönetim kurulu ve BS yönetişimi | Kurumsal Kapsam ve İşletim Modeli, Yönetişim | Sahiplik, karar mekanizması ve üst yönetim görünürlüğü |
| Madde 5 | BS politika, prosedür ve kontroller | Yönetişim, DevSecOps | Politika, standart, kontrol ve evidence olgunluğu |
| Madde 6 | Bilgi varlığı sınıflandırması ve envanter | Kurumsal Kapsam, Altyapı | Uygulama kritiklik modeli, varlık kapsamı, data sınıflandırma ihtiyacı |
| Madde 7 | BS risk yönetimi | Yönetişim, Release, DevSecOps | Risklerin ölçülmesi, takip edilmesi ve raporlanması |
| Madde 8 | Bilgi güvenliği sorumluluğu | Kurumsal Kapsam, DevSecOps | Nihai sahiplik ve security governance modeli |
| Madde 9 | Veri gizliliği | DevSecOps, Altyapı | Secret, erişim, encryption ve data handling kontrolleri |
| Madde 11 | Erişim kontrolü ve görevler ayrılığı | Yönetişim, CD, Kubernetes | RBAC, approval, segregation of duties |
| Madde 12 | Veri ve işlem bütünlüğü | CI, CD, Test, Release | Build, test, deployment ve transaction integrity sinyali |
| Madde 13 | İz kayıtları ve loglama | Observability, Governance | Audit log, retention, korelasyon ve delil niteliği |
| Madde 14 | Ağ güvenliği | Infrastructure, Kubernetes | Network segmentation, firewall, ingress/egress, cluster network policy |
| Madde 15 | Sistem, DB, uygulama ve ağ bileşeni güvenliği | Infrastructure, Kubernetes, DevSecOps | Hardening, configuration baseline, secure defaults |
| Madde 16 | Zafiyet ve güvenlik açıklarının yönetimi | DevSecOps, CI, Kubernetes | SAST, DAST, SCA, image scan, patching ve remediation SLA |
| Madde 18 | Siber olay sonrası toparlanma | Ops, Observability, Continuity | Incident, recovery, runbook, RCA |
| Madde 19 | Güvenlik farkındalığı | Governance | Eğitim ve farkındalık takip kapsamı |
| Madde 21 | BS proje yönetimi | SDLC, Release | Önceliklendirme, proje koordinasyonu, gereksinim ve kabul kriterleri |
| Madde 22 | Geliştirme, test ve üretim ayrımı | SDLC, CI, CD | Ortam ayrımı, deployment path, promotion kontrolleri |
| Madde 23 | Uygulama edinimi/geliştirme ve mevzuat gereksinimi | SDLC, Test, DevSecOps | Uygulama gereksinimlerinin mevzuat ve politika ile izlenmesi |
| Madde 24 | Değişiklik yönetimi | SCM, CD, Release | Change kayıtları, PR, approval, rollback ve audit trail |
| Madde 25 | Birincil/ikincil sistemlerin yurt içinde bulunması | Infrastructure | Lokasyon/hosting sorusu gerekebilir; mevcut kapsamda eksik |
| Madde 26 | BT operasyon yönetimi | Ops, Observability | Günlük operasyon, bakım, izleme, olay yönetimi |
| Madde 27 | Tekil hata noktası ve dayanıklılık | Infrastructure, Continuity | Redundancy, HA, capacity ve failure domain |
| Madde 28 | BS süreklilik yönetimi | Infrastructure, Ops | DR, backup, continuity plan ve test kanıtı |
| Madde 29 | Dış hizmet sağlayıcı risk yönetimi | Governance, Infrastructure | Outsourcing, cloud/provider risk ve sözleşmesel kontrol |
| Madde 30-33 | BS iç kontrol, iç denetim, bulgu takip | Governance, Reports | Bulgu sahipliği, remediation takibi, denetim evidence |
| Madde 34-41 | Elektronik bankacılık ve açık bankacılık güvenliği | DevSecOps, API Security, Observability | Mevcut SDLC setinde kısmi; e-bankacılık/API modülü gerekebilir |

## 39257 Bağımsız Denetim Yönetmeliği ile Raporlama Eşleşmesi

Bu yönetmelik, bizim assessment kontrolünün nasıl raporlanacağına metodolojik dayanak sağlar:

| 39257 madde | Rapor etkisi |
| --- | --- |
| Madde 5 | Önemlilik kavramı; rapordaki bulgular `critical/high/medium/low` olarak normalize edilmeli |
| Madde 6 | Kontrol zafiyeti sınıflandırması; `kontrol zayıflığı`, `kayda değer kontrol eksikliği`, `önemli kontrol eksikliği` benzeri iç sınıflama eklenebilir |
| Madde 19 | Denetlenenin dokümantasyon ve kayıt hazırlığı; assessment evidence alanları bu ihtiyacı destekler |
| Madde 24 | Bilgi sistemleri genel kontrollerinin etkinlik/yeterlilik/uyumluluk açısından incelenmesi; rapor skoru bu üçlü bakışı ayrıca gösterebilir |
| Madde 28-30 | Denetim teknikleri ve kanıt; her BDDK uyum satırı için `kanıt seviyesi` alanı eklenmeli |
| Madde 31-33 | Kontrol zayıflıklarının değerlendirilmesi ve dokümantasyon; recommendation register ile bağlanmalı |
| Madde 37 | Dış hizmet sağlayıcı etkisi; cloud, Kubernetes, CI/CD, security SaaS araçları için dış hizmet notu eklenmeli |
| Madde 38 | BSD raporu; executive PDF içinde mevzuat uyum özeti, bulgu matrisi ve açık kanıtlar ayrı başlık olmalı |

## Uygulama Tasarımı

### Veri Modeli

Yeni kaynak dosyalar:

- `src/data/regulatory/bddk-34360.ts`
- `src/data/regulatory/bddk-39257.ts`
- `src/features/compliance/bddk.ts`
- `src/features/exposure/nvd.ts`

Önerilen tipler:

```ts
type ComplianceControl = {
  id: string;
  source: "BDDK-34360" | "BDDK-39257";
  article: string;
  theme: string;
  summary: string;
  categoryIds: string[];
  questionIds: string[];
  requiredEvidence: string[];
  reportWeight: "High" | "Medium" | "Low";
};

type ComplianceResult = {
  controlId: string;
  status: "Aligned" | "Partial" | "Gap" | "EvidenceRequired" | "NotApplicable";
  confidence: "High" | "Medium" | "Low";
  evidenceSignals: string[];
  gaps: string[];
  recommendationIds: string[];
};
```

### Trigger Mantığı

- Sector `Finance` seçilirse finans uyum değerlendirmesi aktif hale gelir.
- Alt sektör `Bank` seçilirse BDDK 34360 ve 39257 haritası çalışır.
- BDDK uyum için müşteriye ayrı mevzuat sorusu sorulmaz.
- Mevcut assessment cevapları ve not/evidence alanları değerlendirilir.
- Eksik kalan alanlar `EvidenceRequired` veya `NotApplicable` olarak raporlanır.

### Rapor Başlıkları

Executive PDF ve HTML rapora eklenecek başlıklar:

1. `Mevzuat Uyum Özeti`
2. `BDDK Kontrol Matrisi`
3. `Mevzuat Madde Karşılığı`
4. `Kanıt ve Açık Alanlar`
5. `Technology Exposure Watch`

### NVD Online Kontrol Tasarımı

Tool seçimi çoklu seçim olarak tutulmalı. Security tools içine en az şu ürünler eklenmeli:

- Red Hat ACS
- Quay
- SonarQube
- Fortify
- Checkmarx
- Veracode
- Snyk
- Mend
- Trivy
- Prisma Cloud
- Aqua Security
- Wiz
- GitGuardian
- Nexus IQ
- Anchore
- Clair
- Harbor

NVD entegrasyonu:

- Endpoint: `https://services.nvd.nist.gov/rest/json/cves/2.0?keywordSearch={toolName}`
- Opsiyonel filtreler: `cvssV3Severity`, `pubStartDate`, `pubEndDate`, `resultsPerPage`
- Versiyon yoksa rapor dili: `Version not provided; NVD result requires product/version validation.`
- CVE kesin bulguya dönüştürülmez; `exposure signal` olarak tutulur.
- CVSS >= 9 veya KEV/CISA referansı olan sonuçlar raporda üst sıraya alınır.
- Ağ erişimi yoksa son başarılı cache kullanılmalı veya başlık `NVD check unavailable` olarak görünmelidir.

Örnek doğrulama:

- SonarQube aramasında NVD, `CVE-2020-35193` kaydını döndürebiliyor; bu kayıt SonarQube Docker image etkilenmiş sürümlerini listeliyor.
- Red Hat ACS aramasında NVD, RHACS ürün ailesi için `CVE-2022-1902`, `CVE-2023-4958`, `CVE-2022-4975` gibi kayıtları döndürebiliyor.

## Assessment UI Etkisi

Profil ekranı ayrı bir serbest metin bloğu olmamalı. Wizard'ın ilk adımı `Organization profile` olmalı.

Serbest metin kalacak alan:

- Müşteri adı

Seçenekli alanlar:

- Sektör: Finance, IT, Telecom, Public, Retail, Manufacturing, Energy, Other
- Finans alt tipi: Bank, Insurance, FinTech, Payment, Leasing/Factoring, Other
- Çalışan sayısı: 0-50, 51-250, 251-1000, 1000+
- Geliştirici sayısı: 0-10, 11-30, 31-100, 100+
- Uygulama sayısı: 0-5, 6-20, 21-50, 51-100, 100+
- Kubernetes platformu: None, Kubernetes, OpenShift, Tanzu, AKS, EKS, GKE
- Source control: GitHub, GitLab, Azure DevOps, Bitbucket, Gitea, SVN
- Security tools: yukarıdaki genişletilmiş tool listesi

## Eksik Kapsam ve Sonraki Faz

Mevcut SDLC & DevSecOps assessment seti BDDK 34360 için güçlü bir başlangıçtır; ancak şu alanlar için ayrı modül gerekebilir:

- Elektronik bankacılık kimlik doğrulama ve işlem güvenliği
- Açık bankacılık API güvenliği
- Müşteri bilgilendirme ve fraud monitoring kontrolleri
- Veri lokasyonu ve birincil/ikincil sistemlerin yurt içinde bulundurulması
- Dış hizmet sağlayıcı sözleşme ve denetim detayları
- Bankacılık süreç kontrolleri ve iş süreçleri bağımsız denetim kapsamı

## Önerilen Yol Haritası

1. Profil UI redesign: seçenekli profil soruları ve tool chip yapısı.
2. BDDK kontrol haritası: 34360 + 39257 kontrol kaynak dosyaları.
3. Compliance engine: mevcut cevaplardan madde bazlı durum üretimi.
4. Rapor entegrasyonu: HTML/PDF/JSON içine mevzuat uyum başlığı.
5. NVD API entegrasyonu: tool bazlı online exposure watch.
6. Cache ve rate limit: NVD sonuçlarını token veya tool bazında kısa süreli cache.
7. Banka özel modül: elektronik bankacılık/açık bankacılık kontrolleri için ayrı assessment modülü.

