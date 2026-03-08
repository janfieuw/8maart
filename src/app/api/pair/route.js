import { NextResponse } from "next/server";

function jsonErr(error, init) {
  return NextResponse.json({ ok: false, error }, init);
}

export async function POST() {
  return jsonErr(
    "Deze endpoint is verouderd. Gebruik de nieuwe scanflow via /s/[secret] en POST /api/scan.",
    { status: 410 }
  );
}