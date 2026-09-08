import Link from "next/link";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

type ProductRow = {
  id: string;
  name: string;
  price: number;
  stock_quantity: number;
  is_active: boolean;
};

export default async function AdminProductsPage() {
  const supabase = createSupabaseAdminClient();

  if (!supabase) {
    return (
      <section>
        <h1>Manage Products</h1>
        <p>Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to view products.</p>
      </section>
    );
  }

  const { data } = await supabase
    .from("products")
    .select("id, name, price, stock_quantity, is_active")
    .order("created_at", { ascending: false });

  const products: ProductRow[] = data || [];

  return (
    <section>
      <h1>Manage Products</h1>
      <div className="grid">
        {products.map((product) => (
          <article key={product.id} className="panel">
            <h3>{product.name}</h3>
            <p>Price: ${Number(product.price).toFixed(2)}</p>
            <p>Stock: {product.stock_quantity}</p>
            <p>Status: {product.is_active ? "Active" : "Hidden"}</p>
            <Link href={`/admin/products/${product.id}/edit`}>Edit product</Link>
          </article>
        ))}
      </div>
    </section>
  );
}
