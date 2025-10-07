"use client";

import { useState } from "react";
import Link from "next/link";

export default function SubscribePage() {
  const [plan, setPlan] = useState<"lite" | "pro">("lite");

  return (
    <div className="container-page py-10">
      <h1 className="text-2xl sm:text-3xl font-bold text-[--color-primary]">Crea tu cuenta</h1>
      <form className="mt-6 grid gap-4 max-w-xl bg-white p-6 rounded-lg shadow">
        <div className="grid gap-2">
          <label className="text-sm">Nombre</label>
          <input className="border rounded px-3 py-2" placeholder="Tu nombre" />
        </div>
        <div className="grid gap-2">
          <label className="text-sm">Email</label>
          <input type="email" className="border rounded px-3 py-2" placeholder="tucorreo@dominio.com" />
        </div>
        <div className="grid gap-2">
          <label className="text-sm">Contraseña</label>
          <input type="password" className="border rounded px-3 py-2" placeholder="••••••••" />
        </div>
        <div className="grid gap-3">
          <span className="text-sm font-semibold">Selecciona tu plan</span>
          <div className="grid sm:grid-cols-2 gap-3">
            <button type="button" onClick={() => setPlan("lite")} className={`p-4 border rounded ${plan === "lite" ? "border-[--color-accent]" : ""}`}>Lite (gratis)</button>
            <button type="button" onClick={() => setPlan("pro")} className={`p-4 border rounded ${plan === "pro" ? "border-[--color-accent]" : ""}`}>Pro (de pago)</button>
          </div>
        </div>
        <button className="btn-accent" type="submit">Continuar{plan === "pro" ? " con pago" : ""}</button>
        <p className="text-xs text-gray-600">Al continuar aceptas nuestros <Link href="/legal/terminos" className="underline">Términos</Link> y <Link href="/legal/privacidad" className="underline">Política de privacidad</Link>.</p>
      </form>
    </div>
  );
}


