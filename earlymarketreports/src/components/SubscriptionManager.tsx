"use client";

import { useState, useEffect } from 'react';
import { useI18n } from '@/i18n/I18nProvider';
import { Subscription, BillingHistoryItem } from '@/types/subscription';
import { trackEvent } from '@/components/GoogleAnalytics';
import UpgradeButton from '@/components/UpgradeButton';

interface SubscriptionManagerProps {
  userId?: string;
  customerId?: string;
}

export default function SubscriptionManager({ userId, customerId }: SubscriptionManagerProps) {
  const { t } = useI18n();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [billingHistory, setBillingHistory] = useState<BillingHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (customerId) {
      fetchSubscriptionData();
    }
  }, [customerId]);

  const fetchSubscriptionData = async () => {
    try {
      setLoading(true);
      
      // Fetch subscription data
      const subscriptionResponse = await fetch(`/api/stripe/subscription?customerId=${customerId}`);
      if (subscriptionResponse.ok) {
        const subscriptionData = await subscriptionResponse.json();
        setSubscription(subscriptionData.subscription);
      }

      // Fetch billing history
      const billingResponse = await fetch(`/api/stripe/billing-history?customerId=${customerId}`);
      if (billingResponse.ok) {
        const billingData = await billingResponse.json();
        setBillingHistory(billingData.billingHistory);
      }

    } catch (error) {
      console.error('Error fetching subscription data:', error);
      setError('Failed to load subscription data');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!subscription?.stripeSubscriptionId) return;

    try {
      const response = await fetch('/api/stripe/cancel-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscriptionId: subscription.stripeSubscriptionId,
          immediately: false, // Cancel at period end
        }),
      });

      if (response.ok) {
        trackEvent('subscription_canceled', 'subscription', subscription.plan);
        await fetchSubscriptionData(); // Refresh data
      } else {
        throw new Error('Failed to cancel subscription');
      }
    } catch (error) {
      console.error('Error canceling subscription:', error);
      setError('Failed to cancel subscription');
    }
  };

  const handleUpgradePlan = async (newPlan: string) => {
    if (!subscription?.stripeSubscriptionId) return;

    try {
      const response = await fetch('/api/stripe/update-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscriptionId: subscription.stripeSubscriptionId,
          plan: newPlan,
        }),
      });

      if (response.ok) {
        trackEvent('subscription_upgraded', 'subscription', newPlan);
        await fetchSubscriptionData(); // Refresh data
      } else {
        throw new Error('Failed to update subscription');
      }
    } catch (error) {
      console.error('Error updating subscription:', error);
      setError('Failed to update subscription');
    }
  };

  const openCustomerPortal = async () => {
    if (!customerId) return;

    try {
      const response = await fetch('/api/stripe/customer-portal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customerId,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        window.location.href = data.url;
      } else {
        throw new Error('Failed to open customer portal');
      }
    } catch (error) {
      console.error('Error opening customer portal:', error);
      setError('Failed to open customer portal');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[--color-accent]"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-700">{error}</p>
      </div>
    );
  }

  if (!subscription) {
    return (
      <div className="text-center py-8 space-y-4">
        <p className="text-gray-600">No hay ninguna suscripción activa.</p>
        <div className="flex justify-center gap-3">
          <UpgradeButton plan="pro_monthly" label="Pro Mensual — €198/mes" className="btn-accent" />
          <UpgradeButton plan="pro_annual" label="Pro Anual — €1.980/año" className="btn-primary" />
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-green-600 bg-green-100';
      case 'canceled':
        return 'text-red-600 bg-red-100';
      case 'past_due':
        return 'text-yellow-600 bg-yellow-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getPlanName = (plan: string) => {
    switch (plan) {
      case 'lite':
        return 'Lite';
      case 'pro_monthly':
        return 'Pro Monthly';
      case 'pro_annual':
        return 'Pro Annual';
      default:
        return plan;
    }
  };

  return (
    <div className="space-y-6">
      {/* Current Subscription */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-[--color-primary] mb-4">
          {t('current_subscription')}
        </h3>
        
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">{t('plan')}</span>
              <span className="font-semibold">{getPlanName(subscription.plan)}</span>
            </div>
            
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">{t('status')}</span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(subscription.status)}`}>
                {subscription.status}
              </span>
            </div>
            
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">{t('next_billing')}</span>
              <span className="text-sm">
                {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
              </span>
            </div>
            
            {subscription.cancelAtPeriodEnd && (
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-red-600">{t('cancels_at_period_end')}</span>
                <span className="text-sm text-red-600">
                  {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                </span>
              </div>
            )}
          </div>
          
          <div className="space-y-3">
            {subscription.plan === 'lite' && (
              <UpgradeButton plan="pro_monthly" label={t('upgrade_to_pro')} className="w-full btn-accent text-sm" />
            )}
            
            {subscription.plan === 'pro_monthly' && (
              <button
                onClick={() => handleUpgradePlan('pro_annual')}
                className="w-full btn-primary text-sm"
              >
                {t('upgrade_to_annual')}
              </button>
            )}
            
            {subscription.status === 'active' && !subscription.cancelAtPeriodEnd && (
              <button
                onClick={handleCancelSubscription}
                className="w-full btn-secondary text-sm"
              >
                {t('cancel_subscription')}
              </button>
            )}
            
            <button
              onClick={openCustomerPortal}
              className="w-full btn-outline text-sm"
            >
              {t('manage_billing')}
            </button>
          </div>
        </div>
      </div>

      {/* Billing History */}
      {billingHistory.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-[--color-primary] mb-4">
            {t('billing_history')}
          </h3>
          
          <div className="space-y-3">
            {billingHistory.map((item) => (
              <div key={item.id} className="flex items-center justify-between py-3 border-b border-gray-200 last:border-b-0">
                <div>
                  <p className="font-medium">{item.description}</p>
                  <p className="text-sm text-gray-600">
                    {item.date.toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">
                    €{(item.amount / 100).toFixed(2)}
                  </p>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    item.status === 'paid' 
                      ? 'text-green-600 bg-green-100' 
                      : item.status === 'pending'
                      ? 'text-yellow-600 bg-yellow-100'
                      : 'text-red-600 bg-red-100'
                  }`}>
                    {item.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}





