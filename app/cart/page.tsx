"use client";

import { useState } from "react";
import CartDrawer from "@/components/CartDrawer";
import { useCartStore } from "@/store/cartStore";

export default function CartPage() {
  const items = useCartStore((state) => state.items);
  const clearCart = useCartStore((state) => state.clearCart);
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [status, setStatus] = useState("");
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  async function handleCheckout() {
    if (items.length === 0) {
      setStatus("Your cart is empty.");
      return;
    }

    if (!customerEmail.trim()) {
      setStatus("Customer email is required.");
      return;
    }

    setIsCheckingOut(true);
    setStatus("Creating checkout session...");

    const response = await fetch("/api/checkout", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        customerEmail,
        customerName,
        items: items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
        })),
      }),
    });

    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
      setStatus(body.error || "Checkout failed.");
      setIsCheckingOut(false);
      return;
    }

    if (body.checkoutUrl) {
      clearCart();
      window.location.href = body.checkoutUrl;
      return;
    }

    setStatus("Checkout URL was not returned.");
    setIsCheckingOut(false);
  }

  return (
    <section>
      <h1>Your Cart</h1>
      {items.length === 0 ? <p>Your cart is empty.</p> : null}
      <ul>
        {items.map((item) => (
          <li key={item.productId}>
            {item.name} x {item.quantity} @ ${item.unitPrice.toFixed(2)}
          </li>
        ))}
      </ul>
      <div className="panel form">
        <h3>Checkout</h3>
        <label>
          Customer Email
          <input
            type="email"
            value={customerEmail}
            onChange={(event) => setCustomerEmail(event.target.value)}
            required
          />
        </label>
        <label>
          Customer Name
          <input value={customerName} onChange={(event) => setCustomerName(event.target.value)} />
        </label>
        <button className="cta" type="button" onClick={handleCheckout} disabled={isCheckingOut}>
          {isCheckingOut ? "Preparing..." : "Checkout with Stripe"}
        </button>
        <p>{status}</p>
      </div>
      <CartDrawer />
    </section>
  );
}
