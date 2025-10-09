export type Locale = "es" | "en";

type Dict = Record<string, string>;

export const dictionaries: Record<Locale, Dict> = {
  es: {
    brand_name: "EarlyMarketReports",
    nav_offering: "Qué ofrecemos",
    nav_example: "Ejemplo",
    nav_login: "Acceder",
    cta_subscribe_now: "Suscríbete ya",

    hero_title: "Informes bursátiles diarios, antes que nadie.",
    hero_subtitle: "Resúmenes accionables al amanecer y el informe completo para profesionales.",

    section_offering_title: "Qué ofrecemos",
    plan_lite_title: "Lite (gratis)",
    plan_lite_bullet_1: "Resumen de apertura de mercados",
    plan_lite_bullet_2: "3-5 oportunidades destacadas",
    plan_lite_bullet_3: "Niveles clave de soporte/resistencia",
    plan_lite_bullet_4: "Eventos macro del día",
    plan_pro_title: "Pro (de pago)",
    plan_pro_desc: "Informe completo con análisis de mercado, macro, earnings, niveles y watchlist.",
    plan_pro_bullet_1: "Análisis técnico detallado",
    plan_pro_bullet_2: "Watchlist con 15+ valores",
    plan_pro_bullet_3: "Análisis de flujos institucionales",
    plan_pro_bullet_4: "Estrategias de trading",
    plan_pro_bullet_5: "Acceso a comunidad Pro",
    choose_pro: "Elegir Pro",

    section_example_title: "Ejemplo del último informe",
    section_example_note: "Vista previa del reporte (versión US).",
    section_example_summary: "Resumen",
    example_point_1: "Futuros en verde impulsados por tecnología y moderación en yields.",
    example_point_2: "Mercado pendiente de NFP y PMI servicios.",
    example_point_3: "Watchlist: mega-cap tech, semis y consumo discrecional.",
    open_pdf: "Abrir PDF",
    download_pdf: "Descargar",

    how_title: "Cómo funciona",
    how_step_1_title: "Te suscribes gratis",
    how_step_1_desc: "Regístrate en 30 segundos y recibe el primer informe Lite al día siguiente.",
    how_step_2_title: "Recibes análisis diario",
    how_step_2_desc: "Cada mañana, antes de la apertura, recibes tu informe con oportunidades del día.",
    how_step_3_title: "Tomas decisiones informadas",
    how_step_3_desc: "Con datos profesionales, identificas oportunidades y gestionas mejor tu cartera.",

    why_title: "Por qué EarlyMarketReports",
    why_card_1_title: "Antes de la apertura",
    why_card_1_desc: "Recibe cada mañana un resumen accionable del mercado para tomar decisiones informadas.",
    why_card_2_title: "Análisis profesional",
    why_card_2_desc: "Cobertura macro, flujos, resultados y niveles clave elaborados por analistas.",
    why_card_3_title: "Lite o Pro",
    why_card_3_desc: "Empieza sin coste y evoluciona a Pro cuando necesites el informe completo.",

    faq_title: "Preguntas frecuentes",
    faq_q1: "¿A qué hora enviáis el informe?",
    faq_a1: "El resumen Lite sale antes de la apertura en EEUU y el Pro incluye el PDF completo.",
    faq_q2: "¿Qué incluye la versión Pro?",
    faq_a2: "Análisis macro, sectores, earnings del día, niveles técnicos, flujos y watchlist.",
    faq_q3: "¿Puedo cancelar cuando quiera?",
    faq_a3: "Sí, puedes cancelar o cambiar de plan en cualquier momento.",

    footer_terms: "Términos",
    footer_privacy: "Política de privacidad",
  },
  en: {
    brand_name: "EarlyMarketReports",
    nav_offering: "What we offer",
    nav_example: "Example",
    nav_login: "Sign in",
    cta_subscribe_now: "Subscribe now",

    hero_title: "Daily market reports, before anyone else.",
    hero_subtitle: "Actionable summaries at dawn and the full report for professionals.",

    section_offering_title: "What we offer",
    plan_lite_title: "Lite (free)",
    plan_lite_bullet_1: "Market open summary",
    plan_lite_bullet_2: "3-5 highlighted opportunities",
    plan_lite_bullet_3: "Key support/resistance levels",
    plan_lite_bullet_4: "Macro events of the day",
    plan_pro_title: "Pro (paid)",
    plan_pro_desc: "Full report with market analysis, macro, earnings, levels and watchlist.",
    plan_pro_bullet_1: "Detailed technical analysis",
    plan_pro_bullet_2: "Watchlist with 15+ tickers",
    plan_pro_bullet_3: "Institutional flow analysis",
    plan_pro_bullet_4: "Trading strategies",
    plan_pro_bullet_5: "Access to Pro community",
    choose_pro: "Choose Pro",

    section_example_title: "Latest report example",
    section_example_note: "Preview of the report (US version).",
    section_example_summary: "Summary",
    example_point_1: "Futures in green led by tech and easing yields.",
    example_point_2: "Market focused on NFP and Services PMI.",
    example_point_3: "Watchlist: mega-cap tech, semis and discretionary.",
    open_pdf: "Open PDF",
    download_pdf: "Download",

    how_title: "How it works",
    how_step_1_title: "Subscribe for free",
    how_step_1_desc: "Sign up in 30 seconds and receive your first Lite report the next day.",
    how_step_2_title: "Get daily analysis",
    how_step_2_desc: "Every morning before the open you receive your report with daily opportunities.",
    how_step_3_title: "Make informed decisions",
    how_step_3_desc: "With professional data, identify opportunities and manage your portfolio better.",

    why_title: "Why EarlyMarketReports",
    why_card_1_title: "Before the open",
    why_card_1_desc: "Receive an actionable morning summary to make informed decisions.",
    why_card_2_title: "Professional analysis",
    why_card_2_desc: "Macro, flows, earnings and key levels built by analysts.",
    why_card_3_title: "Lite or Pro",
    why_card_3_desc: "Start free and upgrade to Pro when you need the full report.",

    faq_title: "Frequently asked questions",
    faq_q1: "What time do you send the report?",
    faq_a1: "The Lite summary goes out before the US open and Pro includes the full PDF.",
    faq_q2: "What does Pro include?",
    faq_a2: "Macro analysis, sectors, earnings of the day, technical levels, flows and watchlist.",
    faq_q3: "Can I cancel anytime?",
    faq_a3: "Yes, you can cancel or switch plans at any time.",

    footer_terms: "Terms",
    footer_privacy: "Privacy policy",
  },
};

export function t(locale: Locale, key: string): string {
  return dictionaries[locale]?.[key] ?? key;
}


