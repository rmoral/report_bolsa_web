# Stripe Integration Setup Guide

## 🚀 Quick Setup

### 1. Create Stripe Products

Run the setup script to create products in Stripe:

```bash
cd earlymarketreports
node scripts/setup-stripe-products.js
```

This will create:
- Lite product (€0)
- Pro Monthly product (€10/month)
- Pro Annual product (€99/year)

Copy the output environment variables to your `.env.local` file.

### 2. Create Webhook

Run the webhook setup script:

```bash
node scripts/setup-stripe-webhooks.js
```

Copy the webhook secret to your `.env.local` file.

### 3. Test Configuration

1. Start your development server:
```bash
npm run dev
```

2. Visit the test page:
```
http://localhost:3000/test-stripe
```

3. Click "Test Stripe Config" to verify your setup

### 4. Test Checkout Flow

1. Go to the subscribe page:
```
http://localhost:3000/subscribe
```

2. Fill out the form and select a plan
3. Click the checkout button
4. Use Stripe test cards:
   - **Success**: 4242 4242 4242 4242
   - **Decline**: 4000 0000 0000 0002
   - **3D Secure**: 4000 0025 0000 3155

## 🧪 Test Cards

### Successful Payments
- **4242 4242 4242 4242** - Visa
- **5555 5555 5555 4444** - Mastercard
- **3782 822463 10005** - American Express

### Declined Payments
- **4000 0000 0000 0002** - Generic decline
- **4000 0000 0000 9995** - Insufficient funds
- **4000 0000 0000 0069** - Expired card

### 3D Secure Authentication
- **4000 0025 0000 3155** - Requires authentication
- **4000 0000 0000 3220** - Authentication fails

### International Cards
- **4000 0000 0000 3063** - UK card
- **4000 0000 0000 3089** - German card

## 🔧 Environment Variables

Your `.env.local` should contain:

```bash
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Product IDs (from setup script)
STRIPE_LITE_PRODUCT_ID=prod_...
STRIPE_PRO_MONTHLY_PRODUCT_ID=prod_...
STRIPE_PRO_ANNUAL_PRODUCT_ID=prod_...

# Price IDs (from setup script)
STRIPE_LITE_PRICE_ID=price_...
STRIPE_PRO_MONTHLY_PRICE_ID=price_...
STRIPE_PRO_ANNUAL_PRICE_ID=price_...

# Base URL
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

## 📋 Testing Checklist

- [ ] Stripe configuration test passes
- [ ] Products created successfully
- [ ] Webhook configured
- [ ] Checkout form loads correctly
- [ ] Test card payments work
- [ ] Webhook events are received
- [ ] Subscription management works
- [ ] Customer portal accessible

## 🚨 Common Issues

### 1. "No such price" error
- Make sure you've run the setup script
- Check that price IDs are correct in `.env.local`
- Restart your development server

### 2. Webhook not receiving events
- Check webhook URL is correct
- Verify webhook secret in `.env.local`
- Use Stripe CLI for local testing: `stripe listen --forward-to localhost:3000/api/stripe/webhook`

### 3. Checkout session fails
- Verify all required fields are filled
- Check browser console for errors
- Ensure Stripe keys are correct

## 🔄 Production Setup

For production:

1. Switch to live Stripe keys
2. Update webhook URL to production domain
3. Create products in live Stripe dashboard
4. Test with real payment methods
5. Set up monitoring and alerts

## 📞 Support

If you encounter issues:
1. Check Stripe Dashboard for error logs
2. Review browser console for client-side errors
3. Check server logs for API errors
4. Verify all environment variables are set correctly




