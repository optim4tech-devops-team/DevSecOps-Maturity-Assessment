# Roadmap Generator

## Amaç

Assessment sonucuna göre uygulanabilir dönüşüm yol haritası oluşturmak.

## Faz Yapısı

### Phase 1 - Foundation

Odak: Temel standartlar, görünürlük, kontrol

Örnek aksiyonlar:

- Git ve branch standardı
- PR policy
- CI pipeline standardı
- Artifact versioning
- Basic SAST
- Central logging
- Monitoring dashboard
- Release approval flow

### Phase 2 - Automation & Security

Odak: Otomasyon, güvenlik entegrasyonu, deployment olgunluğu

Örnek aksiyonlar:

- CD pipeline
- Environment promotion
- DAST
- SCA
- Secret scanning
- Container scanning
- Automated rollback
- ITSM entegrasyonu
- API test otomasyonu

### Phase 3 - Governance & Optimization

Odak: Kurumsal yönetişim, advanced DevSecOps, platform engineering

Örnek aksiyonlar:

- Policy as Code
- SBOM
- Image signing
- Runtime security
- GitOps
- Developer portal
- Self-service environment
- DORA metrics
- SLO / Error Budget
- AI supported DevOps

## Roadmap Çıktı Formatı

```json
{
  "phase": "Phase 1",
  "duration": "0-3 months",
  "theme": "Foundation",
  "actions": [
    {
      "title": "PR policy standardı oluştur",
      "category": "Source Control",
      "priority": "P1",
      "effort": "Low",
      "impact": "High"
    }
  ]
}
```

## Önceliklendirme Mantığı

Priority = Risk + Impact + Dependency + Effort

- Critical security gap = P1
- Production risk = P1
- Compliance gap = P1
- Automation improvement = P2
- Optimization = P3
