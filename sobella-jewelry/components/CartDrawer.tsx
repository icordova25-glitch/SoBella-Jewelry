"use client";

import { useCartStore } from "@/store/cartStore";

export default function CartDrawer() {
  const items = useCartStore((state) => state.items);
  const total = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);

  return (
    <aside className="panel">
      <h3>Cart</h3>
      <p>{items.length} item(s)</p>
      <p>Total: ${total.toFixed(2)}</p>
    </aside>
  );
}
