import type { Metadata } from "next";
import SiteHeader from "@/components/SiteHeader";
import "./styles.css";

export const metadata: Metadata = {
  title: "SOBELLA JEWELRY CO.",
  description: "SOBELLA JEWELRY CO. storefront and admin panel",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <SiteHeader />
        <main className="page-wrap">{children}</main>
      </body>
    </html>
  );
}
