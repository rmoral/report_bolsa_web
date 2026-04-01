"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useI18n } from '@/i18n/I18nProvider';
import { SubscriptionPlan } from '@/types/subscription';
import { trackEvent } from '@/components/GoogleAnalytics';

interface CheckoutFormProps {
  onSuccess?: (sessionId: string) => void;
  onError?: (error: string) => void;
}

export default function CheckoutForm({ onSuccess, onError }: CheckoutFormProps) {
  const { t } = useI18n();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan>('pro_monthly');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
  });

  const plans = [
    {
      id: 'lite' as SubscriptionPlan,
      name: t('plan_lite_title'),
      price: '€0',
      period: t('free'),
      description: t('pricing_lite_desc'),
      features: [
        t('market_open_summary'),
        t('highlighted_opportunities'),
        t('key_levels'),
        t('macro_events'),
        t('delivered_before_open'),
      ],
      popular: false,
    },
    {
      id: 'pro_monthly' as SubscriptionPlan,
      name: t('plan_pro_title'),
      price: '€10',
      period: t('pricing_monthly'),
      description: t('pricing_pro_desc'),
      features: [
        t('market_open_summary'),
        t('highlighted_opportunities'),
        t('key_levels'),
        t('macro_events'),
        t('delivered_before_open'),
        t('full_pdf_access'),
        t('detailed_technical_analysis'),
        t('watchlist_15_tickers'),
        t('institutional_flow_analysis'),
        t('trading_strategies'),
        t('priority_support'),
        t('pro_community_access'),
        t('historical_reports'),
        t('satisfaction_guarantee'),
      ],
      popular: true,
    },
    {
      id: 'pro_annual' as SubscriptionPlan,
      name: t('plan_pro_title') + ' ' + t('pricing_annual'),
      price: '€99',
      period: t('pricing_annual'),
      description: t('pricing_pro_desc') + ' - ' + t('pricing_save', { percentage: 17 }),
      features: [
        t('market_open_summary'),
        t('highlighted_opportunities'),
        t('key_levels'),
        t('macro_events'),
        t('delivered_before_open'),
        t('full_pdf_access'),
        t('detailed_technical_analysis'),
        t('watchlist_15_tickers'),
        t('institutional_flow_analysis'),
        t('trading_strategies'),
        t('priority_support'),
        t('pro_community_access'),
        t('historical_reports'),
        t('satisfaction_guarantee'),
      ],
      popular: false,
    },
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.email || !formData.name) {
      onError?.('Please fill in all required fields');
      return;
    }

    setLoading(true);

    try {
      trackEvent('begin_checkout', 'subscription', selectedPlan);

      // Plan Lite: registro directo sin pasar por Stripe
      if (selectedPlan === 'lite') {
        if (!formData.password || !formData.phone) {
          onError?.('Please fill in all required fields');
          setLoading(false);
          return;
        }

        const response = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: formData.name,
            email: formData.email,
            password: formData.password,
            phone: formData.phone,
            plan: 'lite',
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Registration failed');
        }

        trackEvent('sign_up', 'subscription', 'lite');
        onSuccess?.(data.id);
        router.push('/dashboard?welcome=true');
        return;
      }

      // Planes Pro: flujo de Stripe Checkout
      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan: selectedPlan,
          userEmail: formData.email,
          userName: formData.name,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session');
      }

      trackEvent('checkout_session_created', 'subscription', selectedPlan);

      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL received');
      }

    } catch (error) {
      console.error('Checkout error:', error);
      onError?.(error instanceof Error ? error.message : 'An error occurred');
      trackEvent('checkout_error', 'subscription', selectedPlan);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Plan Selection */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-[--color-primary]">
            {t('choose_plan')}
          </h3>
          <div className="grid md:grid-cols-3 gap-4">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className={`relative p-6 border-2 rounded-lg cursor-pointer transition-all ${
                  selectedPlan === plan.id
                    ? 'border-[--color-accent] bg-[--color-accent]/5'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setSelectedPlan(plan.id)}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-[--color-accent] text-white text-xs px-3 py-1 rounded-full">
                      {t('popular')}
                    </span>
                  </div>
                )}
                
                <div className="text-center">
                  <h4 className="text-xl font-bold text-[--color-primary] mb-2">
                    {plan.name}
                  </h4>
                  <div className="mb-4">
                    <span className="text-3xl font-bold text-[--color-primary]">
                      {plan.price}
                    </span>
                    {plan.period && (
                      <span className="text-gray-600 ml-1">/{plan.period}</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mb-4">
                    {plan.description}
                  </p>
                </div>

                <ul className="space-y-2 text-sm">
                  {plan.features.slice(0, 5).map((feature, index) => (
                    <li key={index} className="flex items-center">
                      <span className="text-[--color-accent] mr-2">✓</span>
                      {feature}
                    </li>
                  ))}
                  {plan.features.length > 5 && (
                    <li className="text-gray-500 text-xs">
                      +{plan.features.length - 5} more features
                    </li>
                  )}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* User Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-[--color-primary]">
            {t('your_information')}
          </h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('field_name')} *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder={t('placeholder_name')}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[--color-accent] focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('field_email')} *
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder={t('placeholder_email')}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[--color-accent] focus:border-transparent"
                required
              />
            </div>
          </div>

          {/* Campos adicionales solo para el plan Lite */}
          {selectedPlan === 'lite' && (
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('field_password')} *
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder={t('placeholder_password')}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[--color-accent] focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('field_phone')} *
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder={t('placeholder_phone')}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[--color-accent] focus:border-transparent"
                  required
                />
              </div>
            </div>
          )}
        </div>

        {/* Submit Button */}
        <div className="text-center">
          <button
            type="submit"
            disabled={loading}
            className={`btn-accent px-8 py-4 text-lg font-semibold ${
              loading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {t('processing')}...
              </span>
            ) : (
              selectedPlan === 'lite' ? t('continue') : t('continue_with_payment')
            )}
          </button>
        </div>

        {/* Terms */}
        <div className="text-center text-sm text-gray-600">
          <p>
            {t('accept_terms')}{' '}
            <a href="/legal/terminos" className="text-[--color-accent] hover:underline">
              {t('terms')}
            </a>{' '}
            {t('and')}{' '}
            <a href="/legal/privacidad" className="text-[--color-accent] hover:underline">
              {t('privacy')}
            </a>
          </p>
        </div>
      </form>
    </div>
  );
}





