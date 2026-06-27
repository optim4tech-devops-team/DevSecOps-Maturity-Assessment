# Codex Implementation Prompt

Aşağıdaki prompt Codex'e verilerek ilk MVP geliştirilebilir.

## Prompt

You are building a web application called "Global DevOps & DevSecOps Maturity Assessment Platform".

Build a production-ready MVP with the following stack:

- Frontend: Next.js + TypeScript + Tailwind CSS
- Backend: Next.js API routes or standalone .NET 8 API if preferred
- Database: PostgreSQL, but for the first prototype allow JSON file or SQLite persistence
- Charts: Recharts
- Forms: React Hook Form
- Validation: Zod

The application must include:

1. Organization profile form
2. Assessment wizard with categories
3. 30+ questions from the provided question bank
4. Tool selector questions
5. Weighted scoring engine
6. Category score calculation
7. Overall maturity score
8. Result dashboard with:
   - Overall score donut
   - Category bar chart
   - Radar chart
   - Top gaps
   - Recommendations
   - Roadmap
9. Export:
   - JSON export
   - Markdown report export
   - Printable HTML report

Use the markdown documentation files as product requirements.

Create a clean, modular folder structure:

```text
/src
  /app
  /components
  /features/assessment
  /features/scoring
  /features/recommendations
  /features/reports
  /lib
  /data
```

Create static seed data for:
- categories
- questions
- question options
- recommendation rules

Implement scoring:

- Each answer produces 0-5 points
- Each question has weight
- Category score is weighted average
- Overall score is weighted average of category scores

Maturity levels:

- 0-20 Initial
- 21-40 Developing
- 41-60 Defined
- 61-80 Managed
- 81-100 Optimized

Generate recommendations based on missing capabilities:
- No DAST
- No SCA
- No Secret Scan
- No Container Scan
- No Monitoring
- No PR Policy
- No Rollback
- No Production Approval

Focus on working implementation, clean UI, reusable components and readable code.
