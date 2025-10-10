import { Metadata } from 'next';
import { Locale } from '@/i18n/config';

export interface PageMetadata {
  title: string;
  description: string;
  keywords?: string[];
  canonical?: string;
  openGraph?: {
    title: string;
    description: string;
    image?: string;
    url?: string;
  };
  twitter?: {
    card: 'summary_large_image';
    title: string;
    description: string;
    image?: string;
  };
}

const baseUrl = 'https://earlymarketreports.com';

export function generateMetadata(
  pageMetadata: PageMetadata,
  locale: Locale = 'es'
): Metadata {
  const localePrefix = locale === 'es' ? '' : `/${locale}`;
  const canonicalUrl = `${baseUrl}${localePrefix}${pageMetadata.canonical || ''}`;
  
  return {
    title: pageMetadata.title,
    description: pageMetadata.description,
    keywords: pageMetadata.keywords?.join(', '),
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: pageMetadata.openGraph?.title || pageMetadata.title,
      description: pageMetadata.openGraph?.description || pageMetadata.description,
      url: pageMetadata.openGraph?.url || canonicalUrl,
      siteName: 'EarlyMarketReports',
      locale: locale === 'es' ? 'es_ES' : 'en_US',
      type: 'website',
      images: pageMetadata.openGraph?.image ? [
        {
          url: pageMetadata.openGraph.image,
          width: 1200,
          height: 630,
          alt: pageMetadata.title,
        }
      ] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: pageMetadata.twitter?.title || pageMetadata.title,
      description: pageMetadata.twitter?.description || pageMetadata.description,
      images: pageMetadata.twitter?.image ? [pageMetadata.twitter.image] : undefined,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
  };
}

// Metadatos específicos por página
export const pageMetadata: Record<string, Record<Locale, PageMetadata>> = {
  home: {
    es: {
      title: 'EarlyMarketReports | Informes Bursátiles Diarios',
      description: 'Informes bursátiles diarios antes de la apertura. Análisis técnico, watchlist exclusiva y oportunidades de trading. Suscríbete gratis o prueba Pro.',
      keywords: ['informes bursátiles', 'análisis técnico', 'trading', 'mercados financieros', 'inversión', 'bolsa'],
      canonical: '/',
      openGraph: {
        title: 'EarlyMarketReports - Informes Bursátiles Diarios',
        description: 'Recibe análisis del mercado antes de que abra. Informes técnicos, watchlist y oportunidades de trading diarias.',
        image: '/og-home.jpg',
        url: '/',
      },
    },
    en: {
      title: 'EarlyMarketReports | Daily Stock Market Reports',
      description: 'Daily stock market reports before market open. Technical analysis, exclusive watchlist and trading opportunities. Subscribe free or try Pro.',
      keywords: ['stock reports', 'technical analysis', 'trading', 'financial markets', 'investment', 'stock market'],
      canonical: '/',
      openGraph: {
        title: 'EarlyMarketReports - Daily Stock Market Reports',
        description: 'Get market analysis before it opens. Technical reports, watchlist and daily trading opportunities.',
        image: '/og-home.jpg',
        url: '/',
      },
    },
  },
  pricing: {
    es: {
      title: 'Precios | EarlyMarketReports - Planes Lite y Pro',
      description: 'Elige tu plan: Lite gratuito con resumen diario o Pro con análisis completo, watchlist y soporte prioritario. Prueba gratis 7 días.',
      keywords: ['precios', 'planes', 'suscripción', 'trading', 'análisis bursátil', 'gratis'],
      canonical: '/precios',
      openGraph: {
        title: 'Precios EarlyMarketReports - Planes Lite y Pro',
        description: 'Planes desde gratis hasta análisis completo. Prueba Pro 7 días sin compromiso.',
        image: '/og-pricing.jpg',
        url: '/precios',
      },
    },
    en: {
      title: 'Pricing | EarlyMarketReports - Lite and Pro Plans',
      description: 'Choose your plan: Free Lite with daily summary or Pro with complete analysis, watchlist and priority support. Try free for 7 days.',
      keywords: ['pricing', 'plans', 'subscription', 'trading', 'stock analysis', 'free'],
      canonical: '/precios',
      openGraph: {
        title: 'EarlyMarketReports Pricing - Lite and Pro Plans',
        description: 'Plans from free to complete analysis. Try Pro for 7 days with no commitment.',
        image: '/og-pricing.jpg',
        url: '/precios',
      },
    },
  },
  subscribe: {
    es: {
      title: 'Suscríbete | EarlyMarketReports - Acceso Inmediato',
      description: 'Crea tu cuenta y accede a informes bursátiles diarios. Plan Lite gratuito o Pro con análisis completo. Sin compromiso.',
      keywords: ['suscribirse', 'registro', 'cuenta', 'informes', 'trading', 'gratis'],
      canonical: '/subscribe',
      openGraph: {
        title: 'Suscríbete a EarlyMarketReports',
        description: 'Acceso inmediato a informes bursátiles diarios. Planes desde gratis.',
        image: '/og-subscribe.jpg',
        url: '/subscribe',
      },
    },
    en: {
      title: 'Subscribe | EarlyMarketReports - Immediate Access',
      description: 'Create your account and access daily stock reports. Free Lite plan or Pro with complete analysis. No commitment.',
      keywords: ['subscribe', 'register', 'account', 'reports', 'trading', 'free'],
      canonical: '/subscribe',
      openGraph: {
        title: 'Subscribe to EarlyMarketReports',
        description: 'Immediate access to daily stock reports. Plans from free.',
        image: '/og-subscribe.jpg',
        url: '/subscribe',
      },
    },
  },
  login: {
    es: {
      title: 'Iniciar Sesión | EarlyMarketReports',
      description: 'Accede a tu cuenta de EarlyMarketReports. Informes bursátiles diarios, análisis técnico y watchlist exclusiva.',
      keywords: ['login', 'iniciar sesión', 'acceso', 'cuenta', 'informes'],
      canonical: '/login',
    },
    en: {
      title: 'Login | EarlyMarketReports',
      description: 'Access your EarlyMarketReports account. Daily stock reports, technical analysis and exclusive watchlist.',
      keywords: ['login', 'sign in', 'access', 'account', 'reports'],
      canonical: '/login',
    },
  },
  terms: {
    es: {
      title: 'Términos y Condiciones | EarlyMarketReports',
      description: 'Términos y condiciones de uso de EarlyMarketReports. Información legal sobre nuestros servicios de análisis bursátil.',
      keywords: ['términos', 'condiciones', 'legal', 'uso', 'servicios'],
      canonical: '/legal/terminos',
    },
    en: {
      title: 'Terms and Conditions | EarlyMarketReports',
      description: 'Terms and conditions of use for EarlyMarketReports. Legal information about our stock analysis services.',
      keywords: ['terms', 'conditions', 'legal', 'usage', 'services'],
      canonical: '/legal/terminos',
    },
  },
  privacy: {
    es: {
      title: 'Política de Privacidad | EarlyMarketReports',
      description: 'Política de privacidad de EarlyMarketReports. Cómo protegemos y utilizamos tus datos personales.',
      keywords: ['privacidad', 'datos', 'protección', 'RGPD', 'personales'],
      canonical: '/legal/privacidad',
    },
    en: {
      title: 'Privacy Policy | EarlyMarketReports',
      description: 'EarlyMarketReports privacy policy. How we protect and use your personal data.',
      keywords: ['privacy', 'data', 'protection', 'GDPR', 'personal'],
      canonical: '/legal/privacidad',
    },
  },
  cookies: {
    es: {
      title: 'Política de Cookies | EarlyMarketReports',
      description: 'Política de cookies de EarlyMarketReports. Información sobre el uso de cookies en nuestro sitio web.',
      keywords: ['cookies', 'política', 'web', 'navegación', 'datos'],
      canonical: '/legal/cookies',
    },
    en: {
      title: 'Cookie Policy | EarlyMarketReports',
      description: 'EarlyMarketReports cookie policy. Information about cookie usage on our website.',
      keywords: ['cookies', 'policy', 'web', 'navigation', 'data'],
      canonical: '/legal/cookies',
    },
  },
  riskWarning: {
    es: {
      title: 'Aviso de Riesgos | EarlyMarketReports',
      description: 'Aviso de riesgos de EarlyMarketReports. Información importante sobre los riesgos de la inversión en mercados financieros.',
      keywords: ['riesgos', 'inversión', 'mercados', 'financieros', 'advertencia'],
      canonical: '/legal/aviso-riesgos',
    },
    en: {
      title: 'Risk Warning | EarlyMarketReports',
      description: 'EarlyMarketReports risk warning. Important information about investment risks in financial markets.',
      keywords: ['risks', 'investment', 'markets', 'financial', 'warning'],
      canonical: '/legal/aviso-riesgos',
    },
  },
};
