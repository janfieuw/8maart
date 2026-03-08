import { NextResponse } from "next/server";
import { clearSession } from "@/lib/auth";

function jsonOk(data = {}, status = 200) {
  return NextResponse.json({ ok: true, ...data }, { status });
}

export async function POST() {
  await clearSession();
  return jsonOk({ loggedOut: true });
}