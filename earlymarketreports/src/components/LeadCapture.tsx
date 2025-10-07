"use client";

import { useState } from "react";

type Props = { className?: string };

export default function LeadCapture({ className }: Props) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, plan: "lite", source: "homepage-hero" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Error");
      setMessage("¡Listo! Te hemos registrado en la versión Lite.");
      setName("");
      setEmail("");
    } catch (err: any) {
      setMessage(err.message || "No se pudo completar el registro");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className={`grid sm:grid-cols-[1fr_1fr_auto] gap-3 ${className || ""}`}>
      <input
        className="border rounded px-3 py-3 w-full"
        placeholder="Tu nombre"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
      />
      <input
        type="email"
        className="border rounded px-3 py-3 w-full"
        placeholder="tu@email.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <button className="btn-accent min-w-40" type="submit" disabled={loading}>
        {loading ? "Enviando..." : "Suscríbete gratis"}
      </button>
      {message && <p className="sm:col-span-3 text-sm text-gray-700">{message}</p>}
    </form>
  );
}


