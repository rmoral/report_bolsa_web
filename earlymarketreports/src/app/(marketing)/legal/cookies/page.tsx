"use client";

import { useI18n } from "@/i18n/I18nProvider";

export default function CookiesPage() {
  const { t } = useI18n();

  return (
    <div className="container-page py-10">
      <h1 className="text-2xl sm:text-3xl font-bold text-[--color-primary] mb-8">
        Política de Cookies
      </h1>
      
      <div className="prose max-w-4xl mx-auto">
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-[--color-primary] mb-4">¿Qué son las cookies?</h2>
          <p className="mb-4">
            Las cookies son pequeños archivos de texto que se almacenan en su dispositivo cuando visita nuestro sitio web. 
            Nos ayudan a mejorar su experiencia de navegación y a entender cómo utiliza nuestro sitio.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-[--color-primary] mb-4">Tipos de cookies que utilizamos</h2>
          
          <h3 className="text-lg font-semibold mb-3">Cookies técnicas (necesarias)</h3>
          <p className="mb-4">
            Estas cookies son esenciales para el funcionamiento del sitio web y no se pueden desactivar. 
            Incluyen cookies de sesión, autenticación y preferencias básicas.
          </p>

          <h3 className="text-lg font-semibold mb-3">Cookies de rendimiento</h3>
          <p className="mb-4">
            Nos ayudan a entender cómo los visitantes interactúan con nuestro sitio web, 
            recopilando información de forma anónima. Utilizamos Google Analytics para este propósito.
          </p>

          <h3 className="text-lg font-semibold mb-3">Cookies de funcionalidad</h3>
          <p className="mb-4">
            Permiten que el sitio web recuerde las elecciones que hace (como su idioma preferido) 
            y proporcionen características mejoradas y más personales.
          </p>

          <h3 className="text-lg font-semibold mb-3">Cookies de marketing</h3>
          <p className="mb-4">
            Se utilizan para hacer que los mensajes publicitarios sean más relevantes para usted. 
            Solo se activan con su consentimiento explícito.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-[--color-primary] mb-4">Gestionar sus preferencias</h2>
          <p className="mb-4">
            Puede gestionar sus preferencias de cookies en cualquier momento haciendo clic en el botón 
            "Configurar cookies" en la parte inferior de nuestra página web.
          </p>
          <p className="mb-4">
            También puede configurar su navegador para rechazar cookies, aunque esto puede afectar 
            la funcionalidad de nuestro sitio web.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-[--color-primary] mb-4">Contacto</h2>
          <p className="mb-4">
            Si tiene preguntas sobre nuestra política de cookies, puede contactarnos en:
          </p>
          <p className="mb-4">
            Email: privacy@earlymarketreports.com
          </p>
        </section>

        <div className="text-sm text-gray-600 mt-8 pt-4 border-t">
          <p>Última actualización: {new Date().toLocaleDateString('es-ES')}</p>
        </div>
      </div>
    </div>
  );
}
