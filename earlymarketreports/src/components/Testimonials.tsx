import Stars from "./Stars";

type Testimonial = {
  name: string;
  role: string;
  rating: 4 | 5;
  text: string;
};

const testimonials: Testimonial[] = [
  {
    name: "María G.",
    role: "Gestora de patrimonio",
    rating: 5,
    text:
      "Los informes llegan antes de la apertura y me ahorran 40-50 minutos de preparación. El resumen de flujos y los niveles técnicos suelen coincidir con mis zonas de entrada.",
  },
  {
    name: "Javier L.",
    role: "Swing trader en USA",
    rating: 5,
    text:
      "El apartado de earnings y escenarios probables me ha ayudado a filtrar el ruido. He mejorado el ratio de acierto en la primera hora de mercado.",
  },
  {
    name: "Lucía P.",
    role: "Inversora particular",
    rating: 4,
    text:
      "La versión Lite es perfecta para seguir el mercado sin agobios. Pasé a Pro por las tablas con niveles y me han servido para no perseguir precio.",
  },
  {
    name: "Andrés R.",
    role: "Analista junior",
    rating: 5,
    text:
      "Me gusta que citen catalizadores y riesgos del día. El tono es directo y sin palabrería. Se nota la experiencia en la selección de activos.",
  },
  {
    name: "Sara M.",
    role: "Portfolio assistant",
    rating: 5,
    text:
      "El mapa sectorial y el comentario macro me sitúan en dos minutos. Tener watchlist con tesis y niveles ahorra muchísimo tiempo al equipo.",
  },
  {
    name: "Carlos V.",
    role: "Day trader",
    rating: 4,
    text:
      "Las alertas sobre yields y dólar han sido clave este trimestre. La lectura previa del mercado me ayuda a no forzar operaciones.",
  },
  {
    name: "Elena T.",
    role: "Gestora de SICAV",
    rating: 5,
    text:
      "Muy útil la parte de flujos y posicionamiento. Me ha dado contexto para rotar cartera sin improvisar, especialmente en resultados.",
  },
  {
    name: "Álvaro C.",
    role: "Trader independiente",
    rating: 5,
    text:
      "El informe está muy bien estructurado. Empiezo por el resumen, miro niveles y voy a las tesis. Los ejemplos de operativa aportan mucho.",
  },
  {
    name: "Nuria F.",
    role: "Financial advisor",
    rating: 5,
    text:
      "Contenido accionable. No es un boletín más, sino una guía de qué mirar y por qué. Mis clientes aprecian la claridad en la explicación.",
  },
  {
    name: "Héctor S.",
    role: "Trader intradía",
    rating: 4,
    text:
      "La coherencia entre el comentario de preapertura y el comportamiento posterior del mercado me da confianza para ejecutar el plan.",
  },
];

export default function Testimonials() {
  return (
    <section className="bg-white" id="testimonios">
      <div className="container-page py-12">
        <h2 className="text-2xl sm:text-3xl font-bold text-[--color-primary]">Testimonios</h2>
        <p className="text-gray-600 mt-2">Opiniones reales de profesionales e inversores particulares.</p>
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <article key={i} className="bg-[--emr-gray] rounded-lg p-5 border">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-[--color-primary]">{t.name}</h3>
                  <p className="text-sm text-gray-600">{t.role}</p>
                </div>
                <Stars rating={t.rating} />
              </div>
              <p className="mt-3 text-gray-800 text-sm leading-relaxed">{t.text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}


