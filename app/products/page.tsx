import ProductCard from "@/components/ProductCard";
import { createSupabasePublicServerClient } from "@/lib/supabase/server";

type ProductRow = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image_urls: string[] | null;
};

export default async function ProductsPage() {
  const supabase = createSupabasePublicServerClient();

  if (!supabase) {
    return (
      <section>
        <h1>Product Catalog</h1>
        <p>Set Supabase environment variables to load products.</p>
      </section>
    );
  }

  const { data } = await supabase
    .from("products")
    .select("id, name, description, price, image_urls")
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  const products: ProductRow[] = data || [];

  return (
    <section>
      <h1>Product Catalog</h1>
      <div className="grid">
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={{
              id: product.id,
              name: product.name,
              description: product.description || undefined,
              price: Number(product.price),
              imageUrl: product.image_urls?.[0],
            }}
          />
        ))}
      </div>
    </section>
  );
}
