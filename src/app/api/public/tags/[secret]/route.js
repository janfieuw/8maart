import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req, ctx) {
  try {
    const params = await ctx.params;
    const secret = String(params?.secret || "").trim();

    if (!secret) {
      return NextResponse.json({
        ok: false,
        error: "Secret ontbreekt"
      });
    }

    const tag = await prisma.scanTag.findFirst({
      where: {
        secret
      },
      include: {
        scanLocation: {
          include: {
            company: true
          }
        }
      }
    });

    if (!tag) {
      return NextResponse.json({
        ok: false,
        error: "QR-code niet gevonden"
      });
    }

    return NextResponse.json({
      ok: true,
      scanTag: {
        id: tag.id,
        secret: tag.secret,
        direction: tag.direction,
        scanLocation: {
          id: tag.scanLocation.id,
          name: tag.scanLocation.name,
          location: tag.scanLocation.location,
          companyId: tag.scanLocation.companyId
        }
      }
    });

  } catch (error) {
    console.error("Public tag lookup error:", error);

    return NextResponse.json({
      ok: false,
      error: "Server error"
    });
  }
}