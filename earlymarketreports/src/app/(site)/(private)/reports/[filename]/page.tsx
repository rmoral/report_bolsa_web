"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getToken } from "@/lib/clientAuth";
import Link from "next/link";

interface ReportPageProps {
  params: { filename: string };
}

export default function ReportPage({ params }: ReportPageProps) {
  const router = useRouter();
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.push("/login?redirect=/reports/" + params.filename);
      return;
    }

    fetch(`/api/reports/${encodeURIComponent(params.filename)}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (res) => {
        if (res.status === 401) { router.push("/login?redirect=/reports/" + params.filename); return; }
        if (res.status === 403) { setError("forbidden"); return; }
        if (!res.ok) throw new Error();
        const data = await res.json();
        setSignedUrl(data.url);
      })
      .catch(() => setError("load_error"))
      .finally(() => setLoading(false));
  }, [params.filename, router]);

  if (loading) {
    return (
      <div className="container-page py-10 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[--color-primary] mx-auto" />
        <p className="mt-4 text-gray-600">Verificando acceso…</p>
      </div>
    );
  }

  if (error === "forbidden") {
    return (
      <div className="container-page py-10">
        <div className="max-w-2xl mx-auto text-center bg-yellow-50 border border-yellow-200 rounded-lg p-8">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
            🔒
          </div>
          <h1 className="text-2xl font-bold text-[--color-primary] mb-3">Acceso restringido</h1>
          <p className="text-gray-700 mb-6">
            Este informe completo está disponible únicamente para suscriptores del plan Pro.
          </p>
          <div className="space-y-3">
            <Link href="/subscribe" className="btn-accent inline-block">
              Suscribirse al Plan Pro
            </Link>
            <div>
              <Link href="/dashboard" className="text-[--color-primary] hover:underline text-sm">
                ← Volver al dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !signedUrl) {
    return (
      <div className="container-page py-10 text-center text-gray-600">
        <p>No se pudo cargar el informe. <Link href="/dashboard" className="underline">Volver al dashboard</Link></p>
      </div>
    );
  }

  return (
    <div className="container-page py-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-[--color-primary]">
          {params.filename.replace(".pdf", "").replace(/_/g, " ")}
        </h1>
        <div className="flex items-center gap-3">
          <a
            href={signedUrl}
            download={params.filename}
            className="btn-primary text-sm"
          >
            Descargar PDF
          </a>
          <Link href="/dashboard" className="text-sm text-gray-600 hover:underline">
            ← Dashboard
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <iframe
          src={signedUrl}
          className="w-full h-screen min-h-[800px]"
          title={params.filename}
        />
      </div>
    </div>
  );
}
