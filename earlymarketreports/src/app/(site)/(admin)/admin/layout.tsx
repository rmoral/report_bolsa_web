"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const navItems = [
    { href: "/admin/subscriptions", label: "Suscripciones" },
    { href: "/admin/users", label: "Usuarios" },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow">
        <div className="container-page">
          <div className="flex items-center justify-between py-4">
            <h1 className="text-xl font-bold text-[--color-primary]">Panel de Administración</h1>
            <Link href="/" className="btn-outline-primary text-sm">
              Volver al sitio
            </Link>
          </div>
          <nav className="flex space-x-8 border-t">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`py-4 text-sm font-medium border-b-2 transition-colors ${
                  pathname === item.href
                    ? "border-[--color-accent] text-[--color-accent]"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
      <div className="container-page py-8">
        {children}
      </div>
    </div>
  );
}