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
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ status: "", plan: "" });

  // Formatea fechas robustamente (string, number, Firestore Timestamp)
  const toIso = (value: any): string => {
    try {
      if (!value) return "";
      if (typeof value === "string" || typeof value === "number") {
        const d = new Date(value);
        return isNaN(d.getTime()) ? "" : d.toISOString();
      }
      if (typeof value.toDate === "function") {
        const d = value.toDate();
        return d instanceof Date && !isNaN(d.getTime()) ? d.toISOString() : "";
      }
      if (typeof value.seconds === "number") {
        const d = new Date(value.seconds * 1000);
        return isNaN(d.getTime()) ? "" : d.toISOString();
      }
      return "";
    } catch {
      return "";
    }
  };

  const fetchSubscriptions = async () => {
    const token = getToken();
    if (!token) {
      setError("No autorizado. Inicia sesión como admin.");
      setLoading(false);
      return;
    }
    try {
      const res = await fetch("/api/admin/subscriptions", { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "No autorizado");
      setRows(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const handleEdit = (subscription: Sub) => {
    setEditingId(subscription.id);
    setEditForm({ status: subscription.status, plan: subscription.plan });
  };

  const handleSave = async (id: string) => {
    const token = getToken();
    if (!token) return;

    try {
      const res = await fetch(`/api/admin/subscriptions/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(editForm),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Error al actualizar");
      }

      setEditingId(null);
      await fetchSubscriptions(); // Recargar datos
    } catch (e: any) {
      alert(`Error: ${e.message}`);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Estás seguro de que quieres eliminar esta suscripción?")) return;

    const token = getToken();
    if (!token) return;

    try {
      const res = await fetch(`/api/admin/subscriptions/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Error al eliminar");
      }

      await fetchSubscriptions(); // Recargar datos
    } catch (e: any) {
      alert(`Error: ${e.message}`);
    }
  };

  const csv = useMemo(() => {
    const header = ["name", "email", "plan", "status", "createdAt"].join(",");
    const lines = (Array.isArray(rows) ? rows : []).map((r) => [r.name, r.email, r.plan, r.status, toIso(r.createdAt)].join(","));
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
      ) : error ? (
        <p className="text-red-600">{error}</p>
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
                <th className="p-3">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t">
                  <td className="p-3">{r.name}</td>
                  <td className="p-3">{r.email}</td>
                  <td className="p-3">
                    {editingId === r.id ? (
                      <select
                        value={editForm.plan}
                        onChange={(e) => setEditForm({ ...editForm, plan: e.target.value })}
                        className="border rounded px-2 py-1 text-xs"
                      >
                        <option value="lite">Lite</option>
                        <option value="pro">Pro</option>
                      </select>
                    ) : (
                      <span className="capitalize">{r.plan}</span>
                    )}
                  </td>
                  <td className="p-3">
                    {editingId === r.id ? (
                      <select
                        value={editForm.status}
                        onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                        className="border rounded px-2 py-1 text-xs"
                      >
                        <option value="pending">Pendiente</option>
                        <option value="active">Activo</option>
                        <option value="canceled">Cancelado</option>
                      </select>
                    ) : (
                      <span className={`px-2 py-1 rounded text-xs capitalize ${
                        r.status === "active" ? "bg-green-100 text-green-800" :
                        r.status === "pending" ? "bg-yellow-100 text-yellow-800" :
                        "bg-red-100 text-red-800"
                      }`}>
                        {r.status}
                      </span>
                    )}
                  </td>
                  <td className="p-3">
                    {toIso(r.createdAt) ? new Date(toIso(r.createdAt)).toLocaleDateString() : "N/A"}
                  </td>
                  <td className="p-3">
                    {editingId === r.id ? (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleSave(r.id)}
                          className="btn-accent text-xs px-2 py-1"
                        >
                          Guardar
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="btn-outline-primary text-xs px-2 py-1"
                        >
                          Cancelar
                        </button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(r)}
                          className="btn-outline-primary text-xs px-2 py-1"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleDelete(r.id)}
                          className="btn-outline-primary text-xs px-2 py-1 text-red-600 hover:bg-red-50"
                        >
                          Eliminar
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}