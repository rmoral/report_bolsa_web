import { NextRequest, NextResponse } from 'next/server';
import { stripe, STRIPE_CONFIG } from '@/lib/stripe';
import { getUserByEmail, getUserByStripeCustomerId, updateUserPlan } from '@/lib/firebaseAuth';
import Stripe from 'stripe';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      console.error('[webhook] No Stripe signature found');
      return NextResponse.json({ error: 'No signature' }, { status: 400 });
    }

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, STRIPE_CONFIG.WEBHOOK_SECRET);
    } catch (err) {
      console.error('[webhook] Signature verification failed:', err);
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    console.log(`[webhook] Event: ${event.type}`);

    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;

      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      default:
        console.log(`[webhook] Unhandled event: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('[webhook] Error:', error);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}

async function resolveUser(customerId: string) {
  // First try by stored stripeCustomerId (fast)
  let user = await getUserByStripeCustomerId(customerId);
  if (user) return user;

  // Fallback: look up customer email in Stripe and find user by email
  const customer = await stripe.customers.retrieve(customerId);
  if (customer.deleted || !customer.email) return null;
  return getUserByEmail(customer.email);
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const customerId = session.customer as string;
  const plan = session.metadata?.plan as 'pro_monthly' | 'pro_annual' | undefined;

  if (!customerId || !plan || !['pro_monthly', 'pro_annual'].includes(plan)) {
    console.warn('[webhook] checkout.session.completed: missing customerId or invalid plan', { customerId, plan });
    return;
  }

  const user = await resolveUser(customerId);
  if (!user) {
    console.error('[webhook] No user found for Stripe customer', customerId);
    return;
  }

  // Retrieve the subscription ID from the session
  const subscriptionId = session.subscription as string | undefined;

  await updateUserPlan(user.id, 'pro', {
    stripeCustomerId: customerId,
    stripeSubscriptionId: subscriptionId,
  });

  console.log(`[webhook] User ${user.email} upgraded to pro (plan: ${plan})`);
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;
  const status = subscription.status;

  const user = await resolveUser(customerId);
  if (!user) return;

  if (status === 'active' || status === 'trialing') {
    // Reactivation (e.g., payment recovered after past_due)
    if (user.plan !== 'pro') {
      await updateUserPlan(user.id, 'pro', {
        stripeCustomerId: customerId,
        stripeSubscriptionId: subscription.id,
      });
      console.log(`[webhook] User ${user.email} reactivated to pro (status: ${status})`);
    }
  } else if (status === 'unpaid') {
    // Stripe exhausted all retries — downgrade now
    await updateUserPlan(user.id, 'lite');
    console.log(`[webhook] User ${user.email} downgraded to lite (unpaid)`);
  } else {
    console.log(`[webhook] subscription.updated: status=${status} for ${user.email}, no plan change`);
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;

  const user = await resolveUser(customerId);
  if (!user) {
    console.error('[webhook] No user for subscription deleted', customerId);
    return;
  }

  await updateUserPlan(user.id, 'lite', { stripeSubscriptionId: undefined });
  console.log(`[webhook] User ${user.email} downgraded to lite (subscription canceled)`);
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  const customerId = invoice.customer as string;
  console.warn(`[webhook] Payment failed for customer ${customerId}, invoice ${invoice.id}`);
  // Stripe handles dunning automatically; we only downgrade on subscription.deleted/updated
}
