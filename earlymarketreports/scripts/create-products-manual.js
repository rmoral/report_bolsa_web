// Manual script to create Stripe products
// Run this with: STRIPE_SECRET_KEY=your_key node scripts/create-products-manual.js

const Stripe = require('stripe');

// You need to set your Stripe secret key as an environment variable
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

async function createProducts() {
  try {
    console.log('🚀 Creating Stripe products...\n');

    // Create Pro Monthly Product
    console.log('Creating Pro Monthly product...');
    const proMonthlyProduct = await stripe.products.create({
      name: 'EarlyMarketReports Pro Monthly',
      description: 'Professional daily stock market reports delivered before 9:00 AM ET. Includes full PDF access, detailed technical analysis, 15+ ticker watchlist, institutional flow analysis, trading strategies, priority support, and Pro community access. Perfect for active traders and serious investors seeking institutional-grade market intelligence.',
    });

    const proMonthlyPrice = await stripe.prices.create({
      product: proMonthlyProduct.id,
      unit_amount: 1000, // €10.00
      currency: 'eur',
      recurring: {
        interval: 'month'
      }
    });

    console.log(`✅ Pro Monthly Product: ${proMonthlyProduct.id}`);
    console.log(`✅ Pro Monthly Price: ${proMonthlyPrice.id}\n`);

    // Create Pro Annual Product
    console.log('Creating Pro Annual product...');
    const proAnnualProduct = await stripe.products.create({
      name: 'EarlyMarketReports Pro Annual',
      description: 'Professional daily stock market reports with annual billing. Save 17% vs monthly! Includes full PDF access, technical analysis, watchlist, institutional flows, trading strategies, priority support, and Pro community. Delivered before 9:00 AM ET. Perfect for active traders and serious investors.',
    });

    const proAnnualPrice = await stripe.prices.create({
      product: proAnnualProduct.id,
      unit_amount: 9900, // €99.00
      currency: 'eur',
      recurring: {
        interval: 'year'
      }
    });

    console.log(`✅ Pro Annual Product: ${proAnnualProduct.id}`);
    console.log(`✅ Pro Annual Price: ${proAnnualPrice.id}\n`);

    // Output environment variables
    console.log('📋 Add these to your .env.local file:\n');
    console.log(`STRIPE_PRO_MONTHLY_PRODUCT_ID=${proMonthlyProduct.id}`);
    console.log(`STRIPE_PRO_MONTHLY_PRICE_ID=${proMonthlyPrice.id}`);
    console.log(`STRIPE_PRO_ANNUAL_PRODUCT_ID=${proAnnualProduct.id}`);
    console.log(`STRIPE_PRO_ANNUAL_PRICE_ID=${proAnnualPrice.id}\n`);

    console.log('🎉 Products created successfully!');
    console.log('💡 Next steps:');
    console.log('1. Add the environment variables above to your .env.local file');
    console.log('2. Restart your development server');
    console.log('3. Test the checkout flow');

  } catch (error) {
    console.error('❌ Error creating products:', error);
  }
}

// Check if Stripe key is provided
if (!process.env.STRIPE_SECRET_KEY) {
  console.error('❌ Please set STRIPE_SECRET_KEY environment variable');
  console.log('Usage: STRIPE_SECRET_KEY=sk_test_... node scripts/create-products-manual.js');
  process.exit(1);
}

// Run the script
createProducts();





