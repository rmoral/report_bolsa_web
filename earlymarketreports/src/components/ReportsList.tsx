"use client";

import { useEffect, useState } from "react";
import { getToken } from "@/lib/clientAuth";

interface Report {
  filename: string;
  date: string | null;
  type: "full" | "sample" | "other";
  size: number;
  lastModified: string;
}

interface ReportsListProps {
  plan: "lite" | "pro";
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "Sin fecha";
  const [y, m, d] = dateStr.split("-");
  return new Date(Number(y), Number(m) - 1, Number(d)).toLocaleDateString("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatSize(bytes: number): string {
  if (bytes === 0) return "";
  const mb = bytes / (1024 * 1024);
  return mb >= 1 ? `${mb.toFixed(1)} MB` : `${(bytes / 1024).toFixed(0)} KB`;
}

export default function ReportsList({ plan }: ReportsListProps) {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openingFile, setOpeningFile] = useState<string | null>(null);

  useEffect(() => {
    const token = getToken();
    fetch("/api/reports", { headers: { Authorization: `Bearer ${token}` } })
      .then(async (r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then((data) => setReports(data.reports))
      .catch(() => setError("No se pudieron cargar los informes"))
      .finally(() => setLoading(false));
  }, []);

  const openReport = async (filename: string) => {
    setOpeningFile(filename);
    try {
      const token = getToken();
      const res = await fetch(`/api/reports/${encodeURIComponent(filename)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error();
      const { url } = await res.json();
      window.open(url, "_blank", "noopener,noreferrer");
    } catch {
      setError("No se pudo abrir el informe. Inténtalo de nuevo.");
    } finally {
      setOpeningFile(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[--color-accent]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">
        {error}
      </div>
    );
  }

  if (reports.length === 0) {
    return (
      <div className="bg-white rounded-lg border p-10 text-center text-gray-500">
        <p className="text-4xl mb-3">📄</p>
        <p className="font-medium">Aún no hay informes disponibles</p>
        <p className="text-sm mt-1">Los nuevos informes aparecerán aquí en cuanto estén publicados.</p>
      </div>
    );
  }

  // Separar full y sample
  const fullReports = reports.filter((r) => r.type === "full");
  const sampleReports = reports.filter((r) => r.type === "sample");

  const ReportCard = ({ report }: { report: Report }) => {
    const isFull = report.type === "full";
    const isLocked = isFull && plan !== "pro";
    const isOpening = openingFile === report.filename;

    return (
      <div
        className={`flex items-center justify-between p-4 rounded-lg border transition-colors ${
          isLocked
            ? "bg-gray-50 border-gray-200 opacity-70"
            : "bg-white border-gray-200 hover:border-[--color-accent]/40"
        }`}
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">{isFull ? "📊" : "📄"}</span>
          <div>
            <p className="font-medium text-[--color-primary]">
              {isFull ? "Informe completo" : "Muestra gratuita"}{" "}
              {report.date && (
                <span className="text-gray-500 font-normal">— {formatDate(report.date)}</span>
              )}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">
              {report.filename}
              {report.size > 0 && ` · ${formatSize(report.size)}`}
            </p>
          </div>
        </div>

        {isLocked ? (
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 hidden sm:inline">Solo Pro</span>
            <a href="/subscribe" className="btn-accent text-xs px-3 py-1.5">
              Actualizar
            </a>
          </div>
        ) : (
          <button
            onClick={() => openReport(report.filename)}
            disabled={isOpening}
            className="btn-primary text-xs px-3 py-1.5 disabled:opacity-50"
          >
            {isOpening ? "Abriendo…" : "Ver informe"}
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-8">
      {plan === "pro" && fullReports.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Informes completos
          </h2>
          <div className="space-y-3">
            {fullReports.map((r) => (
              <ReportCard key={r.filename} report={r} />
            ))}
          </div>
        </section>
      )}

      {sampleReports.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Muestras gratuitas
          </h2>
          <div className="space-y-3">
            {sampleReports.map((r) => (
              <ReportCard key={r.filename} report={r} />
            ))}
          </div>
        </section>
      )}

      {plan !== "pro" && fullReports.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Informes completos <span className="text-[--color-accent]">(Pro)</span>
          </h2>
          <div className="space-y-3">
            {fullReports.map((r) => (
              <ReportCard key={r.filename} report={r} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
