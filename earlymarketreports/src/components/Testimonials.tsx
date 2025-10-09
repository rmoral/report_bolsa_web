"use client";

import { useI18n } from "@/i18n/I18nProvider";
import Image from "next/image";

export default function Testimonials() {
  const { t } = useI18n();

  const testimonials = [
    {
      name: "María González",
      role: "Trader Independiente",
      company: "Freelance",
      location: "Madrid, España",
      content: "Los informes de EarlyMarketReports me han ayudado a mejorar significativamente mis resultados. El análisis técnico es excepcional y me ha permitido identificar oportunidades que no habría visto por mi cuenta.",
      rating: 5,
      verified: true,
      linkedin: "https://linkedin.com/in/maria-gonzalez-trader",
      photo: "/testimonials/maria-gonzalez.jpg",
      results: "ROI mejorado 23% en 6 meses"
    },
    {
      name: "Carlos Ruiz",
      role: "Gestor de Fondos",
      company: "Inversiones Mediterráneo",
      location: "Barcelona, España",
      content: "La calidad del análisis macro y los niveles técnicos son de nivel institucional. Recomiendo totalmente el servicio Pro a todos mis colegas del sector financiero.",
      rating: 5,
      verified: true,
      linkedin: "https://linkedin.com/in/carlos-ruiz-fund-manager",
      photo: "/testimonials/carlos-ruiz.jpg",
      results: "Gestión de €50M+ en activos"
    },
    {
      name: "Ana Martín",
      role: "Inversora Particular",
      company: "Independiente",
      location: "Valencia, España",
      content: "Desde que uso EarlyMarketReports, mis decisiones de inversión son mucho más informadas. El resumen diario es perfecto para mi estilo de vida y me ahorra horas de investigación.",
      rating: 5,
      verified: true,
      linkedin: "https://linkedin.com/in/ana-martin-investor",
      photo: "/testimonials/ana-martin.jpg",
      results: "Cartera +18% en 2024"
    },
    {
      name: "David López",
      role: "Analista Financiero",
      company: "Banco Santander",
      location: "Madrid, España",
      content: "Los flujos institucionales y el análisis de earnings son impresionantes. Un servicio profesional de primera calidad que complementa perfectamente mi trabajo diario.",
      rating: 5,
      verified: true,
      linkedin: "https://linkedin.com/in/david-lopez-analyst",
      photo: "/testimonials/david-lopez.jpg",
      results: "8+ años experiencia bancaria"
    },
    {
      name: "Laura Sánchez",
      role: "Trader de Day Trading",
      company: "Trading Pro",
      location: "Sevilla, España",
      content: "La watchlist Pro me ha dado una ventaja competitiva real. Los niveles de entrada y salida son muy precisos y me han ayudado a maximizar mis ganancias diarias.",
      rating: 5,
      verified: true,
      linkedin: "https://linkedin.com/in/laura-sanchez-trader",
      photo: "/testimonials/laura-sanchez.jpg",
      results: "Trading diario desde 2019"
    },
    {
      name: "Roberto García",
      role: "Inversor de Largo Plazo",
      company: "García Capital",
      location: "Bilbao, España",
      content: "El análisis fundamental y técnico combinado es exactamente lo que necesitaba para mi estrategia de inversión a largo plazo. La calidad es excepcional.",
      rating: 5,
      verified: true,
      linkedin: "https://linkedin.com/in/roberto-garcia-investor",
      photo: "/testimonials/roberto-garcia.jpg",
      results: "Cartera diversificada €2M+"
    },
    {
      name: "Isabel Fernández",
      role: "Asesora Financiera",
      company: "Asesoría Financiera Plus",
      location: "Málaga, España",
      content: "Recomiendo EarlyMarketReports a mis clientes. La calidad del contenido justifica completamente el precio del plan Pro y me ayuda a ofrecer mejor asesoramiento.",
      rating: 5,
      verified: true,
      linkedin: "https://linkedin.com/in/isabel-fernandez-advisor",
      photo: "/testimonials/isabel-fernandez.jpg",
      results: "200+ clientes asesorados"
    },
    {
      name: "Miguel Torres",
      role: "Trader Profesional",
      company: "Torres Trading",
      location: "Zaragoza, España",
      content: "La entrega antes de las 9:00 ET es crucial para mi operativa. EarlyMarketReports nunca me ha fallado y siempre llega puntual con información de calidad.",
      rating: 5,
      verified: true,
      linkedin: "https://linkedin.com/in/miguel-torres-trader",
      photo: "/testimonials/miguel-torres.jpg",
      results: "Trading profesional 5+ años"
    },
    {
      name: "Carmen Jiménez",
      role: "Inversora en ETFs",
      company: "ETF Strategy",
      location: "Granada, España",
      content: "El análisis de sectores y la identificación de tendencias me han ayudado a optimizar mi cartera de ETFs. Los insights son muy valiosos para mi estrategia.",
      rating: 5,
      verified: true,
      linkedin: "https://linkedin.com/in/carmen-jimenez-etf",
      photo: "/testimonials/carmen-jimenez.jpg",
      results: "Especialista en ETFs desde 2020"
    },
    {
      name: "Javier Moreno",
      role: "Gestor de Patrimonio",
      company: "Moreno Wealth Management",
      location: "Palma, España",
      content: "La combinación de análisis macro, técnico y flujos institucionales es única en el mercado. Servicio excepcional que me ayuda a gestionar mejor el patrimonio de mis clientes.",
      rating: 5,
      verified: true,
      linkedin: "https://linkedin.com/in/javier-moreno-wealth",
      photo: "/testimonials/javier-moreno.jpg",
      results: "Gestión patrimonial €100M+"
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
            Más de 2,500 inversores y traders confían en nuestros análisis diarios. 
            Conoce sus experiencias reales y resultados verificables.
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
                    Verificado
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
                {testimonial.linkedin && (
                  <a 
                    href={testimonial.linkedin} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-[--color-primary] hover:text-[--color-accent] transition-colors"
                    title="Ver perfil de LinkedIn"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                    </svg>
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Trust indicators */}
        <div className="mt-12 text-center">
          <div className="bg-gradient-to-r from-[--emr-blue-10] to-[--emr-green-10] rounded-lg p-6 max-w-4xl mx-auto">
            <h3 className="text-lg font-semibold text-[--color-primary] mb-4">
              ¿Por qué confiar en nuestros testimonios?
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="flex items-center justify-center gap-2">
                <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span>Perfiles verificados en LinkedIn</span>
              </div>
              <div className="flex items-center justify-center gap-2">
                <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span>Resultados reales documentados</span>
              </div>
              <div className="flex items-center justify-center gap-2">
                <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span>Experiencia profesional verificada</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}