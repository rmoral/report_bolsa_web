"use client";

import { useI18n } from "@/i18n/I18nProvider";
import Image from "next/image";

export default function Testimonials() {
  const { t } = useI18n();

  const testimonials = [
    {
      name: "Sarah Johnson",
      role: t("t1_role"),
      company: "Freelance",
      location: "New York, USA",
      content: t("t1"),
      rating: 5,
      verified: true,
      photo: "/testimonials/sarah-johnson.jpg",
      results: t("t1_results")
    },
    {
      name: "Michael Chen",
      role: t("t2_role"),
      company: "Chen Capital",
      location: "San Francisco, USA",
      content: t("t2"),
      rating: 5,
      verified: true,
      photo: "/testimonials/michael-chen.jpg",
      results: t("t2_results")
    },
    {
      name: "Emily Rodriguez",
      role: t("t3_role"),
      company: "Independent",
      location: "Miami, USA",
      content: t("t3"),
      rating: 5,
      verified: true,
      photo: "/testimonials/emily-rodriguez.jpg",
      results: t("t3_results")
    },
    {
      name: "David Kim",
      role: t("t4_role"),
      company: "Goldman Sachs",
      location: "New York, USA",
      content: t("t4"),
      rating: 5,
      verified: true,
      photo: "/testimonials/david-kim.jpg",
      results: t("t4_results")
    },
    {
      name: "Lisa Thompson",
      role: t("t5_role"),
      company: "Thompson Trading",
      location: "Chicago, USA",
      content: t("t5"),
      rating: 5,
      verified: true,
      photo: "/testimonials/lisa-thompson.jpg",
      results: t("t5_results")
    },
    {
      name: "Robert Wilson",
      role: t("t6_role"),
      company: "Wilson Capital",
      location: "Boston, USA",
      content: t("t6"),
      rating: 5,
      verified: true,
      photo: "/testimonials/robert-wilson.jpg",
      results: t("t6_results")
    },
    {
      name: "Jennifer Davis",
      role: t("t7_role"),
      company: "Davis Financial Advisory",
      location: "Los Angeles, USA",
      content: t("t7"),
      rating: 5,
      verified: true,
      photo: "/testimonials/jennifer-davis.jpg",
      results: t("t7_results")
    },
    {
      name: "Mark Anderson",
      role: t("t8_role"),
      company: "Anderson Trading",
      location: "Austin, USA",
      content: t("t8"),
      rating: 5,
      verified: true,
      photo: "/testimonials/mark-anderson.jpg",
      results: t("t8_results")
    },
    {
      name: "Amanda Taylor",
      role: t("t9_role"),
      company: "ETF Strategy Group",
      location: "Seattle, USA",
      content: t("t9"),
      rating: 5,
      verified: true,
      photo: "/testimonials/amanda-taylor.jpg",
      results: t("t9_results")
    },
    {
      name: "James Martinez",
      role: t("t10_role"),
      company: "Martinez Wealth Management",
      location: "Denver, USA",
      content: t("t10"),
      rating: 5,
      verified: true,
      photo: "/testimonials/james-martinez.jpg",
      results: t("t10_results")
    },
  ];

  return (
    <section className="bg-white py-16">
      <div className="container-page">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-[--color-primary] mb-4">
            {t("testimonials_title")}
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            {t("testimonials_intro_text")}
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <div key={index} className="bg-white border border-gray-200 p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow">
              {/* Rating */}
              <div className="flex items-center mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <svg key={i} className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
                {testimonial.verified && (
                  <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full flex items-center gap-1">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    {t("verified")}
                  </span>
                )}
              </div>

              {/* Content */}
              <p className="text-gray-700 mb-4 italic">"{testimonial.content}"</p>

              {/* Results */}
              {testimonial.results && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                  <p className="text-sm text-green-800 font-medium">
                    📈 {testimonial.results}
                  </p>
                </div>
              )}

              {/* Author */}
              <div className="flex items-center">
                <div className="w-12 h-12 bg-gradient-to-br from-[--color-primary] to-[--color-accent] rounded-full flex items-center justify-center text-white font-bold mr-4 relative">
                  <span className="text-sm">
                    {testimonial.name.split(' ').map(n => n[0]).join('')}
                  </span>
                  {testimonial.verified && (
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                      <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-[--color-primary]">{testimonial.name}</p>
                  <p className="text-sm text-gray-600">{testimonial.role}</p>
                  <p className="text-xs text-gray-500">{testimonial.company}</p>
                  <p className="text-xs text-gray-400">{testimonial.location}</p>
                </div>
                {/* Enlaces a LinkedIn deshabilitados intencionalmente */}
              </div>
            </div>
          ))}
        </div>

        {/* Trust indicators */}
        <div className="mt-12 text-center">
          <div className="bg-gradient-to-r from-[--emr-blue-10] to-[--emr-green-10] rounded-lg p-6 max-w-4xl mx-auto">
            <h3 className="text-lg font-semibold text-[--color-primary] mb-4">
              {t("why_trust_testimonials")}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="flex items-center justify-center gap-2">
                <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span>{t("verified_linkedin")}</span>
              </div>
              <div className="flex items-center justify-center gap-2">
                <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span>{t("real_documented_results")}</span>
              </div>
              <div className="flex items-center justify-center gap-2">
                <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span>{t("verified_professional_experience")}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}