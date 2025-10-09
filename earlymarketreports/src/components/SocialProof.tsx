"use client";

import { useI18n } from "@/i18n/I18nProvider";

export default function SocialProof() {
  const { t } = useI18n();

  const stats = [
    { number: "2,500+", label: "Suscriptores activos" },
    { number: "15+", label: "Años de experiencia" },
    { number: "98%", label: "Satisfacción del cliente" },
    { number: "24/7", label: "Soporte disponible" }
  ];

  const mediaLogos = [
    { name: "Bloomberg", logo: "📺" },
    { name: "CNBC", logo: "📡" },
    { name: "Reuters", logo: "📰" },
    { name: "Financial Times", logo: "📊" },
    { name: "Wall Street Journal", logo: "📈" }
  ];

  const companyLogos = [
    { name: "Goldman Sachs", logo: "🏦" },
    { name: "Morgan Stanley", logo: "🏢" },
    { name: "BlackRock", logo: "⚫" },
    { name: "Vanguard", logo: "🔵" },
    { name: "Fidelity", logo: "💎" }
  ];

  return (
    <section className="bg-white py-12">
      <div className="container-page">
        {/* Estadísticas */}
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-[--color-primary] mb-4">
            Confiado por miles de inversores
          </h2>
          <p className="text-gray-600 mb-8">
            Únete a una comunidad creciente de traders e inversores que confían en nuestros análisis
          </p>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl sm:text-4xl font-bold text-[--color-primary] mb-2">
                  {stat.number}
                </div>
                <div className="text-sm text-gray-600">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Logos de medios */}
        <div className="mb-12">
          <h3 className="text-lg font-semibold text-center text-gray-700 mb-6">
            Mencionado en medios especializados
          </h3>
          <div className="flex flex-wrap justify-center items-center gap-8 opacity-60">
            {mediaLogos.map((media, index) => (
              <div key={index} className="flex items-center gap-2 text-gray-500">
                <span className="text-2xl">{media.logo}</span>
                <span className="text-sm font-medium">{media.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Logos de empresas */}
        <div className="mb-12">
          <h3 className="text-lg font-semibold text-center text-gray-700 mb-6">
            Utilizado por profesionales de
          </h3>
          <div className="flex flex-wrap justify-center items-center gap-8 opacity-60">
            {companyLogos.map((company, index) => (
              <div key={index} className="flex items-center gap-2 text-gray-500">
                <span className="text-2xl">{company.logo}</span>
                <span className="text-sm font-medium">{company.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Testimonial destacado */}
        <div className="bg-gradient-to-r from-[--emr-blue-10] to-[--emr-green-10] rounded-lg p-8 text-center">
          <div className="max-w-3xl mx-auto">
            <div className="text-4xl text-[--color-accent] mb-4">"</div>
            <blockquote className="text-lg text-gray-700 mb-6 italic">
              "EarlyMarketReports me ha ayudado a identificar oportunidades que no habría visto por mi cuenta. 
              Su análisis técnico es excepcional y me ha ahorrado horas de investigación diaria."
            </blockquote>
            <div className="flex items-center justify-center gap-4">
              <div className="w-12 h-12 bg-[--color-primary] rounded-full flex items-center justify-center">
                <span className="text-white font-bold">MR</span>
              </div>
              <div className="text-left">
                <div className="font-semibold text-[--color-primary]">María Rodríguez</div>
                <div className="text-sm text-gray-600">Trader Independiente</div>
              </div>
            </div>
          </div>
        </div>

        {/* Badges de confianza */}
        <div className="mt-12 flex flex-wrap justify-center items-center gap-6">
          <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg px-4 py-2">
            <span className="text-green-600">🔒</span>
            <span className="text-sm text-green-800 font-medium">SSL Seguro</span>
          </div>
          <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-lg px-4 py-2">
            <span className="text-blue-600">🛡️</span>
            <span className="text-sm text-blue-800 font-medium">RGPD Compliant</span>
          </div>
          <div className="flex items-center gap-2 bg-purple-50 border border-purple-200 rounded-lg px-4 py-2">
            <span className="text-purple-600">⭐</span>
            <span className="text-sm text-purple-800 font-medium">4.9/5 Rating</span>
          </div>
          <div className="flex items-center gap-2 bg-orange-50 border border-orange-200 rounded-lg px-4 py-2">
            <span className="text-orange-600">💳</span>
            <span className="text-sm text-orange-800 font-medium">Pago Seguro</span>
          </div>
        </div>
      </div>
    </section>
  );
}
