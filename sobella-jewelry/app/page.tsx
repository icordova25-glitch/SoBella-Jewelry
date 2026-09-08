import ProductCard from "@/components/ProductCard";
import { createSupabasePublicServerClient } from "@/lib/supabase/server";

type ProductRow = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image_urls: string[] | null;
};

export default async function HomePage() {
  const supabase = createSupabasePublicServerClient();

  if (!supabase) {
    return (
      <section>
        <h1>Elevated Everyday Jewelry</h1>
        <p>Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to load products.</p>
      </section>
    );
  }

  const { data } = await supabase
    .from("products")
    .select("id, name, description, price, image_urls")
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(6);

  const featured: ProductRow[] = data || [];

  return (
    <section>
      <h1>Curated Pieces For Your Signature Look</h1>
      <p className="lead">Refined gold tones, clean silhouettes, and modern classics designed to stack and shine.</p>
      <div className="grid">
        {featured.map((product) => (
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
