"use client";

import { useI18n } from "@/i18n/I18nProvider";

export default function LanguageSwitcher() {
  const { locale, setLocale } = useI18n();
  return (
    <div className="flex items-center gap-2 text-sm">
      <button
        className={`px-2 py-1 rounded ${locale === "es" ? "btn-outline-primary" : ""}`}
        onClick={() => setLocale("es")}
        aria-pressed={locale === "es"}
      >ES</button>
      <button
        className={`px-2 py-1 rounded ${locale === "en" ? "btn-outline-primary" : ""}`}
        onClick={() => setLocale("en")}
        aria-pressed={locale === "en"}
      >EN</button>
    </div>
  );
}


