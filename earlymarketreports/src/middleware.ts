import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { locales, defaultLocale } from './i18n/config';
import { getLocaleFromPathname, getPathnameWithoutLocale } from './i18n/routing';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const pathnameHasLocale = locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );

  // Proteger rutas de informes completos
  if (pathname.startsWith('/reports/') && !pathname.includes('SAMPLE')) {
    // Verificar si es un PDF completo (no muestra)
    const filename = pathname.split('/').pop();
    if (filename && !filename.includes('SAMPLE')) {
      // Redirigir a la página de acceso protegido
      const protectedUrl = new URL(`/reports/${filename}`, request.url);
      return NextResponse.redirect(protectedUrl);
    }
  }

  // Manejar internacionalización
  if (!pathnameHasLocale) {
    // Redirigir a la versión localizada
    const locale = getLocaleFromRequest(request);
    const newUrl = new URL(`/${locale}${pathname}`, request.url);
    return NextResponse.redirect(newUrl);
  }

  // Añadir headers hreflang
  const response = NextResponse.next();
  const locale = getLocaleFromPathname(pathname);
  const pathWithoutLocale = getPathnameWithoutLocale(pathname);
  
  // Añadir hreflang headers
  locales.forEach((loc) => {
    const href = loc === defaultLocale 
      ? pathWithoutLocale 
      : `/${loc}${pathWithoutLocale}`;
    response.headers.set(`hreflang-${loc}`, href);
  });

  // Añadir header de idioma
  response.headers.set('Content-Language', locale);

  return response;
}

function getLocaleFromRequest(request: NextRequest): string {
  // Intentar obtener el idioma del header Accept-Language
  const acceptLanguage = request.headers.get('accept-language');
  if (acceptLanguage) {
    const preferredLocale = acceptLanguage
      .split(',')[0]
      .split('-')[0]
      .toLowerCase();
    
    if (locales.includes(preferredLocale as any)) {
      return preferredLocale;
    }
  }
  
  return defaultLocale;
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|reports).*)',
  ],
};
