"use client";

import { useState } from "react";
import Link from "next/link";
import { useI18n } from "@/i18n/I18nProvider";

export default function PreciosPage() {
  const { t } = useI18n();
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");

  const plans = {
    lite: {
      name: "Lite",
      description: "Perfecto para empezar",
      monthlyPrice: "Gratis",
      yearlyPrice: "Gratis",
      features: [
        "Resumen de apertura de mercados",
        "3-5 oportunidades destacadas",
        "Niveles clave de soporte/resistencia",
        "Eventos macro del día",
        "Envío antes de las 9:00 ET",
        "Soporte por email"
      ],
      cta: "Empezar gratis",
      ctaLink: "/subscribe?plan=lite",
      popular: false,
      bestFor: "Inversores particulares que buscan información básica"
    },
    pro: {
      name: "Pro",
      description: "Para traders e inversores serios",
      monthlyPrice: "€29",
      yearlyPrice: "€290",
      yearlySavings: "2 meses gratis",
      features: [
        "Todo lo de Lite, más:",
        "Análisis técnico detallado",
        "Watchlist con 15+ valores",
        "Análisis de flujos institucionales",
        "Estrategias de trading",
        "Acceso a comunidad Pro",
        "Informes históricos completos",
        "Soporte prioritario",
        "Garantía de satisfacción 7 días"
      ],
      cta: "Probar Pro gratis",
      ctaLink: "/subscribe?plan=pro",
      popular: true,
      bestFor: "Traders activos, gestores de fondos, inversores profesionales"
    }
  };

  return (
    <div className="container-page py-10">
      <div className="text-center mb-12">
        <h1 className="text-3xl sm:text-4xl font-bold text-[--color-primary] mb-4">
          {t("pricing_title")}
        </h1>
        <p className="text-lg text-gray-600 mb-8">
          {t("pricing_subtitle")}
        </p>
        
        {/* Billing Toggle */}
        <div className="flex items-center justify-center gap-4 mb-8">
          <span className={`text-sm ${billingCycle === "monthly" ? "text-[--color-primary] font-semibold" : "text-gray-500"}`}>
            Mensual
          </span>
          <button
            onClick={() => setBillingCycle(billingCycle === "monthly" ? "yearly" : "monthly")}
            className="relative inline-flex h-6 w-11 items-center rounded-full bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-[--color-accent] focus:ring-offset-2"
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                billingCycle === "yearly" ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
          <span className={`text-sm ${billingCycle === "yearly" ? "text-[--color-primary] font-semibold" : "text-gray-500"}`}>
            Anual
          </span>
          {billingCycle === "yearly" && (
            <span className="bg-[--color-accent] text-white text-xs px-2 py-1 rounded-full">
              Ahorra 17%
            </span>
          )}
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-12">
        {Object.entries(plans).map(([key, plan]) => (
          <div
            key={key}
            className={`relative bg-white rounded-lg border-2 p-8 ${
              plan.popular 
                ? "border-[--color-accent] shadow-lg" 
                : "border-gray-200 shadow-sm"
            }`}
          >
            {plan.popular && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span className="bg-[--color-accent] text-white text-sm px-4 py-1 rounded-full">
                  Más popular
                </span>
              </div>
            )}
            
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold text-[--color-primary] mb-2">
                {plan.name}
              </h3>
              <p className="text-gray-600 mb-4">{plan.description}</p>
              <div className="mb-4">
                <span className="text-4xl font-bold text-[--color-primary]">
                  {billingCycle === "monthly" ? plan.monthlyPrice : plan.yearlyPrice}
                </span>
                {billingCycle === "yearly" && plan.yearlySavings && (
                  <div className="text-sm text-[--color-accent] font-semibold">
                    {plan.yearlySavings}
                  </div>
                )}
                {billingCycle === "monthly" && plan.monthlyPrice !== "Gratis" && (
                  <span className="text-gray-500">/mes</span>
                )}
                {billingCycle === "yearly" && plan.yearlyPrice !== "Gratis" && (
                  <span className="text-gray-500">/año</span>
                )}
              </div>
            </div>

            <ul className="space-y-3 mb-8">
              {plan.features.map((feature, index) => (
                <li key={index} className="flex items-start">
                  <svg className="w-5 h-5 text-[--color-accent] mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-gray-700">{feature}</span>
                </li>
              ))}
            </ul>

            <div className="text-center mb-4">
              <p className="text-sm text-gray-600 mb-2">
                <strong>Mejor para:</strong> {plan.bestFor}
              </p>
            </div>

            <Link
              href={plan.ctaLink}
              className={`block w-full text-center py-3 px-6 rounded-md font-semibold transition-colors ${
                plan.popular
                  ? "bg-[--color-accent] text-white hover:bg-opacity-90"
                  : "bg-[--color-primary] text-white hover:bg-opacity-90"
              }`}
            >
              {plan.cta}
            </Link>
          </div>
        ))}
      </div>

      {/* FAQ Section */}
      <div className="max-w-3xl mx-auto">
        <h2 className="text-2xl font-bold text-[--color-primary] text-center mb-8">
          Preguntas frecuentes sobre precios
        </h2>
        
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg border">
            <h3 className="font-semibold text-[--color-primary] mb-2">
              ¿Puedo cambiar de plan en cualquier momento?
            </h3>
            <p className="text-gray-700">
              Sí, puedes cambiar de plan en cualquier momento desde tu panel de usuario. 
              Los cambios se aplicarán en el próximo ciclo de facturación.
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg border">
            <h3 className="font-semibold text-[--color-primary] mb-2">
              ¿Hay garantía de devolución?
            </h3>
            <p className="text-gray-700">
              Ofrecemos una garantía de satisfacción de 7 días para nuevos suscriptores del plan Pro. 
              Si no estás conforme, te devolvemos el importe íntegro.
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg border">
            <h3 className="font-semibold text-[--color-primary] mb-2">
              ¿Los precios incluyen IVA?
            </h3>
            <p className="text-gray-700">
              Sí, todos los precios mostrados incluyen el IVA correspondiente. 
              Recibirás una factura detallada con el desglose de impuestos.
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg border">
            <h3 className="font-semibold text-[--color-primary] mb-2">
              ¿Puedo cancelar mi suscripción?
            </h3>
            <p className="text-gray-700">
              Sí, puedes cancelar tu suscripción en cualquier momento desde tu panel de usuario. 
              No hay penalizaciones por cancelación.
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg border">
            <h3 className="font-semibold text-[--color-primary] mb-2">
              ¿Hay descuentos para estudiantes o empresas?
            </h3>
            <p className="text-gray-700">
              Ofrecemos descuentos especiales para estudiantes y planes corporativos. 
              Contacta con nosotros en <a href="mailto:enterprise@earlymarketreports.com" className="text-[--color-accent] hover:underline">enterprise@earlymarketreports.com</a> para más información.
            </p>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="text-center mt-12 bg-[--emr-gray] p-8 rounded-lg">
        <h2 className="text-2xl font-bold text-[--color-primary] mb-4">
          ¿Tienes dudas sobre qué plan elegir?
        </h2>
        <p className="text-gray-600 mb-6">
          Nuestro equipo está aquí para ayudarte a encontrar el plan perfecto para tus necesidades.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/contacto"
            className="btn-outline-primary"
          >
            Contactar soporte
          </Link>
          <Link
            href="/subscribe?plan=lite"
            className="btn-accent"
          >
            Empezar gratis ahora
          </Link>
        </div>
      </div>
    </div>
  );
}
