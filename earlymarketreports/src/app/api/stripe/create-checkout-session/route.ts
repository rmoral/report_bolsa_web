import { NextRequest, NextResponse } from 'next/server';
import { stripe, STRIPE_CONFIG } from '@/lib/stripe';
import { createStripeCustomer, createCheckoutSession, getPriceIdByPlan } from '@/lib/subscription';
import { SubscriptionPlan } from '@/types/subscription';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { plan, userEmail, userName } = body;

    // Validate plan — Lite plan is free and handled via /api/auth/register, not Stripe
    const validPlans: SubscriptionPlan[] = ['pro_monthly', 'pro_annual'];
    if (!validPlans.includes(plan)) {
      return NextResponse.json(
        { error: 'Invalid plan' },
        { status: 400 }
      );
    }

    // Validate required fields
    if (!userEmail) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Get price ID for the plan (may be null if not configured)
    const priceId = getPriceIdByPlan(plan);

    // Create or get Stripe customer
    let customer;
    try {
      // Try to find existing customer
      const existingCustomers = await stripe.customers.list({
        email: userEmail,
        limit: 1,
      });

      if (existingCustomers.data.length > 0) {
        customer = existingCustomers.data[0];
      } else {
        // Create new customer
        customer = await createStripeCustomer({
          email: userEmail,
          name: userName,
        });
      }
    } catch (error) {
      console.error('Error with customer:', error);
      return NextResponse.json(
        { error: 'Failed to create customer' },
        { status: 500 }
      );
    }

    // Create checkout session
    const session = await createCheckoutSession({
      customerId: customer.id,
      priceId,
      plan,
      successUrl: STRIPE_CONFIG.SUCCESS_URL,
      cancelUrl: STRIPE_CONFIG.CANCEL_URL,
    });

    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
    });

  } catch (error) {
    console.error('Error creating checkout session:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
