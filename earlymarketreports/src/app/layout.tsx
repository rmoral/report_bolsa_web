import type { Metadata } from "next";
import { Montserrat, Inter } from "next/font/google";
import "./globals.css";
import { I18nProvider } from "@/i18n/I18nProvider";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import GoogleAnalytics from "@/components/GoogleAnalytics";
import GoogleTagManager, { GoogleTagManagerScript } from "@/components/GoogleTagManager";
import { locales, defaultLocale } from "@/i18n/config";
import { getAlternateLocales } from "@/i18n/routing";

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "EarlyMarketReports | Daily market reports",
    template: "%s | EarlyMarketReports",
  },
  description:
    "Daily market reports and analysis. Subscribe to Lite or Pro.",
  keywords: "market reports, technical analysis, trading, financial markets, investing, stocks",
  authors: [{ name: "EarlyMarketReports" }],
  creator: "EarlyMarketReports",
  publisher: "EarlyMarketReports",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL("https://earlymarketreports.com"),
  alternates: {
    canonical: "/",
    languages: {
      "en-US": "/",
      "es-ES": "/es",
    },
  },
  openGraph: {
    title: "EarlyMarketReports | Daily market reports",
    description:
      "Daily market reports and analysis. Subscribe to Lite or Pro.",
    type: "website",
    locale: "en_US",
    siteName: "EarlyMarketReports",
    images: [
      {
        url: "/og-home.jpg",
        width: 1200,
        height: 630,
        alt: "EarlyMarketReports - Daily market reports",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "EarlyMarketReports | Daily market reports",
    description:
      "Daily market reports and analysis. Subscribe to Lite or Pro.",
    images: ["/og-home.jpg"],
    creator: "@earlymarketreports",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: { 
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  manifest: "/site.webmanifest",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang={defaultLocale}>
      <head>
        {/* Google Tag Manager - Must be in head for all pages */}
        <GoogleTagManagerScript />
        {/* Hreflang tags */}
        {locales.map((locale) => (
          <link
            key={locale}
            rel="alternate"
            hrefLang={locale}
            href={`https://earlymarketreports.com/${locale === defaultLocale ? '' : locale}`}
          />
        ))}
        <link
          rel="alternate"
          hrefLang="x-default"
          href="https://earlymarketreports.com"
        />
      </head>
      <body suppressHydrationWarning className={`${montserrat.variable} ${inter.variable} antialiased`}>
        {/* Google Tag Manager - Loads on all pages (noscript fallback + Script component) */}
        <GoogleTagManager />
        {/* Schema.org Organization & WebSite */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Organization',
              name: 'EarlyMarketReports',
              url: 'https://earlymarketreports.com',
              logo: 'https://earlymarketreports.com/logo.png',
              sameAs: [
                'https://twitter.com/earlymarketreports',
                'https://linkedin.com/company/earlymarketreports'
              ],
              brand: {
                '@type': 'Brand',
                name: 'EarlyMarketReports'
              }
            })
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebSite',
              name: 'EarlyMarketReports',
              url: 'https://earlymarketreports.com',
              potentialAction: {
                '@type': 'SearchAction',
                target: 'https://earlymarketreports.com/search?q={search_term_string}',
                'query-input': 'required name=search_term_string'
              }
            })
          }}
        />
        <GoogleAnalytics />
        <I18nProvider>
          <div className="min-h-screen flex flex-col">
            <Header />
            <main className="flex-grow">
              {children}
            </main>
            <Footer />
          </div>
        </I18nProvider>
      </body>
    </html>
  );
}
