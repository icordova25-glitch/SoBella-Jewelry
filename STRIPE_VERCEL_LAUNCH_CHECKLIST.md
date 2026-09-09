## SoBella Jewelry Launch Checklist

### 1. Vercel Environment Variables

Set these in the Vercel project for the customer storefront:

- `SITE_URL=https://so-bella-jewelry.vercel.app`
- `STRIPE_SECRET_KEY=sk_live_or_test_value`
- `STRIPE_WEBHOOK_SECRET=whsec_value`
- `STRIPE_SUCCESS_URL=https://so-bella-jewelry.vercel.app/review?payment=success`
- `STRIPE_CANCEL_URL=https://so-bella-jewelry.vercel.app/review?payment=cancelled`
- `SMTP_HOST=your.smtp.host`
- `SMTP_PORT=587`
- `SMTP_USERNAME=your_smtp_username`
- `SMTP_PASSWORD=your_smtp_password`
- `SMTP_FROM=orders@sobella...`
- Optional: `SMTP_SECURE=true` when using port `465`

### 2. Stripe Dashboard

- Create or confirm the product account is in the correct Stripe mode: `test` first, `live` later.
- Add a webhook endpoint:
  - URL: `https://so-bella-jewelry.vercel.app/api/stripe/webhook`
  - Events: `checkout.session.completed`
- Copy the webhook signing secret into `STRIPE_WEBHOOK_SECRET` in Vercel.

### 3. Production Smoke Test

- Add one item to bag on the live storefront.
- Go to review and confirm the page shows card checkout only.
- Complete a Stripe test payment.
- Confirm redirect returns to:
  - `.../review?payment=success` on success
  - `.../review?payment=cancelled` on cancellation
- Confirm a new order appears in stored orders/admin order view.
- Confirm stock for the purchased product decreases once.
- Confirm the customer receives an order confirmation email if SMTP is configured.

### 4. Content Readiness

- Upload real hero slideshow images from admin.
- Upload real product images for catalog items.
- Verify prices, SKUs, descriptions, and categories.
- Verify shipping policy, return policy, privacy policy, and contact email are published.

### 5. Go-Live Switch

- Swap Stripe keys from test to live.
- Re-run one live low-value purchase.
- Confirm webhook delivery succeeds in Stripe dashboard.
- Confirm email delivery succeeds.
