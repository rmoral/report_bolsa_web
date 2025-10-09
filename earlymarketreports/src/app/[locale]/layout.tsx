import { notFound } from 'next/navigation';
import { locales } from '@/i18n/config';

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  // Validar que el locale es válido
  if (!locales.includes(params.locale as any)) {
    notFound();
  }

  return children;
}
