# API Design

## Authentication

- JWT Bearer Token
- Role based access
- Tenant isolation

## Endpoints

### Organizations

```http
GET /api/organizations
POST /api/organizations
GET /api/organizations/{id}
PUT /api/organizations/{id}
```

### Assessments

```http
GET /api/assessments
POST /api/assessments
GET /api/assessments/{id}
PUT /api/assessments/{id}
POST /api/assessments/{id}/complete
POST /api/assessments/{id}/calculate-score
```

### Questions

```http
GET /api/question-bank
GET /api/question-bank/sections
POST /api/question-bank/questions
PUT /api/question-bank/questions/{id}
DELETE /api/question-bank/questions/{id}
```

### Answers

```http
GET /api/assessments/{id}/answers
POST /api/assessments/{id}/answers
PUT /api/assessments/{id}/answers/{answerId}
```

### Scores

```http
GET /api/assessments/{id}/scores
GET /api/assessments/{id}/scores/categories
```

### Recommendations

```http
GET /api/assessments/{id}/recommendations
POST /api/assessments/{id}/generate-recommendations
```

### Roadmap

```http
GET /api/assessments/{id}/roadmap
POST /api/assessments/{id}/generate-roadmap
```

### Reports

```http
GET /api/assessments/{id}/report/html
GET /api/assessments/{id}/report/pdf
GET /api/assessments/{id}/report/markdown
GET /api/assessments/{id}/report/pptx
```

### Export

```http
GET /api/assessments/{id}/export/json
POST /api/assessments/import/json
```

## Sample Save Answer Request

```json
{
  "questionId": "DEVSECOPS-SAST-001",
  "value": ["SonarQube", "Fortify"],
  "note": "SonarQube PR aşamasında kullanılıyor.",
  "evidenceIds": []
}
```
