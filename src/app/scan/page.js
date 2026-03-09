"use client";

import { useEffect, useState } from "react";

export default function ScanPage() {
  const [loading, setLoading] = useState(true);
  const [pairCode, setPairCode] = useState("");
  const [qrUrl, setQrUrl] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadQr() {
      try {
        setLoading(true);
        setError("");

        const res = await fetch("/api/scan/qr", {
          method: "GET",
          cache: "no-store",
        });

        if (!res.ok) {
          const data = await res.json().catch(() => null);
          throw new Error(data?.error || "QR ophalen mislukt");
        }

        const data = await res.json();

        if (cancelled) return;

        setQrUrl(data?.qrUrl || "");
      } catch (err) {
        if (cancelled) return;
        setError(err.message || "Onbekende fout");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadQr();

    return () => {
      cancelled = true;
    };
  }, []);

  async function handlePair(e) {
    e.preventDefault();

    if (!pairCode.trim()) {
      setError("Voer een geldige PairCode in.");
      return;
    }

    try {
      setSubmitting(true);
      setError("");

      const res = await fetch("/api/scan/pair", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          pairCode: pairCode.trim(),
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(data?.error || "Koppelen mislukt");
      }

      window.location.reload();
    } catch (err) {
      setError(err.message || "Onbekende fout");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f3f3f3",
        padding: "32px 20px 60px",
        fontFamily: "Arial, Helvetica, sans-serif",
      }}
    >
      <div style={{ maxWidth: 520, margin: "0 auto" }}>
        <div style={{ marginBottom: 28 }}>
          <h1
            style={{
              fontSize: 72,
              lineHeight: 1,
              fontWeight: 800,
              color: "#111",
              margin: 0,
              letterSpacing: "-0.03em",
            }}
          >
            Punctoo
          </h1>

          <p
            style={{
              fontSize: 30,
              lineHeight: 1.2,
              color: "#666",
              marginTop: 18,
              marginBottom: 0,
              fontWeight: 400,
            }}
          >
            Scan registreren
          </p>
        </div>

        <section
          style={{
            background: "#fff",
            borderRadius: 999,
            padding: "22px 28px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
            marginBottom: 28,
            minHeight: 112,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {loading ? (
            <p
              style={{
                margin: 0,
                fontSize: 22,
                color: "#222",
              }}
            >
              QR laden...
            </p>
          ) : error && !qrUrl ? (
            <p
              style={{
                margin: 0,
                fontSize: 18,
                color: "#c62828",
                textAlign: "center",
              }}
            >
              {error}
            </p>
          ) : qrUrl ? (
            <img
              src={qrUrl}
              alt="QR code"
              style={{
                maxWidth: "100%",
                height: "auto",
                display: "block",
              }}
            />
          ) : (
            <p
              style={{
                margin: 0,
                fontSize: 18,
                color: "#666",
              }}
            >
              Geen QR beschikbaar
            </p>
          )}
        </section>

        <section
          style={{
            background: "#fff",
            borderRadius: 36,
            padding: 36,
            boxShadow: "0 1px 6px rgba(0,0,0,0.08)",
          }}
        >
          <h2
            style={{
              fontSize: 48,
              lineHeight: 1.08,
              fontWeight: 800,
              color: "#111",
              marginTop: 0,
              marginBottom: 26,
              letterSpacing: "-0.03em",
            }}
          >
            Eerste keer op dit toestel?
          </h2>

          <p
            style={{
              fontSize: 20,
              lineHeight: 1.55,
              color: "#666",
              marginTop: 0,
              marginBottom: 30,
            }}
          >
            Voer je PairCode één keer in om dit toestel te koppelen.
          </p>

          <form onSubmit={handlePair}>
            <input
              type="text"
              value={pairCode}
              onChange={(e) => setPairCode(e.target.value)}
              placeholder="PairCode"
              autoComplete="off"
              style={{
                width: "100%",
                boxSizing: "border-box",
                fontSize: 20,
                padding: "20px 22px",
                borderRadius: 18,
                border: "1px solid #d0d0d0",
                outline: "none",
                marginBottom: 26,
                color: "#111",
                background: "#fff",
              }}
            />

            <button
              type="submit"
              disabled={submitting}
              style={{
                width: "100%",
                border: "none",
                borderRadius: 999,
                padding: "24px 28px",
                fontSize: 24,
                fontWeight: 800,
                letterSpacing: "0.02em",
                background: submitting ? "#d9d9d9" : "#e0e0e0",
                color: "#666",
                cursor: submitting ? "default" : "pointer",
              }}
            >
              {submitting ? "BEZIG..." : "KOPPEL TOESTEL EN SCAN"}
            </button>
          </form>

          {error && (
            <p
              style={{
                marginTop: 20,
                marginBottom: 0,
                fontSize: 16,
                color: "#c62828",
              }}
            >
              {error}
            </p>
          )}
        </section>
      </div>
    </main>
  );
}