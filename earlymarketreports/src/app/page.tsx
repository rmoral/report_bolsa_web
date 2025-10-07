import Image from "next/image";
import Link from "next/link";
import LeadCapture from "@/components/LeadCapture";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      {/* Header global renderizado desde layout */}

      {/* Hero */}
      <section className="bg-white">
        <div className="container-page py-10 sm:py-16 grid grid-cols-1 sm:grid-cols-2 gap-8 items-center">
          <div>
            <h1 className="text-3xl sm:text-5xl font-bold text-[--color-primary] leading-tight font-[var(--font-montserrat)]">
              Informes bursátiles diarios, antes que nadie.
            </h1>
            <p className="mt-4 text-base sm:text-lg text-gray-700">
              Resúmenes accionables al amanecer y el informe completo para profesionales.
            </p>
            <LeadCapture className="mt-6" />
          </div>
          <div className="flex sm:justify-end">
            <Image src="/illustrations/chart-up.svg" alt="Gráfico alcista" width={480} height={270} priority className="rounded-lg shadow" />
          </div>
        </div>
      </section>

      {/* Qué ofrecemos */}
      <section id="que-ofrecemos" className="container-page py-12">
        <h2 className="text-2xl sm:text-3xl font-bold text-[--color-primary]">Qué ofrecemos</h2>
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg p-6 shadow flex gap-4">
            <Image src="/illustrations/report-doc.svg" alt="Informe Lite" width={72} height={72} />
            <div>
              <h3 className="text-xl font-semibold">Lite (gratis)</h3>
              <p className="mt-2 text-gray-700">Extracto diario con puntos clave y oportunidades destacadas, directo a tu email.</p>
            </div>
          </div>
          <div className="bg-white rounded-lg p-6 shadow border border-[--color-accent] flex gap-4">
            <Image src="/illustrations/report-doc.svg" alt="Informe Pro" width={72} height={72} />
            <div>
              <h3 className="text-xl font-semibold">Pro (de pago)</h3>
              <p className="mt-2 text-gray-700">Informe completo con análisis de mercado, macro, earnings, niveles y watchlist.</p>
              <Link href="/subscribe" className="btn-accent mt-4 inline-block">Elegir Pro</Link>
            </div>
          </div>
        </div>
      </section>

      {/* Ejemplo */}
      <section id="ejemplo" className="bg-white">
        <div className="container-page py-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-[--color-primary]">Ejemplo del último informe</h2>
          <p className="mt-2 text-gray-700">Vista previa del reporte del 03/10/2025 (versión US).</p>
          <div className="mt-6 grid gap-6 sm:grid-cols-2">
            <article className="bg-[--emr-gray] p-4 rounded-lg border">
              <h4 className="font-semibold">Resumen</h4>
              <ul className="list-disc pl-5 text-sm text-gray-800 mt-2 space-y-1">
                <li>Futuros en verde impulsados por tecnología y moderación en yields.</li>
                <li>Mercado pendiente de NFP y PMI servicios.</li>
                <li>Watchlist: mega-cap tech, semis y consumo discrecional.</li>
              </ul>
            </article>
            <div className="bg-[--emr-gray] p-4 rounded-lg border">
              <p className="text-sm text-gray-800">Descarga el PDF completo o ábrelo en una nueva pestaña.</p>
              <div className="mt-3 flex gap-3">
                <a className="btn-outline-primary" href="/reports/US_FULL_20251003.pdf" target="_blank">Abrir PDF</a>
                <a className="btn-accent" href="/reports/US_FULL_20251003.pdf" download>Descargar</a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Beneficios para SEO */}
      <section className="bg-white">
        <div className="container-page py-12 grid gap-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-[--color-primary]">Por qué EarlyMarketReports</h2>
          <div className="grid sm:grid-cols-3 gap-6">
            <div className="p-6 rounded-lg border bg-[--emr-gray]">
              <div className="flex items-center gap-2"><Image src="/icons/clock-open.svg" alt="Antes de apertura" width={24} height={24} /><h3 className="font-semibold">Antes de la apertura</h3></div>
              <p className="text-gray-700 mt-2">Recibe cada mañana un resumen accionable del mercado para tomar decisiones informadas.</p>
            </div>
            <div className="p-6 rounded-lg border bg-[--emr-gray]">
              <div className="flex items-center gap-2"><Image src="/icons/analysis.svg" alt="Análisis" width={24} height={24} /><h3 className="font-semibold">Análisis profesional</h3></div>
              <p className="text-gray-700 mt-2">Cobertura macro, flujos, resultados y niveles clave elaborados por analistas.</p>
            </div>
            <div className="p-6 rounded-lg border bg-[--emr-gray]">
              <div className="flex items-center gap-2"><Image src="/icons/upgrade.svg" alt="Upgrade" width={24} height={24} /><h3 className="font-semibold">Lite o Pro</h3></div>
              <p className="text-gray-700 mt-2">Empieza sin coste y evoluciona a Pro cuando necesites el informe completo.</p>
            </div>
          </div>
          <LeadCapture className="mt-2" />
        </div>
      </section>

      {/* FAQs con schema.org */}
      <section className="container-page py-12" id="faq">
        <h2 className="text-2xl sm:text-3xl font-bold text-[--color-primary]">Preguntas frecuentes</h2>
        <div className="mt-6 grid gap-4">
          <details className="bg-white p-4 rounded border">
            <summary className="font-semibold">¿A qué hora enviáis el informe?</summary>
            <p className="mt-2 text-gray-700">El resumen Lite sale antes de la apertura en EEUU y el Pro incluye el PDF completo.</p>
          </details>
          <details className="bg-white p-4 rounded border">
            <summary className="font-semibold">¿Qué incluye la versión Pro?</summary>
            <p className="mt-2 text-gray-700">Análisis macro, sectores, earnings del día, niveles técnicos, flujos y watchlist.</p>
          </details>
          <details className="bg-white p-4 rounded border">
            <summary className="font-semibold">¿Puedo cancelar cuando quiera?</summary>
            <p className="mt-2 text-gray-700">Sí, puedes cancelar o cambiar de plan en cualquier momento.</p>
          </details>
        </div>
        {/* JSON-LD */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "FAQPage",
              mainEntity: [
                { "@type": "Question", name: "¿A qué hora enviáis el informe?", acceptedAnswer: { "@type": "Answer", text: "El resumen Lite sale antes de la apertura en EEUU y el Pro incluye el PDF completo." } },
                { "@type": "Question", name: "¿Qué incluye la versión Pro?", acceptedAnswer: { "@type": "Answer", text: "Análisis macro, sectores, earnings del día, niveles técnicos, flujos y watchlist." } },
                { "@type": "Question", name: "¿Puedo cancelar cuando quiera?", acceptedAnswer: { "@type": "Answer", text: "Sí, puedes cancelar o cambiar de plan en cualquier momento." } }
              ],
            }),
          }}
        />
      </section>
      <section className="container-page py-12" id="testimonios">
        <h2 className="text-2xl sm:text-3xl font-bold text-[--color-primary]">Testimonios</h2>
        <p className="text-gray-600 mt-3">Pronto compartiremos opiniones de gestores y traders profesionales.</p>
      </section>

      {/* Footer */}
      <footer className="mt-auto bg-[--color-primary] text-white">
        <div className="container-page py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm">© {new Date().getFullYear()} EarlyMarketReports</p>
          <div className="flex gap-4 text-sm">
            <Link href="/legal/terminos" className="hover:underline">Términos</Link>
            <Link href="/legal/privacidad" className="hover:underline">Política de privacidad</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
