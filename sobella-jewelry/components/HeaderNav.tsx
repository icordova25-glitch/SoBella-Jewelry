"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const NAV_LINKS = [
  { href: "/", label: "Collection" },
  { href: "/products", label: "Shop All" },
  { href: "/cart", label: "Cart" },
];

export default function HeaderNav() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  return (
    <div className="nav-shell">
      <button
        type="button"
        className="nav-toggle"
        aria-expanded={isOpen}
        aria-controls="site-nav"
        onClick={() => setIsOpen((open) => !open)}
      >
        <span className="nav-toggle-label">Menu</span>
        <span className="nav-toggle-icon" aria-hidden="true">
          <span />
          <span />
          <span />
        </span>
      </button>

      <nav id="site-nav" className={`site-nav${isOpen ? " is-open" : ""}`}>
        {NAV_LINKS.map((link) => {
          const isActive = pathname === link.href;
          return (
            <Link key={link.href} href={link.href} className={isActive ? "is-active" : undefined}>
              {link.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}