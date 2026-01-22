import { notFound } from 'next/navigation';
import { locales } from '@/i18n/config';

type Props = {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: Props) {
  const { locale } = await params
  // Validar que el locale es válido
  if (!locales.includes(locale as any)) {
    notFound();
  }

  return children;
}
