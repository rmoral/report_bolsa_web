"use client";

import { useI18n } from "@/i18n/I18nProvider";

export default function TerminosPage() {
  const { t } = useI18n();

  return (
    <div className="container-page py-10">
      <h1 className="text-2xl sm:text-3xl font-bold text-[--color-primary] mb-8">
        {t("terms_title")}
      </h1>
      
      <div className="prose max-w-4xl mx-auto">
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
          <p className="text-sm text-yellow-800">
            <strong>AVISO IMPORTANTE:</strong> Los informes y análisis proporcionados por EarlyMarketReports 
            no constituyen asesoramiento financiero, de inversión, legal o fiscal. Toda la información 
            es únicamente para fines informativos y educativos.
          </p>
        </div>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-[--color-primary] mb-4">1. Información General</h2>
          <p className="mb-4">
            Estos Términos y Condiciones ("Términos") rigen el uso del sitio web EarlyMarketReports.com 
            ("Sitio Web") y los servicios ofrecidos por EarlyMarketReports ("Empresa", "nosotros", "nuestro").
          </p>
          <p className="mb-4">
            Al acceder y utilizar nuestro Sitio Web y servicios, usted acepta estar sujeto a estos Términos. 
            Si no está de acuerdo con alguna parte de estos términos, no debe utilizar nuestros servicios.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-[--color-primary] mb-4">2. Descripción del Servicio</h2>
          <p className="mb-4">
            EarlyMarketReports proporciona informes bursátiles diarios, análisis de mercado y contenido 
            educativo relacionado con los mercados financieros. Ofrecemos dos niveles de servicio:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li><strong>Plan Lite (Gratuito):</strong> Resúmenes de apertura de mercados, 3-5 oportunidades destacadas, niveles clave de soporte/resistencia y eventos macro del día.</li>
            <li><strong>Plan Pro (De Pago):</strong> Informe completo con análisis técnico detallado, watchlist con 15+ valores, análisis de flujos institucionales, estrategias de trading y acceso a comunidad Pro.</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-[--color-primary] mb-4">3. Aviso de Riesgos Financieros</h2>
          <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
            <p className="text-sm text-red-800">
              <strong>ADVERTENCIA DE RIESGO:</strong> La inversión en mercados financieros conlleva riesgos significativos 
              y puede resultar en la pérdida de su capital invertido. Los precios de los valores pueden subir o bajar, 
              y los inversores pueden perder todo su dinero.
            </p>
          </div>
          <ul className="list-disc pl-6 mb-4">
            <li>Los mercados financieros son volátiles y impredecibles</li>
            <li>Las pérdidas pueden exceder los depósitos iniciales</li>
            <li>El rendimiento pasado no garantiza resultados futuros</li>
            <li>Debe considerar cuidadosamente si la inversión es adecuada para su situación financiera</li>
            <li>Consulte con un asesor financiero independiente antes de tomar decisiones de inversión</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-[--color-primary] mb-4">4. Limitación de Responsabilidad</h2>
          <p className="mb-4">
            <strong>NO ES ASESORAMIENTO FINANCIERO:</strong> La información proporcionada no constituye asesoramiento 
            financiero, de inversión, legal o fiscal. Es únicamente para fines informativos y educativos.
          </p>
          <p className="mb-4">
            EarlyMarketReports no será responsable de:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li>Pérdidas financieras resultantes del uso de nuestra información</li>
            <li>Decisiones de inversión tomadas basándose en nuestros informes</li>
            <li>Errores, omisiones o inexactitudes en la información proporcionada</li>
            <li>Interrupciones del servicio o problemas técnicos</li>
            <li>Daños indirectos, incidentales o consecuenciales</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-[--color-primary] mb-4">5. Suscripciones y Pagos</h2>
          <p className="mb-4">
            <strong>Plan Lite:</strong> Gratuito, sin compromiso de permanencia.
          </p>
          <p className="mb-4">
            <strong>Plan Pro:</strong> Servicio de suscripción de pago con las siguientes condiciones:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li>Facturación mensual o anual según el plan seleccionado</li>
            <li>Precios incluyen IVA cuando corresponda</li>
            <li>Puede cancelar su suscripción en cualquier momento</li>
            <li>No se realizan reembolsos por períodos parciales</li>
            <li>Garantía de satisfacción de 7 días para nuevos suscriptores</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-[--color-primary] mb-4">6. Uso Aceptable</h2>
          <p className="mb-4">Usted se compromete a:</p>
          <ul className="list-disc pl-6 mb-4">
            <li>Utilizar la información únicamente para fines personales y educativos</li>
            <li>No redistribuir, revender o compartir el contenido con terceros</li>
            <li>No utilizar nuestros servicios para actividades ilegales</li>
            <li>Proporcionar información precisa y actualizada</li>
            <li>Respetar los derechos de propiedad intelectual</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-[--color-primary] mb-4">7. Propiedad Intelectual</h2>
          <p className="mb-4">
            Todo el contenido, incluyendo informes, análisis, gráficos, textos y materiales, 
            es propiedad de EarlyMarketReports y está protegido por derechos de autor y otras 
            leyes de propiedad intelectual.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-[--color-primary] mb-4">8. Modificaciones</h2>
          <p className="mb-4">
            Nos reservamos el derecho de modificar estos Términos en cualquier momento. 
            Las modificaciones entrarán en vigor inmediatamente después de su publicación en el Sitio Web. 
            Su uso continuado del servicio constituye aceptación de los términos modificados.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-[--color-primary] mb-4">9. Terminación</h2>
          <p className="mb-4">
            Podemos suspender o terminar su acceso a nuestros servicios en cualquier momento, 
            con o sin causa, con o sin previo aviso. Usted puede cancelar su suscripción 
            en cualquier momento a través de su panel de usuario.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-[--color-primary] mb-4">10. Ley Aplicable</h2>
          <p className="mb-4">
            Estos Términos se rigen por las leyes de España. Cualquier disputa será resuelta 
            en los tribunales competentes de Madrid, España.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-[--color-primary] mb-4">11. Contacto</h2>
          <p className="mb-4">
            Para preguntas sobre estos Términos, puede contactarnos en:
          </p>
          <p className="mb-4">
            Email: legal@earlymarketreports.com<br />
            Dirección: EarlyMarketReports, Madrid, España
          </p>
        </section>

        <div className="text-sm text-gray-600 mt-8 pt-4 border-t">
          <p>Última actualización: {new Date().toLocaleDateString('es-ES')}</p>
        </div>
      </div>
    </div>
  );
}
