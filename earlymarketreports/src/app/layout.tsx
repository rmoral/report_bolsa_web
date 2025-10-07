import type { Metadata } from "next";
import { Montserrat, Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";

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
        <Header />
        {children}
      </body>
    </html>
  );
}
