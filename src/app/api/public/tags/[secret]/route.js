import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req, ctx) {
  try {
    const params = await ctx.params;
    const secret = String(params?.secret || "").trim();

    if (!secret) {
      return NextResponse.json(
        {
          ok: false,
          error: "Secret ontbreekt",
        },
        { status: 400 }
      );
    }

    const tag = await prisma.scanTag.findUnique({
      where: { secret },
      include: {
        Company: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!tag) {
      return NextResponse.json(
        {
          ok: false,
          error: "QR-code niet gevonden",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ok: true,
      scanTag: {
        id: tag.id,
        secret: tag.secret,
        direction: tag.direction,
        companyId: tag.companyId,
        companyName: tag.Company?.name || "",
      },
    });
  } catch (error) {
    console.error("Public tag lookup error:", error);

    return NextResponse.json(
      {
        ok: false,
        error: "Server error",
      },
      { status: 500 }
    );
  }
}