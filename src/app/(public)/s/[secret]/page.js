"use client";

import { useMemo, useState } from "react";

export default function PublicScanPage({ params }) {
  const secret = useMemo(() => String(params?.secret || "").trim(), [params]);
  const [pairCode, setPairCode] = useState("");
  const [deviceToken, setDeviceToken] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setSuccess(null);

    try {
      const res = await fetch(`/api/scan/${secret}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          pairCode: pairCode.trim(),
          deviceToken: deviceToken.trim(),
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || "Scan mislukt");
      }

      setSuccess(data);
      setPairCode("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Scan mislukt");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        background: "#f9fafb",
        padding: 24,
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 480,
          background: "#fff",
          border: "1px solid #e5e7eb",
          borderRadius: 16,
          padding: 24,
        }}
      >
        <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>
          Scan registreren
        </h1>

        <p style={{ color: "#6b7280", marginBottom: 20 }}>
          Geef je pair code in om je scan te registreren.
        </p>

        <div
          style={{
            marginBottom: 16,
            padding: 12,
            borderRadius: 10,
            background: "#f3f4f6",
            fontSize: 14,
          }}
        >
          Scantag secret: <strong>{secret}</strong>
        </div>

        <form onSubmit={handleSubmit}>
          <label style={labelStyle}>Pair code</label>
          <input
            type="text"
            value={pairCode}
            onChange={(e) => setPairCode(e.target.value.toUpperCase())}
            placeholder="Bijv. AB12CD"
            required={!deviceToken}
            style={inputStyle}
          />

          <label style={labelStyle}>Device token (optioneel)</label>
          <input
            type="text"
            value={deviceToken}
            onChange={(e) => setDeviceToken(e.target.value)}
            placeholder="Toestel token"
            style={inputStyle}
          />

          <button
            type="submit"
            disabled={busy}
            style={{
              width: "100%",
              padding: "12px 16px",
              borderRadius: 10,
              border: "none",
              background: busy ? "#9ca3af" : "#111827",
              color: "#fff",
              cursor: busy ? "not-allowed" : "pointer",
              fontWeight: 600,
            }}
          >
            {busy ? "Bezig..." : "Registreer scan"}
          </button>
        </form>

        {error ? (
          <div
            style={{
              marginTop: 16,
              padding: 12,
              borderRadius: 10,
              background: "#fef2f2",
              color: "#991b1b",
            }}
          >
            {error}
          </div>
        ) : null}

        {success ? (
          <div
            style={{
              marginTop: 16,
              padding: 12,
              borderRadius: 10,
              background: "#ecfdf5",
              color: "#065f46",
            }}
          >
            <div>
              <strong>Succes</strong>
            </div>
            <div>Werknemer: {success.employee?.name || "-"}</div>
            <div>Type: {success.type || "-"}</div>
            <div>
              Tijdstip:{" "}
              {success.scannedAt
                ? new Intl.DateTimeFormat("nl-BE", {
                    dateStyle: "short",
                    timeStyle: "medium",
                  }).format(new Date(success.scannedAt))
                : "-"}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

const labelStyle = {
  display: "block",
  marginBottom: 6,
  fontSize: 14,
  fontWeight: 600,
};

const inputStyle = {
  width: "100%",
  padding: "10px 12px",
  marginBottom: 14,
  border: "1px solid #d1d5db",
  borderRadius: 10,
};