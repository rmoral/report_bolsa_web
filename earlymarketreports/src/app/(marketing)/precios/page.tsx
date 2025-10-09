"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useI18n } from "@/i18n/I18nProvider";
import { CheckCircleIcon, XMarkIcon } from "@heroicons/react/24/solid";

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

  const comparisonFeatures = [
    {
      category: "Informes Básicos",
      features: [
        { name: "Resumen diario por email", lite: true, pro: true },
        { name: "3-5 oportunidades destacadas", lite: true, pro: true },
        { name: "Niveles clave soporte/resistencia", lite: true, pro: true },
        { name: "Eventos macro del día", lite: true, pro: true },
        { name: "Envío antes de las 9:00 ET", lite: true, pro: true }
      ]
    },
    {
      category: "Análisis Avanzado",
      features: [
        { name: "PDF completo del informe", lite: false, pro: true },
        { name: "Análisis técnico detallado", lite: false, pro: true },
        { name: "Gráficos y niveles técnicos", lite: false, pro: true },
        { name: "Análisis de flujos institucionales", lite: false, pro: true },
        { name: "Estrategias de trading", lite: false, pro: true }
      ]
    },
    {
      category: "Herramientas Pro",
      features: [
        { name: "Watchlist con 15+ valores", lite: false, pro: true },
        { name: "Acceso a comunidad Pro", lite: false, pro: true },
        { name: "Informes históricos completos", lite: false, pro: true },
        { name: "Alertas personalizadas", lite: false, pro: true },
        { name: "Análisis de earnings", lite: false, pro: true }
      ]
    },
    {
      category: "Soporte",
      features: [
        { name: "Soporte por email", lite: true, pro: true },
        { name: "Soporte prioritario", lite: false, pro: true },
        { name: "Chat en vivo", lite: false, pro: true },
        { name: "Garantía de satisfacción 7 días", lite: false, pro: true }
      ]
    }
  ];

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
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[--color-accent] text-white text-xs font-semibold px-3 py-1 rounded-full">
                Más Popular
              </div>
            )}
            
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-[--color-primary] mb-2">{plan.name}</h2>
              <p className="text-gray-600 mb-4">{plan.description}</p>
              
              <div className="mb-4">
                <span className="text-4xl font-bold text-[--color-primary]">
                  {billingCycle === "yearly" ? plan.yearlyPrice : plan.monthlyPrice}
                </span>
                {plan.monthlyPrice !== "Gratis" && (
                  <span className="text-gray-600">
                    /{billingCycle === "yearly" ? "año" : "mes"}
                  </span>
                )}
                {billingCycle === "yearly" && plan.yearlySavings && (
                  <div className="text-sm text-green-600 font-medium mt-1">
                    {plan.yearlySavings}
                  </div>
                )}
              </div>
              
              <div className={`p-3 rounded-lg border ${
                plan.popular 
                  ? "bg-blue-50 border-blue-200" 
                  : "bg-green-50 border-green-200"
              }`}>
                <p className={`text-sm font-medium ${
                  plan.popular ? "text-blue-800" : "text-green-800"
                }`}>
                  {plan.popular ? "🚀 Mejor para traders serios" : "✅ Mejor para principiantes"}
                </p>
                <p className={`text-xs ${
                  plan.popular ? "text-blue-600" : "text-green-600"
                }`}>
                  {plan.bestFor}
                </p>
              </div>
            </div>

            <ul className="space-y-3 mb-8">
              {plan.features.map((feature, index) => (
                <li key={index} className="flex items-start text-gray-700">
                  <CheckCircleIcon className="h-5 w-5 text-[--color-accent] mr-2 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">{feature}</span>
                </li>
              ))}
            </ul>

            <Link 
              href={plan.ctaLink} 
              className={`w-full text-center py-3 px-4 rounded-lg font-medium transition-colors ${
                plan.popular 
                  ? "bg-[--color-accent] text-white hover:bg-[--color-accent]/90" 
                  : "bg-[--color-primary] text-white hover:bg-[--color-primary]/90"
              }`}
            >
              {plan.cta}
            </Link>
          </div>
        ))}
      </div>

      {/* Tabla Comparativa Detallada */}
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="bg-[--color-primary] text-white p-6">
            <h3 className="text-xl font-bold text-center">Comparación Detallada de Características</h3>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Características</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">Lite (Gratis)</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-[--color-primary]">Pro (€29/mes)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {comparisonFeatures.map((category, categoryIndex) => (
                  <React.Fragment key={categoryIndex}>
                    <tr className="bg-gray-100">
                      <td colSpan={3} className="px-6 py-3 text-sm font-semibold text-[--color-primary]">
                        {category.category}
                      </td>
                    </tr>
                    {category.features.map((feature, featureIndex) => (
                      <tr key={featureIndex} className={featureIndex % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                        <td className="px-6 py-4 text-sm text-gray-900">{feature.name}</td>
                        <td className="px-6 py-4 text-center">
                          {feature.lite ? (
                            <CheckCircleIcon className="h-5 w-5 text-green-500 mx-auto" />
                          ) : (
                            <XMarkIcon className="h-5 w-5 text-gray-400 mx-auto" />
                          )}
                        </td>
                        <td className="px-6 py-4 text-center">
                          {feature.pro ? (
                            <CheckCircleIcon className="h-5 w-5 text-[--color-accent] mx-auto" />
                          ) : (
                            <XMarkIcon className="h-5 w-5 text-gray-400 mx-auto" />
                          )}
                        </td>
                      </tr>
                    ))}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Pricing FAQs */}
      <section className="py-12">
        <h2 className="text-2xl sm:text-3xl font-bold text-[--color-primary] text-center mb-8">
          Preguntas frecuentes sobre precios
        </h2>
        <div className="mt-8 max-w-2xl mx-auto space-y-4">
          <details className="group bg-[--emr-gray] p-4 rounded-lg shadow-sm">
            <summary className="flex justify-between items-center font-semibold cursor-pointer text-[--color-primary]">
              ¿Cómo funciona la prueba gratuita de 7 días?
              <span className="group-open:rotate-180 transition-transform">▼</span>
            </summary>
            <p className="mt-2 text-gray-700">
              Puedes probar el plan Pro durante 7 días sin compromiso. Si no cancelas antes de que termine la prueba, 
              se te cobrará automáticamente la primera cuota.
            </p>
          </details>
          <details className="group bg-[--emr-gray] p-4 rounded-lg shadow-sm">
            <summary className="flex justify-between items-center font-semibold cursor-pointer text-[--color-primary]">
              ¿Puedo cambiar de plan en cualquier momento?
              <span className="group-open:rotate-180 transition-transform">▼</span>
            </summary>
            <p className="mt-2 text-gray-700">
              Sí, puedes cambiar de Lite a Pro o viceversa en cualquier momento desde tu área de usuario. 
              Los cambios se aplicarán en el siguiente ciclo de facturación.
            </p>
          </details>
          <details className="group bg-[--emr-gray] p-4 rounded-lg shadow-sm">
            <summary className="flex justify-between items-center font-semibold cursor-pointer text-[--color-primary]">
              ¿Qué métodos de pago aceptáis?
              <span className="group-open:rotate-180 transition-transform">▼</span>
            </summary>
            <p className="mt-2 text-gray-700">
              Aceptamos tarjetas de crédito/débito (Visa, Mastercard, American Express) y PayPal.
            </p>
          </details>
          <details className="group bg-[--emr-gray] p-4 rounded-lg shadow-sm">
            <summary className="flex justify-between items-center font-semibold cursor-pointer text-[--color-primary]">
              ¿Se renueva automáticamente mi suscripción?
              <span className="group-open:rotate-180 transition-transform">▼</span>
            </summary>
            <p className="mt-2 text-gray-700">
              Sí, todas las suscripciones se renuevan automáticamente al final de cada período (mensual o anual) 
              a menos que las canceles.
            </p>
          </details>
          <details className="group bg-[--emr-gray] p-4 rounded-lg shadow-sm">
            <summary className="flex justify-between items-center font-semibold cursor-pointer text-[--color-primary]">
              ¿Hay garantía de devolución?
              <span className="group-open:rotate-180 transition-transform">▼</span>
            </summary>
            <p className="mt-2 text-gray-700">
              Ofrecemos una garantía de satisfacción de 7 días para el plan Pro. 
              Si no estás satisfecho, te reembolsaremos el importe íntegro.
            </p>
          </details>
        </div>
      </section>
    </div>
  );
}