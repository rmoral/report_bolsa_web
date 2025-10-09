"use client";
import Stars from "./Stars";
import { useI18n } from "@/i18n/I18nProvider";

type Testimonial = { name: string; roleKey: string; textKey: string; rating: 4 | 5 };

const testimonials: Testimonial[] = [
  { name: "María G.", roleKey: "t1_role", textKey: "t1", rating: 5 },
  { name: "Javier L.", roleKey: "t2_role", textKey: "t2", rating: 5 },
  { name: "Lucía P.", roleKey: "t3_role", textKey: "t3", rating: 4 },
  { name: "Andrés R.", roleKey: "t4_role", textKey: "t4", rating: 5 },
  { name: "Sara M.", roleKey: "t5_role", textKey: "t5", rating: 5 },
  { name: "Carlos V.", roleKey: "t6_role", textKey: "t6", rating: 4 },
  { name: "Elena T.", roleKey: "t7_role", textKey: "t7", rating: 5 },
  { name: "Álvaro C.", roleKey: "t8_role", textKey: "t8", rating: 5 },
  { name: "Nuria F.", roleKey: "t9_role", textKey: "t9", rating: 5 },
  { name: "Héctor S.", roleKey: "t10_role", textKey: "t10", rating: 4 },
];

export default function Testimonials() {
  const { t } = useI18n();
  return (
    <section className="bg-white" id="testimonios">
      <div className="container-page py-12">
        <h2 className="text-2xl sm:text-3xl font-bold text-[--color-primary]">{t("testimonials_title")}</h2>
        <p className="text-gray-600 mt-2">{t("testimonials_intro")}</p>
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((item, i) => (
            <article key={i} className="bg-[--emr-gray] rounded-lg p-5 border">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-[--color-primary]">{item.name}</h3>
                  <p className="text-sm text-gray-600">{t(item.roleKey)}</p>
                </div>
                <Stars rating={item.rating} />
              </div>
              <p className="mt-3 text-gray-800 text-sm leading-relaxed">{t(item.textKey)}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}


