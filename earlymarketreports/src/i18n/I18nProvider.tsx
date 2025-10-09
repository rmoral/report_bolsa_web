"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { Locale, t } from "./dictionaries";

type Ctx = { locale: Locale; setLocale: (l: Locale) => void; t: (k: string) => string };

const I18nCtx = createContext<Ctx | null>(null);
const STORAGE_KEY = "emr_locale";

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("es");

  useEffect(() => {
    const saved = (typeof window !== "undefined" && (localStorage.getItem(STORAGE_KEY) as Locale)) || "es";
    setLocaleState(saved);
  }, []);

  function setLocale(l: Locale) {
    setLocaleState(l);
    if (typeof window !== "undefined") localStorage.setItem(STORAGE_KEY, l);
  }

  const value = useMemo<Ctx>(() => ({
    locale,
    setLocale,
    t: (k: string) => t(locale, k),
  }), [locale]);

  return <I18nCtx.Provider value={value}>{children}</I18nCtx.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nCtx);
  if (!ctx) throw new Error("I18nProvider missing");
  return ctx;
}


