"use client";

import { useEffect, useState } from "react";
import { getToken } from "@/lib/clientAuth";

type User = {
  id: string;
  name: string;
  email: string;
  plan: "lite" | "pro";
  role: "user" | "admin";
  isActive: boolean;
  createdAt: string;
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ role: "", plan: "", isActive: true });

  const fetchUsers = async () => {
    const token = getToken();
    if (!token) {
      setError("No autorizado. Inicia sesión como admin.");
      setLoading(false);
      return;
    }
    try {
      const res = await fetch("/api/admin/users", { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "No autorizado");
      setUsers(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleEdit = (user: User) => {
    setEditingId(user.id);
    setEditForm({ role: user.role, plan: user.plan, isActive: user.isActive });
  };

  const handleSave = async (id: string) => {
    const token = getToken();
    if (!token) return;

    try {
      const res = await fetch(`/api/admin/promote-user`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ userId: id, role: editForm.role }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Error al actualizar");
      }

      setEditingId(null);
      await fetchUsers(); // Recargar datos
    } catch (e: any) {
      alert(`Error: ${e.message}`);
    }
  };

  return (
    <div className="grid gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[--color-primary]">Usuarios</h1>
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
                <th className="p-3">Rol</th>
                <th className="p-3">Estado</th>
                <th className="p-3">Alta</th>
                <th className="p-3">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-t">
                  <td className="p-3">{u.name}</td>
                  <td className="p-3">{u.email}</td>
                  <td className="p-3">
                    {editingId === u.id ? (
                      <select
                        value={editForm.plan}
                        onChange={(e) => setEditForm({ ...editForm, plan: e.target.value })}
                        className="border rounded px-2 py-1 text-xs"
                      >
                        <option value="lite">Lite</option>
                        <option value="pro">Pro</option>
                      </select>
                    ) : (
                      <span className="capitalize">{u.plan}</span>
                    )}
                  </td>
                  <td className="p-3">
                    {editingId === u.id ? (
                      <select
                        value={editForm.role}
                        onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                        className="border rounded px-2 py-1 text-xs"
                      >
                        <option value="user">Usuario</option>
                        <option value="admin">Admin</option>
                      </select>
                    ) : (
                      <span className={`px-2 py-1 rounded text-xs capitalize ${
                        u.role === "admin" ? "bg-purple-100 text-purple-800" : "bg-blue-100 text-blue-800"
                      }`}>
                        {u.role}
                      </span>
                    )}
                  </td>
                  <td className="p-3">
                    <span className={`px-2 py-1 rounded text-xs ${
                      u.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                    }`}>
                      {u.isActive ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td className="p-3">
                    {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "N/A"}
                  </td>
                  <td className="p-3">
                    {editingId === u.id ? (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleSave(u.id)}
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
                      <button
                        onClick={() => handleEdit(u)}
                        className="btn-outline-primary text-xs px-2 py-1"
                      >
                        Editar
                      </button>
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
