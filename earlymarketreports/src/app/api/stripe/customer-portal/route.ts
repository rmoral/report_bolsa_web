import { NextRequest, NextResponse } from 'next/server';
import { createCustomerPortalSession } from '@/lib/subscription';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { customerId } = body;

    if (!customerId) {
      return NextResponse.json(
        { error: 'Customer ID is required' },
        { status: 400 }
      );
    }

    const returnUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/dashboard`;
    
    const session = await createCustomerPortalSession(customerId, returnUrl);

    return NextResponse.json({
      success: true,
      url: session.url,
    });

  } catch (error) {
    console.error('Error creating customer portal session:', error);
    return NextResponse.json(
      { error: 'Failed to create customer portal session' },
      { status: 500 }
    );
  }
}





