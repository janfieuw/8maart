"use client";

import { useState } from "react";

function toCsvValue(value) {
  const text = String(value ?? "");
  return `"${text.replace(/"/g, '""')}"`;
}

function formatDateTime(value) {
  if (!value) return "";
  const date = new Date(value);
  return new Intl.DateTimeFormat("nl-BE", {
    dateStyle: "short",
    timeStyle: "medium",
  }).format(date);
}

function downloadTextFile(filename, content, type = "text/csv;charset=utf-8;") {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export default function ExportPage() {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function handleExport() {
    setBusy(true);
    setMessage("");

    try {
      const res = await fetch("/api/registrations", { cache: "no-store" });
      const data = await res.json().catch(() => ({}));

      const rows = Array.isArray(data.rows) ? data.rows : [];

      const csvRows = [
        [
          "Datum",
          "Type",
          "Werknemer",
          "PairCode",
          "Tag richting",
          "Tag secret",
        ]
          .map(toCsvValue)
          .join(","),
        ...rows.map((row) =>
          [
            formatDateTime(row.scannedAt),
            row.type || "",
            row.employee?.name || "",
            row.employee?.pairCode || "",
            row.scanTag?.direction || "",
            row.scanTag?.secret || "",
          ]
            .map(toCsvValue)
            .join(",")
        ),
      ];

      downloadTextFile("registraties.csv", csvRows.join("\n"));
      setMessage("Export succesvol gedownload.");
    } catch (error) {
      console.error("Export error:", error);
      setMessage("Export mislukt.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 16 }}>Export</h1>
      <p style={{ marginBottom: 16 }}>
        Exporteer alle registraties naar CSV.
      </p>

      <button
        onClick={handleExport}
        disabled={busy}
        style={{
          padding: "10px 16px",
          borderRadius: 10,
          border: "1px solid #d1d5db",
          background: busy ? "#f3f4f6" : "#111827",
          color: busy ? "#6b7280" : "#fff",
          cursor: busy ? "not-allowed" : "pointer",
        }}
      >
        {busy ? "Bezig met export..." : "Download CSV"}
      </button>

      {message ? <p style={{ marginTop: 16 }}>{message}</p> : null}
    </div>
  );
}