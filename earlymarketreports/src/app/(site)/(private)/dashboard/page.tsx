"use client";

import { useEffect, useState } from "react";
import { getToken, clearToken } from "@/lib/clientAuth";
import { useRouter } from "next/navigation";
import SubscriptionManager from "@/components/SubscriptionManager";
import ReportsList from "@/components/ReportsList";
import ProfileForm from "@/components/ProfileForm";
import UpgradeButton from "@/components/UpgradeButton";

type Me = {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  plan: "lite" | "pro";
  role: "user" | "admin";
  stripeCustomerId: string | null;
};

type Tab = "reports" | "subscription" | "profile";

export default function DashboardPage() {
  const router = useRouter();
  const [me, setMe] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("reports");

  const fetchMe = () => {
    const token = getToken();
    if (!token) { router.replace("/login"); return; }
    fetch("/api/me", { headers: { Authorization: `Bearer ${token}` } })
      .then(async (r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then((user) => setMe(user))
      .catch(() => { clearToken(); router.replace("/login"); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchMe(); }, []);

  if (loading) {
    return (
      <div className="container-page py-10 flex justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[--color-primary]" />
      </div>
    );
  }
  if (!me) return null;

  const tabs: { id: Tab; label: string }[] = [
    { id: "reports", label: "Mis informes" },
    { id: "subscription", label: "Mi suscripción" },
    { id: "profile", label: "Mi perfil" },
  ];

  return (
    <div className="container-page py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[--color-primary]">Bienvenido, {me.name}</h1>
          <span className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full font-medium ${
            me.plan === "pro"
              ? "bg-[--color-accent] text-white"
              : "bg-gray-200 text-gray-700"
          }`}>
            {me.plan === "pro" ? "Plan Pro" : "Plan Lite"}
          </span>
        </div>
        <button
          className="btn-primary text-sm"
          onClick={() => { clearToken(); router.replace("/"); }}
        >
          Cerrar sesión
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex gap-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? "border-[--color-accent] text-[--color-accent]"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab content */}
      {activeTab === "reports" && <ReportsList plan={me.plan} />}

      {activeTab === "subscription" && (
        me.stripeCustomerId ? (
          <SubscriptionManager customerId={me.stripeCustomerId} />
        ) : (
          <div className="bg-white rounded-lg border p-8 text-center space-y-4">
            <p className="text-gray-600">
              {me.plan === "pro"
                ? "Cargando información de suscripción…"
                : "Estás en el plan Lite gratuito."}
            </p>
            {me.plan !== "pro" && (
              <div className="flex justify-center gap-3">
                <UpgradeButton plan="pro_monthly" label="Pro Mensual — €198/mes" className="btn-accent" />
                <UpgradeButton plan="pro_annual" label="Pro Anual — €1.980/año" className="btn-primary" />
              </div>
            )}
          </div>
        )
      )}

      {activeTab === "profile" && (
        <ProfileForm me={me} onSaved={fetchMe} />
      )}
    </div>
  );
}
