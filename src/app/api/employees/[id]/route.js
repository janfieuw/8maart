import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function jsonOk(data) {
  return NextResponse.json({ ok: true, ...data });
}

function jsonErr(error, status = 400) {
  return NextResponse.json({ ok: false, error }, { status });
}

export async function GET(req, { params }) {
  try {
    const employee = await prisma.employee.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        name: true,
        pairCode: true,
        expectedMode: true,
        active: true,
        createdAt: true,
      },
    });

    if (!employee) return jsonErr("Employee not found", 404);

    return jsonOk({ employee });
  } catch (e) {
    console.error(e);
    return jsonErr("Failed to load employee", 500);
  }
}

export async function PATCH(req, { params }) {
  try {
    const body = await req.json();

    const employee = await prisma.employee.update({
      where: { id: params.id },
      data: {
        name: body.name,
        pairCode: body.pairCode,
        expectedMode: body.expectedMode,
        active: body.active,
      },
    });

    return jsonOk({ employee });
  } catch (e) {
    console.error(e);

    if (e.code === "P2002") {
      return jsonErr("PairCode bestaat al");
    }

    return jsonErr("Employee update failed", 500);
  }
}

export async function DELETE(req, { params }) {
  try {
    await prisma.employee.delete({
      where: { id: params.id },
    });

    return jsonOk({});
  } catch (e) {
    console.error(e);
    return jsonErr("Employee delete failed", 500);
  }
}