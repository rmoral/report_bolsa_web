"use client";

import { useI18n } from "@/i18n/I18nProvider";

export default function TerminosClient() {
  const { t } = useI18n();

  return (
    <div className="container-page py-10">
      <h1 className="text-2xl sm:text-3xl font-bold text-[--color-primary] mb-8">
        {t("terms_title")}
      </h1>
      
      <div className="prose max-w-none">
        <p className="text-gray-600 mb-6">
          Last updated: {new Date().toLocaleDateString('en-US')}
        </p>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-[--color-primary] mb-4">1. General Information</h2>
          <p className="text-gray-700 mb-4">
            EarlyMarketReports is a financial analysis and information service that provides daily stock market reports. By using our services, you agree to these terms and conditions.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-[--color-primary] mb-4">2. Service Description</h2>
          <p className="text-gray-700 mb-4">
            Our service includes:
          </p>
          <ul className="list-disc pl-6 text-gray-700 mb-4">
            <li>Daily stock market analysis reports</li>
            <li>Market summaries and investment opportunities</li>
            <li>Technical and fundamental analysis</li>
            <li>Watchlist of selected securities</li>
            <li>Customer support</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-[--color-primary] mb-4">3. Risk Notice</h2>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
            <p className="text-yellow-800 font-semibold mb-2">⚠️ IMPORTANT - RISK WARNING</p>
            <p className="text-yellow-700">
              Investing in financial markets involves significant risks. Security prices can go up or down, and investors may lose part or all of their investment. Our reports are for informational purposes only and do not constitute personalized financial advice.
            </p>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-[--color-primary] mb-4">4. Limitation of Liability</h2>
          <p className="text-gray-700 mb-4">
            EarlyMarketReports will not be liable for:
          </p>
          <ul className="list-disc pl-6 text-gray-700 mb-4">
            <li>Financial losses resulting from the use of our information</li>
            <li>Investment decisions based on our reports</li>
            <li>Service interruptions due to technical causes</li>
            <li>Errors or omissions in the information provided</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-[--color-primary] mb-4">5. Subscriptions and Payments</h2>
          <p className="text-gray-700 mb-4">
            Subscriptions renew automatically. You can cancel at any time from your user area. Payments are securely processed via Stripe.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-[--color-primary] mb-4">6. Intellectual Property</h2>
          <p className="text-gray-700 mb-4">
            All EarlyMarketReports content is protected by copyright. Reproduction, distribution, or commercial use is not permitted without express authorization.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-[--color-primary] mb-4">7. Modifications</h2>
          <p className="text-gray-700 mb-4">
            We reserve the right to modify these terms at any time. Changes take effect immediately upon publication on the website.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-[--color-primary] mb-4">8. Contact</h2>
          <p className="text-gray-700 mb-4">
            For any questions regarding these terms, you can contact us at:
          </p>
          <p className="text-gray-700">
            Email: legal@earlymarketreports.com<br />
            Address: [Company address]
          </p>
        </section>
      </div>
    </div>
  );
}
