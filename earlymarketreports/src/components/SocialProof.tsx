"use client";

import { useI18n } from "@/i18n/I18nProvider";

export default function SocialProof() {
  const { t } = useI18n();

  const stats = [
    { number: "2,500+", label: t("active_subscribers") },
    { number: "15+", label: t("years_experience") },
    { number: "98%", label: t("customer_satisfaction") },
    { number: "24/7", label: t("support_available") }
  ];

  // Logos monocromo sin texto, servidos desde public/logos
  const mediaLogos = [
    { alt: "Bloomberg", src: "/logos/bloomberg.svg" },
    { alt: "CNBC", src: "/logos/cnbc.svg" },
    { alt: "Reuters", src: "/logos/reuters.svg" },
    { alt: "Financial Times", src: "/logos/ft.svg" },
    { alt: "Wall Street Journal", src: "/logos/wsj.svg" },
  ];

  const companyLogos = [
    { alt: "Goldman Sachs", src: "/logos/goldman-sachs.svg" },
    { alt: "Morgan Stanley", src: "/logos/morgan-stanley.svg" },
    { alt: "BlackRock", src: "/logos/blackrock.svg" },
    { alt: "Vanguard", src: "/logos/vanguard.svg" },
    { alt: "Fidelity", src: "/logos/fidelity.svg" },
  ];

  return (
    <section className="bg-white py-12">
      <div className="container-page">
        {/* Estadísticas */}
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-[--color-primary] mb-4">
            {t("trusted_by_thousands")}
          </h2>
          <p className="text-gray-600 mb-8">
            {t("join_growing_community")}
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

        {/* Testimonial destacado */}
          <div className="bg-gradient-to-r from-[--emr-blue-10] to-[--emr-green-10] rounded-lg p-8 text-center">
          <div className="max-w-3xl mx-auto">
            <div className="text-4xl text-[--color-accent] mb-4">"</div>
            <blockquote className="text-lg text-gray-700 mb-6 italic">
              "{t("featured_testimonial")}"
            </blockquote>
            <div className="flex items-center justify-center gap-4">
              <div className="w-12 h-12 bg-[--color-primary] rounded-full flex items-center justify-center">
                <span className="text-white font-bold">SJ</span>
              </div>
              <div className="text-left">
                <div className="font-semibold text-[--color-primary]">{t("featured_testimonial_author")}</div>
                <div className="text-sm text-gray-600">{t("featured_testimonial_role")}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Badges de confianza */}
        <div className="mt-12 flex flex-wrap justify-center items-center gap-6">
          <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg px-4 py-2">
            <span className="text-green-600">🔒</span>
            <span className="text-sm text-green-800 font-medium">{t("ssl_secure")}</span>
          </div>
          <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-lg px-4 py-2">
            <span className="text-blue-600">🛡️</span>
            <span className="text-sm text-blue-800 font-medium">{t("gdpr_compliant")}</span>
          </div>
          <div className="flex items-center gap-2 bg-purple-50 border border-purple-200 rounded-lg px-4 py-2">
            <span className="text-purple-600">⭐</span>
            <span className="text-sm text-purple-800 font-medium">{t("rating")}</span>
          </div>
          <div className="flex items-center gap-2 bg-orange-50 border border-orange-200 rounded-lg px-4 py-2">
            <span className="text-orange-600">💳</span>
            <span className="text-sm text-orange-800 font-medium">{t("secure_payment")}</span>
          </div>
        </div>
      </div>
    </section>
  );
}
