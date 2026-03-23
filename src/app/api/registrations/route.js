import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getDemoCompanyId } from "@/lib/demo-company";
import PDFDocument from "pdfkit";

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

function formatDateTime(value) {
  if (!value) return "";
  try {
    return new Date(value).toLocaleString("nl-BE", {
      timeZone: "Europe/Brussels",
    });
  } catch {
    return String(value);
  }
}

export async function GET(req) {
  try {
    const companyId = await getDemoCompanyId();
    const format = new URL(req.url).searchParams.get("format");

    const rows = await prisma.scanEvent.findMany({
      where: { companyId },
      orderBy: { scannedAt: "desc" },
      take: 500,
      include: {
        employee: {
          select: {
            name: true,
            pairCode: true,
          },
        },
        scanTag: true,
      },
    });

    // 👉 PDF EXPORT
    if (format === "pdf") {
      const doc = new PDFDocument({ margin: 40, size: "A4" });

      const chunks = [];
      doc.on("data", (chunk) => chunks.push(chunk));

      const endPromise = new Promise((resolve) => {
        doc.on("end", resolve);
      });

      // Titel
      doc.fontSize(16).text("Registraties export", { align: "left" });
      doc.moveDown();

      // Header
      doc.fontSize(10).text(
        "Datum | Werknemer | PairCode | Type | Richting",
        { underline: true }
      );
      doc.moveDown(0.5);

      // Data
      rows.forEach((row) => {
        const line = [
          formatDateTime(row.scannedAt),
          row.employee?.name || "",
          row.employee?.pairCode || "",
          row.type || "",
          row.scanTag?.direction || "",
        ].join(" | ");

        doc.text(line, {
          width: 500,
        });
      });

      doc.end();
      await endPromise;

      const pdfBuffer = Buffer.concat(chunks);

      return new NextResponse(pdfBuffer, {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": 'attachment; filename="registraties.pdf"',
        },
      });
    }

    // 👉 JSON (voor CSV)
    return jsonOk({ rows });
  } catch (error) {
    console.error("GET /api/registrations error:", error);
    return jsonError("Failed to load registrations", 500);
  }
}