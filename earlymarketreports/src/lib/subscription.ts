import { stripe, STRIPE_CONFIG, SUBSCRIPTION_PLANS } from './stripe';
import { SubscriptionPlan, SubscriptionStatus, User, Subscription } from '@/types/subscription';

/**
 * Create a Stripe customer
 */
export async function createStripeCustomer(user: { email: string; name?: string }) {
  try {
    const customer = await stripe.customers.create({
      email: user.email,
      name: user.name,
      metadata: {
        userId: user.email, // We'll use email as user ID for now
      },
    });
    
    return customer;
  } catch (error) {
    console.error('Error creating Stripe customer:', error);
    throw new Error('Failed to create customer');
  }
}

/**
 * Create a checkout session for subscription
 */
export async function createCheckoutSession({
  customerId,
  priceId,
  plan,
  successUrl,
  cancelUrl,
}: {
  customerId: string;
  priceId: string | null;
  plan: SubscriptionPlan;
  successUrl: string;
  cancelUrl: string;
}) {
  try {
    // For Pro plans, use price_data directly (more reliable)
    const amount = plan === 'pro_monthly' ? 1000 : 9900; // €10 or €99
    const interval = plan === 'pro_monthly' ? 'month' : 'year';
    
    const lineItems = [
      {
        price_data: {
          currency: 'eur',
          product_data: {
            name: `EarlyMarketReports Pro ${plan === 'pro_monthly' ? 'Monthly' : 'Annual'}`,
            description: 'Professional daily stock market reports',
          },
          unit_amount: amount,
          recurring: {
            interval: interval as 'month' | 'year',
          },
        },
        quantity: 1,
      },
    ];

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'subscription',
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        plan,
        priceId,
      },
      allow_promotion_codes: true,
      billing_address_collection: 'required',
      customer_update: {
        name: 'auto',
        address: 'auto',
      },
      // tax_id_collection: {
      //   enabled: true,
      // },
    });

    return session;
  } catch (error) {
    console.error('Error creating checkout session:', error);
    console.error('Error details:', error);
    throw new Error(`Failed to create checkout session: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get subscription by customer ID
 */
export async function getSubscriptionByCustomerId(customerId: string) {
  try {
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: 'all',
      limit: 1,
    });

    return subscriptions.data[0] || null;
  } catch (error) {
    console.error('Error fetching subscription:', error);
    return null;
  }
}

/**
 * Cancel subscription
 */
export async function cancelSubscription(subscriptionId: string, immediately = false) {
  try {
    if (immediately) {
      return await stripe.subscriptions.cancel(subscriptionId);
    } else {
      return await stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: true,
      });
    }
  } catch (error) {
    console.error('Error canceling subscription:', error);
    throw new Error('Failed to cancel subscription');
  }
}

/**
 * Update subscription plan
 */
export async function updateSubscriptionPlan(
  subscriptionId: string,
  newPriceId: string,
  prorationBehavior: 'create_prorations' | 'none' | 'always_invoice' = 'create_prorations'
) {
  try {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    
    return await stripe.subscriptions.update(subscriptionId, {
      items: [
        {
          id: subscription.items.data[0].id,
          price: newPriceId,
        },
      ],
      proration_behavior: prorationBehavior,
    });
  } catch (error) {
    console.error('Error updating subscription:', error);
    throw new Error('Failed to update subscription');
  }
}

/**
 * Get customer's billing history
 */
export async function getBillingHistory(customerId: string, limit = 10) {
  try {
    const invoices = await stripe.invoices.list({
      customer: customerId,
      limit,
    });

    return invoices.data.map(invoice => ({
      id: invoice.id,
      amount: invoice.amount_paid,
      currency: invoice.currency,
      status: invoice.status as 'paid' | 'pending' | 'failed',
      description: invoice.description || 'Subscription payment',
      date: new Date(invoice.created * 1000),
      invoiceUrl: invoice.hosted_invoice_url,
    }));
  } catch (error) {
    console.error('Error fetching billing history:', error);
    return [];
  }
}

/**
 * Create customer portal session
 */
export async function createCustomerPortalSession(customerId: string, returnUrl: string) {
  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });

    return session;
  } catch (error) {
    console.error('Error creating customer portal session:', error);
    throw new Error('Failed to create customer portal session');
  }
}

/**
 * Helper function to map Stripe subscription status to our status
 */
export function mapStripeStatusToSubscriptionStatus(stripeStatus: string): SubscriptionStatus {
  switch (stripeStatus) {
    case 'active':
      return 'active';
    case 'canceled':
      return 'canceled';
    case 'incomplete':
      return 'incomplete';
    case 'incomplete_expired':
      return 'incomplete_expired';
    case 'past_due':
      return 'past_due';
    case 'trialing':
      return 'trialing';
    case 'unpaid':
      return 'unpaid';
    default:
      return 'incomplete';
  }
}

/**
 * Helper function to get plan name by price ID
 */
export function getPlanNameByPriceId(priceId: string): string {
  if (priceId === STRIPE_CONFIG.PRICES.LITE) return 'Lite';
  if (priceId === STRIPE_CONFIG.PRICES.PRO_MONTHLY) return 'Pro Monthly';
  if (priceId === STRIPE_CONFIG.PRICES.PRO_ANNUAL) return 'Pro Annual';
  return 'Unknown Plan';
}

/**
 * Helper function to get price ID by plan
 */
export function getPriceIdByPlan(plan: SubscriptionPlan): string | null {
  switch (plan) {
    case 'lite':
      return STRIPE_CONFIG.PRICES.LITE;
    case 'pro_monthly':
      return STRIPE_CONFIG.PRICES.PRO_MONTHLY;
    case 'pro_annual':
      return STRIPE_CONFIG.PRICES.PRO_ANNUAL;
    default:
      return null;
  }
}

/**
 * Check if user has active subscription
 */
export function hasActiveSubscription(subscription: Subscription | null): boolean {
  if (!subscription) return false;
  return subscription.status === 'active' || subscription.status === 'trialing';
}

/**
 * Check if user has Pro access
 */
export function hasProAccess(subscription: Subscription | null): boolean {
  if (!subscription) return false;
  if (!hasActiveSubscription(subscription)) return false;
  return subscription.plan === 'pro_monthly' || subscription.plan === 'pro_annual';
}
