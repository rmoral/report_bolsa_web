"use client";

import { useState } from "react";
import { saveToken } from "@/lib/clientAuth";
import { useRouter } from "next/navigation";
import { useI18n } from "@/i18n/I18nProvider";

export default function LoginPage() {
  const router = useRouter();
  const { t } = useI18n();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Error de acceso");
      saveToken(data.token);
      router.replace("/dashboard");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container-page py-10 max-w-md">
      <h1 className="text-2xl sm:text-3xl font-bold text-[--color-primary]">{t("login_title")}</h1>
      <form onSubmit={onSubmit} className="mt-6 grid gap-4 bg-white p-6 rounded-lg shadow">
        <input type="email" className="border rounded px-3 py-2" placeholder="email@example.com" value={email} onChange={(e)=>setEmail(e.target.value)} required />
        <input type="password" className="border rounded px-3 py-2" placeholder={t("field_password") || "Password"} value={password} onChange={(e)=>setPassword(e.target.value)} required />
        <button className="btn-accent" disabled={loading} type="submit">{loading ? "…" : t("login_submit")}</button>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </form>
    </div>
  );
}


