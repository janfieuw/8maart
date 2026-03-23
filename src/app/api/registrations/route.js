import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

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

function toCsvValue(value) {
  const text = String(value ?? "");
  return `"${text.replace(/"/g, '""')}"`;
}

function parseDateStart(value) {
  if (!value) return null;
  const d = new Date(`${value}T00:00:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

function parseDateEnd(value) {
  if (!value) return null;
  const d = new Date(`${value}T23:59:59.999`);
  return Number.isNaN(d.getTime()) ? null : d;
}

function buildWhere(companyId, from, to) {
  const where = { companyId };

  if (from || to) {
    where.scannedAt = {};
    if (from) where.scannedAt.gte = from;
    if (to) where.scannedAt.lte = to;
  }

  return where;
}

function drawTableHeader(doc, y) {
  doc
    .font("Helvetica-Bold")
    .fontSize(9)
    .text("Datum", 40, y, { width: 120 })
    .text("Werknemer", 165, y, { width: 130 })
    .text("Koppelcode", 300, y, { width: 80 })
    .text("Type", 385, y, { width: 45 })
    .text("Richting", 435, y, { width: 55 })
    .text("QR secret", 495, y, { width: 60 });

  doc
    .moveTo(40, y + 14)
    .lineTo(555, y + 14)
    .strokeColor("#999")
    .stroke();

  return y + 20;
}

async function buildPdfBuffer({ companyName, rows, fromDate, toDate }) {
  const { default: PDFDocument } = await import("pdfkit");

  const doc = new PDFDocument({
    size: "A4",
    margin: 40,
    bufferPages: true,
  });

  const chunks = [];
  doc.on("data", (chunk) => chunks.push(chunk));

  const done = new Promise((resolve) => {
    doc.on("end", resolve);
  });

  doc.font("Helvetica-Bold").fontSize(16).text("Aanwezigheden export");
  doc.moveDown(0.3);

  doc.font("Helvetica").fontSize(10).text(`Bedrijf: ${companyName || "-"}`);
  doc.text(
    `Periode: ${
      fromDate || toDate
        ? `${fromDate || "..."} t.e.m. ${toDate || "..."}`
        : "Alle registraties"
    }`
  );
  doc.text(`Aantal registraties: ${rows.length}`);
  doc.moveDown(1);

  let y = drawTableHeader(doc, doc.y);

  for (const row of rows) {
    if (y > 770) {
      doc.addPage();
      y = drawTableHeader(doc, 40);
    }

    doc
      .font("Helvetica")
      .fontSize(8.5)
      .text(formatDateTime(row.scannedAt), 40, y, { width: 120 })
      .text(row.employee?.name || "-", 165, y, { width: 130 })
      .text(row.employee?.pairCode || "-", 300, y, { width: 80 })
      .text(row.type || "-", 385, y, { width: 45 })
      .text(row.scanTag?.direction || "-", 435, y, { width: 55 })
      .text(row.scanTag?.secret || "-", 495, y, { width: 60 });

    y += 18;
  }

  doc.end();
  await done;

  return Buffer.concat(chunks);
}

export async function GET(req) {
  try {
    const session = await getSession();

    if (!session?.companyId) {
      return jsonError("Niet ingelogd.", 401);
    }

    const companyId = session.companyId;
    const url = new URL(req.url);
    const format = url.searchParams.get("format");
    const fromDate = url.searchParams.get("from") || "";
    const toDate = url.searchParams.get("to") || "";

    const from = parseDateStart(fromDate);
    const to = parseDateEnd(toDate);

    const where = buildWhere(companyId, from, to);

    const [company, rows] = await Promise.all([
      prisma.company.findUnique({
        where: { id: companyId },
        select: { name: true },
      }),
      prisma.scanEvent.findMany({
        where,
        orderBy: { scannedAt: "desc" },
        take: 5000,
        include: {
          employee: {
            select: {
              name: true,
              pairCode: true,
            },
          },
          scanTag: {
            select: {
              direction: true,
              secret: true,
            },
          },
        },
      }),
    ]);

    if (format === "pdf") {
      const pdfBuffer = await buildPdfBuffer({
        companyName: company?.name || "",
        rows,
        fromDate,
        toDate,
      });

      return new NextResponse(pdfBuffer, {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="aanwezigheden${
            fromDate || toDate
              ? `_${fromDate || "start"}_${toDate || "einde"}`
              : ""
          }.pdf"`,
          "Cache-Control": "no-store",
        },
      });
    }

    if (format === "csv") {
      const csvRows = [
        [
          "Datum",
          "Werknemer",
          "Koppelcode",
          "Type",
          "Richting",
          "QR secret",
        ]
          .map(toCsvValue)
          .join(","),
        ...rows.map((row) =>
          [
            formatDateTime(row.scannedAt),
            row.employee?.name || "",
            row.employee?.pairCode || "",
            row.type || "",
            row.scanTag?.direction || "",
            row.scanTag?.secret || "",
          ]
            .map(toCsvValue)
            .join(",")
        ),
      ];

      return new NextResponse(csvRows.join("\n"), {
        status: 200,
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="aanwezigheden${
            fromDate || toDate
              ? `_${fromDate || "start"}_${toDate || "einde"}`
              : ""
          }.csv"`,
          "Cache-Control": "no-store",
        },
      });
    }

    return jsonOk({
      companyName: company?.name || "",
      rows,
      filters: {
        from: fromDate,
        to: toDate,
      },
    });
  } catch (error) {
    console.error("GET /api/registrations error:", error);
    return jsonError(error?.message || "Failed to load registrations", 500);
  }
}