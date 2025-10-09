import { locales, defaultLocale } from './config';
import type { Locale } from './config';

export function getLocaleFromPathname(pathname: string): Locale {
  const segments = pathname.split('/');
  const locale = segments[1] as Locale;
  
  if (locales.includes(locale)) {
    return locale;
  }
  
  return defaultLocale;
}

export function getPathnameWithoutLocale(pathname: string): string {
  const segments = pathname.split('/');
  const locale = segments[1] as Locale;
  
  if (locales.includes(locale)) {
    return '/' + segments.slice(2).join('/');
  }
  
  return pathname;
}

export function createLocalizedPath(pathname: string, locale: Locale): string {
  const pathWithoutLocale = getPathnameWithoutLocale(pathname);
  
  if (locale === defaultLocale) {
    return pathWithoutLocale;
  }
  
  return `/${locale}${pathWithoutLocale}`;
}

export function getAlternateLocales(pathname: string): Array<{ locale: Locale; href: string }> {
  const currentPath = getPathnameWithoutLocale(pathname);
  
  return locales.map(locale => ({
    locale,
    href: createLocalizedPath(currentPath, locale)
  }));
}
