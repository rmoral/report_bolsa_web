"use client";

import { useI18n } from "@/i18n/I18nProvider";

export default function CookiesPage() {
  const { t } = useI18n();

  return (
    <div className="container-page py-10">
      <h1 className="text-2xl sm:text-3xl font-bold text-[--color-primary] mb-8">
        Cookie Policy
      </h1>
      
      <div className="prose max-w-4xl mx-auto">
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-[--color-primary] mb-4">What are cookies?</h2>
          <p className="mb-4">
            Cookies are small text files stored on your device when you visit our website. They help improve your browsing experience and help us understand how you use our site.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-[--color-primary] mb-4">Types of cookies we use</h2>
          
          <h3 className="text-lg font-semibold mb-3">Technical (necessary) cookies</h3>
          <p className="mb-4">
            These cookies are essential for the website to function and cannot be disabled. They include session, authentication and basic preferences cookies.
          </p>

          <h3 className="text-lg font-semibold mb-3">Performance cookies</h3>
          <p className="mb-4">
            They help us understand how visitors interact with our site by collecting information anonymously. We use Google Analytics for this purpose.
          </p>

          <h3 className="text-lg font-semibold mb-3">Functionality cookies</h3>
          <p className="mb-4">
            They allow the site to remember choices you make (such as your preferred language) and provide enhanced, more personal features.
          </p>

          <h3 className="text-lg font-semibold mb-3">Marketing cookies</h3>
          <p className="mb-4">
            Used to make advertising messages more relevant to you. They are only enabled with your explicit consent.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-[--color-primary] mb-4">Manage your preferences</h2>
          <p className="mb-4">
            You can manage your cookie preferences at any time by clicking the "Cookie settings" button at the bottom of our website.
          </p>
          <p className="mb-4">
            You can also configure your browser to reject cookies, although this may affect the functionality of our site.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-[--color-primary] mb-4">Contact</h2>
          <p className="mb-4">
            If you have questions about our cookie policy, you can contact us at:
          </p>
          <p className="mb-4">
            Email: privacy@earlymarketreports.com
          </p>
        </section>

        <div className="text-sm text-gray-600 mt-8 pt-4 border-t">
          <p>Last updated: {new Date().toLocaleDateString('en-US')}</p>
        </div>
      </div>
    </div>
  );
}
