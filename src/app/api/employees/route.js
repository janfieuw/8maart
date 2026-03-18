import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getDemoCompanyId } from "@/lib/demo-company";

function jsonOk(data = {}, status = 200) {
  return NextResponse.json({ ok: true, ...data }, { status });
}

function jsonError(error, status = 400) {
  return NextResponse.json(
    {
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    },
    { status }
  );
}

const PAIR_CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const PAIR_CODE_LENGTH = 6;
const PAIR_CODE_REGEX = /^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{6}$/;

function normalizePairCode(code) {
  return String(code || "").trim().toUpperCase();
}

function generatePairCode(length = PAIR_CODE_LENGTH) {
  let result = "";

  for (let i = 0; i < length; i += 1) {
    result += PAIR_CODE_CHARS.charAt(
      Math.floor(Math.random() * PAIR_CODE_CHARS.length)
    );
  }

  return result;
}

async function generateUniquePairCode(companyId) {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const code = generatePairCode();

    const existing = await prisma.employee.findFirst({
      where: {
        companyId,
        pairCode: code,
      },
      select: {
        id: true,
      },
    });

    if (!existing) {
      return code;
    }
  }

  throw new Error("Kon geen unieke PairCode genereren");
}

export async function GET() {
  try {
    const companyId = await getDemoCompanyId();

    const rows = await prisma.employee.findMany({
      where: { companyId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        pairCode: true,
        active: true,
        expectedMode: true,
        createdAt: true,
      },
    });

    return jsonOk({ rows });
  } catch (error) {
    console.error("GET /api/employees error:", error);
    return jsonError("Failed to load employees", 500);
  }
}

export async function POST(req) {
  try {
    const companyId = await getDemoCompanyId();
    const body = await req.json().catch(() => ({}));

    const name = String(body?.name || "").trim();
    let pairCode = normalizePairCode(body?.pairCode);

    let expectedMode = body?.expectedMode ?? null;

    if (expectedMode != null && expectedMode !== "") {
      expectedMode = String(expectedMode).trim().toUpperCase();

      if (!["ROSTER", "CALENDAR"].includes(expectedMode)) {
        return jsonError("Invalid expectedMode", 400);
      }
    } else {
      expectedMode = null;
    }

    if (!name) {
      return jsonError("Naam is verplicht", 400);
    }

    if (!pairCode) {
      pairCode = await generateUniquePairCode(companyId);
    }

    if (!PAIR_CODE_REGEX.test(pairCode)) {
      return jsonError(
        "PairCode moet 6 tekens bevatten en mag enkel veilige hoofdletters en cijfers bevatten",
        400
      );
    }

    const existingEmployee = await prisma.employee.findFirst({
      where: {
        companyId,
        pairCode,
      },
      select: {
        id: true,
      },
    });

    if (existingEmployee) {
      return jsonError("PairCode bestaat al", 409);
    }

    const employee = await prisma.employee.create({
      data: {
        companyId,
        name,
        pairCode,
        expectedMode,
        active: true,
      },
      select: {
        id: true,
        companyId: true,
        name: true,
        pairCode: true,
        expectedMode: true,
        active: true,
        createdAt: true,
      },
    });

    return jsonOk({ employee }, 201);
  } catch (error) {
    console.error("POST /api/employees error:", error);

    if (error?.code === "P2002") {
      return jsonError("PairCode bestaat al", 409);
    }

    return jsonError("Failed to create employee", 500);
  }
}