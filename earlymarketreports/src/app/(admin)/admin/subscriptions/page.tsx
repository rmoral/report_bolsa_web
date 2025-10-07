"use client";

import { useEffect, useMemo, useState } from "react";
import { getToken } from "@/lib/clientAuth";

type Sub = {
  id: string;
  name: string;
  email: string;
  plan: "lite" | "pro";
  status: "pending" | "active" | "canceled";
  createdAt: string;
};

export default function AdminSubscriptionsPage() {
  const [rows, setRows] = useState<Sub[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getToken();
    fetch("/api/admin/subscriptions", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => setRows(d))
      .finally(() => setLoading(false));
  }, []);

  const csv = useMemo(() => {
    const header = ["name", "email", "plan", "status", "createdAt"].join(",");
    const lines = rows.map((r) => [r.name, r.email, r.plan, r.status, new Date(r.createdAt).toISOString()].join(","));
    return [header, ...lines].join("\n");
  }, [rows]);

  function downloadCSV() {
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `subscriptions_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="grid gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[--color-primary]">Suscripciones</h1>
        <button className="btn-outline-primary" onClick={downloadCSV}>Exportar CSV</button>
      </div>
      {loading ? (
        <p>Cargando…</p>
      ) : (
        <div className="overflow-x-auto bg-white rounded border">
          <table className="min-w-full text-sm">
            <thead className="bg-[--emr-gray] text-left">
              <tr>
                <th className="p-3">Nombre</th>
                <th className="p-3">Email</th>
                <th className="p-3">Plan</th>
                <th className="p-3">Estado</th>
                <th className="p-3">Alta</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t">
                  <td className="p-3">{r.name}</td>
                  <td className="p-3">{r.email}</td>
                  <td className="p-3 capitalize">{r.plan}</td>
                  <td className="p-3 capitalize">{r.status}</td>
                  <td className="p-3">{new Date(r.createdAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}


