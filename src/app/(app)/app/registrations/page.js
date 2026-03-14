"use client";

import { useEffect, useMemo, useState } from "react";

function formatDateTime(value) {
  if (!value) return "-";
  const date = new Date(value);
  return new Intl.DateTimeFormat("nl-BE", {
    dateStyle: "short",
    timeStyle: "medium",
  }).format(date);
}

function readJson(res) {
  return res.json().catch(() => ({}));
}

export default function RegistrationsPage() {
  const [rows, setRows] = useState([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const res = await fetch("/api/registrations", { cache: "no-store" });
        const data = await readJson(res);

        if (!active) return;

        setRows(Array.isArray(data.rows) ? data.rows : []);
      } catch (error) {
        console.error("Registrations load error:", error);
      } finally {
        if (active) setLoading(false);
      }
    }

    load();

    return () => {
      active = false;
    };
  }, []);

  const filteredRows = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;

    return rows.filter((row) => {
      return (
        String(row.employee?.name || "").toLowerCase().includes(q) ||
        String(row.employee?.pairCode || "").toLowerCase().includes(q) ||
        String(row.type || "").toLowerCase().includes(q) ||
        String(row.scanTag?.direction || "").toLowerCase().includes(q) ||
        String(row.scanTag?.secret || "").toLowerCase().includes(q)
      );
    });
  }, [rows, query]);

  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 16 }}>
        Registraties
      </h1>

      <input
        type="text"
        placeholder="Zoek werknemer, paircode, type of tag..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        style={{
          width: "100%",
          maxWidth: 500,
          padding: "10px 12px",
          marginBottom: 16,
          borderRadius: 10,
          border: "1px solid #d1d5db",
        }}
      />

      {loading ? (
        <div>Registraties laden...</div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              background: "#fff",
            }}
          >
            <thead>
              <tr>
                <th style={thStyle}>Datum</th>
                <th style={thStyle}>Werknemer</th>
                <th style={thStyle}>PairCode</th>
                <th style={thStyle}>Type</th>
                <th style={thStyle}>Tag richting</th>
                <th style={thStyle}>Tag secret</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.length === 0 ? (
                <tr>
                  <td style={tdStyle} colSpan={6}>
                    Geen registraties gevonden.
                  </td>
                </tr>
              ) : (
                filteredRows.map((row) => (
                  <tr key={row.id}>
                    <td style={tdStyle}>{formatDateTime(row.scannedAt)}</td>
                    <td style={tdStyle}>{row.employee?.name || "-"}</td>
                    <td style={tdStyle}>{row.employee?.pairCode || "-"}</td>
                    <td style={tdStyle}>{row.type || "-"}</td>
                    <td style={tdStyle}>{row.scanTag?.direction || "-"}</td>
                    <td style={tdStyle}>{row.scanTag?.secret || "-"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const thStyle = {
  textAlign: "left",
  padding: "12px",
  borderBottom: "1px solid #e5e7eb",
  background: "#f9fafb",
};

const tdStyle = {
  padding: "12px",
  borderBottom: "1px solid #e5e7eb",
};