import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function jsonOk(data, init) {
  return NextResponse.json({ ok: true, ...data }, init);
}

function jsonErr(error, init) {
  return NextResponse.json({ ok: false, error }, init);
}

async function getIdFromContext(context) {
  const params = await context?.params;
  return params?.id ?? null;
}

export async function PATCH(req, context) {
  try {
    const id = await getIdFromContext(context);
    if (!id) return jsonErr("Missing id", { status: 400 });

    const body = await req.json();
    const data = {};

    if (body?.name !== undefined) {
      const name = String(body.name || "").trim();
      if (!name) return jsonErr("Naam is verplicht", { status: 400 });
      data.name = name;
    }

    if (body?.location !== undefined) {
      data.location = String(body.location || "").trim() || null;
    }

    const row = await prisma.scanLocation.update({
      where: { id },
      data,
      select: {
        id: true,
        name: true,
        location: true,
        createdAt: true,
        scanTags: {
          select: {
            id: true,
            secret: true,
            direction: true,
            createdAt: true,
          },
          orderBy: { direction: "asc" },
        },
      },
    });

    return jsonOk({ row });
  } catch (e) {
    return jsonErr(e?.message || "Failed to update scan location", { status: 500 });
  }
}

export async function DELETE(_req, context) {
  try {
    const id = await getIdFromContext(context);
    if (!id) return jsonErr("Missing id", { status: 400 });

    await prisma.$transaction(async (tx) => {
      await tx.scanTag.deleteMany({
        where: { scanLocationId: id },
      });

      await tx.scanLocation.delete({
        where: { id },
      });
    });

    return jsonOk({ ok: true });
  } catch (e) {
    return jsonErr(e?.message || "Failed to delete scan location", { status: 500 });
  }
}