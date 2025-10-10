"use client";

import { useState, useEffect } from "react";

export default function SubscriberCounter() {
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

  // Prevent hydration mismatch by not rendering dynamic content until client-side
  if (!isClient) {
    return (
      <div className="hidden sm:flex items-center gap-2 text-sm text-gray-600">
        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
        <span>
          <span className="font-semibold text-[--color-primary]">2,487</span> suscriptores activos
        </span>
      </div>
    );
  }

  return (
    <div className="hidden sm:flex items-center gap-2 text-sm text-gray-600">
      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
      <span>
        <span className="font-semibold text-[--color-primary]">{count.toLocaleString()}</span> suscriptores activos
      </span>
    </div>
  );
}
