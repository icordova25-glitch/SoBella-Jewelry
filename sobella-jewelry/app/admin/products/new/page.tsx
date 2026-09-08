import AdminProductForm from "@/components/AdminProductForm";

export default function AdminNewProductPage() {
  return (
    <section>
      <h1>Add Product</h1>
      <AdminProductForm mode="create" />
    </section>
  );
}
