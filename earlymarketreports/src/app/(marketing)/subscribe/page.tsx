"use client";

import { useState } from "react";
import Link from "next/link";
import { useI18n } from "@/i18n/I18nProvider";

export default function SubscribePage() {
  const [plan, setPlan] = useState<"lite" | "pro">("lite");
  const { t } = useI18n();

  return (
    <div className="container-page py-10">
      <h1 className="text-2xl sm:text-3xl font-bold text-[--color-primary]">{t("subscribe_title")}</h1>
      <form className="mt-6 grid gap-4 max-w-xl bg-white p-6 rounded-lg shadow">
        <div className="grid gap-2">
          <label className="text-sm">{t("field_name")}</label>
          <input className="border rounded px-3 py-2" placeholder="Tu nombre" />
        </div>
        <div className="grid gap-2">
          <label className="text-sm">{t("field_email")}</label>
          <input type="email" className="border rounded px-3 py-2" placeholder="tucorreo@dominio.com" />
        </div>
        <div className="grid gap-2">
          <label className="text-sm">{t("field_password")}</label>
          <input type="password" className="border rounded px-3 py-2" placeholder="••••••••" />
        </div>
        <div className="grid gap-3">
          <span className="text-sm font-semibold">{t("choose_plan")}</span>
          <div className="grid sm:grid-cols-2 gap-3">
            <button type="button" onClick={() => setPlan("lite")} className={`p-4 border rounded ${plan === "lite" ? "border-[--color-accent]" : ""}`}>{t("plan_lite")}</button>
            <button type="button" onClick={() => setPlan("pro")} className={`p-4 border rounded ${plan === "pro" ? "border-[--color-accent]" : ""}`}>{t("plan_pro")}</button>
          </div>
        </div>
        <button className="btn-accent" type="submit">{plan === "pro" ? t("continue_with_payment") : t("continue")}</button>
        <p className="text-xs text-gray-600">{t("accept_terms")} <Link href="/legal/terminos" className="underline">{t("terms")}</Link> {" "}{t("privacy")}.</p>
      </form>
    </div>
  );
}


