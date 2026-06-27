# Architecture

## High Level Architecture

```text
React / Next.js UI
        |
        v
Backend API (.NET 8 / NestJS)
        |
        +--> PostgreSQL
        +--> Object Storage
        +--> Report Generator
        +--> Scoring Engine
        +--> Recommendation Engine
        +--> Roadmap Engine
```

## Frontend

- Next.js
- TypeScript
- Tailwind CSS
- React Hook Form
- Zod validation
- Recharts / ECharts
- TanStack Query

## Backend Option 1

- .NET 8 Web API
- Entity Framework Core
- PostgreSQL
- Clean Architecture
- MediatR
- FluentValidation
- QuestPDF or Playwright PDF

## Backend Option 2

- Node.js NestJS
- Prisma
- PostgreSQL
- BullMQ
- Puppeteer PDF

## Database

- PostgreSQL
- JSONB answers
- Tenant isolation

## Deployment

- Docker
- Kubernetes
- Helm
- GitHub Actions or Azure DevOps
- ArgoCD optional

## Security

- JWT
- RBAC
- Tenant isolation
- Audit log
- Data encryption at rest
- Evidence file access control

## Report Generation

Report çıktısı HTML template üzerinden üretilmelidir.

- HTML preview
- PDF export
- Markdown export
- PPTX export
