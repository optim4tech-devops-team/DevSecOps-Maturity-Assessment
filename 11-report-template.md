# Report Template

## 1. Executive Summary

Bu assessment çalışması, kurumun DevOps ve DevSecOps olgunluk seviyesini ölçmek, mevcut eksikleri belirlemek ve uygulanabilir dönüşüm yol haritası oluşturmak amacıyla hazırlanmıştır.

## 2. Organization Profile

- Company:
- Sector:
- Application Count:
- Developer Count:
- Main Tools:
- Cloud / Platform:

## 3. Overall Maturity Score

Genel olgunluk skoru:

```text
{{overallScore}}%
{{maturityLevel}}
```

## 4. Category Scores

| Category | Score | Level |
|---|---:|---|
| SDLC | {{sdlcScore}} | {{sdlcLevel}} |
| Source Control | {{sourceControlScore}} | {{sourceControlLevel}} |
| CI | {{ciScore}} | {{ciLevel}} |
| CD | {{cdScore}} | {{cdLevel}} |
| DevSecOps | {{devsecopsScore}} | {{devsecopsLevel}} |
| Observability | {{observabilityScore}} | {{observabilityLevel}} |

## 5. Key Strengths

- {{strength1}}
- {{strength2}}
- {{strength3}}

## 6. Key Gaps

- {{gap1}}
- {{gap2}}
- {{gap3}}

## 7. DevSecOps Gap Analysis

| Area | Current | Target | Gap |
|---|---|---|---|
| SAST | {{sastCurrent}} | Integrated Quality Gate | {{sastGap}} |
| DAST | {{dastCurrent}} | Automated Release Gate | {{dastGap}} |
| SCA | {{scaCurrent}} | Dependency Governance | {{scaGap}} |
| Secret Scan | {{secretCurrent}} | PR and Scheduled Scan | {{secretGap}} |

## 8. Roadmap

### Phase 1 - Foundation

{{phase1Actions}}

### Phase 2 - Automation & Security

{{phase2Actions}}

### Phase 3 - Governance & Optimization

{{phase3Actions}}

## 9. Recommendations

{{recommendations}}

## 10. Appendix

- Question answers
- Tool inventory
- Evidence list
- Scoring details
