import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';

export async function GET(request: NextRequest) {
  try {
    // Test Stripe connection
    const account = await stripe.accounts.retrieve();
    
    return NextResponse.json({
      success: true,
      message: 'Stripe configuration is working',
      account: {
        id: account.id,
        country: account.country,
        default_currency: account.default_currency,
        charges_enabled: account.charges_enabled,
        payouts_enabled: account.payouts_enabled,
      },
      environment: {
        hasSecretKey: !!process.env.STRIPE_SECRET_KEY,
        hasPublishableKey: !!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
        hasWebhookSecret: !!process.env.STRIPE_WEBHOOK_SECRET,
        secretKeyPrefix: process.env.STRIPE_SECRET_KEY?.substring(0, 7),
        publishableKeyPrefix: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.substring(0, 7),
      },
      config: {
        proMonthlyPriceId: process.env.STRIPE_PRO_MONTHLY_PRICE_ID || 'Not set',
        proAnnualPriceId: process.env.STRIPE_PRO_ANNUAL_PRICE_ID || 'Not set',
        baseUrl: process.env.NEXT_PUBLIC_BASE_URL || 'Not set',
      }
    });

  } catch (error) {
    console.error('Stripe configuration test failed:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Stripe configuration test failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
