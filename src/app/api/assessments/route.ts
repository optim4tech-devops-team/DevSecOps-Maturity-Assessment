import { NextResponse } from "next/server";
import { createAssessment, listAssessments } from "@/lib/db";

export async function GET() {
  return NextResponse.json(await listAssessments());
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const record = await createAssessment(body.organization ?? {});
  return NextResponse.json(record, { status: 201 });
}
