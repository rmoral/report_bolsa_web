"use client";

import { useI18n } from "@/i18n/I18nProvider";

export default function AvisoRiesgosPage() {
  const { t } = useI18n();

  return (
    <div className="container-page py-10">
      <h1 className="text-2xl sm:text-3xl font-bold text-[--color-primary] mb-8">
        Aviso de Riesgos Financieros
      </h1>
      
      <div className="prose max-w-4xl mx-auto">
        <div className="bg-red-50 border-l-4 border-red-400 p-6 mb-8">
          <h2 className="text-xl font-semibold text-red-800 mb-4">⚠️ ADVERTENCIA IMPORTANTE</h2>
          <p className="text-red-800 font-semibold">
            Los informes y análisis proporcionados por EarlyMarketReports NO CONSTITUYEN ASESORAMIENTO FINANCIERO, 
            DE INVERSIÓN, LEGAL O FISCAL. Toda la información es únicamente para fines informativos y educativos.
          </p>
        </div>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-[--color-primary] mb-4">Riesgos de Inversión</h2>
          <p className="mb-4">
            La inversión en mercados financieros conlleva riesgos significativos que pueden resultar en la pérdida 
            de su capital invertido. Es importante que comprenda estos riesgos antes de tomar cualquier decisión de inversión.
          </p>
          
          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li><strong>Riesgo de pérdida de capital:</strong> Puede perder todo o parte del dinero que invierte</li>
            <li><strong>Volatilidad del mercado:</strong> Los precios de los valores pueden fluctuar significativamente</li>
            <li><strong>Riesgo de liquidez:</strong> Puede no ser posible vender sus inversiones cuando lo desee</li>
            <li><strong>Riesgo de divisa:</strong> Las fluctuaciones cambiarias pueden afectar el valor de sus inversiones</li>
            <li><strong>Riesgo de concentración:</strong> Invertir en pocos valores aumenta el riesgo específico</li>
            <li><strong>Riesgo de inflación:</strong> La inflación puede erosionar el poder adquisitivo de sus inversiones</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-[--color-primary] mb-4">Limitaciones de la Información</h2>
          <p className="mb-4">
            La información proporcionada por EarlyMarketReports tiene las siguientes limitaciones:
          </p>
          
          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li>No constituye asesoramiento personalizado para su situación específica</li>
            <li>No considera sus objetivos de inversión, situación financiera o necesidades particulares</li>
            <li>Puede contener errores, omisiones o información desactualizada</li>
            <li>Los rendimientos pasados no garantizan resultados futuros</li>
            <li>No incluye todos los riesgos y consideraciones relevantes</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-[--color-primary] mb-4">Recomendaciones Importantes</h2>
          <div className="bg-blue-50 border-l-4 border-blue-400 p-6 mb-4">
            <h3 className="text-lg font-semibold text-blue-800 mb-3">Antes de invertir:</h3>
            <ul className="list-disc pl-6 space-y-2 text-blue-800">
              <li>Consulte con un asesor financiero independiente y cualificado</li>
              <li>Evalúe cuidadosamente su situación financiera y objetivos</li>
              <li>Diversifique su cartera para reducir el riesgo</li>
              <li>Invierta solo el dinero que puede permitirse perder</li>
              <li>Comprenda completamente los productos en los que invierte</li>
            </ul>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-[--color-primary] mb-4">Exención de Responsabilidad</h2>
          <p className="mb-4">
            EarlyMarketReports, sus empleados, directores y afiliados no serán responsables de:
          </p>
          
          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li>Pérdidas financieras resultantes del uso de nuestra información</li>
            <li>Decisiones de inversión tomadas basándose en nuestros informes</li>
            <li>Errores, omisiones o inexactitudes en la información proporcionada</li>
            <li>Interrupciones del servicio o problemas técnicos</li>
            <li>Daños indirectos, incidentales o consecuenciales</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-[--color-primary] mb-4">Regulación y Supervisión</h2>
          <p className="mb-4">
            EarlyMarketReports no está regulado como asesor de inversiones. Nuestros servicios son únicamente 
            informativos y educativos. Si necesita asesoramiento financiero personalizado, debe consultar con 
            un profesional regulado en su jurisdicción.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-[--color-primary] mb-4">Contacto</h2>
          <p className="mb-4">
            Si tiene preguntas sobre este aviso de riesgos, puede contactarnos en:
          </p>
          <p className="mb-4">
            Email: legal@earlymarketreports.com<br />
            Dirección: EarlyMarketReports, Madrid, España
          </p>
        </section>

        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-6 mt-8">
          <p className="text-yellow-800 font-semibold">
            Al utilizar nuestros servicios, usted reconoce que ha leído, entendido y acepta este aviso de riesgos. 
            Si no está de acuerdo con alguna parte de este aviso, no debe utilizar nuestros servicios.
          </p>
        </div>

        <div className="text-sm text-gray-600 mt-8 pt-4 border-t">
          <p>Última actualización: {new Date().toLocaleDateString('es-ES')}</p>
        </div>
      </div>
    </div>
  );
}
