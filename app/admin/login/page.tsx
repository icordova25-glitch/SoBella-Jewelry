import Link from "next/link";

export default function AdminLoginPage() {
  return (
    <section className="auth-shell">
      <div className="auth-brand">
        <p className="eyebrow">Private Access</p>
        <h1>Admin Login</h1>
        <p className="lead">This login is intentionally separate from the storefront. Only authorized staff should continue.</p>
      </div>

      <div className="panel auth-panel">
        <p>Attach Supabase Auth UI here for admin access.</p>
        <Link href="/" className="text-link">
          Return to storefront
        </Link>
      </div>
    </section>
  );
}
