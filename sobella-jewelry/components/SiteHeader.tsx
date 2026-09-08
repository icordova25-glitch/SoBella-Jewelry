"use client";

import { usePathname } from "next/navigation";
import HeaderNav from "@/components/HeaderNav";

export default function SiteHeader() {
  const pathname = usePathname();

  if (pathname.startsWith("/admin")) {
    return null;
  }

  return (
    <header className="site-header">
      <div className="site-header-row">
        <div className="brand-wrap">
          <img className="brand-logo" src="/assets/logo/sobella-logo.svg" alt="SOBELLA JEWELRY CO." />
        </div>
        <HeaderNav />
      </div>
    </header>
  );
}