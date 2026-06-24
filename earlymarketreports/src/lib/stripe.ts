import Stripe from 'stripe';

// Initialize Stripe with secret key
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
  typescript: true,
});

// Stripe configuration
export const STRIPE_CONFIG = {
  // Product IDs (to be configured after creating products in Stripe Dashboard)
  PRODUCTS: {
    LITE: process.env.STRIPE_LITE_PRODUCT_ID || 'prod_lite_product_id',
    PRO_MONTHLY: process.env.STRIPE_PRO_MONTHLY_PRODUCT_ID || 'prod_TFl57RxCtkBnmF',
    PRO_ANNUAL: process.env.STRIPE_PRO_ANNUAL_PRODUCT_ID || 'prod_TFl5BMkuWIkCce',
  },
  
  // Price IDs (to be configured after creating prices in Stripe Dashboard)
  PRICES: {
    LITE: process.env.STRIPE_LITE_PRICE_ID || 'price_lite_free',
    PRO_MONTHLY: process.env.STRIPE_PRO_MONTHLY_PRICE_ID || 'price_1SJFZFK7J4kufde32VO187QI',
    PRO_ANNUAL: process.env.STRIPE_PRO_ANNUAL_PRICE_ID || 'price_1SJFZFK7J4kufde3SdRJqKjr',
  },
  
  // Webhook secret for validation
  WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET || 'whsec_your_webhook_secret',
  
  // Currency
  CURRENCY: 'eur',
  
  // Success and cancel URLs
  SUCCESS_URL: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/dashboard?success=true`,
  CANCEL_URL: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/precios?canceled=true`,
} as const;

// Subscription plans configuration
export const SUBSCRIPTION_PLANS = {
  lite: {
    name: 'Lite',
    price: 0,
    currency: 'EUR',
    interval: null,
    features: [
      'Market open summary',
      '3-5 highlighted opportunities',
      'Key support/resistance levels',
      'Macro events of the day',
      'Delivered before 9:00 AM ET',
    ],
  },
  pro_monthly: {
    name: 'Pro Monthly',
    price: 199,
    currency: 'EUR',
    interval: 'month',
    features: [
      'Everything in Lite',
      'Full PDF access',
      'Detailed technical analysis',
      'Watchlist with 15+ tickers',
      'Institutional flow analysis',
      'Trading strategies',
      'Priority support',
      'Access to Pro community',
      'Full historical reports',
      '7-day satisfaction guarantee',
    ],
  },
  pro_annual: {
    name: 'Pro Annual',
    price: 1990,
    currency: 'EUR',
    interval: 'year',
    features: [
      'Everything in Pro Monthly',
      'Save 17% compared to monthly',
      'Annual billing convenience',
    ],
  },
} as const;

// Helper function to get plan by price ID
export function getPlanByPriceId(priceId: string) {
  const plans = Object.entries(SUBSCRIPTION_PLANS);
  for (const [key, plan] of plans) {
    if (STRIPE_CONFIG.PRICES[key.toUpperCase() as keyof typeof STRIPE_CONFIG.PRICES] === priceId) {
      return { key, plan };
    }
  }
  return null;
}

// Helper function to get price ID by plan key (deprecated - use the one in subscription.ts)
export function getPriceIdByPlanKey(planKey: string) {
  const upperKey = planKey.toUpperCase() as keyof typeof STRIPE_CONFIG.PRICES;
  const priceId = STRIPE_CONFIG.PRICES[upperKey];
  
  // If price ID is not configured (still has default value), return null
  if (priceId && !priceId.includes('price_')) {
    return null;
  }
  
  return priceId;
}
