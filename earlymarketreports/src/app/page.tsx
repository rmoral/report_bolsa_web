"use client";
import Image from "next/image";
import Link from "next/link";
import LeadCapture from "@/components/LeadCapture";
import Testimonials from "@/components/Testimonials";
import { useI18n } from "@/i18n/I18nProvider";

export default function Home() {
  const { t } = useI18n();
  return (
    <div>
      {/* Header */}
      {/* Header global renderizado desde layout */}

      {/* Hero */}
      <section className="bg-hero-gradient">
        <div className="container-page py-10 sm:py-16 grid grid-cols-1 sm:grid-cols-2 gap-8 items-center">
          <div>
            <h1 className="text-3xl sm:text-5xl font-bold text-[--color-primary] leading-tight font-[var(--font-montserrat)]">{t("hero_title")}</h1>
            <p className="mt-4 text-base sm:text-lg text-gray-700">{t("hero_subtitle")}</p>
            <p className="mt-2 text-sm text-gray-600 italic">{t("hero_delivery_time")}</p>
            <LeadCapture className="mt-6" />
            <div className="mt-4 flex flex-col sm:flex-row gap-3">
              <Link href="/#ejemplo" className="btn-outline-primary text-center">
                {t("hero_cta_example")}
              </Link>
              <Link href="/precios" className="btn-outline-accent text-center">
                {t("hero_cta_plans")}
              </Link>
            </div>
          </div>
          <div className="flex sm:justify-end">
            <Image src="/illustrations/chart-up.svg" alt="Gráfico alcista" width={480} height={270} priority className="rounded-lg shadow" />
          </div>
        </div>
      </section>

      {/* Qué ofrecemos */}
      <section id="que-ofrecemos" className="container-page py-12">
        <h2 className="text-2xl sm:text-3xl font-bold text-[--color-primary]">{t("section_offering_title")}</h2>
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg p-6 shadow card-accent flex gap-4">
            <Image src="/illustrations/report-doc.svg" alt="Informe Lite" width={72} height={72} />
            <div>
              <h3 className="text-xl font-semibold">{t("plan_lite_title")}</h3>
              <p className="mt-2 text-gray-700">{t("plan_lite_bullet_1")}</p>
              <ul className="mt-3 text-sm text-gray-600 space-y-1">
                <li>• {t("plan_lite_bullet_2")}</li>
                <li>• {t("plan_lite_bullet_3")}</li>
                <li>• {t("plan_lite_bullet_4")}</li>
              </ul>
            </div>
          </div>
          <div className="bg-white rounded-lg p-6 shadow border border-[--color-accent] card-accent flex gap-4">
            <Image src="/illustrations/report-doc.svg" alt="Informe Pro" width={72} height={72} />
            <div>
              <h3 className="text-xl font-semibold">{t("plan_pro_title")}</h3>
              <p className="mt-2 text-gray-700">{t("plan_pro_desc")}</p>
              <ul className="mt-3 text-sm text-gray-600 space-y-1">
                <li>• {t("plan_pro_bullet_1")}</li>
                <li>• {t("plan_pro_bullet_2")}</li>
                <li>• {t("plan_pro_bullet_3")}</li>
                <li>• {t("plan_pro_bullet_4")}</li>
                <li>• {t("plan_pro_bullet_5")}</li>
              </ul>
              <Link href="/subscribe" className="btn-accent mt-4 inline-block">{t("choose_pro")}</Link>
            </div>
          </div>
        </div>
      </section>

      {/* Ejemplo */}
      <section id="ejemplo" className="bg-white">
        <div className="container-page py-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-[--color-primary]">{t("section_example_title")}</h2>
          <p className="mt-2 text-gray-700">{t("section_example_note")}</p>
          <div className="mt-6 grid gap-6 sm:grid-cols-2">
            <article className="bg-[--emr-gray] p-4 rounded-lg border">
              <h4 className="font-semibold">{t("section_example_summary")}</h4>
              <ul className="list-disc pl-5 text-sm text-gray-800 mt-2 space-y-1">
                <li>{t("example_point_1")}</li>
                <li>{t("example_point_2")}</li>
                <li>{t("example_point_3")}</li>
              </ul>
            </article>
            <div className="bg-[--emr-gray] p-4 rounded-lg border">
              <p className="text-sm text-gray-800">Descarga el PDF completo o ábrelo en una nueva pestaña.</p>
              <div className="mt-3 flex gap-3">
                <a className="btn-outline-primary" href="/reports/US_FULL_20251003.pdf" target="_blank">{t("open_pdf")}</a>
                <a className="btn-accent" href="/reports/US_FULL_20251003.pdf" download>{t("download_pdf")}</a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Cómo funciona */}
      <section className="bg-white">
        <div className="container-page py-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-[--color-primary] text-center">{t("how_title")}</h2>
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-[--color-accent] rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-white">1</span>
              </div>
              <h3 className="text-lg font-semibold mb-2">{t("how_step_1_title")}</h3>
              <p className="text-gray-600">{t("how_step_1_desc")}</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-[--color-accent] rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-white">2</span>
              </div>
              <h3 className="text-lg font-semibold mb-2">{t("how_step_2_title")}</h3>
              <p className="text-gray-600">{t("how_step_2_desc")}</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-[--color-accent] rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-white">3</span>
              </div>
              <h3 className="text-lg font-semibold mb-2">{t("how_step_3_title")}</h3>
              <p className="text-gray-600">{t("how_step_3_desc")}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Beneficios para SEO */}
      <section className="bg-[--emr-gray]">
        <div className="container-page py-12 grid gap-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-[--color-primary]">{t("why_title")}</h2>
          <div className="grid sm:grid-cols-3 gap-6">
            <div className="p-6 rounded-lg border bg-white">
              <div className="flex items-center gap-2"><Image src="/icons/clock-open.svg" alt="Antes de apertura" width={24} height={24} /><h3 className="font-semibold">{t("why_card_1_title")}</h3></div>
              <p className="text-gray-700 mt-2">{t("why_card_1_desc")}</p>
            </div>
            <div className="p-6 rounded-lg border bg-white">
              <div className="flex items-center gap-2"><Image src="/icons/analysis.svg" alt="Análisis" width={24} height={24} /><h3 className="font-semibold">{t("why_card_2_title")}</h3></div>
              <p className="text-gray-700 mt-2">{t("why_card_2_desc")}</p>
            </div>
            <div className="p-6 rounded-lg border bg-white">
              <div className="flex items-center gap-2"><Image src="/icons/upgrade.svg" alt="Upgrade" width={24} height={24} /><h3 className="font-semibold">{t("why_card_3_title")}</h3></div>
              <p className="text-gray-700 mt-2">{t("why_card_3_desc")}</p>
            </div>
          </div>
          <LeadCapture className="mt-2" />
        </div>
      </section>

      {/* FAQs con schema.org */}
      <section className="container-page py-12" id="faq">
        <h2 className="text-2xl sm:text-3xl font-bold text-[--color-primary] text-center mb-8">{t("faq_title")}</h2>
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-7xl mx-auto">
          <details className="bg-white p-4 rounded border shadow-sm hover:shadow-md transition-shadow">
            <summary className="font-semibold cursor-pointer text-[--color-primary] hover:text-[--color-accent] transition-colors">{t("faq_q1")}</summary>
            <p className="mt-2 text-gray-700">{t("faq_a1")}</p>
          </details>
          <details className="bg-white p-4 rounded border shadow-sm hover:shadow-md transition-shadow">
            <summary className="font-semibold cursor-pointer text-[--color-primary] hover:text-[--color-accent] transition-colors">{t("faq_q2")}</summary>
            <p className="mt-2 text-gray-700">{t("faq_a2")}</p>
          </details>
          <details className="bg-white p-4 rounded border shadow-sm hover:shadow-md transition-shadow">
            <summary className="font-semibold cursor-pointer text-[--color-primary] hover:text-[--color-accent] transition-colors">{t("faq_q3")}</summary>
            <p className="mt-2 text-gray-700">{t("faq_a3")}</p>
          </details>
          <details className="bg-white p-4 rounded border shadow-sm hover:shadow-md transition-shadow">
            <summary className="font-semibold cursor-pointer text-[--color-primary] hover:text-[--color-accent] transition-colors">{t("faq_q4")}</summary>
            <p className="mt-2 text-gray-700">{t("faq_a4")}</p>
          </details>
          <details className="bg-white p-4 rounded border shadow-sm hover:shadow-md transition-shadow">
            <summary className="font-semibold cursor-pointer text-[--color-primary] hover:text-[--color-accent] transition-colors">{t("faq_q5")}</summary>
            <p className="mt-2 text-gray-700">{t("faq_a5")}</p>
          </details>
          <details className="bg-white p-4 rounded border shadow-sm hover:shadow-md transition-shadow">
            <summary className="font-semibold cursor-pointer text-[--color-primary] hover:text-[--color-accent] transition-colors">{t("faq_q6")}</summary>
            <p className="mt-2 text-gray-700">{t("faq_a6")}</p>
          </details>
          <details className="bg-white p-4 rounded border shadow-sm hover:shadow-md transition-shadow">
            <summary className="font-semibold cursor-pointer text-[--color-primary] hover:text-[--color-accent] transition-colors">{t("faq_q7")}</summary>
            <p className="mt-2 text-gray-700">{t("faq_a7")}</p>
          </details>
          <details className="bg-white p-4 rounded border shadow-sm hover:shadow-md transition-shadow">
            <summary className="font-semibold cursor-pointer text-[--color-primary] hover:text-[--color-accent] transition-colors">{t("faq_q8")}</summary>
            <p className="mt-2 text-gray-700">{t("faq_a8")}</p>
          </details>
          <details className="bg-white p-4 rounded border shadow-sm hover:shadow-md transition-shadow">
            <summary className="font-semibold cursor-pointer text-[--color-primary] hover:text-[--color-accent] transition-colors">{t("faq_q9")}</summary>
            <p className="mt-2 text-gray-700">{t("faq_a9")}</p>
          </details>
          <details className="bg-white p-4 rounded border shadow-sm hover:shadow-md transition-shadow">
            <summary className="font-semibold cursor-pointer text-[--color-primary] hover:text-[--color-accent] transition-colors">{t("faq_q10")}</summary>
            <p className="mt-2 text-gray-700">{t("faq_a10")}</p>
          </details>
          <details className="bg-white p-4 rounded border shadow-sm hover:shadow-md transition-shadow">
            <summary className="font-semibold cursor-pointer text-[--color-primary] hover:text-[--color-accent] transition-colors">{t("faq_q11")}</summary>
            <p className="mt-2 text-gray-700">{t("faq_a11")}</p>
          </details>
          <details className="bg-white p-4 rounded border shadow-sm hover:shadow-md transition-shadow">
            <summary className="font-semibold cursor-pointer text-[--color-primary] hover:text-[--color-accent] transition-colors">{t("faq_q12")}</summary>
            <p className="mt-2 text-gray-700">{t("faq_a12")}</p>
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
                { "@type": "Question", name: t("faq_q1"), acceptedAnswer: { "@type": "Answer", text: t("faq_a1") } },
                { "@type": "Question", name: t("faq_q2"), acceptedAnswer: { "@type": "Answer", text: t("faq_a2") } },
                { "@type": "Question", name: t("faq_q3"), acceptedAnswer: { "@type": "Answer", text: t("faq_a3") } },
                { "@type": "Question", name: t("faq_q4"), acceptedAnswer: { "@type": "Answer", text: t("faq_a4") } },
                { "@type": "Question", name: t("faq_q5"), acceptedAnswer: { "@type": "Answer", text: t("faq_a5") } },
                { "@type": "Question", name: t("faq_q6"), acceptedAnswer: { "@type": "Answer", text: t("faq_a6") } },
                { "@type": "Question", name: t("faq_q7"), acceptedAnswer: { "@type": "Answer", text: t("faq_a7") } },
                { "@type": "Question", name: t("faq_q8"), acceptedAnswer: { "@type": "Answer", text: t("faq_a8") } },
                { "@type": "Question", name: t("faq_q9"), acceptedAnswer: { "@type": "Answer", text: t("faq_a9") } },
                { "@type": "Question", name: t("faq_q10"), acceptedAnswer: { "@type": "Answer", text: t("faq_a10") } },
                { "@type": "Question", name: t("faq_q11"), acceptedAnswer: { "@type": "Answer", text: t("faq_a11") } },
                { "@type": "Question", name: t("faq_q12"), acceptedAnswer: { "@type": "Answer", text: t("faq_a12") } }
              ],
            }),
          }}
        />
      </section>
      <Testimonials />
    </div>
  );
}
