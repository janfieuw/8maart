"use client";

import { useEffect, useState } from "react";

function getDeviceToken() {
  if (typeof window === "undefined") return "";

  let token = localStorage.getItem("deviceToken");

  if (!token) {
    token = crypto.randomUUID();
    localStorage.setItem("deviceToken", token);
  }

  return token;
}

export default function ScanPage({ params }) {
  const { secret } = params;

  const [pairCode, setPairCode] = useState("");
  const [deviceToken, setDeviceToken] = useState("");
  const [needsPair, setNeedsPair] = useState(false);
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);

  // 🔥 AUTO SCAN BIJ OPENEN
  useEffect(() => {
    const token = getDeviceToken();
    setDeviceToken(token);

    autoScan(token);
  }, []);

  async function autoScan(token) {
    try {
      const res = await fetch(`/api/scan/${secret}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deviceToken: token,
        }),
      });

      const data = await res.json();

      if (data.ok) {
        // ✅ toestel al gekoppeld → scan OK
        setSuccess(true);
      } else {
        // 👉 alleen hier pair tonen
        setNeedsPair(true);
      }
    } catch (e) {
      setNeedsPair(true);
    } finally {
      setLoading(false);
    }
  }

  async function handlePair() {
    try {
      const res = await fetch(`/api/device/pair`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          pairCode,
          deviceToken,
          secret,
        }),
      });

      const data = await res.json();

      if (data.ok) {
        // 🔥 NA KOPPELEN → DIRECT SCAN DOEN
        await autoScan(deviceToken);
        setNeedsPair(false);
      } else {
        alert(data.error || "Koppelen mislukt");
      }
    } catch (e) {
      alert("Server fout");
    }
  }

  // ⏳ loading
  if (loading) {
    return (
      <div className="p-6 text-center">
        Even laden...
      </div>
    );
  }

  // ✅ SUCCESS SCREEN (scan gelukt)
  if (success) {
    return (
      <div className="p-6 text-center">
        <h2 className="text-xl font-bold">
          Scan geregistreerd
        </h2>
      </div>
    );
  }

  // 🔐 PAIR SCREEN
  if (needsPair) {
    return (
      <div className="p-6">
        <h2 className="text-xl font-bold mb-4">
          Eerste keer op dit toestel?
        </h2>

        <input
          className="border p-2 w-full mb-4"
          placeholder="PairCode"
          value={pairCode}
          onChange={(e) => setPairCode(e.target.value)}
        />

        <button
          onClick={handlePair}
          className="bg-green-600 text-white px-4 py-2 rounded w-full"
        >
          KOPPEL TOESTEL
        </button>
      </div>
    );
  }

  return null;
}