"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  User as UserIcon,
  ShoppingBag,
  Trophy,
  HelpCircle,
  ShieldCheck,
  LogOut,
} from "lucide-react";
import AuthModal from "./AuthModal";
import ThemeToggle from "./ThemeToggle";
import Logo from "./Logo";

interface UserProfile {
  id: string;
  fullName: string;
  email: string;
  role: string;
}

export default function Header() {
  const pathname = usePathname();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [user, setUser] = useState<UserProfile | null>(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  // Carregar sessão do usuário
  const fetchSession = async () => {
    try {
      const res = await fetch("/api/auth/me");
      const data = await res.json();
      setUser(data.user || null);
    } catch {
      setUser(null);
    }
  };

  useEffect(() => {
    fetchSession();
  }, []);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setUser(null);
      setUserMenuOpen(false);
      window.location.reload();
    } catch (err) {
      console.error(err);
    }
  };

  // Itens públicos do menu superior (Administração removida do site público)
  const navLinks = [
    { href: "/", label: "Início / Campanhas" },
    { href: "/minhas-compras", label: "Minhas Compras" },
    { href: "/ganhadores", label: "Ganhadores" },
    { href: "/ajuda", label: "Ajuda / FAQ" },
  ];

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 dark:bg-[#000000] border-b border-slate-200 dark:border-neutral-900 shadow-xs dark:shadow-[0_4px_20px_rgba(0,0,0,0.5)] backdrop-blur-md transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-2 sm:gap-4 md:gap-6">
          {/* 1. Logo Oficial Bolinha da Sorte (BS) */}
          <Logo href="/" size="md" variant="auto" />

          {/* 2. Todos os Itens Visíveis Diretamente na Barra Superior (Sem Menu Hambúrguer) */}
          <nav className="flex items-center gap-2 sm:gap-3 md:gap-5 lg:gap-7 overflow-x-auto no-scrollbar py-2">
            {navLinks.map((link) => {
              const active =
                link.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(link.href);
              const isAdmin = link.href === "/admin";

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`text-xs sm:text-sm font-semibold transition-colors shrink-0 px-2.5 py-1.5 rounded-lg ${
                    active
                      ? "text-[#10B981] font-bold bg-emerald-50 dark:bg-neutral-900/60"
                      : isAdmin
                      ? "text-amber-600 dark:text-[#FACC15] hover:text-amber-700 dark:hover:text-amber-300 font-bold hover:bg-amber-50 dark:hover:bg-neutral-900/40"
                      : "text-slate-600 dark:text-neutral-300 hover:text-slate-950 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-neutral-900/40"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* 3. Alternador de Modo Claro/Escuro & Botão Entrar / Cadastrar */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Botão de Modo Claro e Modo Escuro */}
            <ThemeToggle />

            {user ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 bg-slate-100 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 text-slate-900 dark:text-white px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl hover:bg-slate-200 dark:hover:bg-neutral-800 transition-all cursor-pointer"
                >
                  <div
                    className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center font-bold text-xs sm:text-sm border ${
                      user.role === "ADMIN"
                        ? "bg-[#0E7A3E]/30 text-amber-600 dark:text-[#FACC15] border-[#0E7A3E]/60 shadow-inner"
                        : "bg-emerald-600/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                    }`}
                  >
                    {user.fullName.substring(0, 2).toUpperCase()}
                  </div>
                  <div className="hidden md:flex flex-col text-left">
                    <span className="text-xs font-bold truncate max-w-[110px]">
                      {user.fullName.split(" ")[0]}
                    </span>
                    <span
                      className={`text-[9px] font-black uppercase tracking-wider ${
                        user.role === "ADMIN"
                          ? "text-amber-600 dark:text-[#FACC15]"
                          : "text-emerald-600 dark:text-emerald-400"
                      }`}
                    >
                      {user.role === "ADMIN" ? "ADMIN" : "COMPRADOR"}
                    </span>
                  </div>
                </button>

                {/* Dropdown Menu */}
                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-60 bg-white dark:bg-neutral-950 border border-slate-200 dark:border-neutral-800 rounded-xl shadow-2xl p-2 z-50 text-slate-900 dark:text-white">
                    <div className="px-3 py-2 border-b border-slate-100 dark:border-neutral-800">
                      <p className="text-xs font-bold truncate">{user.fullName}</p>
                      <p className="text-[11px] text-slate-500 dark:text-neutral-400 truncate">{user.email}</p>
                      {user.role === "ADMIN" && (
                        <span className="inline-block mt-1 text-[9px] font-black uppercase tracking-wider text-amber-600 dark:text-[#FACC15] bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded">
                          Administrador Master
                        </span>
                      )}
                    </div>

                    {user.role === "ADMIN" && (
                      <Link
                        href="/admin/dashboard"
                        onClick={() => setUserMenuOpen(false)}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-[#10B981] hover:bg-slate-100 dark:hover:bg-neutral-900 rounded-lg transition-colors mt-1"
                      >
                        <ShieldCheck className="w-4 h-4 text-[#10B981]" />
                        <span>Ir para Centro de Comando</span>
                      </Link>
                    )}

                    <Link
                      href="/minhas-compras"
                      onClick={() => setUserMenuOpen(false)}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-neutral-300 hover:bg-slate-100 dark:hover:bg-neutral-800 rounded-lg transition-colors mt-1"
                    >
                      <ShoppingBag className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
                      <span>Minhas Compras</span>
                    </Link>

                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors mt-1 cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sair da Conta</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => {
                  setAuthMode("login");
                  setAuthModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 sm:gap-2 bg-[#16A34A] hover:bg-[#0E7A3E] text-white px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all shadow-[0_4px_15px_rgba(22,163,74,0.35)] active:scale-95 cursor-pointer whitespace-nowrap"
              >
                <UserIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span>Entrar / Cadastrar</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        initialMode={authMode}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={(loggedUser) => {
          setUser(loggedUser);
          setAuthModalOpen(false);
          // Redirecionamento automático exclusivo para administrador
          if (loggedUser.role === "ADMIN") {
            window.location.href = "/admin/dashboard";
          }
        }}
      />
    </>
  );
}
