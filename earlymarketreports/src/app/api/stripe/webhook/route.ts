import { NextRequest, NextResponse } from 'next/server';
import { stripe, STRIPE_CONFIG } from '@/lib/stripe';
import { WebhookEventType } from '@/types/subscription';
import Stripe from 'stripe';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      console.error('No Stripe signature found');
      return NextResponse.json(
        { error: 'No signature' },
        { status: 400 }
      );
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        STRIPE_CONFIG.WEBHOOK_SECRET
      );
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      );
    }

    // Handle the event
    switch (event.type) {
      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object as Stripe.Subscription);
        break;
      
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;
      
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;
      
      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;
      
      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.Invoice);
        break;
      
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;
      
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });

  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}

async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  console.log('Subscription created:', subscription.id);
  
  // Here you would typically:
  // 1. Update user's subscription status in your database
  // 2. Send welcome email
  // 3. Grant access to Pro features
  
  // For now, we'll just log it
  console.log('Customer:', subscription.customer);
  console.log('Status:', subscription.status);
  console.log('Price ID:', subscription.items.data[0]?.price.id);
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  console.log('Subscription updated:', subscription.id);
  
  // Here you would typically:
  // 1. Update user's subscription status in your database
  // 2. Handle plan changes
  // 3. Update access permissions
  
  console.log('New status:', subscription.status);
  console.log('Cancel at period end:', subscription.cancel_at_period_end);
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  console.log('Subscription deleted:', subscription.id);
  
  // Here you would typically:
  // 1. Update user's subscription status to canceled
  // 2. Revoke Pro access
  // 3. Send cancellation confirmation email
  
  console.log('Customer:', subscription.customer);
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  console.log('Payment succeeded:', invoice.id);
  
  // Here you would typically:
  // 1. Update payment status in your database
  // 2. Send payment confirmation email
  // 3. Extend subscription period
  
  console.log('Customer:', invoice.customer);
  console.log('Amount:', invoice.amount_paid);
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  console.log('Payment failed:', invoice.id);
  
  // Here you would typically:
  // 1. Update payment status in your database
  // 2. Send payment failure notification
  // 3. Handle dunning management
  
  console.log('Customer:', invoice.customer);
  console.log('Amount:', invoice.amount_due);
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  console.log('Checkout completed:', session.id);
  
  // Here you would typically:
  // 1. Create user account if needed
  // 2. Link subscription to user
  // 3. Send welcome email
  // 4. Redirect to dashboard
  
  console.log('Customer:', session.customer);
  console.log('Metadata:', session.metadata);
}





