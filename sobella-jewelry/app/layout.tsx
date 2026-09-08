import type { Metadata } from "next";
import HeaderNav from "@/components/HeaderNav";
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
          <HeaderNav />
        </header>
        <main className="page-wrap">{children}</main>
      </body>
    </html>
  );
}
