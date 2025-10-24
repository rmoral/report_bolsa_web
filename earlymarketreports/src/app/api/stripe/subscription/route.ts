import { NextRequest, NextResponse } from 'next/server';
import { getSubscriptionByCustomerId, mapStripeStatusToSubscriptionStatus } from '@/lib/subscription';
import { Subscription } from '@/types/subscription';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get('customerId');

    if (!customerId) {
      return NextResponse.json(
        { error: 'Customer ID is required' },
        { status: 400 }
      );
    }

    const stripeSubscription = await getSubscriptionByCustomerId(customerId);

    if (!stripeSubscription) {
      return NextResponse.json({
        success: true,
        subscription: null,
      });
    }

    // Map Stripe subscription to our subscription type
    const subscription: Subscription = {
      id: stripeSubscription.id,
      userId: customerId, // We'll use customerId as userId for now
      plan: stripeSubscription.items.data[0]?.price.id === 'price_pro_monthly' ? 'pro_monthly' : 
            stripeSubscription.items.data[0]?.price.id === 'price_pro_annual' ? 'pro_annual' : 'lite',
      status: mapStripeStatusToSubscriptionStatus(stripeSubscription.status),
      currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
      currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
      cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
      stripeCustomerId: stripeSubscription.customer as string,
      stripeSubscriptionId: stripeSubscription.id,
      stripePriceId: stripeSubscription.items.data[0]?.price.id || '',
      createdAt: new Date(stripeSubscription.created * 1000),
      updatedAt: new Date(stripeSubscription.updated * 1000),
    };

    return NextResponse.json({
      success: true,
      subscription,
    });

  } catch (error) {
    console.error('Error fetching subscription:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subscription' },
      { status: 500 }
    );
  }
}




