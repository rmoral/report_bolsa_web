"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useI18n } from "@/i18n/I18nProvider";
import { CheckCircleIcon, XMarkIcon } from "@heroicons/react/24/solid";
import { trackEvent } from "@/components/GoogleAnalytics";

export default function PricingClient() {
  const { t } = useI18n();
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");

  const features = [
    { category: t("report_access"),
      items: [
        { name: t("market_open_summary"), lite: true, pro: true },
        { name: t("highlighted_opportunities"), lite: true, pro: true },
        { name: t("key_levels"), lite: true, pro: true },
        { name: t("macro_events"), lite: true, pro: true },
        { name: t("delivered_before_open"), lite: true, pro: true },
        { name: t("full_pdf_access"), lite: false, pro: true },
        { name: t("detailed_technical_analysis"), lite: false, pro: true },
        { name: t("watchlist_15_tickers"), lite: false, pro: true },
        { name: t("institutional_flow_analysis"), lite: false, pro: true },
        { name: t("trading_strategies"), lite: false, pro: true },
      ]
    },
    { category: t("support_community"),
      items: [
        { name: t("email_support"), lite: true, pro: true },
        { name: t("priority_support"), lite: false, pro: true },
        { name: t("pro_community_access"), lite: false, pro: true },
      ]
    },
    { category: t("additional_features"),
      items: [
        { name: t("historical_reports"), lite: false, pro: true },
        { name: t("satisfaction_guarantee"), lite: false, pro: true },
      ]
    }
  ];

  const litePlan = {
    name: t("plan_lite_title"),
    description: t("pricing_lite_desc"),
    monthlyPrice: "€0",
    yearlyPrice: "€0",
    cta: t("pricing_cta_lite"),
    ctaLink: "/subscribe?plan=lite",
    bestFor: t("lite_best_for"),
  };

  const proPlan = {
    name: t("plan_pro_title"),
    description: t("pricing_pro_desc"),
    monthlyPrice: "€198",
    yearlyPrice: "€1.980",
    yearlySavings: t("pricing_save", { percentage: 17 }),
    cta: t("pricing_cta_pro"),
    ctaLink: "/subscribe?plan=pro",
    bestFor: t("pro_best_for"),
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
            {t("pricing_monthly")}
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
            {t("pricing_annual")}
          </span>
          {billingCycle === "yearly" && (
            <span className="bg-[--color-accent] text-white text-xs px-2 py-1 rounded-full">
              {proPlan.yearlySavings}
            </span>
          )}
        </div>
      </div>

      {/* Pricing Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white rounded-lg shadow-lg divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                {t("features")}
              </th>
              <th scope="col" className="px-3 py-3.5 text-center text-sm font-semibold text-gray-900">
                {litePlan.name}
              </th>
              <th scope="col" className="px-3 py-3.5 text-center text-sm font-semibold text-gray-900 relative">
                {proPlan.name}
                <span className="absolute -top-2 left-1/2 -translate-x-1/2 bg-[--color-accent] text-white text-xs px-2 py-0.5 rounded-full">
                  {t("popular")}
                </span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {/* Prices */}
            <tr>
              <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                {t("price")} ({billingCycle === "monthly" ? t("pricing_monthly").toLowerCase() : t("pricing_annual").toLowerCase()})
              </td>
              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 text-center">
                <span className="text-lg font-bold text-[--color-primary]">{litePlan.monthlyPrice}</span>
              </td>
              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 text-center">
                <span className="text-lg font-bold text-[--color-primary]">
                  {billingCycle === "monthly" ? proPlan.monthlyPrice : proPlan.yearlyPrice}
                </span>
              </td>
            </tr>
            {/* Best For */}
            <tr>
              <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                {t("best_for")}
              </td>
              <td className="px-3 py-4 text-sm text-gray-500 text-center">
                {litePlan.bestFor}
              </td>
              <td className="px-3 py-4 text-sm text-gray-500 text-center">
                {proPlan.bestFor}
              </td>
            </tr>

            {/* Features */}
            {features.map((section, sectionIdx) => (
              <React.Fragment key={sectionIdx}>
                <tr className="bg-gray-50">
                  <td colSpan={3} className="px-4 py-2 text-sm font-semibold text-gray-900 sm:px-6">
                    {section.category}
                  </td>
                </tr>
                {section.items.map((feature, featureIdx) => (
                  <tr key={featureIdx}>
                    <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm text-gray-700 sm:pl-6">
                      {feature.name}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 text-center">
                      {feature.lite ? (
                        <CheckCircleIcon className="h-5 w-5 text-[--color-accent] mx-auto" />
                      ) : (
                        <XMarkIcon className="h-5 w-5 text-gray-400 mx-auto" />
                      )}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 text-center">
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
          <tfoot>
            <tr>
              <td className="py-4 pl-4 pr-3 sm:pl-6"></td>
              <td className="px-3 py-4 text-sm text-gray-500 text-center">
                <Link 
                  href={litePlan.ctaLink} 
                  className="btn-primary w-full"
                  onClick={() => trackEvent('click_cta', 'pricing', 'lite_plan')}
                >
                  {litePlan.cta}
                </Link>
              </td>
              <td className="px-3 py-4 text-sm text-gray-500 text-center">
                <Link 
                  href={proPlan.ctaLink} 
                  className="btn-accent w-full"
                  onClick={() => trackEvent('click_cta', 'pricing', 'pro_plan')}
                >
                  {proPlan.cta}
                </Link>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Pricing FAQs */}
      <section className="py-12">
        <h2 className="text-2xl sm:text-3xl font-bold text-[--color-primary] text-center mb-8">{t("pricing_faq_title")}</h2>
        <div className="mt-8 max-w-2xl mx-auto space-y-4">
          <details className="group bg-[--emr-gray] p-4 rounded-lg shadow-sm">
            <summary className="flex justify-between items-center font-semibold cursor-pointer text-[--color-primary]">
              {t("pricing_faq_q1")}
              <span className="group-open:rotate-180 transition-transform">▼</span>
            </summary>
            <p className="mt-2 text-gray-700">{t("pricing_faq_a1")}</p>
          </details>
          <details className="group bg-[--emr-gray] p-4 rounded-lg shadow-sm">
            <summary className="flex justify-between items-center font-semibold cursor-pointer text-[--color-primary]">
              {t("pricing_faq_q2")}
              <span className="group-open:rotate-180 transition-transform">▼</span>
            </summary>
            <p className="mt-2 text-gray-700">{t("pricing_faq_a2")}</p>
          </details>
          <details className="group bg-[--emr-gray] p-4 rounded-lg shadow-sm">
            <summary className="flex justify-between items-center font-semibold cursor-pointer text-[--color-primary]">
              {t("pricing_faq_q3")}
              <span className="group-open:rotate-180 transition-transform">▼</span>
            </summary>
            <p className="mt-2 text-gray-700">{t("pricing_faq_a3")}</p>
          </details>
          <details className="group bg-[--emr-gray] p-4 rounded-lg shadow-sm">
            <summary className="flex justify-between items-center font-semibold cursor-pointer text-[--color-primary]">
              {t("pricing_faq_q4")}
              <span className="group-open:rotate-180 transition-transform">▼</span>
            </summary>
            <p className="mt-2 text-gray-700">{t("pricing_faq_a4")}</p>
          </details>
          <details className="group bg-[--emr-gray] p-4 rounded-lg shadow-sm">
            <summary className="flex justify-between items-center font-semibold cursor-pointer text-[--color-primary]">
              {t("pricing_faq_q5")}
              <span className="group-open:rotate-180 transition-transform">▼</span>
            </summary>
            <p className="mt-2 text-gray-700">{t("pricing_faq_a5")}</p>
          </details>
        </div>
      </section>
    </div>
  );
}
