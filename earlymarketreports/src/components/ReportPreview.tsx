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
      title: "Resumen Ejecutivo",
      description: "Vista general del mercado y eventos clave del día",
      image: "/screenshots/executive-summary.png",
      features: [
        "Análisis macro del día",
        "Eventos económicos importantes",
        "Sentimiento general del mercado",
        "Niveles clave a vigilar"
      ]
    },
    {
      title: "Análisis Técnico",
      description: "Gráficos detallados y niveles de soporte/resistencia",
      image: "/screenshots/technical-analysis.png",
      features: [
        "Gráficos de velas japonesas",
        "Indicadores técnicos (RSI, MACD)",
        "Niveles de soporte y resistencia",
        "Patrones de trading"
      ]
    },
    {
      title: "Watchlist Pro",
      description: "15+ valores seleccionados con análisis detallado",
      image: "/screenshots/watchlist.png",
      features: [
        "Valores con mayor potencial",
        "Precios objetivo y stop loss",
        "Análisis de riesgo/beneficio",
        "Catalizadores próximos"
      ]
    },
    {
      title: "Flujos Institucionales",
      description: "Seguimiento de movimientos de grandes inversores",
      image: "/screenshots/institutional-flows.png",
      features: [
        "Actividad de fondos institucionales",
        "Cambios en posiciones",
        "Análisis de volumen",
        "Insider trading"
      ]
    }
  ];

  return (
    <section className="bg-[--emr-gray] py-16">
      <div className="container-page">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-[--color-primary] mb-4">
            Por dentro del informe Pro
          </h2>
          <p className="text-lg text-gray-700 max-w-3xl mx-auto">
            Descubre la profundidad y calidad de nuestro análisis profesional. 
            Cada sección está diseñada para darte la ventaja competitiva que necesitas.
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
                    Captura de pantalla del informe real
                  </p>
                </div>
              </div>
              
              {/* Overlay con CTA */}
              <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                <Link 
                  href="/subscribe?plan=pro" 
                  className="btn-accent"
                >
                  Ver Informe Completo
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
                ¿Qué incluye esta sección?
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
                  ¿Quieres acceso completo?
                </h4>
                <p className="text-sm text-gray-700 mb-4">
                  Suscríbete al plan Pro para acceder a todas las secciones del informe, 
                  incluyendo análisis técnico detallado y watchlist exclusiva.
                </p>
                <div className="flex gap-3">
                  <Link 
                    href="/subscribe?plan=pro" 
                    className="btn-accent flex-1 text-center"
                  >
                    Probar Pro Gratis
                  </Link>
                  <Link 
                    href="/#ejemplo" 
                    className="btn-outline-primary flex-1 text-center"
                  >
                    Ver Muestra
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
            <h4 className="font-semibold text-[--color-primary] mb-2">Entrega Rápida</h4>
            <p className="text-sm text-gray-600">
              Informe completo disponible antes de las 9:00 ET
            </p>
          </div>
          
          <div className="text-center p-6 bg-white rounded-lg shadow">
            <div className="w-12 h-12 bg-[--color-accent] rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-white text-lg">🎯</span>
            </div>
            <h4 className="font-semibold text-[--color-primary] mb-2">Análisis Preciso</h4>
            <p className="text-sm text-gray-600">
              Datos verificados y análisis basado en evidencia
            </p>
          </div>
          
          <div className="text-center p-6 bg-white rounded-lg shadow">
            <div className="w-12 h-12 bg-[--color-accent] rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-white text-lg">💼</span>
            </div>
            <h4 className="font-semibold text-[--color-primary] mb-2">Nivel Profesional</h4>
            <p className="text-sm text-gray-600">
              Calidad institucional para traders serios
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
