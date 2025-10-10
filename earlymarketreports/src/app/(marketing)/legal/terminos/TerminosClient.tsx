"use client";

import { useI18n } from "@/i18n/I18nProvider";

export default function TerminosClient() {
  const { t } = useI18n();

  return (
    <div className="container-page py-10">
      <h1 className="text-2xl sm:text-3xl font-bold text-[--color-primary] mb-8">
        {t("terms_title")}
      </h1>
      
      <div className="prose max-w-none">
        <p className="text-gray-600 mb-6">
          Última actualización: {new Date().toLocaleDateString('es-ES')}
        </p>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-[--color-primary] mb-4">1. Información General</h2>
          <p className="text-gray-700 mb-4">
            EarlyMarketReports es un servicio de análisis e información financiera que proporciona informes diarios 
            sobre mercados bursátiles. Al utilizar nuestros servicios, aceptas estos términos y condiciones.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-[--color-primary] mb-4">2. Descripción del Servicio</h2>
          <p className="text-gray-700 mb-4">
            Nuestro servicio incluye:
          </p>
          <ul className="list-disc pl-6 text-gray-700 mb-4">
            <li>Informes diarios de análisis bursátil</li>
            <li>Resúmenes de mercado y oportunidades de inversión</li>
            <li>Análisis técnico y fundamental</li>
            <li>Watchlist de valores seleccionados</li>
            <li>Soporte al cliente</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-[--color-primary] mb-4">3. Aviso de Riesgos</h2>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
            <p className="text-yellow-800 font-semibold mb-2">⚠️ IMPORTANTE - AVISO DE RIESGOS</p>
            <p className="text-yellow-700">
              La inversión en mercados financieros conlleva riesgos significativos. Los precios de los valores 
              pueden subir o bajar, y los inversores pueden perder parte o la totalidad de su inversión. 
              Nuestros informes son únicamente informativos y no constituyen asesoramiento financiero personalizado.
            </p>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-[--color-primary] mb-4">4. Limitación de Responsabilidad</h2>
          <p className="text-gray-700 mb-4">
            EarlyMarketReports no se hace responsable de:
          </p>
          <ul className="list-disc pl-6 text-gray-700 mb-4">
            <li>Pérdidas financieras derivadas del uso de nuestra información</li>
            <li>Decisiones de inversión basadas en nuestros informes</li>
            <li>Interrupciones del servicio por causas técnicas</li>
            <li>Errores u omisiones en la información proporcionada</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-[--color-primary] mb-4">5. Suscripciones y Pagos</h2>
          <p className="text-gray-700 mb-4">
            Las suscripciones se renuevan automáticamente. Puedes cancelar en cualquier momento desde tu 
            área de usuario. Los pagos se procesan de forma segura a través de Stripe.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-[--color-primary] mb-4">6. Propiedad Intelectual</h2>
          <p className="text-gray-700 mb-4">
            Todo el contenido de EarlyMarketReports está protegido por derechos de autor. 
            No está permitida la reproducción, distribución o uso comercial sin autorización expresa.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-[--color-primary] mb-4">7. Modificaciones</h2>
          <p className="text-gray-700 mb-4">
            Nos reservamos el derecho de modificar estos términos en cualquier momento. 
            Las modificaciones entrarán en vigor inmediatamente tras su publicación en el sitio web.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-[--color-primary] mb-4">8. Contacto</h2>
          <p className="text-gray-700 mb-4">
            Para cualquier consulta sobre estos términos, puedes contactarnos en:
          </p>
          <p className="text-gray-700">
            Email: legal@earlymarketreports.com<br />
            Dirección: [Dirección de la empresa]
          </p>
        </section>
      </div>
    </div>
  );
}
