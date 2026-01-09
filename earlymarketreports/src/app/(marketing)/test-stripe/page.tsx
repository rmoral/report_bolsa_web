"use client";

import { useI18n } from '@/i18n/I18nProvider';
import StripeTestPanel from '@/components/StripeTestPanel';
import CheckoutForm from '@/components/CheckoutForm';
import SubscriptionManager from '@/components/SubscriptionManager';

export default function TestStripePage() {
  const { t } = useI18n();

  return (
    <div className="container-page py-10">
      <div className="text-center mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold text-[--color-primary] mb-4">
          Stripe Testing Page
        </h1>
        <p className="text-lg text-gray-600">
          Test Stripe integration and checkout flow
        </p>
      </div>

      <div className="space-y-8">
        {/* Test Panel */}
        <StripeTestPanel />

        {/* Checkout Form Test */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-[--color-primary] mb-4">
            Checkout Form Test
          </h3>
          <CheckoutForm 
            onSuccess={(sessionId) => {
              console.log('Checkout success:', sessionId);
            }}
            onError={(error) => {
              console.error('Checkout error:', error);
            }}
          />
        </div>

        {/* Subscription Manager Test */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-[--color-primary] mb-4">
            Subscription Manager Test
          </h3>
          <p className="text-gray-600 mb-4">
            This will show subscription data if you have a customer ID
          </p>
          <SubscriptionManager 
            customerId="cus_test_customer_id" // Replace with actual customer ID for testing
          />
        </div>
      </div>
    </div>
  );
}





