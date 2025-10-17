"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useI18n } from "@/i18n/I18nProvider";

export default function ReportPreview() {
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState(0);

  const reportSections = [
    {
      title: t("executive_summary"),
      description: t("executive_summary_desc"),
      image: "/screenshots/executive-summary.png",
      features: [
        t("macro_analysis_day"),
        t("important_economic_events"),
        t("general_market_sentiment"),
        t("key_levels_to_watch")
      ]
    },
    {
      title: t("technical_analysis_section"),
      description: t("technical_analysis_section_desc"),
      image: "/screenshots/technical-analysis.png",
      features: [
        t("japanese_candlestick_charts"),
        t("technical_indicators"),
        t("support_resistance_levels"),
        t("trading_patterns")
      ]
    },
    {
      title: t("watchlist_pro_section"),
      description: t("watchlist_pro_section_desc"),
      image: "/screenshots/watchlist.png",
      features: [
        t("highest_potential_tickers"),
        t("target_prices_stop_loss"),
        t("risk_reward_analysis"),
        t("upcoming_catalysts")
      ]
    },
    {
      title: t("institutional_flows_section"),
      description: t("institutional_flows_section_desc"),
      image: "/screenshots/institutional-flows.png",
      features: [
        t("institutional_fund_activity"),
        t("position_changes"),
        t("volume_analysis"),
        t("insider_trading")
      ]
    }
  ];

  return (
    <section className="bg-[--emr-gray] py-16">
      <div className="container-page">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-[--color-primary] mb-4">
            {t("inside_pro_report")}
          </h2>
          <p className="text-lg text-gray-700 max-w-3xl mx-auto">
            {t("pro_report_description")}
          </p>
        </div>

        {/* Tabs de navegación */}
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {reportSections.map((section, index) => (
            <button
              key={index}
              onClick={() => setActiveTab(index)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === index
                  ? "bg-[--color-primary] text-white"
                  : "bg-white text-gray-700 hover:bg-gray-100"
              }`}
            >
              {section.title}
            </button>
          ))}
        </div>

        {/* Contenido de la pestaña activa */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Imagen del informe */}
            <div className="relative">
              <div className="aspect-[4/3] bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-16 h-16 bg-[--color-accent] rounded-lg flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl text-white">📊</span>
                  </div>
                  <h3 className="text-xl font-semibold text-[--color-primary] mb-2">
                    {reportSections[activeTab].title}
                  </h3>
                  <p className="text-gray-600 text-sm">
                    {t("real_report_screenshot")}
                  </p>
                </div>
              </div>
              
              {/* Overlay con CTA */}
              <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                <Link 
                  href="/subscribe?plan=pro" 
                  className="btn-accent"
                >
                  {t("view_full_report")}
                </Link>
              </div>
            </div>

            {/* Descripción y características */}
            <div className="p-8">
              <h3 className="text-2xl font-bold text-[--color-primary] mb-4">
                {reportSections[activeTab].title}
              </h3>
              <p className="text-gray-700 mb-6">
                {reportSections[activeTab].description}
              </p>
              
              <h4 className="text-lg font-semibold text-[--color-primary] mb-4">
                {t("what_includes_section")}
              </h4>
              <ul className="space-y-3 mb-8">
                {reportSections[activeTab].features.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <div className="w-2 h-2 bg-[--color-accent] rounded-full mt-2 mr-3 flex-shrink-0"></div>
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>

              <div className="bg-gradient-to-r from-[--emr-blue-10] to-[--emr-green-10] p-6 rounded-lg border border-[--color-accent]">
                <h4 className="font-semibold text-[--color-primary] mb-2">
                  {t("want_full_access")}
                </h4>
                <p className="text-sm text-gray-700 mb-4">
                  {t("full_access_description")}
                </p>
                <div className="flex gap-3">
                  <Link 
                    href="/subscribe?plan=pro" 
                    className="btn-accent flex-1 text-center"
                  >
                    {t("try_pro_free")}
                  </Link>
                  <Link 
                    href="/#ejemplo" 
                    className="btn-outline-primary flex-1 text-center"
                  >
                    {t("view_sample")}
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Indicadores de calidad */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-6 bg-white rounded-lg shadow">
            <div className="w-12 h-12 bg-[--color-accent] rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-white text-lg">⚡</span>
            </div>
            <h4 className="font-semibold text-[--color-primary] mb-2">{t("fast_delivery")}</h4>
            <p className="text-sm text-gray-600">
              {t("fast_delivery_desc")}
            </p>
          </div>
          
          <div className="text-center p-6 bg-white rounded-lg shadow">
            <div className="w-12 h-12 bg-[--color-accent] rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-white text-lg">🎯</span>
            </div>
            <h4 className="font-semibold text-[--color-primary] mb-2">{t("accurate_analysis")}</h4>
            <p className="text-sm text-gray-600">
              {t("accurate_analysis_desc")}
            </p>
          </div>
          
          <div className="text-center p-6 bg-white rounded-lg shadow">
            <div className="w-12 h-12 bg-[--color-accent] rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-white text-lg">💼</span>
            </div>
            <h4 className="font-semibold text-[--color-primary] mb-2">{t("professional_level")}</h4>
            <p className="text-sm text-gray-600">
              {t("professional_level_desc")}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
