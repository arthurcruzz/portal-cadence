"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/dashboard", icon: "⌂", label: "Início" },
  { href: "/painel", icon: "📊", label: "Painel" },
  { href: "/catalogo", icon: "🎵", label: "Catálogo" },
  { href: "/monitorado", icon: "🎙️", label: "Monitorado" },
  { href: "/autorizacoes", icon: "✍️", label: "Autorizações" },
];

export default function TabBar() {
  const pathname = usePathname();

  return (
    <nav className="tabbar">
      {TABS.map((tab) => (
        <Link
          key={tab.href}
          href={tab.href}
          className={`tab ${pathname === tab.href ? "active" : ""}`}
        >
          <div className="ic">{tab.icon}</div>
          <div className="tt">{tab.label}</div>
        </Link>
      ))}
    </nav>
  );
}
