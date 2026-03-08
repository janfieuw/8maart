"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function NewEmployeePage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [pairCode, setPairCode] = useState("");
  const [loading, setLoading] = useState(false);

  async function createEmployee(e) {
    e.preventDefault();
    setLoading(true);

    const res = await fetch("/api/employees", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name, pairCode }),
    });

    const data = await res.json();

    if (data.ok) {
      router.push(`/app/employees/${data.employee.id}`);
    } else {
      alert(data.error || "Fout bij aanmaken werknemer");
    }

    setLoading(false);
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>Nieuwe werknemer</h1>

      <form onSubmit={createEmployee} style={{ maxWidth: 400 }}>
        <div style={{ marginBottom: 20 }}>
          <label>Naam</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            style={{ width: "100%" }}
          />
        </div>

        <div style={{ marginBottom: 20 }}>
          <label>PairCode</label>
          <input
            value={pairCode}
            onChange={(e) => setPairCode(e.target.value)}
            required
            style={{ width: "100%" }}
          />
        </div>

        <button disabled={loading}>
          {loading ? "Opslaan..." : "Werknemer aanmaken"}
        </button>
      </form>
    </div>
  );
}