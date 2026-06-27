import { Pool } from "pg";
import { randomUUID } from "crypto";
import { defaultAnswers, defaultProfile, OrganizationProfile, Answers } from "@/data/assessment";
import { AssessmentRecord } from "@/lib/types";
import { buildExecutiveSummary } from "@/features/reports/report";

let pool: Pool | undefined;

declare global {
  // Keep the in-memory MVP store stable across Next.js route module reloads.
  // This is only used when DATABASE_URL is not configured.
  // eslint-disable-next-line no-var
  var assessmentMemoryStore: Map<string, AssessmentRecord> | undefined;
}

const memoryStore = globalThis.assessmentMemoryStore ??= new Map<string, AssessmentRecord>();

function getPool() {
  if (!process.env.DATABASE_URL) return undefined;
  pool ??= new Pool({ connectionString: process.env.DATABASE_URL });
  return pool;
}

function token() {
  return randomUUID().replaceAll("-", "");
}

async function ensureSchema() {
  const db = getPool();
  if (!db) return;
  await db.query(`
    create table if not exists assessments (
      id uuid primary key,
      token text not null unique,
      status text not null,
      report_status text not null default 'NotStarted',
      organization jsonb not null,
      answers jsonb not null,
      score jsonb,
      recommendations jsonb,
      ai_summary text,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now(),
      completed_at timestamptz,
      report_requested_at timestamptz,
      report_ready_at timestamptz,
      report_generated_at timestamptz
    )
  `);
  await db.query("alter table assessments add column if not exists report_status text not null default 'NotStarted'");
  await db.query("alter table assessments add column if not exists report_requested_at timestamptz");
  await db.query("alter table assessments add column if not exists report_ready_at timestamptz");
  await db.query("alter table assessments add column if not exists report_generated_at timestamptz");
}

function rowToRecord(row: any): AssessmentRecord {
  return {
    id: row.id,
    token: row.token,
    status: row.status,
    reportStatus: row.report_status ?? "NotStarted",
    organization: row.organization,
    answers: row.answers,
    score: row.score ?? undefined,
    recommendations: row.recommendations ?? undefined,
    aiSummary: row.ai_summary ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    completedAt: row.completed_at ?? undefined,
    reportRequestedAt: row.report_requested_at ?? undefined,
    reportReadyAt: row.report_ready_at ?? undefined,
    reportGeneratedAt: row.report_generated_at ?? undefined
  };
}

export async function createAssessment(organization: Partial<OrganizationProfile> = {}) {
  await ensureSchema();
  const id = randomUUID();
  const record: AssessmentRecord = {
    id,
    token: token(),
    status: "Draft",
    reportStatus: "NotStarted",
    organization: { ...defaultProfile, ...organization },
    answers: defaultAnswers,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  const db = getPool();
  if (!db) {
    memoryStore.set(record.token, record);
    return record;
  }
  await db.query(
    `insert into assessments (id, token, status, organization, answers)
     values ($1, $2, $3, $4, $5)`,
    [record.id, record.token, record.status, JSON.stringify(record.organization), JSON.stringify(record.answers)]
  );
  return record;
}

export async function listAssessments() {
  await ensureSchema();
  const db = getPool();
  if (!db) return [...memoryStore.values()].map(finalizeReportIfDue).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  const result = await db.query("select * from assessments order by updated_at desc limit 100");
  return Promise.all(result.rows.map((row) => finalizeReportIfDue(rowToRecord(row))));
}

export async function getAssessmentByToken(accessToken: string) {
  await ensureSchema();
  const db = getPool();
  if (!db) {
    const record = memoryStore.get(accessToken);
    return record ? finalizeReportIfDue(record) : undefined;
  }
  const result = await db.query("select * from assessments where token = $1", [accessToken]);
  return result.rows[0] ? finalizeReportIfDue(rowToRecord(result.rows[0])) : undefined;
}

export async function deleteAssessmentByToken(accessToken: string) {
  await ensureSchema();
  const db = getPool();
  if (!db) return memoryStore.delete(accessToken);
  const result = await db.query("delete from assessments where token = $1", [accessToken]);
  return (result.rowCount ?? 0) > 0;
}

export async function updateAssessmentByToken(accessToken: string, patch: Partial<Pick<AssessmentRecord, "organization" | "answers" | "score" | "recommendations" | "aiSummary" | "status" | "reportStatus" | "reportRequestedAt" | "reportReadyAt" | "reportGeneratedAt">>) {
  await ensureSchema();
  const existing = await getAssessmentByToken(accessToken);
  if (!existing) return undefined;
  const next = {
    ...existing,
    ...patch,
    organization: patch.organization ? { ...existing.organization, ...patch.organization } : existing.organization,
    answers: patch.answers ? { ...existing.answers, ...patch.answers } : existing.answers,
    updatedAt: new Date().toISOString(),
    completedAt: patch.status === "Completed" ? new Date().toISOString() : existing.completedAt
  };
  const db = getPool();
  if (!db) {
    memoryStore.set(accessToken, next);
    return next;
  }
  const result = await db.query(
    `update assessments
     set status = $2, report_status = $3, organization = $4, answers = $5, score = $6, recommendations = $7, ai_summary = $8,
         updated_at = now(), completed_at = case when $2 = 'Completed' then coalesce(completed_at, now()) else completed_at end,
         report_requested_at = $9, report_ready_at = $10, report_generated_at = $11
     where token = $1
     returning *`,
    [
      accessToken,
      next.status,
      next.reportStatus ?? "NotStarted",
      JSON.stringify(next.organization),
      JSON.stringify(next.answers),
      next.score ? JSON.stringify(next.score) : null,
      next.recommendations ? JSON.stringify(next.recommendations) : null,
      next.aiSummary ?? null,
      next.reportRequestedAt ?? null,
      next.reportReadyAt ?? null,
      next.reportGeneratedAt ?? null
    ]
  );
  return rowToRecord(result.rows[0]);
}

export async function startReportGeneration(accessToken: string, delayMinutes = 15) {
  const existing = await getAssessmentByToken(accessToken);
  if (!existing) return undefined;
  if (existing.reportStatus === "Ready") return existing;
  const requestedAt = new Date();
  const readyAt = new Date(requestedAt.getTime() + delayMinutes * 60_000);
  return updateAssessmentByToken(accessToken, {
    reportStatus: "Processing",
    reportRequestedAt: requestedAt.toISOString(),
    reportReadyAt: readyAt.toISOString(),
    reportGeneratedAt: undefined,
    aiSummary: undefined
  });
}

function finalizeReportIfDue(record: AssessmentRecord) {
  if (record.reportStatus !== "Processing" || !record.reportReadyAt) return record;
  if (Date.parse(record.reportReadyAt) > Date.now()) return record;

  const next: AssessmentRecord = {
    ...record,
    reportStatus: "Ready",
    aiSummary: record.score && record.recommendations ? buildExecutiveSummary(record.organization, record.score, record.recommendations) : record.aiSummary,
    reportGeneratedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const db = getPool();
  if (!db) {
    memoryStore.set(record.token, next);
    return next;
  }

  void db.query(
    `update assessments
     set report_status = 'Ready', ai_summary = $2, report_generated_at = $3, updated_at = now()
     where token = $1 and report_status = 'Processing'`,
    [record.token, next.aiSummary ?? null, next.reportGeneratedAt]
  );
  return next;
}

export async function seedDemoAssessment() {
  const existing = await listAssessments();
  if (existing.length > 0) return existing[0];
  return createAssessment();
}
