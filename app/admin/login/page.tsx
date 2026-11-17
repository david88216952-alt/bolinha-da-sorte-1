"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ShieldCheck, Lock, Mail, ArrowLeft, AlertCircle } from "lucide-react";
import AdminAccessDenied from "@/components/AdminAccessDenied";
import ThemeToggle from "@/components/ThemeToggle";
import Logo from "@/components/Logo";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Se o usuário logado for USER, exibir a tela de Acesso Negado
  const [isNormalUser, setIsNormalUser] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch("/api/auth/me");
        const data = await res.json();
        if (data.user) {
          if (data.user.role === "ADMIN") {
            router.push("/admin/dashboard");
            return;
          } else {
            // Usuário comum logado tentando acessar login administrativo
            setCurrentUser(data.user);
            setIsNormalUser(true);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setCheckingAuth(false);
      }
    }
    checkAuth();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: email, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Credenciais de administrador inválidas.");
        setLoading(false);
        return;
      }

      // Se logou com sucesso, mas a conta for USER (cliente comum):
      if (data.user.role !== "ADMIN") {
        setCurrentUser(data.user);
        setIsNormalUser(true);
        setLoading(false);
        return;
      }

      // Sucesso: Redireciona para o Dashboard Geral
      router.push("/admin/dashboard");
    } catch {
      setError("Erro de comunicação com o servidor.");
      setLoading(false);
    }
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-slate-100 dark:bg-[#090D16] flex items-center justify-center p-4">
        <div className="w-10 h-10 border-4 border-[#10B981] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Se for usuário comum tentando acessar
  if (isNormalUser) {
    return <AdminAccessDenied />;
  }

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-[#090D16] flex flex-col justify-center items-center p-4 sm:p-6 relative">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
        {/* Logo BS Oficial de Alta Resolução e Selo de Acesso Restrito */}
        <div className="text-center space-y-3">
          <div className="inline-block transition-transform hover:scale-105">
            <Logo href="/" size="lg" variant="pill" />
          </div>

          <div className="pt-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-black uppercase tracking-wider">
              <ShieldCheck className="w-3.5 h-3.5 text-[#10B981]" />
              Acesso Restrito — Administração
            </span>
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            Informe suas credenciais de administrador para acessar o painel de gestão.
          </p>
        </div>

        {error && (
          <div className="p-3.5 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 text-xs font-bold rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              E-mail Administrativo
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@bolinhadasorte.com.br"
                className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-[#1F2937] border border-slate-300 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#10B981] transition-all placeholder:text-slate-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Senha Master
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-[#1F2937] border border-slate-300 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#10B981] transition-all placeholder:text-slate-400"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-4 bg-[#0E7A3E] hover:bg-[#16A34A] text-white font-extrabold text-sm rounded-xl transition-all shadow-md active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            {loading ? "Autenticando..." : "Entrar no Painel Administrativo"}
          </button>
        </form>

        {/* Bottom Helper & Return */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 text-center space-y-3">
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Acesso mestre padrão:{" "}
            <strong className="text-emerald-600 dark:text-emerald-400">admin@bolinhadasorte.com.br</strong>
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-slate-400" />
            <span>Voltar para a Página Inicial do Site</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
