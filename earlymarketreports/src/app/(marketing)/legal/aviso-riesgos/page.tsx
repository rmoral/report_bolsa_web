"use client";

import { useI18n } from "@/i18n/I18nProvider";

export default function AvisoRiesgosPage() {
  const { t } = useI18n();

  return (
    <div className="container-page py-10">
      <h1 className="text-2xl sm:text-3xl font-bold text-[--color-primary] mb-8">
        Financial Risk Warning
      </h1>
      
      <div className="prose max-w-4xl mx-auto">
        <div className="bg-red-50 border-l-4 border-red-400 p-6 mb-8">
          <h2 className="text-xl font-semibold text-red-800 mb-4">⚠️ IMPORTANT WARNING</h2>
          <p className="text-red-800 font-semibold">
            Reports and analysis provided by EarlyMarketReports DO NOT CONSTITUTE FINANCIAL, INVESTMENT, LEGAL OR TAX ADVICE. All information is for informational and educational purposes only.
          </p>
        </div>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-[--color-primary] mb-4">Investment Risks</h2>
          <p className="mb-4">
            Investing in financial markets carries significant risks that may result in the loss of your invested capital. It is important that you understand these risks before making any investment decisions.
          </p>
          
          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li><strong>Capital loss risk:</strong> You can lose all or part of the money you invest</li>
            <li><strong>Market volatility:</strong> Security prices can fluctuate significantly</li>
            <li><strong>Liquidity risk:</strong> You may not be able to sell your investments when you want</li>
            <li><strong>Currency risk:</strong> Exchange rate fluctuations can affect investment value</li>
            <li><strong>Concentration risk:</strong> Investing in few securities increases specific risk</li>
            <li><strong>Inflation risk:</strong> Inflation can erode purchasing power of returns</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-[--color-primary] mb-4">Information Limitations</h2>
          <p className="mb-4">
            Information provided by EarlyMarketReports has the following limitations:
          </p>
          
          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li>It is not personalized advice for your specific situation</li>
            <li>It does not consider your objectives, financial situation or needs</li>
            <li>It may contain errors, omissions or outdated information</li>
            <li>Past performance does not guarantee future results</li>
            <li>It does not include all relevant risks and considerations</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-[--color-primary] mb-4">Important Recommendations</h2>
          <div className="bg-blue-50 border-l-4 border-blue-400 p-6 mb-4">
            <h3 className="text-lg font-semibold text-blue-800 mb-3">Before investing:</h3>
            <ul className="list-disc pl-6 space-y-2 text-blue-800">
              <li>Consult an independent, qualified financial advisor</li>
              <li>Carefully assess your financial situation and goals</li>
              <li>Diversify your portfolio to reduce risk</li>
              <li>Only invest money you can afford to lose</li>
              <li>Fully understand the products you invest in</li>
            </ul>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-[--color-primary] mb-4">Disclaimer</h2>
          <p className="mb-4">
            EarlyMarketReports, its employees, directors and affiliates will not be liable for:
          </p>
          
          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li>Financial losses from the use of our information</li>
            <li>Investment decisions based on our reports</li>
            <li>Errors, omissions or inaccuracies in the information provided</li>
            <li>Service interruptions or technical issues</li>
            <li>Indirect, incidental or consequential damages</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-[--color-primary] mb-4">Regulation and Oversight</h2>
          <p className="mb-4">
            EarlyMarketReports is not regulated as an investment advisor. Our services are for informational and educational purposes only. If you need personalized financial advice, consult a regulated professional in your jurisdiction.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-[--color-primary] mb-4">Contact</h2>
          <p className="mb-4">
            If you have questions about this risk warning, you can contact us at:
          </p>
          <p className="mb-4">
            Email: legal@earlymarketreports.com<br />
            Address: EarlyMarketReports, Madrid, Spain
          </p>
        </section>

        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-6 mt-8">
          <p className="text-yellow-800 font-semibold">
            Al utilizar nuestros servicios, usted reconoce que ha leído, entendido y acepta este aviso de riesgos. 
            Si no está de acuerdo con alguna parte de este aviso, no debe utilizar nuestros servicios.
          </p>
        </div>

        <div className="text-sm text-gray-600 mt-8 pt-4 border-t">
          <p>Last updated: {new Date().toLocaleDateString('en-US')}</p>
        </div>
      </div>
    </div>
  );
}
