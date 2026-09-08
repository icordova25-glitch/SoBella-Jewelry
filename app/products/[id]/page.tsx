import { notFound } from "next/navigation";
import { createSupabasePublicServerClient } from "@/lib/supabase/server";

type ProductDetailPageProps = {
  params: Promise<{ id: string }>;
};

type ProductRow = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  category: string | null;
  stock_quantity: number;
  image_urls: string[] | null;
};

export default async function ProductDetailPage({ params }: ProductDetailPageProps) {
  const { id } = await params;
  const supabase = createSupabasePublicServerClient();

  if (!supabase) {
    return (
      <section className="panel">
        <h1>Product Detail</h1>
        <p>Set Supabase environment variables to load product details.</p>
      </section>
    );
  }

  const { data } = await supabase
    .from("products")
    .select("id, name, description, price, category, stock_quantity, image_urls")
    .eq("id", id)
    .eq("is_active", true)
    .single();

  const product = data as ProductRow | null;
  if (!product) {
    notFound();
  }

  return (
    <section className="panel">
      <h1>{product.name}</h1>
      {product.image_urls?.[0] ? <img src={product.image_urls[0]} alt={product.name} /> : null}
      <p>{product.description}</p>
      <p>Category: {product.category || "Uncategorized"}</p>
      <p>In stock: {product.stock_quantity}</p>
      <p>Price: ${Number(product.price).toFixed(2)}</p>
    </section>
  );
}
