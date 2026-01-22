"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useI18n } from "@/i18n/I18nProvider";
import Link from "next/link";

interface ReportPageProps {
  params: {
    filename: string;
  };
}

export default function ReportPage({ params }: ReportPageProps) {
  const { t } = useI18n();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verificar autenticación
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login?redirect=/reports/" + params.filename);
      return;
    }

    // Obtener datos del usuario
    fetch("/api/me", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          router.push("/login?redirect=/reports/" + params.filename);
          return;
        }
        setUser(data);
        setLoading(false);
      })
      .catch(() => {
        router.push("/login?redirect=/reports/" + params.filename);
      });
  }, [params.filename, router]);

  if (loading) {
    return (
      <div className="container-page py-10">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[--color-primary] mx-auto"></div>
          <p className="mt-4 text-gray-600">Verificando acceso...</p>
        </div>
      </div>
    );
  }

  // Verificar si el usuario tiene plan Pro
  if (!user || user.plan !== "pro") {
    return (
      <div className="container-page py-10">
        <div className="max-w-2xl mx-auto text-center">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-8">
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🔒</span>
            </div>
            <h1 className="text-2xl font-bold text-[--color-primary] mb-4">
              Acceso Restringido
            </h1>
            <p className="text-gray-700 mb-6">
              Este informe completo está disponible únicamente para suscriptores del plan Pro. 
              La muestra gratuita está disponible en la página principal.
            </p>
            <div className="space-y-3">
              <Link 
                href="/subscribe?plan=pro" 
                className="btn-accent inline-block"
              >
                Suscribirse al Plan Pro
              </Link>
              <div>
                <Link 
                  href="/" 
                  className="text-[--color-primary] hover:underline"
                >
                  ← Volver al inicio
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Usuario Pro - mostrar el PDF
  return (
    <div className="container-page py-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-[--color-primary]">
          Informe Completo - {params.filename.replace('.pdf', '')}
        </h1>
        <Link 
          href="/dashboard" 
          className="text-sm text-gray-600 hover:underline"
        >
          ← Volver al Dashboard
        </Link>
      </div>
      
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <iframe
          src={`/reports/${params.filename}`}
          className="w-full h-screen min-h-[800px]"
          title={`Informe ${params.filename}`}
        />
      </div>
    </div>
  );
}
