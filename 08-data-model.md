# Data Model

## Entity List

- Tenant
- Organization
- Assessment
- AssessmentSection
- Question
- QuestionOption
- Answer
- Tool
- ToolCategory
- Score
- Recommendation
- Roadmap
- Report
- Evidence
- User
- Role

## Assessment

```json
{
  "id": "uuid",
  "organizationId": "uuid",
  "name": "2026 DevOps Maturity Assessment",
  "status": "Draft | InProgress | Completed | Archived",
  "createdAt": "datetime",
  "completedAt": "datetime",
  "createdBy": "uuid",
  "overallScore": 82,
  "maturityLevel": "Managed"
}
```

## Question

```json
{
  "id": "uuid",
  "sectionId": "uuid",
  "code": "DEVSECOPS-SAST-001",
  "text": "SAST aracı kullanılıyor mu?",
  "type": "tool_selector",
  "weight": 3,
  "isRequired": true,
  "condition": null,
  "helpText": "SonarQube, Fortify, Checkmarx gibi araçlar seçilebilir."
}
```

## Answer

```json
{
  "id": "uuid",
  "assessmentId": "uuid",
  "questionId": "uuid",
  "value": ["SonarQube", "Fortify"],
  "score": 4,
  "note": "PR aşamasında SonarQube çalışıyor.",
  "evidenceIds": []
}
```

## Score

```json
{
  "assessmentId": "uuid",
  "category": "DevSecOps",
  "score": 48,
  "level": "Defined",
  "maxScore": 100
}
```

## Recommendation

```json
{
  "assessmentId": "uuid",
  "category": "DevSecOps",
  "severity": "High",
  "priority": "P1",
  "title": "DAST entegrasyonu yapılmalı",
  "phase": "Phase 2"
}
```
