# Initial Seed JSON

Aşağıdaki JSON yapısı uygulama içine seed olarak konulabilir.

```json
{
  "categories": [
    { "id": "org", "name": "Organization & Operating Model", "weight": 6 },
    { "id": "sdlc", "name": "SDLC & Work Management", "weight": 8 },
    { "id": "scm", "name": "Source Control", "weight": 8 },
    { "id": "ci", "name": "CI Pipeline", "weight": 9 },
    { "id": "cd", "name": "CD & Deployment", "weight": 10 },
    { "id": "release", "name": "Release Management", "weight": 8 },
    { "id": "devsecops", "name": "DevSecOps", "weight": 12 },
    { "id": "testing", "name": "Test Automation", "weight": 8 },
    { "id": "observability", "name": "Observability", "weight": 8 },
    { "id": "platform", "name": "Platform Engineering", "weight": 5 }
  ],
  "maturityLevels": [
    { "min": 0, "max": 20, "name": "Initial" },
    { "min": 21, "max": 40, "name": "Developing" },
    { "min": 41, "max": 60, "name": "Defined" },
    { "min": 61, "max": 80, "name": "Managed" },
    { "min": 81, "max": 100, "name": "Optimized" }
  ]
}
```
