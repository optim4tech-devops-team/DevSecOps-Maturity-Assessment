# Scoring Model

## Genel Yaklaşım

Assessment skorları kategori bazlı ve genel skor olarak hesaplanır.

Her soru 0-5 arası puan üretir.

| Puan | Seviye | Açıklama |
|---:|---|---|
| 0 | Yok | Süreç veya araç yok |
| 1 | Başlangıç | Ad-hoc, kişiye bağımlı |
| 2 | Kısmi | Bazı ekiplerde veya projelerde var |
| 3 | Tanımlı | Dokümante edilmiş, uygulanıyor |
| 4 | Yönetilen | Ölçülüyor, policy ile kontrol ediliyor |
| 5 | Optimize | Otomatik, sürekli iyileştiriliyor |

## Kategori Skoru

```text
Category Score = Sum(question_score * question_weight) / Sum(max_score * question_weight) * 100
```

## Genel Skor

```text
Overall Score = Sum(category_score * category_weight) / Sum(category_weight)
```

## Önerilen Kategori Ağırlıkları

| Kategori | Ağırlık |
|---|---:|
| Organization & Operating Model | 6 |
| SDLC & Work Management | 8 |
| Source Control | 8 |
| CI Pipeline | 9 |
| CD & Deployment | 10 |
| Release Management | 8 |
| DevSecOps | 12 |
| Test Automation | 8 |
| Infrastructure & Cloud | 6 |
| Kubernetes & Container Platform | 7 |
| Observability | 8 |
| Operations & Incident | 5 |
| Governance & Compliance | 7 |
| Platform Engineering | 5 |
| AI Enabled DevOps | 3 |

## Olgunluk Seviyeleri

| Skor | Seviye | Açıklama |
|---:|---|---|
| 0-20 | Level 1 - Initial | Manuel ve kişiye bağımlı |
| 21-40 | Level 2 - Developing | Kısmi standartlar var |
| 41-60 | Level 3 - Defined | Süreçler tanımlı ve yaygınlaşıyor |
| 61-80 | Level 4 - Managed | Ölçümleniyor ve kontrol ediliyor |
| 81-100 | Level 5 - Optimized | Otomatik, güvenli, optimize |

## Risk Seviyesi

| Gap | Risk |
|---|---|
| SAST yok | High |
| DAST yok | High |
| SCA yok | High |
| Secret Scan yok | Critical |
| Production approval yok | Critical |
| Rollback yok | High |
| Monitoring yok | Critical |
| Log management yok | High |
| PR policy yok | High |
| Backup/DR yok | Critical |
