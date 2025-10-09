"use client";

import { useI18n } from "@/i18n/I18nProvider";
import { locales, localeFlags } from "@/i18n/config";
import { useRouter, usePathname } from "next/navigation";
import { createLocalizedPath, getPathnameWithoutLocale } from "@/i18n/routing";

export default function LanguageSwitcher() {
  const { locale, setLocale } = useI18n();
  const router = useRouter();
  const pathname = usePathname();

  const handleLocaleChange = (newLocale: string) => {
    setLocale(newLocale as any);
    
    // Navegar a la versión localizada de la página actual
    const pathWithoutLocale = getPathnameWithoutLocale(pathname);
    const newPath = createLocalizedPath(pathWithoutLocale, newLocale as any);
    router.push(newPath);
  };

  return (
    <div className="flex items-center gap-2 text-sm">
      {locales.map((code) => (
        <button
          key={code}
          className={`px-2 py-1 rounded text-xs ${
            locale === code 
              ? "bg-[--color-primary] text-white" 
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
          onClick={() => handleLocaleChange(code)}
          aria-pressed={locale === code}
        >
          {localeFlags[code]} {code.toUpperCase()}
        </button>
      ))}
    </div>
  );
}


