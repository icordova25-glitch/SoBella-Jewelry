import Stripe from "stripe";

export function getStripeClient() {
  const apiKey = process.env.STRIPE_SECRET_KEY;
  if (!apiKey) {
    return null;
  }

  return new Stripe(apiKey, {
    apiVersion: "2025-02-24.acacia",
  });
}
