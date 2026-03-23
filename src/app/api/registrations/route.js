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

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
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

function buildPdfContent(rows) {
  const lines = [];

  lines.push("%PDF-1.4");

  const objects = [];

  function addObject(content) {
    objects.push(content);
    return objects.length;
  }

  const textLines = [
    "Registraties export",
    "",
    "Datum | Werknemer | PairCode | Type | QR richting | QR secret",
    ...rows.map((row) => {
      const parts = [
        formatDateTime(row.scannedAt),
        row.employee?.name || "",
        row.employee?.pairCode || "",
        row.type || "",
        row.scanTag?.direction || "",
        row.scanTag?.secret || "",
      ];

      const text = parts.join(" | ");
      return text.length > 110 ? `${text.slice(0, 107)}...` : text;
    }),
  ];

  const escapedText = textLines
    .map((line) =>
      line.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)")
    )
    .join(") Tj\n0 -16 Td\n(");

  const contentStream = `BT
/F1 10 Tf
50 780 Td
(${escapedText}) Tj
ET`;

  const contentLength = Buffer.byteLength(contentStream, "utf8");

  const catalogId = addObject("<< /Type /Catalog /Pages 2 0 R >>");
  const pagesId = addObject("<< /Type /Pages /Kids [3 0 R] /Count 1 >>");
  const pageId = addObject(
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 842 595] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>"
  );
  const fontId = addObject("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");
  const contentId = addObject(
    `<< /Length ${contentLength} >>\nstream\n${contentStream}\nendstream`
  );

  const xrefOffsets = [];
  let pdfBody = "";

  objects.forEach((content, index) => {
    const objectNumber = index + 1;
    xrefOffsets[objectNumber] = Buffer.byteLength(lines.join("\n") + "\n" + pdfBody, "utf8");
    pdfBody += `${objectNumber} 0 obj\n${content}\nendobj\n`;
  });

  const header = `${lines.join("\n")}\n`;
  const xrefStart = Buffer.byteLength(header + pdfBody, "utf8");

  let xref = `xref\n0 ${objects.length + 1}\n`;
  xref += `0000000000 65535 f \n`;

  for (let i = 1; i <= objects.length; i += 1) {
    xref += `${String(xrefOffsets[i]).padStart(10, "0")} 00000 n \n`;
  }

  const trailer = `trailer
<< /Size ${objects.length + 1} /Root ${catalogId} 0 R >>
startxref
${xrefStart}
%%EOF`;

  return Buffer.from(header + pdfBody + xref + trailer, "utf8");
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
            id: true,
            name: true,
            pairCode: true,
          },
        },
        scanTag: true,
      },
    });

    if (format === "pdf") {
      const pdfBuffer = buildPdfContent(rows);

      return new NextResponse(pdfBuffer, {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": 'attachment; filename="registraties.pdf"',
          "Cache-Control": "no-store",
        },
      });
    }

    return jsonOk({ rows });
  } catch (error) {
    console.error("GET /api/registrations error:", error);
    return jsonError("Failed to load registrations", 500);
  }
}