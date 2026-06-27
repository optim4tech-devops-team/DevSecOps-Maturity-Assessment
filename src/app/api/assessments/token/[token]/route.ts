import { NextResponse } from "next/server";
import { calculateAssessment } from "@/features/scoring/scoring";
import { generateRecommendations } from "@/features/recommendations/recommendations";
import { deleteAssessmentByToken, getAssessmentByToken, updateAssessmentByToken } from "@/lib/db";

export async function GET(_: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const record = await getAssessmentByToken(token);
  if (!record) return NextResponse.json({ message: "Assessment not found" }, { status: 404 });
  return NextResponse.json(record);
}

export async function PUT(request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const body = await request.json();
  const score = calculateAssessment(body.answers);
  const recommendations = generateRecommendations(body.answers, score.categoryScores);
  const record = await updateAssessmentByToken(token, {
    organization: body.organization,
    answers: body.answers,
    score,
    recommendations,
    status: body.status ?? "InProgress"
  });
  if (!record) return NextResponse.json({ message: "Assessment not found" }, { status: 404 });
  return NextResponse.json(record);
}

export async function DELETE(_: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const deleted = await deleteAssessmentByToken(token);
  if (!deleted) return NextResponse.json({ message: "Assessment not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
