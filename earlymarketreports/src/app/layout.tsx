import type { Metadata } from "next";
import { Montserrat, Inter } from "next/font/google";
import "./globals.css";
import { I18nProvider } from "@/i18n/I18nProvider";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
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
    default: "EarlyMarketReports | Informes bursátiles diarios",
    template: "%s | EarlyMarketReports",
  },
  description:
    "Informes bursátiles diarios y análisis del mercado. Suscríbete a la versión Lite o Pro.",
  keywords: "informes bursátiles, análisis técnico, trading, mercados financieros, inversión, bolsa",
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
      "es-ES": "/",
      "en-US": "/en",
    },
  },
  openGraph: {
    title: "EarlyMarketReports | Informes bursátiles diarios",
    description:
      "Informes bursátiles diarios y análisis del mercado. Suscríbete a la versión Lite o Pro.",
    type: "website",
    locale: "es_ES",
    siteName: "EarlyMarketReports",
    images: [
      {
        url: "/og-home.jpg",
        width: 1200,
        height: 630,
        alt: "EarlyMarketReports - Informes bursátiles diarios",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "EarlyMarketReports | Informes bursátiles diarios",
    description:
      "Informes bursátiles diarios y análisis del mercado. Suscríbete a la versión Lite o Pro.",
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
