"use client";

import { useI18n } from "@/i18n/I18nProvider";

export default function PrivacidadPage() {
  const { t } = useI18n();

  return (
    <div className="container-page py-10">
      <h1 className="text-2xl sm:text-3xl font-bold text-[--color-primary] mb-8">
        {t("privacy_title")}
      </h1>
      
      <div className="prose max-w-4xl mx-auto">
        <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
          <p className="text-sm text-blue-800">
            <strong>INFORMACIÓN IMPORTANTE:</strong> Esta Política de Privacidad describe cómo EarlyMarketReports 
            recopila, utiliza y protege su información personal de acuerdo con el Reglamento General de Protección 
            de Datos (RGPD) y la Ley Orgánica de Protección de Datos Personales y garantía de los derechos digitales (LOPDGDD).
          </p>
        </div>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-[--color-primary] mb-4">1. Responsable del Tratamiento</h2>
          <p className="mb-4">
            <strong>Identidad:</strong> EarlyMarketReports<br />
            <strong>Dirección:</strong> Madrid, España<br />
            <strong>Email:</strong> privacy@earlymarketreports.com<br />
            <strong>DPO (Delegado de Protección de Datos):</strong> dpo@earlymarketreports.com
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-[--color-primary] mb-4">2. Información que Recopilamos</h2>
          
          <h3 className="text-lg font-semibold mb-3">2.1 Información Personal</h3>
          <ul className="list-disc pl-6 mb-4">
            <li><strong>Datos de identificación:</strong> Nombre, apellidos, dirección de correo electrónico</li>
            <li><strong>Datos de contacto:</strong> Dirección de correo electrónico para comunicaciones</li>
            <li><strong>Datos de suscripción:</strong> Plan seleccionado (Lite/Pro), fecha de suscripción, estado de pago</li>
            <li><strong>Datos de uso:</strong> Páginas visitadas, tiempo de permanencia, interacciones con el contenido</li>
          </ul>

          <h3 className="text-lg font-semibold mb-3">2.2 Información Técnica</h3>
          <ul className="list-disc pl-6 mb-4">
            <li><strong>Datos de navegación:</strong> Dirección IP, tipo de navegador, sistema operativo</li>
            <li><strong>Cookies y tecnologías similares:</strong> Para mejorar la experiencia del usuario y analizar el tráfico</li>
            <li><strong>Datos de dispositivo:</strong> Tipo de dispositivo, resolución de pantalla, idioma preferido</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-[--color-primary] mb-4">3. Finalidades del Tratamiento</h2>
          
          <h3 className="text-lg font-semibold mb-3">3.1 Finalidades Principales</h3>
          <ul className="list-disc pl-6 mb-4">
            <li><strong>Prestación del servicio:</strong> Envío de informes bursátiles diarios según el plan contratado</li>
            <li><strong>Gestión de suscripciones:</strong> Procesamiento de pagos, facturación, gestión de cambios de plan</li>
            <li><strong>Comunicaciones:</strong> Notificaciones sobre el servicio, actualizaciones importantes</li>
            <li><strong>Soporte al cliente:</strong> Atención a consultas y resolución de incidencias</li>
          </ul>

          <h3 className="text-lg font-semibold mb-3">3.2 Finalidades Secundarias</h3>
          <ul className="list-disc pl-6 mb-4">
            <li><strong>Mejora del servicio:</strong> Análisis de uso para optimizar la experiencia del usuario</li>
            <li><strong>Marketing directo:</strong> Envío de ofertas y promociones (solo con consentimiento)</li>
            <li><strong>Análisis estadístico:</strong> Generación de informes agregados y anónimos</li>
            <li><strong>Cumplimiento legal:</strong> Cumplimiento de obligaciones fiscales y contables</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-[--color-primary] mb-4">4. Base Legal del Tratamiento</h2>
          <ul className="list-disc pl-6 mb-4">
            <li><strong>Ejecución contractual:</strong> Para la prestación del servicio de suscripción</li>
            <li><strong>Interés legítimo:</strong> Para la mejora del servicio y análisis estadístico</li>
            <li><strong>Consentimiento:</strong> Para el envío de comunicaciones comerciales</li>
            <li><strong>Cumplimiento legal:</strong> Para el cumplimiento de obligaciones fiscales</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-[--color-primary] mb-4">5. Conservación de Datos</h2>
          <ul className="list-disc pl-6 mb-4">
            <li><strong>Datos de suscripción activa:</strong> Durante la vigencia de la suscripción y 3 años adicionales</li>
            <li><strong>Datos de facturación:</strong> 6 años desde la última transacción (obligación fiscal)</li>
            <li><strong>Datos de marketing:</strong> Hasta la retirada del consentimiento</li>
            <li><strong>Datos de navegación:</strong> Máximo 2 años (cookies analíticas)</li>
            <li><strong>Datos de soporte:</strong> 3 años desde la resolución de la consulta</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-[--color-primary] mb-4">6. Compartir Información</h2>
          <p className="mb-4">No vendemos, alquilamos ni compartimos su información personal con terceros, excepto:</p>
          <ul className="list-disc pl-6 mb-4">
            <li><strong>Proveedores de servicios:</strong> Procesadores de pagos (Stripe), servicios de email (SendGrid)</li>
            <li><strong>Cumplimiento legal:</strong> Cuando sea requerido por ley o autoridades competentes</li>
            <li><strong>Protección de derechos:</strong> Para proteger nuestros derechos legales o los de nuestros usuarios</li>
            <li><strong>Consentimiento explícito:</strong> Cuando haya dado su consentimiento específico</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-[--color-primary] mb-4">7. Transferencias Internacionales</h2>
          <p className="mb-4">
            Algunos de nuestros proveedores de servicios pueden estar ubicados fuera del Espacio Económico Europeo. 
            En estos casos, garantizamos que se aplican las salvaguardas adecuadas:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li>Decisiones de adecuación de la Comisión Europea</li>
            <li>Cláusulas contractuales tipo aprobadas por la UE</li>
            <li>Certificaciones de privacidad reconocidas (Privacy Shield, etc.)</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-[--color-primary] mb-4">8. Sus Derechos</h2>
          <p className="mb-4">Como titular de los datos, tiene los siguientes derechos:</p>
          <ul className="list-disc pl-6 mb-4">
            <li><strong>Acceso:</strong> Conocer qué datos tenemos sobre usted</li>
            <li><strong>Rectificación:</strong> Corregir datos inexactos o incompletos</li>
            <li><strong>Supresión:</strong> Solicitar la eliminación de sus datos</li>
            <li><strong>Limitación:</strong> Restringir el tratamiento de sus datos</li>
            <li><strong>Portabilidad:</strong> Recibir sus datos en formato estructurado</li>
            <li><strong>Oposición:</strong> Oponerse al tratamiento por motivos legítimos</li>
            <li><strong>Retirada de consentimiento:</strong> En cualquier momento, sin afectar la licitud del tratamiento previo</li>
          </ul>
          <p className="mb-4">
            Para ejercer estos derechos, contacte con nosotros en: privacy@earlymarketreports.com
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-[--color-primary] mb-4">9. Cookies y Tecnologías Similares</h2>
          <p className="mb-4">Utilizamos cookies para:</p>
          <ul className="list-disc pl-6 mb-4">
            <li><strong>Cookies técnicas:</strong> Funcionamiento básico del sitio web</li>
            <li><strong>Cookies de preferencias:</strong> Recordar sus configuraciones (idioma, tema)</li>
            <li><strong>Cookies analíticas:</strong> Medir el uso del sitio web (Google Analytics)</li>
            <li><strong>Cookies de marketing:</strong> Mostrar publicidad relevante (solo con consentimiento)</li>
          </ul>
          <p className="mb-4">
            Puede gestionar sus preferencias de cookies a través del panel de configuración 
            disponible en nuestro sitio web.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-[--color-primary] mb-4">10. Seguridad de los Datos</h2>
          <p className="mb-4">Implementamos medidas técnicas y organizativas apropiadas para proteger sus datos:</p>
          <ul className="list-disc pl-6 mb-4">
            <li><strong>Cifrado:</strong> Datos transmitidos y almacenados con cifrado SSL/TLS</li>
            <li><strong>Acceso restringido:</strong> Solo personal autorizado puede acceder a los datos</li>
            <li><strong>Copias de seguridad:</strong> Respaldo regular y seguro de los datos</li>
            <li><strong>Monitoreo:</strong> Supervisión continua de accesos y actividades</li>
            <li><strong>Formación:</strong> Personal formado en protección de datos</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-[--color-primary] mb-4">11. Menores de Edad</h2>
          <p className="mb-4">
            Nuestros servicios no están dirigidos a menores de 16 años. No recopilamos 
            intencionalmente información personal de menores. Si un padre o tutor descubre 
            que su hijo nos ha proporcionado información personal, contacte con nosotros 
            para su eliminación.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-[--color-primary] mb-4">12. Cambios en esta Política</h2>
          <p className="mb-4">
            Podemos actualizar esta Política de Privacidad ocasionalmente. Los cambios 
            significativos serán notificados por email o mediante un aviso prominente 
            en nuestro sitio web. La fecha de la última actualización se indica al final 
            de este documento.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-[--color-primary] mb-4">13. Reclamaciones</h2>
          <p className="mb-4">
            Si considera que el tratamiento de sus datos personales no es adecuado, 
            puede presentar una reclamación ante la Agencia Española de Protección de Datos (AEPD):
          </p>
          <p className="mb-4">
            <strong>Agencia Española de Protección de Datos</strong><br />
            C/ Jorge Juan, 6 - 28001 Madrid<br />
            Teléfono: 901 100 099<br />
            Web: www.aepd.es
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-[--color-primary] mb-4">14. Contacto</h2>
          <p className="mb-4">
            Para cualquier consulta sobre esta Política de Privacidad o el tratamiento 
            de sus datos personales, puede contactarnos en:
          </p>
          <p className="mb-4">
            <strong>Email:</strong> privacy@earlymarketreports.com<br />
            <strong>DPO:</strong> dpo@earlymarketreports.com<br />
            <strong>Dirección:</strong> EarlyMarketReports, Madrid, España
          </p>
        </section>

        <div className="text-sm text-gray-600 mt-8 pt-4 border-t">
          <p>Última actualización: {new Date().toLocaleDateString('es-ES')}</p>
        </div>
      </div>
    </div>
  );
}
