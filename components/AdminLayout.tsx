"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Layers,
  CreditCard,
  Users,
  Trophy,
  ExternalLink,
  LogOut,
  Menu,
  X,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import AdminAccessDenied from "./AdminAccessDenied";
import ThemeToggle from "./ThemeToggle";
import Logo from "./Logo";

interface AdminUser {
  id: string;
  fullName: string;
  email: string;
  role: string;
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [unauthorized, setUnauthorized] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [desktopSidebarCollapsed, setDesktopSidebarCollapsed] = useState(false);

  // Referência para gestos de arrastar na sidebar
  const touchStartX = useRef<number>(0);
  const touchCurrentX = useRef<number>(0);

  // Inicializar preferência da sidebar salva no localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("admin_sidebar_collapsed");
      if (saved === "true") {
        setDesktopSidebarCollapsed(true);
      }
    } catch {
      // ignore
    }
  }, []);

  const toggleDesktopSidebar = () => {
    setDesktopSidebarCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("admin_sidebar_collapsed", next ? "true" : "false");
      } catch {
        // ignore
      }
      return next;
    });
  };

  // Verificar se o usuário atual é realmente ADMIN
  const checkAdminAuth = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/auth/me");
      const data = await res.json();

      if (!res.ok || !data.user) {
        router.push("/admin/login");
        return;
      }

      if (data.user.role !== "ADMIN") {
        setUnauthorized(true);
        setLoading(false);
        return;
      }

      setAdminUser(data.user);
    } catch {
      router.push("/admin/login");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAdminAuth();
  }, []);

  // Gestos de arrastar para o lado (Swipe / Drag)
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchCurrentX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    const diff = touchStartX.current - touchCurrentX.current;
    // Se arrastou mais de 50px para a esquerda, recolhe a barra
    if (diff > 50) {
      if (mobileSidebarOpen) setMobileSidebarOpen(false);
      else if (!desktopSidebarCollapsed) setDesktopSidebarCollapsed(true);
    }
    // Se arrastou mais de 50px para a direita a partir do canto esquerdo, expande
    if (diff < -50 && touchStartX.current < 60) {
      if (!mobileSidebarOpen) setMobileSidebarOpen(true);
      if (desktopSidebarCollapsed) setDesktopSidebarCollapsed(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/admin/login");
      window.location.reload();
    } catch (err) {
      console.error(err);
      router.push("/admin/login");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 dark:bg-[#090D16] flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <div className="w-9 h-9 border-3 border-[#10B981] border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs font-bold text-slate-600 dark:text-slate-300 tracking-wide">
            Carregando Centro de Comando v2.0...
          </span>
        </div>
      </div>
    );
  }

  // Se o usuário logado for comum (role !== "ADMIN"), exibir tela de Acesso Restrito
  if (unauthorized) {
    return <AdminAccessDenied />;
  }

  if (!adminUser) {
    return null;
  }

  // 5 Módulos Principais do Centro de Comando v2.0
  const navModules = [
    {
      href: "/admin/dashboard",
      label: "Visão Geral",
      badge: "Dashboard",
      icon: LayoutDashboard,
      active: pathname === "/admin" || pathname === "/admin/dashboard",
    },
    {
      href: "/admin/campanhas",
      label: "Rifas e Prêmios",
      badge: "Catálogo",
      icon: Layers,
      active: pathname.startsWith("/admin/campanhas"),
    },
    {
      href: "/admin/pedidos",
      label: "Pedidos e Pix",
      badge: "Financeiro",
      icon: CreditCard,
      active: pathname.startsWith("/admin/pedidos"),
    },
    {
      href: "/admin/clientes",
      label: "Clientes e Ranking",
      badge: "Compradores",
      icon: Users,
      active: pathname.startsWith("/admin/clientes"),
    },
    {
      href: "/admin/ganhadores",
      label: "Sorteios e Ganhadores",
      badge: "Oficial",
      icon: Trophy,
      active: pathname.startsWith("/admin/ganhadores"),
    },
  ];

  const currentModule = navModules.find((m) => m.active) || {
    label: "Centro de Comando",
    badge: "Administração",
  };

  const getInitials = (name: string) => {
    if (!name) return "AD";
    const parts = name.trim().split(" ");
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  return (
    <div
      className="min-h-screen bg-slate-100 dark:bg-[#090D16] text-slate-900 dark:text-slate-100 flex antialiased relative transition-colors duration-200"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* ========================================================= */}
      {/* SIDEBAR LATERAL: bg-white dark:bg-[#0B1120] border-slate-200 dark:border-slate-800 */}
      {/* ========================================================= */}

      {/* Backdrop Mobile */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-2xs z-40 lg:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        ></div>
      )}

      {/* Barra Lateral com suporte para arrastar e recolher pro lado */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 bg-white dark:bg-[#0B1120] border-r border-slate-200 dark:border-slate-800 flex flex-col justify-between transition-all duration-300 ease-in-out shadow-sm ${
          mobileSidebarOpen
            ? "translate-x-0"
            : desktopSidebarCollapsed
            ? "-translate-x-full"
            : "translate-x-0 -translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Topo da Sidebar: Logo Bolinha da Sorte Oficial + Selo Centro de Comando v2.0 */}
        <div className="flex flex-col">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
            <Link
              href="/admin/dashboard"
              className="flex items-center gap-2.5 group flex-1 min-w-0"
              onClick={() => setMobileSidebarOpen(false)}
            >
              <Logo size="sm" showText={false} variant="pill" className="p-1 shrink-0" />
              <div className="min-w-0">
                <span className="text-slate-900 dark:text-white font-extrabold text-xs tracking-tight block truncate">
                  CENTRO DE COMANDO
                </span>
                <span className="text-[10px] text-[#10B981] font-mono font-bold flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse"></span>
                  PAINEL v2.0
                </span>
              </div>
            </Link>

            {/* Botão de Recolher Sidebar no Desktop */}
            <button
              type="button"
              onClick={toggleDesktopSidebar}
              className="hidden lg:flex p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="Recolher menu lateral para o lado"
              aria-label="Recolher menu lateral"
            >
              <PanelLeftClose className="w-4 h-4 text-[#10B981]" />
            </button>

            {/* Botão Fechar no Mobile */}
            <button
              type="button"
              onClick={() => setMobileSidebarOpen(false)}
              className="lg:hidden p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              aria-label="Fechar menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Dica de arrastar para o lado */}
          <div className="px-4 py-1.5 bg-slate-50 dark:bg-[#070D18] border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400">
            <span>← Arraste para o lado para recolher</span>
            <button
              type="button"
              onClick={toggleDesktopSidebar}
              className="text-[#10B981] hover:underline font-bold"
            >
              Recolher
            </button>
          </div>

          {/* Navegação dos 5 Módulos */}
          <div className="p-4 space-y-1.5">
            <p className="px-3 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3">
              Módulos do Sistema
            </p>

            {navModules.map((module) => {
              const Icon = module.icon;
              return (
                <Link
                  key={module.href}
                  href={module.href}
                  onClick={() => setMobileSidebarOpen(false)}
                  className={`flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-bold transition-all duration-200 group cursor-pointer ${
                    module.active
                      ? "bg-[#10B981]/15 text-[#10B981] border-l-4 border-[#10B981] shadow-2xs font-extrabold"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      className={`w-4 h-4 transition-transform group-hover:scale-110 ${
                        module.active ? "text-[#10B981]" : "text-slate-400 dark:text-slate-500 group-hover:text-slate-800 dark:group-hover:text-white"
                      }`}
                    />
                    <span>{module.label}</span>
                  </div>

                  <span
                    className={`text-[9px] uppercase px-1.5 py-0.5 rounded font-bold tracking-wider ${
                      module.active
                        ? "bg-[#10B981]/20 text-[#10B981]"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-300"
                    }`}
                  >
                    {module.badge}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Rodapé da Sidebar: Administrador Logado + Ações Rápidas */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 space-y-3 bg-slate-50/80 dark:bg-[#070A11]/60">
          {/* Card do Usuário Admin */}
          <div className="flex items-center gap-3 p-2.5 rounded-xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-2xs">
            <div className="w-9 h-9 rounded-xl bg-[#10B981]/20 border border-[#10B981]/40 text-[#10B981] font-black text-xs flex items-center justify-center shrink-0">
              {getInitials(adminUser.fullName)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                {adminUser.fullName}
              </p>
              <div className="flex items-center gap-1.5 text-[10px] text-slate-500 dark:text-slate-400">
                <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]"></span>
                <span className="truncate">Super Admin</span>
              </div>
            </div>
          </div>

          {/* Botões de Ação Inferior */}
          <div className="grid grid-cols-2 gap-2">
            <Link
              href="/"
              target="_blank"
              className="px-3 py-2 bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 border border-slate-200 dark:border-slate-700/60"
              title="Abrir o site público em nova aba"
            >
              <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
              <span>Ver Site</span>
            </Link>

            <button
              type="button"
              onClick={handleLogout}
              className="px-3 py-2 bg-red-50 dark:bg-red-950/40 hover:bg-red-100 dark:hover:bg-red-900/60 text-red-600 dark:text-red-300 hover:text-red-700 dark:hover:text-red-100 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 border border-red-200 dark:border-red-900/50 cursor-pointer"
              title="Encerrar sessão de administrador"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sair</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Botão Flutuante quando a Sidebar estiver recolhida (Arrastar / Clicar para Expandir) */}
      {desktopSidebarCollapsed && (
        <button
          type="button"
          onClick={toggleDesktopSidebar}
          className="hidden lg:flex fixed left-0 top-20 z-40 bg-white dark:bg-[#0B1120] text-[#10B981] border border-l-0 border-slate-200 dark:border-slate-800 shadow-md rounded-r-xl px-2.5 py-3 items-center gap-1.5 hover:bg-slate-50 dark:hover:bg-slate-900 transition-all cursor-pointer group"
          title="Clique para expandir o menu lateral"
        >
          <PanelLeftOpen className="w-4 h-4 transition-transform group-hover:scale-110" />
          <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200">Menu</span>
        </button>
      )}

      {/* ========================================================= */}
      {/* CONTEÚDO PRINCIPAL COM TRANSIÇÃO DE LARGURA TOTAL */}
      {/* ========================================================= */}
      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out ${
          desktopSidebarCollapsed ? "lg:pl-0" : "lg:pl-72"
        }`}
      >
        {/* Header Superior Limpo: bg-white/95 dark:bg-[#0B1120]/95 border-slate-200/80 dark:border-slate-800 */}
        <header className="sticky top-0 z-30 h-16 bg-white/95 dark:bg-[#0B1120]/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 px-4 sm:px-6 flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-3">
            {/* Botão de Toggle da Sidebar (Mobile & Desktop) */}
            <button
              type="button"
              onClick={() => {
                if (window.innerWidth < 1024) {
                  setMobileSidebarOpen(true);
                } else {
                  toggleDesktopSidebar();
                }
              }}
              className="p-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer flex items-center gap-1.5"
              aria-label="Alternar Menu Lateral"
              title={
                desktopSidebarCollapsed
                  ? "Expandir menu lateral"
                  : "Recolher menu lateral para o lado"
              }
            >
              {desktopSidebarCollapsed ? (
                <PanelLeftOpen className="w-5 h-5 text-[#10B981]" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
              <span className="hidden xl:inline text-xs font-semibold text-slate-500 dark:text-slate-400">
                {desktopSidebarCollapsed ? "Expandir" : "Recolher"}
              </span>
            </button>

            {/* Breadcrumb e Título do Módulo */}
            <div>
              <div className="flex items-center gap-1.5 text-[11px] text-slate-400 dark:text-slate-500 font-medium">
                <span>Centro de Comando</span>
                <span>/</span>
                <span className="text-[#10B981] font-bold">{currentModule.badge}</span>
              </div>
              <h1 className="text-base font-extrabold text-slate-900 dark:text-white leading-tight">
                {currentModule.label}
              </h1>
            </div>
          </div>

          {/* Lado Direito do Header: Alternador de Tema (Sol / Lua), Status Pix Ativo e Atalhos */}
          <div className="flex items-center gap-3">
            {/* Alternador de Modo Claro / Escuro (Sol / Lua) */}
            <ThemeToggle />

            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/40 text-[#10B981] rounded-full border border-emerald-200/80 dark:border-emerald-800/60 text-[11px] font-bold">
              <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse"></span>
              <span>Gateway Pix 100% Operacional</span>
            </div>

            <Link
              href="/"
              className="hidden md:inline-flex items-center gap-1 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-[#10B981] transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Acessar Loja</span>
            </Link>
          </div>
        </header>

        {/* Área de Conteúdo Renderizada: bg-slate-100 dark:bg-[#090D16] */}
        <main className="flex-1 p-4 sm:p-6 md:p-8 max-w-7xl w-full mx-auto space-y-6">
          {children}
        </main>
      </div>
    </div>
  );
}
