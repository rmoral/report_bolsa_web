import { NextRequest, NextResponse } from 'next/server';
import { stripe, STRIPE_CONFIG } from '@/lib/stripe';
import { createStripeCustomer, createCheckoutSession, getPriceIdByPlan } from '@/lib/subscription';
import { SubscriptionPlan } from '@/types/subscription';
import { verifyAuth } from '@/middleware/auth';
import { getUserById } from '@/lib/firebaseAuth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { plan } = body;
    let { userEmail, userName } = body;

    // Validate plan — Lite plan is free and handled via /api/auth/register, not Stripe
    const validPlans: SubscriptionPlan[] = ['pro_monthly', 'pro_annual'];
    if (!validPlans.includes(plan)) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
    }

    // Si hay JWT, leer datos del usuario autenticado directamente
    const auth = request.headers.get('authorization') || undefined;
    const payload = verifyAuth(auth);
    if (payload) {
      const user = await getUserById(payload.sub);
      if (user) {
        userEmail = user.email;
        userName = user.name;
      }
    }

    if (!userEmail) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const priceId = getPriceIdByPlan(plan);

    // Buscar o crear customer en Stripe
    let customer;
    try {
      const existingCustomers = await stripe.customers.list({ email: userEmail, limit: 1 });
      customer = existingCustomers.data.length > 0
        ? existingCustomers.data[0]
        : await createStripeCustomer({ email: userEmail, name: userName });
    } catch (error) {
      console.error('Error with customer:', error);
      return NextResponse.json({ error: 'Failed to create customer' }, { status: 500 });
    }

    const session = await createCheckoutSession({
      customerId: customer.id,
      priceId,
      plan,
      successUrl: STRIPE_CONFIG.SUCCESS_URL,
      cancelUrl: STRIPE_CONFIG.CANCEL_URL,
    });

    return NextResponse.json({ sessionId: session.id, url: session.url });

  } catch (error) {
    console.error('Error creating checkout session:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
