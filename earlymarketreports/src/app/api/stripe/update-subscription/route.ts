import { NextRequest, NextResponse } from 'next/server';
import { updateSubscriptionPlan, getPriceIdByPlan } from '@/lib/subscription';
import { SubscriptionPlan } from '@/types/subscription';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { subscriptionId, plan, prorationBehavior = 'create_prorations' } = body;

    if (!subscriptionId) {
      return NextResponse.json(
        { error: 'Subscription ID is required' },
        { status: 400 }
      );
    }

    if (!plan) {
      return NextResponse.json(
        { error: 'Plan is required' },
        { status: 400 }
      );
    }

    // Validate plan
    const validPlans: SubscriptionPlan[] = ['lite', 'pro_monthly', 'pro_annual'];
    if (!validPlans.includes(plan)) {
      return NextResponse.json(
        { error: 'Invalid plan' },
        { status: 400 }
      );
    }

    // Get price ID for the new plan
    const newPriceId = getPriceIdByPlan(plan);
    if (!newPriceId) {
      return NextResponse.json(
        { error: 'Price not found for plan' },
        { status: 400 }
      );
    }

    const subscription = await updateSubscriptionPlan(
      subscriptionId,
      newPriceId,
      prorationBehavior as 'create_prorations' | 'none' | 'always_invoice'
    );

    return NextResponse.json({
      success: true,
      subscription: {
        id: subscription.id,
        status: subscription.status,
        currentPeriodStart: subscription.current_period_start,
        currentPeriodEnd: subscription.current_period_end,
        items: subscription.items.data.map(item => ({
          id: item.id,
          priceId: item.price.id,
        })),
      },
    });

  } catch (error) {
    console.error('Error updating subscription:', error);
    return NextResponse.json(
      { error: 'Failed to update subscription' },
      { status: 500 }
    );
  }
}





