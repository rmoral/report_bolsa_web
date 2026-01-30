"use client";

import { useEffect } from "react";
import { usePageAlternates } from "@/i18n/PageAlternatesContext";
import type { Locale } from "@/i18n/config";

type Props = Partial<Record<Locale, string>>;

export default function SetPageAlternates(props: Props) {
  const { setAlternates } = usePageAlternates();
  const { en, es } = props;

  useEffect(() => {
    const next: Props = {};
    if (en) next.en = en;
    if (es) next.es = es;
    setAlternates(next);
    return () => setAlternates({});
  }, [en, es, setAlternates]);

  return null;
}
