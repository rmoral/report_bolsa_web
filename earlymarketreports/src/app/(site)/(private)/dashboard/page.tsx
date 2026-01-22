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
          <div className="mt-4 space-y-3">
            {me.plan === "pro" ? (
              <div className="p-4 bg-gradient-to-r from-[--emr-blue-10] to-[--emr-green-10] rounded-lg border border-[--color-accent]">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-[--color-primary]">Informe del 3 de Octubre 2025</h3>
                    <p className="text-sm text-gray-600">Análisis completo del mercado</p>
                  </div>
                  <a 
                    href="/reports/US_FULL_20251003.pdf" 
                    target="_blank"
                    className="btn-accent text-sm"
                  >
                    Ver Completo
                  </a>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-gray-100 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Informe del 3 de Octubre 2025</h3>
                    <p className="text-sm text-gray-600">Solo muestra disponible</p>
                  </div>
                  <div className="flex gap-2">
                    <a 
                      href="/reports/US_SAMPLE_20251003.pdf" 
                      target="_blank"
                      className="btn-outline-primary text-sm"
                    >
                      Ver Muestra
                    </a>
                    <a 
                      href="/subscribe?plan=pro" 
                      className="btn-accent text-sm"
                    >
                      Actualizar a Pro
                    </a>
                  </div>
                </div>
              </div>
            )}
            
            <div className="p-4 bg-gray-50 rounded-lg opacity-60">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Más informes próximamente</h3>
                  <p className="text-sm text-gray-600">Nuevos informes diarios</p>
                </div>
                <span className="text-gray-400">🔒</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


