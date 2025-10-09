import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

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

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/reports/:path*',
  ],
};
