"use client";

import { usePathname } from "next/navigation";
import Header from "./Header";
import Footer from "./Footer";

export default function ClientLayoutShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/admin");

  // Se a rota for administrativa (/admin/*), não renderiza o cabeçalho e rodapé públicos,
  // nem o padding-top de 80px (pt-20), garantindo isolamento total do painel administrativo.
  if (isAdmin) {
    return <div className="min-h-screen w-full">{children}</div>;
  }

  return (
    <>
      <Header />
      <main className="flex-1 w-full pt-20">{children}</main>
      <Footer />
    </>
  );
}
