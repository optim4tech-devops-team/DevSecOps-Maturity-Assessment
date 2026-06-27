# Functional Requirements

## 1. Organization Profile

Platform ilk aşamada kurum bilgilerini toplamalıdır.

### Alanlar

- Company Name
- Sector
- Employee Count
- Developer Count
- DevOps Engineer Count
- Application Count
- Production Application Count
- Critical Application Count
- Cloud Provider
- Kubernetes Usage
- Main Source Control Tool
- Main CI/CD Tool
- Main ITSM Tool
- Security Tools
- Monitoring Tools

## 2. Assessment Wizard

Assessment soru bazlı ve kategori bazlı ilerlemelidir.

### Özellikler

- Step by step wizard
- Progress indicator
- Save as draft
- Continue later
- Category completion percentage
- Required / optional questions
- Conditional questions
- Multi-select tool questions
- Evidence upload
- Notes field

## 3. Question Bank

Sorular admin panelden yönetilebilir olmalıdır.

### Soru Tipleri

- Single choice
- Multiple choice
- Yes / No
- Numeric input
- Text input
- Maturity level choice
- Tool selector
- Evidence required question

## 4. Scoring Engine

Her soru ağırlıklı puan üretmelidir.

### Scoring

- 0 = Yok
- 1 = Başlangıç
- 2 = Kısmi
- 3 = Tanımlı
- 4 = Yönetilen
- 5 = Optimize

## 5. Recommendation Engine

Cevaplara göre öneriler otomatik üretilmelidir.

### Örnek

DAST aracı yoksa:

- OWASP ZAP veya kurumsal DAST çözümü devreye alınmalı
- Test ortamına deploy sonrası otomatik DAST scan çalıştırılmalı
- Critical/High bulgularda release gate uygulanmalı

## 6. Roadmap Generator

Eksiklere göre otomatik Faz 1 / Faz 2 / Faz 3 planı oluşturulmalıdır.

### Fazlar

- Faz 1: Foundation
- Faz 2: Automation & Security
- Faz 3: Advanced Governance & Optimization

## 7. Report Generator

Assessment sonucu aşağıdaki formatlarda üretilebilir olmalıdır.

- HTML
- PDF
- Markdown
- PowerPoint
- JSON export

## 8. Dashboard

Dashboard aşağıdaki görselleri içermelidir.

- Genel olgunluk skoru
- Kategori bazlı skorlar
- Radar chart
- Heatmap
- Top 10 gap
- Tool coverage
- DevSecOps maturity
- DORA metrics maturity
- Roadmap timeline
