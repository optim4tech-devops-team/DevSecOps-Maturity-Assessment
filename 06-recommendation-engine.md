# Recommendation Engine

## Amaç

Recommendation Engine, assessment cevaplarına göre otomatik aksiyonlar üretir.

## Recommendation Nesnesi

```json
{
  "id": "DEVSECOPS-DAST-001",
  "category": "DevSecOps",
  "trigger": "dast_tool == None",
  "severity": "High",
  "priority": "P1",
  "title": "DAST çözümü devreye alınmalı",
  "description": "Web ve API uygulamaları için dinamik güvenlik taraması yapılmamaktadır.",
  "recommendation": "OWASP ZAP veya kurumsal DAST aracı pipeline'a entegre edilmelidir.",
  "phase": "Phase 2",
  "expectedImpact": "Release öncesi runtime güvenlik açıklarının tespit edilmesi",
  "effort": "Medium"
}
```

## Örnek Kurallar

### SAST Yok

Trigger:

```text
sast_tool == None
```

Recommendation:

- SAST aracı seçilmeli
- PR aşamasında SAST taraması yapılmalı
- Quality Gate tanımlanmalı
- Critical/High bulgularda build fail edilmeli

### DAST Yok

Trigger:

```text
dast_tool == None
```

Recommendation:

- OWASP ZAP veya kurumsal DAST çözümü kurulmalı
- Test ortamı deploy sonrası otomatik scan yapılmalı
- Release öncesi security gate tanımlanmalı

### SCA Yok

Trigger:

```text
sca_tool == None
```

Recommendation:

- Dependency ve CVE analizi yapılmalı
- License compliance raporu üretilmeli
- Kritik CVE'lerde release bloklanmalı

### Secret Scan Yok

Trigger:

```text
secret_scan_tool == None
```

Recommendation:

- GitLeaks veya GitGuardian devreye alınmalı
- PR ve scheduled scan yapılmalı
- Secret rotation süreci tanımlanmalı

### Production Approval Yok

Trigger:

```text
prod_approval == false
```

Recommendation:

- Jira / ITSM / pipeline approval gate tanımlanmalı
- Release admin rolü oluşturulmalı
- Audit trail zorunlu hale getirilmeli

### Monitoring Yok

Trigger:

```text
monitoring_tools == None
```

Recommendation:

- Prometheus/Grafana veya mevcut APM aracı standardize edilmeli
- Kritik servisler için dashboard oluşturulmalı
- Alert severity standardı tanımlanmalı
