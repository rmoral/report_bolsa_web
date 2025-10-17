"use client";

import { useState } from "react";
import { trackEvent, trackConversion } from "./GoogleAnalytics";
import { useI18n } from "@/i18n/I18nProvider";

type Props = { className?: string };

export default function LeadCapture({ className }: Props) {
  const { t } = useI18n();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    
    // Track form submission
    trackEvent('form_submit', 'lead_capture', 'homepage_hero');
    
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, plan: "lite", source: "homepage-hero" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Error");
      
      // Track successful subscription
      trackEvent('subscribe_success', 'conversion', 'lite_plan');
      trackConversion('subscribe_lite', 0, 'EUR');
      
      setMessage("All set! You’re subscribed to the Lite version.");
      setName("");
      setEmail("");
    } catch (err: any) {
      // Track error
      trackEvent('subscribe_error', 'conversion', 'lite_plan');
      setMessage(err.message || "Couldn’t complete the signup");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className={`grid sm:grid-cols-[1fr_1fr_auto] gap-3 ${className || ""}`}>
      <input
        className="border rounded px-3 py-3 w-full"
        placeholder={t("your_name")}
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
      />
      <input
        type="email"
        className="border rounded px-3 py-3 w-full"
        placeholder={t("your_email")}
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <button className="btn-accent min-w-40" type="submit" disabled={loading}>
        {loading ? t("sending") : t("subscribe_free")}
      </button>
      {message && <p className="sm:col-span-3 text-sm text-gray-700">{message}</p>}
    </form>
  );
}


