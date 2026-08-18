import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Portal Cadence",
  description: "Portal do compositor — Cadence Gestão de Direitos Autorais",
  manifest: "/manifest.json",
  themeColor: "#0E1A2B",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
