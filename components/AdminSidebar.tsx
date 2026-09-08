import Link from "next/link";

export default function AdminSidebar() {
  return (
    <aside className="panel">
      <h3>Admin</h3>
      <nav className="admin-nav">
        <Link href="/admin">Dashboard</Link>
        <Link href="/admin/products">Products</Link>
        <Link href="/admin/products/new">Add Product</Link>
        <Link href="/admin/orders">Orders</Link>
      </nav>
    </aside>
  );
}
