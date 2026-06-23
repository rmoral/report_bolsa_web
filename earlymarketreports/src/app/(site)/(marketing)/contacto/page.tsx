"use client";

import { useState } from "react";
import { useI18n } from "@/i18n/I18nProvider";

export default function ContactPage() {
  const { t } = useI18n();
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) {
      setError(t("error_fill_required_fields"));
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al enviar");
      setSuccess(true);
      setForm({ name: "", email: "", subject: "", message: "" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-page py-12">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-3xl sm:text-4xl font-bold text-[--color-primary] mb-4">
            {t("contact_title")}
          </h1>
          <p className="text-lg text-gray-600">
            {t("contact_subtitle")}
          </p>
        </div>

        {/* Success */}
        {success ? (
          <div className="bg-green-50 border border-green-200 rounded-lg p-8 text-center">
            <div className="text-4xl mb-3">✅</div>
            <h2 className="text-xl font-semibold text-green-800 mb-2">{t("contact_success_title")}</h2>
            <p className="text-green-700">{t("contact_success_body")}</p>
            <button
              className="mt-6 btn-accent"
              onClick={() => setSuccess(false)}
            >
              {t("contact_send_another")}
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t("field_name")} *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder={t("placeholder_name")}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[--color-accent] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t("field_email")} *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder={t("placeholder_email")}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[--color-accent] focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("contact_subject")}
                </label>
                <select
                  name="subject"
                  value={form.subject}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[--color-accent] focus:border-transparent bg-white"
                >
                  <option value="">{t("contact_subject_placeholder")}</option>
                  <option value="soporte">{t("contact_subject_support")}</option>
                  <option value="facturacion">{t("contact_subject_billing")}</option>
                  <option value="prensa">{t("contact_subject_press")}</option>
                  <option value="otro">{t("contact_subject_other")}</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("contact_message")} *
                </label>
                <textarea
                  name="message"
                  value={form.message}
                  onChange={handleChange}
                  placeholder={t("contact_message_placeholder")}
                  rows={5}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[--color-accent] focus:border-transparent resize-none"
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full btn-accent py-3 text-base font-semibold disabled:opacity-50"
              >
                {loading ? t("contact_sending") : t("contact_send")}
              </button>
            </form>

            {/* Alternative contact */}
            <div className="mt-8 pt-6 border-t border-gray-100 text-center text-sm text-gray-500">
              <p>{t("contact_also_email")}{" "}
                <a href="mailto:info@earlymarketreports.com" className="text-[--color-accent] hover:underline font-medium">
                  info@earlymarketreports.com
                </a>
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
