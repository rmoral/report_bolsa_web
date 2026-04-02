"use client";

import { useState } from "react";
import { getToken } from "@/lib/clientAuth";
import { trackEvent } from "@/components/GoogleAnalytics";

interface UpgradeButtonProps {
  plan?: "pro_monthly" | "pro_annual";
  label?: string;
  className?: string;
}

export default function UpgradeButton({
  plan = "pro_monthly",
  label = "Actualizar a Pro",
  className = "btn-accent",
}: UpgradeButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUpgrade = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = getToken();
      trackEvent("begin_checkout", "subscription", plan);

      const res = await fetch("/api/stripe/create-checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ plan }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al iniciar el pago");

      trackEvent("checkout_session_created", "subscription", plan);
      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
      setLoading(false);
    }
  };

  return (
    <div>
      <button onClick={handleUpgrade} disabled={loading} className={`${className} disabled:opacity-50`}>
        {loading ? "Redirigiendo…" : label}
      </button>
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  );
}
