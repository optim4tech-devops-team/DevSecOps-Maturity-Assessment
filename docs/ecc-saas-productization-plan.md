# DevSecOps Maturity Assessment - ECC SaaS Productization Plan

## CAPABILITY

Bu proje, kurumlara token bazlı assessment linki göndererek DevOps, DevSecOps ve mimari olgunluklarını standart soru setiyle ölçen; cevaplardan skor, bulgu, öneri, yol haritası ve danışmanlık raporu üreten bir SaaS platformuna dönüşmelidir. İlk MVP'de tek mevcut müşteri için assessment yapılacak, danışman panelinden sonuç gözden geçirilecek ve PDF örneğindeki rapor formatına yakın bir çıktı teslim edilecektir.

## MVP NOW: Mevcut Müşteri Teslim Akışı

1. Admin panelden müşteri kaydı oluşturulur.
2. Sistem müşteriye özel assessment token linki üretir.
3. Link müşteri temsilcisine gönderilir.
4. Müşteri veya danışman görüşme sırasında formu doldurur.
5. Cevaplar kategori bazlı skorlanır.
6. Sistem otomatik gap, risk, öneri ve roadmap üretir.
7. Danışman panelde sonuçları gözden geçirir ve gerekirse notları düzenler.
8. AI summary oluşturulur.
9. Markdown/PDF rapor çıktısı alınır.
10. Rapor müşteriyle paylaşılır ve aksiyon planı üzerinden danışmanlık kapsamı netleştirilir.

## Sonuç Paylaşım Modeli

MVP'de sonuç iki farklı yüzeyden paylaşılmalıdır:

| Yüzey | Kullanım Amacı | Kim Kullanır? | Müşteriye Gider mi? |
|---|---|---|---|
| Portal dashboard | Canlı analiz, grafik inceleme, gap ve roadmap tartışması | Danışman, müşteri teknik ekip, yönetici | Evet, read-only müşteri portalı olarak |
| Final rapor dokümanı | Resmi teslimat, arşiv, yönetim sunumu ve danışmanlık kapsamı | Danışman, sponsor, yönetim | Evet, PDF/Markdown/PPTX olarak |

Önerilen akış: assessment tamamlandıktan sonra danışman portalda skorları ve grafikleri müşteriyle birlikte yorumlar; toplantı sonunda danışman raporu finalize eder ve resmi çıktı olarak PDF paylaşır. Böylece portal dinamik karar destek ekranı, doküman ise sözleşmesel/danışmanlık teslimatı olur.

## AI Model Kararı

MVP'de AI görevi karar vermek değil, danışmana yardımcı metin üretmektir. Kullanım alanları:

- Executive summary üretimi
- Bulguları danışmanlık diliyle yeniden yazma
- Önerileri faz/etki/efor diliyle genişletme
- Rapor taslağında amaç, kapsam ve sonuç paragraflarını oluşturma
- İleride interview assistant ile eksik cevaplar için takip sorusu önerme

Cluster'da mevcut local-ai runtime Ollama'dır. Şu an kurulu model `qwen2.5-coder:1.5b` olduğu için kod üretimine yakın, fakat Türkçe rapor ve executive summary için zayıf kalır. 6Gi bellek limitli pod için önerilen MVP modeli `qwen3:4b` olmalıdır: küçük kalır, 2.5GB model boyutuyla cluster'a uygundur, uzun context ve multilingual instruction yeteneği sağlar. Daha güçlü enterprise kurulumlarda `qwen3:8b` veya `llama3.1:8b` değerlendirilebilir, ancak mevcut 6Gi limitte risklidir.

## MVP NOW: Panel Nasıl Çalışıyor?

- Admin login: danışman paneline erişim sağlar.
- Customer assessment create: kurum adı ve sektör bilgisiyle yeni assessment oluşturur.
- Customer token link: müşterinin doğrudan dolduracağı public linki üretir.
- Public assessment form: müşteri profil ve kategori sorularını yanıtlar.
- Score engine: 0-5 cevaplarını kategori ağırlıklarıyla 0-100 skora çevirir.
- Recommendation engine: düşük skor veya eksik tool cevaplarından öneri üretir.
- Roadmap engine: önerileri Phase 1, Phase 2, Phase 3 olarak sıralar.
- Report export: sonucu danışmanlık raporuna dönüştürmek için Markdown çıktı verir.
- AI summary: cluster içindeki local-ai/Ollama servisiyle executive özet üretir.

## PDF Rapor Başlıklarına Göre Çıktı Standardı

| PDF Başlığı | Platformdaki Kaynak | Üretilen Çıktı |
|---|---|---|
| 1. Amaç | Assessment amacı, tenant/organization bilgisi | Raporun neden hazırlandığı, kapsam ve hedef |
| 2. Uygulama Alanı | Organization profile, application inventory, team profile | On-prem/cloud, web/mobile, ekipler, süreçler ve tool kapsamı |
| 3. Kısaltmalar/Tanımlar | Sabit rapor sözlüğü | SAST, DAST, SCA, CI/CD, SDLC, SLO gibi kavramlar |
| 4. Genel Prensipler | Görüşme notları, cevap açıklamaları, evidence | Ekip bazlı mevcut durum görüşme çıktıları |
| 4.1 Sistem ekibi çıktıları | Infrastructure, cloud, observability, operations cevapları | Altyapı, monitoring, logging, backup, DR bulguları |
| 4.2 Uygulama geliştirme çıktıları | SDLC, source control, CI, CD, test, DevSecOps cevapları | Kod yönetimi, build, deploy, test, security bulguları |
| 4.3 Proje geliştirme çıktıları | SDLC & work management cevapları | Jira/board, backlog, sprint, DoR/DoD, release readiness |
| 4.4 SAP/özel ekip çıktıları | Team-specific optional section | Özel teknoloji ekipleri için ek değerlendirme |
| 4.5 BI ekibi çıktıları | Data/BI optional question group | Raporlama, veri pipeline, versiyonlama ve deployment bulguları |
| 5. Analiz ve Bulgular | Score engine, gap engine, charts | Kategori skorları, radar chart, heatmap, top gaps |
| DevOps Değerlendirme Sonucu | Source Control, CI, CD, Release, Test, Observability | DevOps maturity sonucu |
| DevSecOps Değerlendirme Sonucu | SAST, DAST, SCA, secret scan, container scan, SBOM | DevSecOps maturity sonucu |
| Mimari Değerlendirme Sonucu | App inventory, integration, cloud, data, platform answers | Mimari riskler ve iyileştirme alanları |
| 6. Danışmanlık Hizmet Kapsamı ve Yol Haritası | Recommendation + Roadmap engine | Faz bazlı danışmanlık kapsamı |
| 6.1 Temel Altyapı ve Kod Yönetimi | Source Control + CI foundation gaps | Git, branch, PR, RBAC, repo standardı |
| 6.2 Kod Kalitesi ve Güvenlik Analizi | DevSecOps gaps | SonarQube/SAST, OWASP ZAP/DAST, SCA, secret scan |
| 6.3 Test Otomasyon Süreçleri | Test Automation gaps | Unit, API, UI, regression, performance test önerileri |
| 6.4 API Yönetimi ve Servis Katmanı | Architecture/API optional answers | API gateway, contract, service governance önerileri |
| 6.5 İzleme ve Log Yönetimi | Observability gaps | ELK/OpenSearch, Prometheus/Grafana, alerting, health check |
| 6.6 Agile Süreç ve Organizasyon | Organization + SDLC gaps | Agile roller, sprint, backlog, reviewer/approver standartları |

## Soru Standardı

Her soru aşağıdaki alanlarla tanımlanmalıdır:

```json
{
  "code": "DEVSECOPS-SAST-001",
  "category": "DevSecOps",
  "reportSection": "6.2 Kod Kalitesi ve Güvenlik Analizi",
  "question": "SAST aracı kullanılıyor mu?",
  "type": "tool_selector",
  "required": true,
  "weight": 3,
  "maturityScale": {
    "0": "Yok",
    "1": "Ad-hoc veya manuel",
    "2": "Bazı projelerde var",
    "3": "Tanımlı ve dokümante",
    "4": "Pipeline/policy ile yönetiliyor",
    "5": "Kurumsal standart ve quality gate ile optimize"
  },
  "toolOptions": ["SonarQube", "Fortify", "Checkmarx", "Veracode", "Semgrep", "None"],
  "evidenceExpected": ["pipeline screenshot", "quality gate policy", "sample scan report"],
  "recommendationTriggers": ["sast_tool == None", "sast_pr_gate_score < 4"],
  "outputTags": ["devsecops", "code-quality", "phase-2"]
}
```

## Soru Bankası V1 Kapsamı

| Alan | MVP Soru Sayısı | Ana Kanıt/Tool |
|---|---:|---|
| Organization & Operating Model | 4 | Team structure, RACI, platform team |
| SDLC & Work Management | 5 | Jira, Azure Boards, ServiceNow, DoR/DoD |
| Source Control | 6 | GitHub, GitLab, Azure DevOps, Bitbucket |
| CI Pipeline | 5 | Jenkins, Azure Pipelines, GitHub Actions, GitLab CI |
| CD & Deployment | 5 | ArgoCD, Flux, Spinnaker, Octopus, native pipelines |
| Release Management | 4 | ITSM, CAB/PCAB, release notes, approvals |
| DevSecOps | 8 | SAST, DAST, SCA, secret scan, container scan, SBOM |
| Test Automation | 5 | Unit, API, UI, performance, regression tools |
| Infrastructure & Cloud | 4 | Terraform, Ansible, Bicep, cloud governance |
| Kubernetes & Container | 5 | Kubernetes, Helm, GitOps, OPA/Kyverno |
| Observability | 5 | Prometheus, Grafana, ELK, OpenSearch, Splunk, APM |
| Operations & Incident | 4 | On-call, runbook, postmortem, RCA |
| Governance & Compliance | 4 | RBAC, audit trail, policy as code, evidence |
| Platform Engineering | 4 | Developer portal, golden path, self-service |
| AI Enabled DevOps | 3 | AI code review, test generation, RCA/release summary |

MVP için 60-70 soruluk geniş set yerine mevcut müşteriye 35-45 soru ile başlanabilir. Soru seti daha sonra template/version mantığıyla büyütülmelidir.

## Tool ve Sonuç Eşleştirme Standardı

| Gap / Cevap | Sonuç Etkisi | Önerilen Tool / Çözüm | Roadmap Fazı |
|---|---|---|---|
| PR policy yok | Source Control skoru düşer, review riski oluşur | Azure DevOps/GitHub branch policy, CODEOWNERS | Phase 1 |
| CI pipeline yok | Build standardı ve release güveni düşük çıkar | Azure Pipelines, Jenkins, GitLab CI, GitHub Actions | Phase 1 |
| SAST yok | DevSecOps High risk | SonarQube, Fortify, Checkmarx, Semgrep | Phase 2 |
| DAST yok | Runtime security gap | OWASP ZAP, Burp Enterprise, Invicti | Phase 2 |
| SCA yok | Dependency/CVE governance gap | Snyk, Mend, Nexus IQ, OWASP Dependency Check | Phase 2 |
| Secret scan yok | Critical credential leakage risk | Gitleaks, TruffleHog, GitGuardian | Phase 2 |
| Container scan yok | Image supply-chain risk | Trivy, Aqua, Prisma, Anchore | Phase 2 |
| SBOM yok | Compliance ve supply-chain görünürlüğü eksik | Syft, CycloneDX, Dependency-Track | Phase 3 |
| Monitoring yok | Operasyonel görünürlük critical gap | Prometheus/Grafana, Datadog, Dynatrace, New Relic | Phase 1 |
| Merkezi log yok | RCA ve audit eksikliği | ELK, OpenSearch, Splunk, Loki | Phase 1 |
| SLI/SLO yok | Hizmet kalitesi yönetilemiyor | Grafana SLO, Nobl9, OpenSLO yaklaşımı | Phase 3 |
| Rollback yok | Production hata dönüş riski | Pipeline rollback, Helm rollback, feature flag | Phase 2 |
| GitOps yok | Kubernetes deployment standardı eksik | ArgoCD, Flux | Phase 3 |
| Policy as Code yok | Governance manuel kalır | OPA Gatekeeper, Kyverno, Conftest | Phase 3 |
| Developer portal yok | Self-service ve golden path eksik | Backstage, Port, Humanitec | Phase 3 |

## IMPLEMENTATION CONTRACT

### Actors

- Consultant: assessment oluşturur, cevapları yorumlar, raporu finalize eder.
- Customer Respondent: token link üzerinden formu doldurur.
- Customer Executive: dashboard ve final raporu okur.
- Platform Admin: soru bankası, scoring, template ve tenant ayarlarını yönetir.
- SaaS Owner: paket, lisans, müşteri yaşam döngüsü ve operasyonu yönetir.

### Product Surfaces

- Admin login
- Consultant dashboard
- Customer/token assessment form
- Assessment detail and scoring page
- Recommendation and roadmap page
- Report preview/export page
- Question bank manager
- Template/version manager
- Tenant/customer manager
- Evidence upload and review surface
- SaaS billing/license/admin settings

### Core Modules

- Auth & RBAC
- Tenant isolation
- Organization profile
- Assessment lifecycle
- Question bank and versioning
- Answer collection
- Evidence storage
- Scoring engine
- Gap/risk engine
- Recommendation engine
- Roadmap engine
- Report generator
- AI summary/generation service
- Notification/link delivery
- Audit log
- Integration connectors
- Billing/subscription
- Observability and operations

### Runtime Separation

MVP ilk kurulumda Next.js UI ve API aynı uygulama içinde başlamıştı. SaaS performansı ve ileride bağımsız ölçekleme için runtime ayrımı hedeflenmelidir:

- `assessment-app`: Next.js UI, dashboard ve public assessment ekranlarını servis eder.
- `assessment-backend`: API, auth, assessment CRUD, scoring, recommendation, report export ve AI summary işlemlerini ayrı Node process olarak servis eder.
- Ingress `/api` path'ini backend servisine, `/` path'ini UI servisine yönlendirir.
- İlk MVP'de aynı repository ve aynı PostgreSQL kullanılabilir; productized SaaS aşamasında backend ayrı image, ayrı CI/CD ve ayrı horizontal scaling policy almalıdır.

### Required States

- Assessment: Draft, LinkSent, InProgress, Submitted, ConsultantReview, Completed, ReportDelivered, Archived.
- Report: Draft, Generated, Reviewed, Approved, Delivered.
- Question Template: Draft, Published, Deprecated.
- Recommendation: Open, Accepted, Deferred, Rejected, Completed.
- Tenant: Trial, Active, Suspended, Archived.

### Data Model Additions for SaaS

- Tenant plan and subscription status
- Assessment template version
- Question version and scoring version
- Report template version
- Evidence file metadata and access policy
- Invite/token expiry and usage history
- Consultant review notes
- Report delivery log
- Benchmark cohort metadata
- Audit event table

### Interfaces

- Public assessment URL: `/assessment/{token}`
- Admin API: assessment CRUD, token creation, scoring, export
- Report API: HTML, Markdown, PDF, PPTX later
- AI API: summary, finding rewrite, recommendation expansion
- Connector API: Git provider, CI/CD provider, security scanners later
- Webhook API: assessment submitted, report generated, report delivered

## CONSTRAINTS

- İlk MVP tek müşteri akışını bozmayacak.
- Token linki login gerektirmeden çalışmalı, ama expiry ve single-tenant scope eklenmeli.
- Cevap, skor, öneri ve rapor aynı template/scoring version ile izlenebilir olmalı.
- Danışman raporu otomatik üretilebilir olmalı, fakat final onay danışmanda kalmalı.
- AI çıktıları karar verici değil, yardımcı metin üretici olmalı.
- Evidence ve müşteri verileri tenant sınırları dışına çıkmamalı.
- SaaS mimarisi multi-tenant olacak, fakat ilk sürümde single deployment/single database + tenant_id izolasyonu yeterli.
- Enterprise müşteriler için ileride dedicated namespace veya dedicated DB opsiyonu bırakılmalı.
- Rapor formatı PDF örneğindeki danışmanlık diline uyacak, ama dashboard skorlarıyla izlenebilir bağ kuracak.

## NON-GOALS

- İlk müşteri MVP'sinde self-service ödeme ve tam billing zorunlu değil.
- İlk müşteri MVP'sinde full SSO zorunlu değil.
- İlk müşteri MVP'sinde müşteri tarafı advanced admin paneli zorunlu değil.
- İlk müşteri MVP'sinde gerçek tool entegrasyonları zorunlu değil; tool envanteri form cevabı olarak alınabilir.
- İlk müşteri MVP'sinde benchmark veri seti zorunlu değil.
- İlk müşteri MVP'sinde otomatik evidence doğrulama zorunlu değil.

## SaaS Ürünleşme Yol Haritası

### Phase 0 - Current Customer MVP

- Login ve danışman paneli stabil hale getir.
- Token link ile assessment akışını tamamla.
- 35-45 soruluk standart V1 soru setini yayınla.
- Skor, öneri, roadmap ve AI summary üret.
- PDF örneğine yakın final rapor şablonu oluştur.
- Müşteri sonucunu danışman review sonrası teslim et.

### Phase 1 - Productized MVP

- Tenant modelini veritabanında netleştir.
- Assessment template versioning ekle.
- Question bank'i admin panelden yönetilebilir hale getir.
- Report template engine ekle.
- PDF export üret.
- Evidence upload ekle.
- Token expiry, resend, revoke ve completion tracking ekle.
- Audit log ekle.
- Basic customer portal ekle.

### Phase 2 - SaaS Readiness

- Multi-tenant RBAC ve tenant admin rolleri ekle.
- SSO/SAML/OIDC opsiyonu ekle.
- Subscription/plan modelini ekle.
- Usage metering: assessment count, user count, report count.
- Email notification ve branded report delivery ekle.
- Object storage ile evidence/report saklama ekle.
- Background job queue ile report generation ayır.
- Platform observability ve admin operations dashboard ekle.

### Phase 3 - Differentiated Product

- Benchmark ve sektör karşılaştırmaları ekle.
- AI destekli interview assistant ekle.
- AI ile bulgu dili iyileştirme ve executive summary varyasyonları ekle.
- GitHub/GitLab/Azure DevOps/Jira connector ekle.
- Tool entegrasyonlarından otomatik kanıt toplama ekle.
- Remediation tracker ve customer success workflow ekle.
- PPTX export ve branded board deck üret.

## SaaS Paketleme

| Paket | Hedef | İçerik |
|---|---|---|
| Assessment Service | İlk müşteri ve danışmanlık teslimleri | Danışman yürütür, müşteri link doldurur, rapor teslim edilir |
| Team SaaS | Küçük/orta ekipler | Sınırlı assessment, standart rapor, basic roadmap |
| Enterprise SaaS | Kurumsal müşteriler | Multi-user, SSO, evidence, audit, benchmark, özel template |
| Consulting Platform | Optim4Tech danışmanları | Çok müşteri yönetimi, white-label rapor, proposal/roadmap çıktısı |

## Teknik Proje Yapılandırması

```text
src/
  app/
    page.tsx                         admin dashboard + login
    assessment/[token]/page.tsx       public assessment form
    api/                              Next.js API routes
  components/
    AssessmentEditor.tsx
    Charts.tsx
  data/
    assessment.ts                     MVP seed question set
  features/
    scoring/
    recommendations/
    reports/
  lib/
    db.ts
    types.ts
docs/
  ecc-saas-productization-plan.md
k8s/
  namespace.yaml
  postgres.yaml
  app.yaml
  source-loader.yaml
```

Hedef ürünleşmiş yapıda `features/question-bank`, `features/tenant`, `features/evidence`, `features/report-templates`, `features/audit`, `features/billing`, `features/integrations` modülleri eklenmelidir.

## ECC Execution Blueprint

| Step | Lane | İş | Bağımlılık | Çıktı |
|---|---|---|---|---|
| 1 | product-capability | SaaS capability contract netleştirme | Mevcut MD + PDF | Bu doküman |
| 2 | dashboard-builder | Login/admin panel UX polish | Step 1 | Kullanılabilir danışman paneli |
| 3 | api-design | Assessment lifecycle API standardı | Step 1 | Stable API contract |
| 4 | postgres-patterns | Tenant-aware schema migration | Step 3 | Multi-tenant DB |
| 5 | frontend-patterns | Public assessment wizard iyileştirme | Step 3 | Müşteri form deneyimi |
| 6 | backend-patterns | Scoring/recommendation/report engines ayırma | Step 3 | Test edilebilir domain logic |
| 7 | documents/pdf | PDF report generator | Step 6 | Müşteri teslim raporu |
| 8 | ai-first-engineering | Local AI summary and finding rewrite | Step 6 | AI destekli özet |
| 9 | deployment-patterns | Helm/Kubernetes release standardı | Step 4 | Tekrarlanabilir deploy |
| 10 | verification-loop | E2E ve acceptance suite | Tüm adımlar | Güvenilir release checklist |

## Acceptance Criteria for Current Customer

- Admin login çalışır.
- Müşteri assessment linki üretilebilir.
- Link login olmadan açılır.
- Form kaydedilir ve tamamlanır.
- Genel skor ve kategori skorları oluşur.
- En az 10 anlamlı gap/recommendation oluşur.
- Roadmap Phase 1/2/3 olarak üretilir.
- AI executive summary oluşur veya local-ai yoksa açık hata mesajı verilir.
- Markdown/PDF rapor PDF örneğindeki başlıklarla eşleşir.
- Rapor danışman tarafından gözden geçirilip teslim edilebilir.

## OPEN QUESTIONS

- İlk müşteri için soru sayısı 35-45 mi, yoksa detaylı 60+ soru mu olacak?
- Rapor dili tamamen Türkçe mi, yoksa TR/EN seçenekli mi olacak?
- Müşteri tarafında evidence upload bu MVP'de gerekli mi?
- PDF rapor tasarımı Optim4Tech markalı mı olacak, müşteri markası da eklenecek mi?
- AI çıktıları rapora otomatik mi girecek, yoksa danışman onayı şart mı olacak?
- SaaS paketlemede self-service satış mı, danışmanlık destekli satış mı öncelikli?
- Enterprise müşteriler için dedicated DB/namespace gerekecek mi?

## HANDOFF

Hemen sonraki en doğru iş, Current Customer MVP akışını tamamlayacak şekilde soru bankası V1'i PDF rapor başlıklarına göre genişletmek ve rapor generator'ı aynı başlıklara uygun hale getirmektir. Bunun ardından tenant-aware schema ve question-template versioning eklenerek SaaS ürünleşme yoluna girilmelidir.
