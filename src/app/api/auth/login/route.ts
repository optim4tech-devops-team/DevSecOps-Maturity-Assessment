import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { username, password } = await request.json();
  const expectedUser = process.env.ADMIN_USERNAME ?? "admin";
  const expectedPass = process.env.ADMIN_PASSWORD ?? "Optim4Tech@2026!";

  if (username === expectedUser && password === expectedPass) {
    return NextResponse.json({ ok: true, token: "assessment-admin-session-v2" });
  }
  return NextResponse.json({ ok: false, message: "Invalid credentials" }, { status: 401 });
}
