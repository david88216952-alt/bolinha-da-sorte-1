"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Lock } from "lucide-react";
import ThemeToggle from "./ThemeToggle";

export default function AdminAccessDenied() {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/admin/login");
      window.location.reload();
    } catch (err) {
      console.error("Logout error:", err);
      router.push("/admin/login");
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-[#090D16] flex flex-col items-center justify-start p-4 relative transition-colors duration-200">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      {/* Centralizar um único card branco responsivo ao tema */}
      <div className="max-w-md w-full mx-auto mt-20 p-8 text-center rounded-2xl shadow-xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800">
        {/* Ícone de cadeado vermelho no topo */}
        <div className="w-14 h-14 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-rose-100 dark:border-rose-900 shadow-2xs">
          <Lock className="w-7 h-7" />
        </div>

        {/* Título */}
        <h1 className="text-xl font-black text-slate-900 dark:text-white mb-2">
          Acesso Restrito ao Administrador
        </h1>

        {/* Texto */}
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
          Esta área é exclusiva para administradores do sistema (Centro de Comando v2.0). Sua conta de usuário comum não possui permissão para acessar este painel.
        </p>

        {/* Dois botões empilhados */}
        <div className="flex flex-col gap-3">
          <Link
            href="/"
            className="w-full py-3 bg-[#10B981] hover:bg-[#0EA271] text-white font-extrabold text-sm rounded-xl transition-colors flex items-center justify-center cursor-pointer shadow-sm"
          >
            Voltar ao Site Público
          </Link>

          <button
            type="button"
            onClick={handleLogout}
            className="w-full py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-sm rounded-xl transition-colors cursor-pointer border border-slate-200 dark:border-slate-700"
          >
            Sair desta Conta
          </button>
        </div>
      </div>
    </div>
  );
}
