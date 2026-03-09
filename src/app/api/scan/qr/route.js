import { NextResponse } from "next/server";
import { cookies, headers } from "next/headers";
import QRCode from "qrcode";

const PAIR_COOKIE_NAME = "punctoo_device_pair";

function getBaseUrl() {
  const envUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.APP_URL ||
    process.env.NEXTAUTH_URL;

  if (envUrl) {
    return envUrl.replace(/\/$/, "");
  }

  const headerStore = headers();
  const host = headerStore.get("x-forwarded-host") || headerStore.get("host");
  const proto = headerStore.get("x-forwarded-proto") || "https";

  if (!host) return null;

  return `${proto}://${host}`;
}

export async function GET() {
  try {
    const cookieStore = cookies();
    const pairedCookie = cookieStore.get(PAIR_COOKIE_NAME);

    if (!pairedCookie?.value) {
      return NextResponse.json(
        { error: "Toestel is nog niet gekoppeld." },
        { status: 401 }
      );
    }

    let parsed;
    try {
      parsed = JSON.parse(pairedCookie.value);
    } catch {
      return NextResponse.json(
        { error: "Ongeldige toestelkoppeling." },
        { status: 401 }
      );
    }

    if (!parsed?.paired || !parsed?.deviceId) {
      return NextResponse.json(
        { error: "Toestel is nog niet correct gekoppeld." },
        { status: 401 }
      );
    }

    const baseUrl = getBaseUrl();

    if (!baseUrl) {
      return NextResponse.json(
        { error: "Base URL kon niet bepaald worden." },
        { status: 500 }
      );
    }

    const scanTarget = `${baseUrl}/scan/register?device=${encodeURIComponent(
      parsed.deviceId
    )}`;

    const qrUrl = await QRCode.toDataURL(scanTarget, {
      errorCorrectionLevel: "M",
      margin: 1,
      width: 700,
    });

    return NextResponse.json({
      ok: true,
      paired: true,
      deviceId: parsed.deviceId,
      scanTarget,
      qrUrl,
    });
  } catch (error) {
    console.error("GET /api/scan/qr error:", error);

    return NextResponse.json(
      { error: "Interne serverfout bij ophalen van QR." },
      { status: 500 }
    );
  }
}