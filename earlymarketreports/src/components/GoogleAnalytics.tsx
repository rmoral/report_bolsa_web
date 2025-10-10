"use client";

import Script from "next/script";

const GA_TRACKING_ID = process.env.NEXT_PUBLIC_GA_ID;

export default function GoogleAnalytics() {
  if (!GA_TRACKING_ID) {
    return null;
  }

  return (
    <>
      <Script
        strategy="afterInteractive"
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_TRACKING_ID}`}
      />
      <Script
        id="google-analytics"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_TRACKING_ID}', {
              page_title: document.title,
              page_location: window.location.href,
            });
          `,
        }}
      />
    </>
  );
}

// Función para trackear eventos
export const trackEvent = (action: string, category: string, label?: string, value?: number) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value,
    });
  }
};

// Función para trackear conversiones
export const trackConversion = (eventName: string, value?: number, currency = 'EUR') => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', eventName, {
      value: value,
      currency: currency,
    });
  }
};

// Declarar gtag en el objeto window
declare global {
  interface Window {
    gtag: (...args: any[]) => void;
  }
}
