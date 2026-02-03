"use client";

import { useState, useEffect } from "react";
import { useI18n } from "@/i18n/I18nProvider";

export default function SubscriberCounter({ alwaysShow }: { alwaysShow?: boolean }) {
  const { t } = useI18n();
  const [count, setCount] = useState(2487);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    
    // Simular crecimiento de suscriptores
    const interval = setInterval(() => {
      setCount(prev => prev + Math.floor(Math.random() * 3) + 1);
    }, 30000); // Actualizar cada 30 segundos

    return () => clearInterval(interval);
  }, []);

  const showClass = alwaysShow ? "flex" : "hidden sm:flex";

  // Prevent hydration mismatch by not rendering dynamic content until client-side
  if (!isClient) {
    return (
      <div className={`${showClass} items-center gap-2 text-sm text-gray-600`}>
        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
        <span>
          <span className="font-semibold text-[--color-primary]">2,487</span> {t("active_subscribers")}
        </span>
      </div>
    );
  }

  return (
    <div className={`${showClass} items-center gap-2 text-sm text-gray-600`}>
      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
      <span>
        <span className="font-semibold text-[--color-primary]">{count.toLocaleString()}</span> {t("active_subscribers")}
      </span>
    </div>
  );
}
