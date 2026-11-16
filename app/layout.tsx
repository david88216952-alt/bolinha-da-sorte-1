import type { Metadata } from "next";
import "./globals.css";
import ClientLayoutShell from "@/components/ClientLayoutShell";
import { ThemeProvider } from "@/components/ThemeProvider";

export const metadata: Metadata = {
  title: "Bolinha da Sorte — Plataforma Oficial de Rifas e Sorteios",
  description:
    "Participe dos melhores sorteios com cotas a partir de R$ 0,02, pagamento instantâneo via Pix, baixa automática e sorteio 100% auditado pela Loteria Federal.",
  icons: {
    icon: "/images/logo-bs.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className="h-full antialiased" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const saved = localStorage.getItem('theme');
                if (saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.classList.remove('dark');
                }
              } catch (_) {}
            `,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-[#F2F4F7] dark:bg-[#090D16] text-[#191C1E] dark:text-slate-100 transition-colors duration-200">
        <ThemeProvider>
          <ClientLayoutShell>{children}</ClientLayoutShell>
        </ThemeProvider>
      </body>
    </html>
  );
}
