export type SubscriptionPlan = 'lite' | 'pro_monthly' | 'pro_annual';

export type SubscriptionStatus = 
  | 'active' 
  | 'canceled' 
  | 'incomplete' 
  | 'incomplete_expired' 
  | 'past_due' 
  | 'trialing' 
  | 'unpaid';

export interface Subscription {
  id: string;
  userId: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  stripeCustomerId: string;
  stripeSubscriptionId: string;
  stripePriceId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface User {
  id: string;
  email: string;
  name?: string;
  stripeCustomerId?: string;
  subscription?: Subscription;
  createdAt: Date;
  updatedAt: Date;
}

export interface CheckoutSession {
  id: string;
  url: string;
  customerId: string;
  priceId: string;
  plan: SubscriptionPlan;
}

export interface BillingHistoryItem {
  id: string;
  amount: number;
  currency: string;
  status: 'paid' | 'pending' | 'failed';
  description: string;
  date: Date;
  invoiceUrl?: string;
}

export interface SubscriptionChangeRequest {
  plan: SubscriptionPlan;
  prorationBehavior?: 'create_prorations' | 'none' | 'always_invoice';
}

// Stripe webhook event types
export interface StripeWebhookEvent {
  id: string;
  type: string;
  data: {
    object: any;
  };
  created: number;
}

// Common webhook event types we'll handle
export type WebhookEventType = 
  | 'customer.subscription.created'
  | 'customer.subscription.updated'
  | 'customer.subscription.deleted'
  | 'invoice.payment_succeeded'
  | 'invoice.payment_failed'
  | 'checkout.session.completed';




