"use client";

import { createContext, useContext, useCallback, useState } from "react";
import type { Locale } from "./config";

export type PageAlternates = Partial<Record<Locale, string>>;

type Ctx = {
  alternates: PageAlternates;
  setAlternates: (a: PageAlternates) => void;
};

const PageAlternatesCtx = createContext<Ctx | null>(null);

export function PageAlternatesProvider({ children }: { children: React.ReactNode }) {
  const [alternates, setAlternatesState] = useState<PageAlternates>({});

  const setAlternates = useCallback((a: PageAlternates) => {
    setAlternatesState(a);
  }, []);

  return (
    <PageAlternatesCtx.Provider value={{ alternates, setAlternates }}>
      {children}
    </PageAlternatesCtx.Provider>
  );
}

export function usePageAlternates() {
  const ctx = useContext(PageAlternatesCtx);
  return ctx ?? { alternates: {}, setAlternates: () => {} };
}
