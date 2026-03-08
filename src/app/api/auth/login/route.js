import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createAndSetSession, verifyPassword } from "@/lib/auth";

function jsonOk(data = {}, status = 200) {
  return NextResponse.json({ ok: true, ...data }, { status });
}

function jsonError(error, status = 400) {
  return NextResponse.json(
    { ok: false, error: error instanceof Error ? error.message : String(error) },
    { status }
  );
}

export async function POST(req) {
  try {
    const body = await req.json();

    const email = String(body?.email || "").trim().toLowerCase();
    const password = String(body?.password || "");

    if (!email) return jsonError("E-mailadres is verplicht", 400);
    if (!password) return jsonError("Wachtwoord is verplicht", 400);

    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        companyId: true,
        email: true,
        name: true,
        passwordHash: true,
      },
    });

    if (!user) {
      return jsonError("Ongeldige login", 401);
    }

    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      return jsonError("Ongeldige login", 401);
    }

    await createAndSetSession(user);

    return jsonOk({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        companyId: user.companyId,
      },
    });
  } catch (error) {
    console.error("POST /api/auth/login error:", error);
    return jsonError("Login mislukt", 500);
  }
}