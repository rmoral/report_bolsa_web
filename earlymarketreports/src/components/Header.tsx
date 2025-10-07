"use client";

import Image from "next/image";
import Link from "next/link";

export default function Header() {
  return (
    <header className="w-full site-header">
      <div className="container-page flex items-center justify-between py-2 sm:py-3">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-3">
            <Image src="/logo.png" alt="EarlyMarketReports" width={48} height={48} className="rounded" />
            <span className="text-xl sm:text-2xl font-bold tracking-tight">EarlyMarketReports</span>
          </Link>
        </div>
        <nav className="hidden sm:flex gap-6 text-sm">
          <Link href="/#que-ofrecemos" className="hover:underline">Qué ofrecemos</Link>
          <Link href="/#ejemplo" className="hover:underline">Ejemplo</Link>
          <Link href="/login" className="hover:underline">Acceder</Link>
        </nav>
        <Link href="/subscribe" className="btn-accent text-sm">Suscríbete ya</Link>
      </div>
    </header>
  );
}


