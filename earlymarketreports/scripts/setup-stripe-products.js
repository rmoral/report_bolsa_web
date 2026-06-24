const Stripe = require('stripe');

// Initialize Stripe with your secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

async function createProducts() {
  try {
    console.log('🚀 Setting up Stripe products...\n');

    // 1. Create Lite Product (Free)
    console.log('Creating Lite product...');
    const liteProduct = await stripe.products.create({
      name: 'EarlyMarketReports Lite',
      description: 'Free daily stock market summary with essential market insights. Perfect introduction to our professional market analysis.',
      metadata: {
        category: 'financial_services',
        delivery_time: 'before_9am_et',
        target_audience: 'retail_investors',
        content_type: 'daily_reports',
        language: 'english'
      }
    });

    const litePrice = await stripe.prices.create({
      product: liteProduct.id,
      unit_amount: 0,
      currency: 'eur',
      metadata: {
        plan: 'lite'
      }
    });

    console.log(`✅ Lite Product: ${liteProduct.id}`);
    console.log(`✅ Lite Price: ${litePrice.id}\n`);

    // 2. Create Pro Monthly Product
    console.log('Creating Pro Monthly product...');
    const proMonthlyProduct = await stripe.products.create({
      name: 'EarlyMarketReports Pro Monthly',
      description: 'Professional daily stock market reports delivered before 9:00 AM ET. Includes full PDF access, detailed technical analysis, 15+ ticker watchlist, institutional flow analysis, trading strategies, priority support, and Pro community access. Perfect for active traders and serious investors seeking institutional-grade market intelligence.',
      metadata: {
        category: 'financial_services',
        delivery_time: 'before_9am_et',
        target_audience: 'traders_investors',
        content_type: 'daily_reports',
        language: 'english'
      }
    });

    const proMonthlyPrice = await stripe.prices.create({
      product: proMonthlyProduct.id,
      unit_amount: 19900, // €199.00
      currency: 'eur',
      recurring: {
        interval: 'month'
      },
      metadata: {
        plan: 'pro_monthly'
      }
    });

    console.log(`✅ Pro Monthly Product: ${proMonthlyProduct.id}`);
    console.log(`✅ Pro Monthly Price: ${proMonthlyPrice.id}\n`);

    // 3. Create Pro Annual Product
    console.log('Creating Pro Annual product...');
    const proAnnualProduct = await stripe.products.create({
      name: 'EarlyMarketReports Pro Annual',
      description: 'Professional daily stock market reports with annual billing. Save 17% vs monthly! Includes full PDF access, technical analysis, watchlist, institutional flows, trading strategies, priority support, and Pro community. Delivered before 9:00 AM ET. Perfect for active traders and serious investors.',
      metadata: {
        category: 'financial_services',
        delivery_time: 'before_9am_et',
        target_audience: 'traders_investors',
        content_type: 'daily_reports',
        language: 'english'
      }
    });

    const proAnnualPrice = await stripe.prices.create({
      product: proAnnualProduct.id,
      unit_amount: 199000, // €1,990.00
      currency: 'eur',
      recurring: {
        interval: 'year'
      },
      metadata: {
        plan: 'pro_annual'
      }
    });

    console.log(`✅ Pro Annual Product: ${proAnnualProduct.id}`);
    console.log(`✅ Pro Annual Price: ${proAnnualPrice.id}\n`);

    // 4. Output environment variables
    console.log('📋 Add these to your .env.local file:\n');
    console.log(`STRIPE_LITE_PRODUCT_ID=${liteProduct.id}`);
    console.log(`STRIPE_LITE_PRICE_ID=${litePrice.id}`);
    console.log(`STRIPE_PRO_MONTHLY_PRODUCT_ID=${proMonthlyProduct.id}`);
    console.log(`STRIPE_PRO_MONTHLY_PRICE_ID=${proMonthlyPrice.id}`);
    console.log(`STRIPE_PRO_ANNUAL_PRODUCT_ID=${proAnnualProduct.id}`);
    console.log(`STRIPE_PRO_ANNUAL_PRICE_ID=${proAnnualPrice.id}\n`);

    console.log('🎉 All products created successfully!');
    console.log('💡 Next steps:');
    console.log('1. Add the environment variables above to your .env.local file');
    console.log('2. Restart your development server');
    console.log('3. Test the checkout flow');

  } catch (error) {
    console.error('❌ Error creating products:', error);
  }
}

// Run the script
createProducts();





