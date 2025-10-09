"use client";

import Image from "next/image";
import Link from "next/link";
import LanguageSwitcher from "./LanguageSwitcher";
import { useI18n } from "@/i18n/I18nProvider";

export default function Header() {
  const { t } = useI18n();
  return (
    <header className="w-full site-header">
      <div className="container-page flex items-center justify-between py-2 sm:py-3">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-3">
            <Image src="/logo.png" alt="EarlyMarketReports" width={48} height={48} className="rounded" />
            <span className="text-xl sm:text-2xl font-bold tracking-tight">{t("brand_name")}</span>
          </Link>
        </div>
        <nav className="hidden sm:flex items-center gap-6 text-sm">
          <Link href="/#que-ofrecemos" className="hover:underline">{t("nav_offering")}</Link>
          <Link href="/precios" className="hover:underline">{t("nav_pricing")}</Link>
          <Link href="/#ejemplo" className="hover:underline">{t("nav_example")}</Link>
          <Link href="/login" className="hover:underline">{t("nav_login")}</Link>
          <LanguageSwitcher />
        </nav>
        <Link href="/subscribe" className="btn-accent text-sm">{t("cta_subscribe_now")}</Link>
      </div>
    </header>
  );
}


