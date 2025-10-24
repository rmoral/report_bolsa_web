const Stripe = require('stripe');

// Initialize Stripe with your secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

async function createWebhook() {
  try {
    console.log('🚀 Setting up Stripe webhook...\n');

    // Create webhook endpoint
    const webhook = await stripe.webhookEndpoints.create({
      url: 'http://localhost:3000/api/stripe/webhook',
      enabled_events: [
        'customer.subscription.created',
        'customer.subscription.updated',
        'customer.subscription.deleted',
        'invoice.payment_succeeded',
        'invoice.payment_failed',
        'checkout.session.completed',
      ],
      metadata: {
        environment: 'development'
      }
    });

    console.log(`✅ Webhook created: ${webhook.id}`);
    console.log(`✅ Webhook URL: ${webhook.url}`);
    console.log(`✅ Webhook Secret: ${webhook.secret}\n`);

    console.log('📋 Add this to your .env.local file:\n');
    console.log(`STRIPE_WEBHOOK_SECRET=${webhook.secret}\n`);

    console.log('🎉 Webhook setup complete!');
    console.log('💡 Note: For production, update the webhook URL to your production domain');

  } catch (error) {
    console.error('❌ Error creating webhook:', error);
  }
}

// Run the script
createWebhook();




