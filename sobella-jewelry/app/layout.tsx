import type { Metadata } from "next";
import Link from "next/link";
import "./styles.css";

export const metadata: Metadata = {
  title: "SoBella Jewelry",
  description: "Modern jewelry storefront and admin panel",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header className="site-header">
          <div className="brand-wrap">
            <p className="brand-mark">SB</p>
            <p className="brand-name">SOBELLA JEWELRY CO.</p>
            <p className="brand-tag">Wear it. Live in it. Love it.</p>
          </div>
          <nav className="site-nav">
            <Link href="/">Collection</Link>
            <Link href="/products">Shop All</Link>
            <Link href="/cart">Cart</Link>
            <Link href="/admin">Admin</Link>
          </nav>
        </header>
        <main className="page-wrap">{children}</main>
      </body>
    </html>
  );
}
