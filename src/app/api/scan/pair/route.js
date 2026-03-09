import { NextResponse } from "next/server";
import crypto from "crypto";

const PAIR_COOKIE_NAME = "punctoo_device_pair";
const PAIR_COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 jaar

function normalizePairCode(value) {
  return String(value || "")
    .trim()
    .toUpperCase();
}

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const pairCode = normalizePairCode(body?.pairCode);

    if (!pairCode) {
      return NextResponse.json(
        { error: "PairCode ontbreekt." },
        { status: 400 }
      );
    }

    const validPairCode = normalizePairCode(process.env.SCAN_PAIR_CODE);

    if (!validPairCode) {
      return NextResponse.json(
        {
          error:
            "SCAN_PAIR_CODE is niet ingesteld in de environment variables.",
        },
        { status: 500 }
      );
    }

    if (pairCode !== validPairCode) {
      return NextResponse.json(
        { error: "Ongeldige PairCode." },
        { status: 401 }
      );
    }

    const deviceId = crypto.randomUUID();
    const pairedAt = new Date().toISOString();

    const response = NextResponse.json({
      ok: true,
      paired: true,
      deviceId,
      pairedAt,
    });

    response.cookies.set({
      name: PAIR_COOKIE_NAME,
      value: JSON.stringify({
        paired: true,
        deviceId,
        pairedAt,
      }),
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: PAIR_COOKIE_MAX_AGE,
    });

    return response;
  } catch (error) {
    console.error("POST /api/scan/pair error:", error);

    return NextResponse.json(
      { error: "Interne serverfout bij koppelen van toestel." },
      { status: 500 }
    );
  }
}