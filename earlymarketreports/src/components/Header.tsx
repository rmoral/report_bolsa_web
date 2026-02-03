"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Bars3Icon, XMarkIcon } from "@heroicons/react/24/outline";
import LanguageSwitcher from "./LanguageSwitcher";
import SubscriberCounter from "./SubscriberCounter";
import { useI18n } from "@/i18n/I18nProvider";
import { getLocaleFromPathname } from "@/i18n/routing";
import { defaultLocale } from "@/i18n/config";

const navLinkClass =
  "text-white/95 hover:text-white hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-white/50 rounded";

export default function Header() {
  const { t } = useI18n();
  const pathname = usePathname();
  const locale = pathname ? getLocaleFromPathname(pathname) : defaultLocale;
  const blogHref = locale ? `/${locale}/blog` : `/${defaultLocale}/blog`;
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = (
    <>
      <Link href={blogHref} className={navLinkClass} onClick={() => setMobileMenuOpen(false)}>
        Blog
      </Link>
      <Link href="/#que-ofrecemos" className={navLinkClass} onClick={() => setMobileMenuOpen(false)}>
        {t("nav_offering")}
      </Link>
      <Link href="/precios" className={navLinkClass} onClick={() => setMobileMenuOpen(false)}>
        {t("nav_pricing")}
      </Link>
      <Link href="/#ejemplo" className={navLinkClass} onClick={() => setMobileMenuOpen(false)}>
        {t("nav_example")}
      </Link>
      <Link href="/login" className={navLinkClass} onClick={() => setMobileMenuOpen(false)}>
        {t("nav_login")}
      </Link>
    </>
  );

  return (
    <header className="w-full site-header">
      <div className="container-page flex items-center justify-between gap-4 py-2 sm:py-3 min-h-[56px]">
        {/* Logo + marca */}
        <Link href="/" className="flex items-center gap-2 sm:gap-3 shrink-0">
          <Image
            src="/logo.png"
            alt="EarlyMarketReports"
            width={40}
            height={40}
            className="rounded sm:w-12 sm:h-12"
          />
          <span className="text-lg sm:text-xl md:text-2xl font-bold tracking-tight truncate max-w-[140px] sm:max-w-none">
            {t("brand_name")}
          </span>
        </Link>

        {/* Desktop: nav + idioma + contador + CTA */}
        <div className="hidden md:flex md:items-center md:gap-4 lg:gap-5 md:flex-wrap md:justify-end">
          <nav className="flex items-center gap-4 lg:gap-5 text-sm" aria-label="Main">
            {navLinks}
          </nav>
          <div className="flex items-center gap-4 lg:gap-5 shrink-0">
            <LanguageSwitcher />
            <SubscriberCounter />
            <Link href="/subscribe" className="btn-accent text-sm whitespace-nowrap shrink-0">
              {t("cta_subscribe_now")}
            </Link>
          </div>
        </div>

        {/* Mobile: CTA + hamburger (nav dentro del drawer) */}
        <div className="flex md:hidden items-center gap-2 shrink-0">
          <Link href="/subscribe" className="btn-accent text-xs sm:text-sm px-3 py-2">
            {t("cta_subscribe_now")}
          </Link>
          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            className="p-2 text-white hover:bg-white/10 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
            aria-label={t("nav_menu_open")}
            aria-expanded={mobileMenuOpen}
          >
            <Bars3Icon className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Mobile menu (drawer) */}
      {mobileMenuOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            aria-hidden="true"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div
            className="fixed top-0 right-0 bottom-0 w-full max-w-[280px] bg-[var(--emr-blue-dark)] shadow-xl z-50 md:hidden flex flex-col"
            role="dialog"
            aria-modal="true"
            aria-label={t("nav_menu")}
          >
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <span className="font-semibold text-white">{t("nav_menu") ?? "Menú"}</span>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 text-white hover:bg-white/10 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
                aria-label={t("nav_menu_close")}
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
            <nav className="flex flex-col p-4 text-sm [&_a]:block [&_a]:py-3 [&_a]:-mx-2 [&_a]:px-2 rounded" aria-label="Main">
              {navLinks}
            </nav>
            <div className="p-4 mt-auto border-t border-white/10 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-white/80 text-sm">{t("language")}</span>
                <LanguageSwitcher />
              </div>
              <div className="[&_.text-gray-600]:text-white/80">
                <SubscriberCounter alwaysShow />
              </div>
            </div>
          </div>
        </>
      )}
    </header>
  );
}
