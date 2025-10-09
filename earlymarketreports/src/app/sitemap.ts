import { MetadataRoute } from 'next';
import { locales, defaultLocale } from '@/i18n/config';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://earlymarketreports.com';
  const routes = [
    '',
    '/precios',
    '/legal/terminos',
    '/legal/privacidad',
    '/legal/cookies',
    '/legal/aviso-riesgos',
    '/subscribe',
    '/login',
  ];

  const sitemap: MetadataRoute.Sitemap = [];

  // Generar rutas para cada idioma
  locales.forEach((locale) => {
    routes.forEach((route) => {
      const url = locale === defaultLocale 
        ? `${baseUrl}${route}` 
        : `${baseUrl}/${locale}${route}`;
      
      sitemap.push({
        url,
        lastModified: new Date(),
        changeFrequency: route === '' ? 'daily' : 'monthly',
        priority: route === '' ? 1 : route === '/precios' ? 0.8 : 0.5,
        alternates: {
          languages: locales.reduce((acc, loc) => {
            acc[loc] = loc === defaultLocale 
              ? `${baseUrl}${route}` 
              : `${baseUrl}/${loc}${route}`;
            return acc;
          }, {} as Record<string, string>),
        },
      });
    });
  });

  return sitemap;
}