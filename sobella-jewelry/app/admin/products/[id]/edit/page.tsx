import AdminProductForm from "@/components/AdminProductForm";
import { notFound } from "next/navigation";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

type AdminEditProductPageProps = {
  params: Promise<{ id: string }>;
};

export default async function AdminEditProductPage({ params }: AdminEditProductPageProps) {
  const { id } = await params;
  const supabase = createSupabaseAdminClient();

  if (!supabase) {
    return (
      <section className="panel">
        <h1>Edit Product</h1>
        <p>Set Supabase service role credentials to edit products.</p>
      </section>
    );
  }

  const { data } = await supabase
    .from("products")
    .select("id, name, description, category, price, stock_quantity, is_active, image_urls")
    .eq("id", id)
    .single();

  if (!data) {
    notFound();
  }

  return (
    <section>
      <h1>Edit Product</h1>
      <AdminProductForm
        mode="edit"
        initialValues={{
          id: data.id,
          name: data.name,
          description: data.description || "",
          category: data.category || "",
          price: String(data.price),
          stockQuantity: String(data.stock_quantity),
          isActive: data.is_active,
          imageUrlsText: Array.isArray(data.image_urls) ? data.image_urls.join("\n") : "",
        }}
      />
    </section>
  );
}
