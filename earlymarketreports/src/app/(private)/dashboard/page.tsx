"use client";

import { useEffect, useState } from "react";
import { getToken, clearToken } from "@/lib/clientAuth";
import { useRouter } from "next/navigation";

type Me = { id: string; email: string; name: string; plan: "lite" | "pro"; role: "user" | "admin" };

export default function DashboardPage() {
  const router = useRouter();
  const [me, setMe] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.replace("/login");
      return;
    }
    fetch("/api/me", { headers: { Authorization: `Bearer ${token}` } })
      .then(async (r) => {
        if (!r.ok) throw new Error("noauth");
        return r.json();
      })
      .then((user) => setMe(user))
      .catch(() => {
        clearToken();
        router.replace("/login");
      })
      .finally(() => setLoading(false));
  }, [router]);

  if (loading) return <div className="container-page py-10">Cargando…</div>;
  if (!me) return null;

  return (
    <div className="container-page py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl sm:text-3xl font-bold text-[--color-primary]">Bienvenido, {me.name}</h1>
        <button className="btn-primary" onClick={() => { clearToken(); router.replace("/"); }}>Cerrar sesión</button>
      </div>
      <div className="mt-6 grid gap-6 sm:grid-cols-3">
        <div className="bg-white p-6 rounded border">
          <h2 className="font-semibold">Tu plan</h2>
          <p className="mt-2">{me.plan === "pro" ? "Pro (acceso completo)" : "Lite (gratuito)"}</p>
        </div>
        <div className="bg-white p-6 rounded border sm:col-span-2">
          <h2 className="font-semibold">Últimos informes</h2>
          <ul className="list-disc pl-5 mt-2 text-sm">
            <li><a className="underline" href="/reports/US_FULL_20251003.pdf" target="_blank">US_FULL_20251003.pdf</a> {me.plan === "lite" && <span className="ml-2 text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded">Solo vista</span>}</li>
          </ul>
        </div>
      </div>
    </div>
  );
}


