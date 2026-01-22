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
            <strong>IMPORTANT INFORMATION:</strong> This Privacy Policy describes how EarlyMarketReports collects, uses and protects your personal information in line with GDPR and applicable data protection laws.
          </p>
        </div>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-[--color-primary] mb-4">1. Data Controller</h2>
          <p className="mb-4">
            <strong>Identity:</strong> EarlyMarketReports<br />
            <strong>Address:</strong> Madrid, Spain<br />
            <strong>Email:</strong> privacy@earlymarketreports.com<br />
            <strong>DPO (Data Protection Officer):</strong> dpo@earlymarketreports.com
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-[--color-primary] mb-4">2. Information We Collect</h2>
          
          <h3 className="text-lg font-semibold mb-3">2.1 Personal Information</h3>
          <ul className="list-disc pl-6 mb-4">
            <li><strong>Identification data:</strong> Name, last name, email address</li>
            <li><strong>Contact data:</strong> Email address for communications</li>
            <li><strong>Subscription data:</strong> Selected plan (Lite/Pro), subscription date, payment status</li>
            <li><strong>Usage data:</strong> Pages visited, time on site, content interactions</li>
          </ul>

          <h3 className="text-lg font-semibold mb-3">2.2 Technical Information</h3>
          <ul className="list-disc pl-6 mb-4">
            <li><strong>Browsing data:</strong> IP address, browser type, operating system</li>
            <li><strong>Cookies and similar technologies:</strong> To improve experience and analyze traffic</li>
            <li><strong>Device data:</strong> Device type, screen resolution, preferred language</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-[--color-primary] mb-4">3. Purposes of Processing</h2>
          
          <h3 className="text-lg font-semibold mb-3">3.1 Primary Purposes</h3>
          <ul className="list-disc pl-6 mb-4">
            <li><strong>Service delivery:</strong> Sending daily market reports according to the plan</li>
            <li><strong>Subscription management:</strong> Payment processing, billing, plan changes</li>
            <li><strong>Communications:</strong> Service notices and important updates</li>
            <li><strong>Customer support:</strong> Handling inquiries and incidents</li>
          </ul>

          <h3 className="text-lg font-semibold mb-3">3.2 Secondary Purposes</h3>
          <ul className="list-disc pl-6 mb-4">
            <li><strong>Service improvement:</strong> Usage analytics to optimize user experience</li>
            <li><strong>Direct marketing:</strong> Offers and promotions (only with consent)</li>
            <li><strong>Statistical analysis:</strong> Aggregated and anonymized reporting</li>
            <li><strong>Legal compliance:</strong> Tax and accounting obligations</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-[--color-primary] mb-4">4. Legal Basis</h2>
          <ul className="list-disc pl-6 mb-4">
            <li><strong>Contract performance:</strong> Subscription service delivery</li>
            <li><strong>Legitimate interest:</strong> Service improvement and analytics</li>
            <li><strong>Consent:</strong> Commercial communications</li>
            <li><strong>Legal obligation:</strong> Tax and accounting compliance</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-[--color-primary] mb-4">5. Data Retention</h2>
          <ul className="list-disc pl-6 mb-4">
            <li><strong>Active subscription data:</strong> During the subscription and 3 additional years</li>
            <li><strong>Billing data:</strong> 6 years from last transaction (legal requirement)</li>
            <li><strong>Marketing data:</strong> Until consent is withdrawn</li>
            <li><strong>Browsing data:</strong> Up to 2 years (analytics cookies)</li>
            <li><strong>Support data:</strong> 3 years from ticket resolution</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-[--color-primary] mb-4">6. Sharing Information</h2>
          <p className="mb-4">We do not sell, rent, or share your personal information with third parties, except:</p>
          <ul className="list-disc pl-6 mb-4">
            <li><strong>Service providers:</strong> Payment processors (Stripe), email services (SendGrid)</li>
            <li><strong>Legal compliance:</strong> When required by law or authorities</li>
            <li><strong>Rights protection:</strong> To protect our legal rights or those of users</li>
            <li><strong>Explicit consent:</strong> When you have provided specific consent</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-[--color-primary] mb-4">7. International Transfers</h2>
          <p className="mb-4">
            Some of our service providers may be located outside your jurisdiction. In such cases, we ensure appropriate safeguards are applied:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li>Applicable adequacy decisions</li>
            <li>Standard contractual clauses</li>
            <li>Recognized privacy certifications</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-[--color-primary] mb-4">8. Your Rights</h2>
          <p className="mb-4">As a data subject, you have the following rights:</p>
          <ul className="list-disc pl-6 mb-4">
            <li><strong>Access:</strong> Know what data we hold about you</li>
            <li><strong>Rectification:</strong> Correct inaccurate or incomplete data</li>
            <li><strong>Erasure:</strong> Request deletion of your data</li>
            <li><strong>Restriction:</strong> Restrict processing of your data</li>
            <li><strong>Portability:</strong> Receive your data in a structured format</li>
            <li><strong>Objection:</strong> Object to processing on legitimate grounds</li>
            <li><strong>Withdraw consent:</strong> At any time, without affecting prior lawful processing</li>
          </ul>
          <p className="mb-4">
            To exercise these rights, contact us at: privacy@earlymarketreports.com
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-[--color-primary] mb-4">9. Cookies and Similar Technologies</h2>
          <p className="mb-4">We use cookies to:</p>
          <ul className="list-disc pl-6 mb-4">
            <li><strong>Technical cookies:</strong> Basic website operation</li>
            <li><strong>Preference cookies:</strong> Remember settings (language, theme)</li>
            <li><strong>Analytics cookies:</strong> Measure site usage (Google Analytics)</li>
            <li><strong>Marketing cookies:</strong> Show relevant ads (only with consent)</li>
          </ul>
          <p className="mb-4">
            You can manage your cookie preferences through the settings panel available on our website.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-[--color-primary] mb-4">10. Data Security</h2>
          <p className="mb-4">We implement appropriate technical and organizational measures to protect your data:</p>
          <ul className="list-disc pl-6 mb-4">
            <li><strong>Encryption:</strong> Data transmitted and stored with SSL/TLS encryption</li>
            <li><strong>Restricted access:</strong> Only authorized staff can access data</li>
            <li><strong>Backups:</strong> Regular and secure data backups</li>
            <li><strong>Monitoring:</strong> Continuous monitoring of access and activity</li>
            <li><strong>Training:</strong> Staff trained in data protection</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-[--color-primary] mb-4">11. Minors</h2>
          <p className="mb-4">
            Our services are not directed to individuals under 16. We do not knowingly collect personal information from minors. If a parent or guardian becomes aware that a child has provided personal information, please contact us for deletion.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-[--color-primary] mb-4">12. Changes to this Policy</h2>
          <p className="mb-4">
            We may update this Privacy Policy from time to time. Significant changes will be notified by email or through a prominent notice on our website. The date of the last update is indicated at the end of this document.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-[--color-primary] mb-4">13. Complaints</h2>
          <p className="mb-4">
            If you believe your personal data is being processed improperly, you may lodge a complaint with your local data protection authority. For EU residents, you can contact your national authority.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-[--color-primary] mb-4">14. Contact</h2>
          <p className="mb-4">
            For any questions about this Privacy Policy or the processing of your personal data, contact us at:
          </p>
          <p className="mb-4">
            <strong>Email:</strong> privacy@earlymarketreports.com<br />
            <strong>DPO:</strong> dpo@earlymarketreports.com<br />
            <strong>Address:</strong> EarlyMarketReports, Madrid, Spain
          </p>
        </section>

        <div className="text-sm text-gray-600 mt-8 pt-4 border-t">
          <p>Last updated: {new Date().toLocaleDateString('en-US')}</p>
        </div>
      </div>
    </div>
  );
}
