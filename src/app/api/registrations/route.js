import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

function jsonError(message, status = 400) {
  return new Response(JSON.stringify({ ok: false, error: message }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export async function GET(req) {
  try {
    const session = await getSession();

    if (!session?.companyId) {
      return jsonError("Niet ingelogd.", 401);
    }

    const companyId = session.companyId;

    const { searchParams } = new URL(req.url);
    const format = searchParams.get("format");

    const scans = await prisma.scan.findMany({
      where: { companyId },
      include: {
        employee: {
          select: {
            name: true,
            pairCode: true,
          },
        },
      },
      orderBy: { scannedAt: "desc" },
    });

    const rows = scans.map((s) => ({
      date: s.scannedAt,
      employee: s.employee?.name || "-",
      pairCode: s.employee?.pairCode || "-",
      type: s.type,
      direction: s.direction,
      secret: s.secret,
    }));

    // =========================
    // CSV EXPORT
    // =========================
    if (format === "csv") {
      const header = [
        "Datum",
        "Werknemer",
        "Koppelcode",
        "Type",
        "Richting",
        "QR Secret",
      ];

      const csv = [
        header.join(";"),
        ...rows.map((r) =>
          [
            new Date(r.date).toLocaleString("nl-BE"),
            r.employee,
            r.pairCode,
            r.type,
            r.direction,
            r.secret,
          ].join(";")
        ),
      ].join("\n");

      return new Response(csv, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": "attachment; filename=registraties.csv",
        },
      });
    }

    // =========================
    // PDF EXPORT
    // =========================
    if (format === "pdf") {
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF();

      doc.setFontSize(16);
      doc.text("Registraties", 14, 20);

      let y = 30;

      rows.forEach((r) => {
        if (y > 280) {
          doc.addPage();
          y = 20;
        }

        doc.setFontSize(10);
        doc.text(
          `${new Date(r.date).toLocaleString("nl-BE")} | ${r.employee} | ${r.type} | ${r.direction}`,
          14,
          y
        );

        y += 6;
      });

      const pdfBuffer = doc.output("arraybuffer");

      return new Response(pdfBuffer, {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": "attachment; filename=registraties.pdf",
        },
      });
    }

    // =========================
    // DEFAULT JSON
    // =========================
    return new Response(JSON.stringify({ ok: true, rows }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error(e);
    return jsonError("Failed to load registrations", 500);
  }
}