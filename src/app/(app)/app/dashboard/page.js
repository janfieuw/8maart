"use client";

import { useEffect, useState } from "react";

function readJson(res) {
  return res.json().catch(() => ({}));
}

function StatCard({ title, value }) {
  return (
    <div
      style={{
        border: "1px solid #e5e7eb",
        borderRadius: 12,
        padding: 16,
        background: "#fff",
      }}
    >
      <div style={{ fontSize: 14, color: "#6b7280", marginBottom: 8 }}>{title}</div>
      <div style={{ fontSize: 28, fontWeight: 700 }}>{value}</div>
    </div>
  );
}

export default function DashboardPage() {
  const [stats, setStats] = useState({
    employees: 0,
    scanTags: 0,
    registrations: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const [employeesRes, registrationsRes] = await Promise.all([
          fetch("/api/employees", { cache: "no-store" }),
          fetch("/api/registrations", { cache: "no-store" }),
        ]);

        const [employeesData, registrationsData] = await Promise.all([
          readJson(employeesRes),
          readJson(registrationsRes),
        ]);

        const employees = Array.isArray(employeesData.rows) ? employeesData.rows : [];
        const registrations = Array.isArray(registrationsData.rows)
          ? registrationsData.rows
          : [];

        const uniqueTagIds = new Set(
          registrations.map((row) => row?.scanTag?.id).filter(Boolean)
        );

        if (!active) return;

        setStats({
          employees: employees.length,
          scanTags: uniqueTagIds.size,
          registrations: registrations.length,
        });
      } catch (error) {
        console.error("Dashboard load error:", error);
      } finally {
        if (active) setLoading(false);
      }
    }

    load();

    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return <div style={{ padding: 24 }}>Dashboard laden...</div>;
  }

  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 20 }}>Dashboard</h1>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 16,
        }}
      >
        <StatCard title="Werknemers" value={stats.employees} />
        <StatCard title="Scantags" value={stats.scanTags} />
        <StatCard title="Registraties" value={stats.registrations} />
      </div>
    </div>
  );
}