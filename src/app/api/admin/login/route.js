import { NextResponse } from "next/server";
import {
  createAndSetAdminSession,
  verifyAdminCredentials,
} from "../_lib/adminAuth.js";

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

    if (!email) {
      return jsonError("E-mailadres is verplicht", 400);
    }

    if (!password) {
      return jsonError("Wachtwoord is verplicht", 400);
    }

    const valid = await verifyAdminCredentials(email, password);

    if (!valid) {
      return jsonError("Ongeldige admin login", 401);
    }

    await createAndSetAdminSession();

    return jsonOk({
      user: {
        email,
        role: "admin",
      },
    });
  } catch (error) {
    console.error("POST /api/admin/login error:", error);
    return jsonError("Admin login mislukt", 500);
  }
}