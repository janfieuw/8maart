import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { PDFDocument } from "pdf-lib";
import QRCode from "qrcode";
import fs from "fs/promises";
import path from "path";

function getBaseUrl() {
  return (
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_BASE_URL ||
    "https://8maart-production.up.railway.app"
  );
}

function scanUrl(secret) {
  return `${getBaseUrl()}/s/${secret}`;
}

async function fileExists(filepath) {
  try {
    await fs.access(filepath);
    return true;
  } catch {
    return false;
  }
}

export async function GET() {
  try {
    const session = await getSession();

    if (!session?.companyId) {
      return NextResponse.json(
        { ok: false, error: "Niet ingelogd." },
        { status: 401 }
      );
    }

    const companyId = session.companyId;

    const company = await prisma.company.findUnique({
      where: { id: companyId },
      select: {
        name: true,
      },
    });

    const tags = await prisma.scanTag.findMany({
      where: { companyId },
      select: {
        direction: true,
        secret: true,
      },
    });

    const inTag = tags.find((tag) => tag.direction === "IN");
    const outTag = tags.find((tag) => tag.direction === "OUT");

    if (!inTag || !outTag) {
      return NextResponse.json(
        { ok: false, error: "IN of OUT QR ontbreekt." },
        { status: 404 }
      );
    }

    const templatePath = path.join(
      process.cwd(),
      "public",
      "templates",
      "scantag-template.png"
    );

    const exists = await fileExists(templatePath);

    if (!exists) {
      return NextResponse.json(
        {
          ok: false,
          error: "Template niet gevonden op public/templates/scantag-template.png",
        },
        { status: 404 }
      );
    }

    const templateBytes = await fs.readFile(templatePath);

    const qrInDataUrl = await QRCode.toDataURL(scanUrl(inTag.secret), {
      margin: 1,
      width: 500,
      color: {
        dark: "#000000",
        light: "#0000",
      },
    });

    const qrOutDataUrl = await QRCode.toDataURL(scanUrl(outTag.secret), {
      margin: 1,
      width: 500,
      color: {
        dark: "#000000",
        light: "#0000",
      },
    });

    const qrInBytes = Buffer.from(qrInDataUrl.split(",")[1], "base64");
    const qrOutBytes = Buffer.from(qrOutDataUrl.split(",")[1], "base64");

    const pdfDoc = await PDFDocument.create();

    const templateImage = await pdfDoc.embedPng(templateBytes);
    const qrInImage = await pdfDoc.embedPng(qrInBytes);
    const qrOutImage = await pdfDoc.embedPng(qrOutBytes);

    const templateWidth = templateImage.width;
    const templateHeight = templateImage.height;

    const page = pdfDoc.addPage([templateWidth, templateHeight]);

    page.drawImage(templateImage, {
      x: 0,
      y: 0,
      width: templateWidth,
      height: templateHeight,
    });

    // Fijnere positionering binnen de witte vakken
    const qrSize = 330;

    page.drawImage(qrInImage, {
      x: 285,
      y: 515,
      width: qrSize,
      height: qrSize,
    });

    page.drawImage(qrOutImage, {
      x: 920,
      y: 515,
      width: qrSize,
      height: qrSize,
    });

    const pdfBytes = await pdfDoc.save();

    const filename = `scantag-${(company?.name || "bedrijf")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")}.pdf`;

    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("GET /api/scantag/download error:", error);

    return NextResponse.json(
      { ok: false, error: "PDF genereren mislukt." },
      { status: 500 }
    );
  }
}