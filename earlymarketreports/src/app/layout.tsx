import type { Metadata } from "next";
import { Montserrat, Inter } from "next/font/google";
import "./globals.css";
import { I18nProvider } from "@/i18n/I18nProvider";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

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
  openGraph: {
    title: "EarlyMarketReports",
    description:
      "Informes bursátiles diarios y análisis del mercado. Suscríbete a la versión Lite o Pro.",
    type: "website",
  },
  icons: { icon: "/favicon.ico" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
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
