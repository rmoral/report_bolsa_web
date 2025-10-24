"use client";

import { useState } from 'react';
import { useI18n } from '@/i18n/I18nProvider';

export default function StripeTestPanel() {
  const { t } = useI18n();
  const [testResults, setTestResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testStripeConfig = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/stripe/test-config');
      const data = await response.json();
      setTestResults(data);
    } catch (error) {
      setTestResults({ success: false, error: 'Failed to test configuration' });
    } finally {
      setLoading(false);
    }
  };

  const testCheckoutSession = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          plan: 'pro_monthly',
          userEmail: 'test@example.com',
          userName: 'Test User',
        }),
      });
      const data = await response.json();
      setTestResults(data);
    } catch (error) {
      setTestResults({ success: false, error: 'Failed to create checkout session' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-[--color-primary] mb-4">
        Stripe Testing Panel
      </h3>
      
      <div className="space-y-4">
        <div className="flex gap-4">
          <button
            onClick={testStripeConfig}
            disabled={loading}
            className="btn-primary"
          >
            {loading ? 'Testing...' : 'Test Stripe Config'}
          </button>
          
          <button
            onClick={testCheckoutSession}
            disabled={loading}
            className="btn-accent"
          >
            {loading ? 'Testing...' : 'Test Checkout Session'}
          </button>
        </div>

        {testResults && (
          <div className="mt-4">
            <h4 className="font-semibold mb-2">Test Results:</h4>
            <pre className="bg-gray-100 p-4 rounded-lg text-sm overflow-auto">
              {JSON.stringify(testResults, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}




