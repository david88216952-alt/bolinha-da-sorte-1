"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Sparkles,
  ShieldCheck,
  Zap,
  Lock,
  Search,
  Calendar,
  Flame,
  ArrowRight,
  Trophy,
  CheckCircle,
  ExternalLink,
} from "lucide-react";

interface CampaignItem {
  id: string;
  title: string;
  subtitle?: string;
  description: string;
  prizeValue: number;
  ticketPrice: number;
  totalTickets: number;
  soldTickets: number;
  percentSold: number;
  remainingTickets: number;
  drawDate: string;
  status: "ACTIVE" | "COMPLETED";
  coverImageUrl: string;
  galleryImages: string[];
  winner?: {
    winningTicketNumber: string;
    winnerName: string;
    awardedAt: string;
  } | null;
}

export default function HomePage() {
  const [heroCampaign, setHeroCampaign] = useState<CampaignItem | null>(null);
  const [campaigns, setCampaigns] = useState<CampaignItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterTab, setFilterTab] = useState<"all" | "active" | "completed">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    async function loadInitialData() {
      try {
        const [cRes, uRes] = await Promise.all([
          fetch("/api/campaigns"),
          fetch("/api/auth/me").catch(() => null),
        ]);
        const data = await cRes.json();
        setHeroCampaign(data.heroCampaign);
        setCampaigns(data.campaigns || []);

        if (uRes && uRes.ok) {
          const uData = await uRes.json();
          if (uData?.user?.role === "ADMIN") {
            setIsAdmin(true);
          }
        }
      } catch (err) {
        console.error("Error loading campaigns:", err);
      } finally {
        setLoading(false);
      }
    }
    loadInitialData();
  }, []);

  // Filtragem de campanhas
  const filteredCampaigns = campaigns.filter((c) => {
    // Não repetir a campanha Hero na listagem se for a mesma
    if (heroCampaign && c.id === heroCampaign.id && filterTab !== "completed") {
      return false;
    }

    if (filterTab === "active" && c.status !== "ACTIVE") return false;
    if (filterTab === "completed" && c.status !== "COMPLETED") return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = c.title.toLowerCase().includes(q);
      const matchDesc = c.description.toLowerCase().includes(q);
      const matchWinner = c.winner?.winnerName.toLowerCase().includes(q);
      return matchTitle || matchDesc || matchWinner;
    }

    return true;
  });

  return (
    <div className="flex flex-col w-full pb-16">
      {/* 0. Barra Rápida de Gestão para Administrador na Página Inicial */}
      {isAdmin && (
        <aside className="w-full bg-[#0a1a0f] border-b border-emerald-900/60 px-4 sm:px-6 py-2.5 shadow-md">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#FACC15] animate-pulse"></span>
              <span className="font-black text-[#FACC15] uppercase tracking-wider text-[11px]">
                Modo Administrador Ativo
              </span>
              <span className="hidden md:inline text-neutral-400">• Acesso Rápido ao Painel</span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Link
                href="/admin/dashboard"
                className="px-3 py-1 rounded-lg bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 font-bold border border-emerald-800/60 transition-colors flex items-center gap-1.5"
              >
                <span>📊 Dashboard</span>
              </Link>
              <Link
                href="/admin/desempenho"
                className="px-3 py-1 rounded-lg bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 font-bold border border-emerald-800/60 transition-colors flex items-center gap-1.5"
              >
                <span>📈 Desempenho</span>
              </Link>
              <Link
                href="/admin/campanhas"
                className="px-3 py-1 rounded-lg bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 font-bold border border-emerald-800/60 transition-colors flex items-center gap-1.5"
              >
                <span>🎫 Campanhas & Fotos</span>
              </Link>
              <Link
                href="/admin/ganhadores"
                className="px-3 py-1 rounded-lg bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 font-bold border border-emerald-800/60 transition-colors flex items-center gap-1.5"
              >
                <span>🏆 Ganhadores</span>
              </Link>
            </div>
          </div>
        </aside>
      )}

      {/* 1. Live Social Proof Ticker */}
      <div className="w-full bg-[#000000] text-neutral-300 py-2.5 px-4 sm:px-6 lg:px-8 border-b border-neutral-900 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-xs overflow-hidden gap-4">
          <div className="flex items-center gap-2 shrink-0">
            <span className="inline-flex w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            <span className="uppercase tracking-widest text-emerald-400 font-extrabold text-[11px]">
              Ao Vivo
            </span>
          </div>

          <div className="flex items-center gap-6 overflow-x-auto whitespace-nowrap py-0.5 text-neutral-400">
            <span className="flex items-center gap-1.5 text-white font-medium">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>
                <strong>Cota Premiada R$ 2.500</strong> acabou de sair para{" "}
                <em className="text-emerald-400 font-bold not-italic">Renata F. (SP)</em>
              </span>
            </span>
            <span className="text-neutral-700">•</span>
            <span className="flex items-center gap-1.5 text-neutral-300 font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              Loteria Federal Oficial — Extrações semanais da CEF
            </span>
            <span className="text-neutral-700">•</span>
            <span className="flex items-center gap-1.5 text-neutral-300 font-medium">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              +1.850 cotas reservadas nos últimos 15 min
            </span>
          </div>

          <div className="hidden md:flex items-center gap-1.5 text-emerald-400 shrink-0 text-xs font-semibold">
            <Lock className="w-3.5 h-3.5" />
            <span>Ambiente Criptografado SSL</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 space-y-10">
        {/* 2. HERO CARD — ORDENAÇÃO ESTRITA PELO MAIOR VALOR FINANCEIRO (ACTIVE) */}
        {loading ? (
          <div className="w-full h-96 rounded-3xl bg-neutral-200 animate-pulse"></div>
        ) : heroCampaign ? (
          <section className="w-full relative rounded-3xl overflow-hidden shadow-2xl bg-white border border-neutral-100">
            <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[540px]">
              {/* Left Image Side */}
              <div className="lg:col-span-7 relative min-h-[300px] sm:min-h-[400px] lg:min-h-full overflow-hidden bg-neutral-950 group">
                <img
                  src={heroCampaign.coverImageUrl}
                  alt={heroCampaign.title}
                  className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent lg:hidden"></div>

                {/* Micro Floating Badges */}
                <div className="absolute top-4 left-4 flex flex-wrap gap-2 z-10">
                  <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#FACC15] text-neutral-950 text-xs shadow-lg uppercase tracking-wider font-black">
                    <Trophy className="w-3.5 h-3.5 text-neutral-950" />
                    MAIOR PRÊMIO ATIVO
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#16A34A] text-white text-xs shadow-lg font-bold">
                    <Flame className="w-3.5 h-3.5" />
                    Reta Final
                  </span>
                </div>

                {/* Bottom image metadata for desktop */}
                <div className="hidden lg:flex absolute bottom-5 left-6 right-6 items-center justify-between text-white p-3.5 rounded-2xl bg-black/80 backdrop-blur-md border border-white/10 shadow-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-[10px] text-neutral-400 uppercase font-bold tracking-wider">
                        Auditoria Oficial
                      </p>
                      <p className="text-xs font-extrabold text-white">
                        Loteria Federal &bull; Concurso Oficial
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-emerald-400 font-extrabold">
                      Edição Especial
                    </p>
                    <p className="text-[11px] text-neutral-300">
                      Cotas Instantâneas Ativas
                    </p>
                  </div>
                </div>
              </div>

              {/* Right Content & Action Panel */}
              <div className="lg:col-span-5 p-6 sm:p-8 flex flex-col justify-between bg-white">
                <div className="space-y-4">
                  {/* Category & Date */}
                  <div className="flex items-center justify-between">
                    <span className="px-3 py-1 rounded-full bg-neutral-100 text-neutral-700 text-xs font-bold uppercase tracking-wider">
                      {heroCampaign.subtitle || "Edição Especial"}
                    </span>
                    <span className="flex items-center gap-1.5 text-xs text-emerald-700 font-bold bg-emerald-50 px-2.5 py-1 rounded-full">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(heroCampaign.drawDate).toLocaleDateString("pt-BR", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                      })}
                    </span>
                  </div>

                  {/* Titles */}
                  <div>
                    <h1 className="text-xl sm:text-2xl font-black text-neutral-900 tracking-tight leading-tight">
                      {heroCampaign.title}
                    </h1>
                    <p className="text-xs sm:text-sm text-neutral-600 mt-1.5 line-clamp-2 leading-relaxed">
                      {heroCampaign.description}
                    </p>
                  </div>

                  {/* Price & Highlight Box */}
                  <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-100 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] uppercase text-neutral-500 font-bold tracking-wider block">
                        Valor por Cota
                      </span>
                      <div className="flex items-baseline gap-1">
                        <span className="text-sm font-bold text-neutral-600">R$</span>
                        <span className="text-3xl font-black text-[#16A34A] tracking-tight">
                          {heroCampaign.ticketPrice.toFixed(2).replace(".", ",")}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="inline-flex items-center gap-1 text-amber-800 text-[11px] font-extrabold bg-amber-100 border border-amber-200 px-2.5 py-1 rounded-lg">
                        <Sparkles className="w-3 h-3 text-amber-600" /> Cotas Premiadas
                      </span>
                      <p className="text-[11px] text-neutral-500 mt-1">
                        Até R$ 10.000 no Pix na hora
                      </p>
                    </div>
                  </div>

                  {/* Real-time Progress Bar */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-neutral-600 flex items-center gap-1">
                        <Flame className="w-4 h-4 text-emerald-600" />
                        Andamento das Vendas
                      </span>
                      <span className="text-emerald-700 font-extrabold">
                        {heroCampaign.percentSold}% Vendido
                      </span>
                    </div>
                    <div className="w-full h-3 rounded-full bg-neutral-200 overflow-hidden p-0.5">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-[#0E7A3E] to-[#16A34A] transition-all duration-1000 shadow-sm"
                        style={{ width: `${Math.max(5, heroCampaign.percentSold)}%` }}
                      ></div>
                    </div>
                    <p className="text-[11px] text-neutral-500 text-right">
                      Restam poucos bilhetes para o fechamento!
                    </p>
                  </div>

                  {/* Quick Preset Buttons preview */}
                  <div className="space-y-1 pt-1">
                    <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider block">
                      Escolha rápida de cotas
                    </span>
                    <div className="grid grid-cols-4 gap-2">
                      <Link
                        href={`/campanha/${heroCampaign.id}?qty=50`}
                        className="py-2 rounded-xl bg-neutral-100 hover:bg-emerald-100 hover:text-emerald-800 text-xs font-bold text-neutral-800 text-center transition-all shadow-sm"
                      >
                        +50
                      </Link>
                      <Link
                        href={`/campanha/${heroCampaign.id}?qty=100`}
                        className="py-2 rounded-xl bg-neutral-100 hover:bg-emerald-100 hover:text-emerald-800 text-xs font-bold text-neutral-800 text-center transition-all shadow-sm"
                      >
                        +100
                      </Link>
                      <Link
                        href={`/campanha/${heroCampaign.id}?qty=500`}
                        className="py-2 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-[#16A34A] hover:text-white text-xs font-black text-center transition-all shadow-sm relative"
                      >
                        <span className="absolute -top-2 left-1/2 -translate-x-1/2 px-1.5 py-0.2 rounded-full bg-amber-400 text-neutral-950 text-[8px] font-black uppercase">
                          TOP
                        </span>
                        +500
                      </Link>
                      <Link
                        href={`/campanha/${heroCampaign.id}?qty=1000`}
                        className="py-2 rounded-xl bg-neutral-100 hover:bg-emerald-100 hover:text-emerald-800 text-xs font-bold text-neutral-800 text-center transition-all shadow-sm"
                      >
                        +1.000
                      </Link>
                    </div>
                  </div>
                </div>

                {/* Action CTA Button */}
                <div className="pt-6 space-y-2">
                  <Link
                    href={`/campanha/${heroCampaign.id}`}
                    className="w-full py-4 px-6 rounded-2xl bg-[#0E7A3E] hover:bg-[#16A34A] text-white text-base font-extrabold transition-all duration-200 flex items-center justify-center gap-2 shadow-[0_8px_25px_rgba(14,122,62,0.35)] hover:shadow-[0_12px_30px_rgba(14,122,62,0.45)] active:scale-[0.98]"
                  >
                    <span>Comprar agora / Participar do Sorteio</span>
                    <ArrowRight className="w-5 h-5" />
                  </Link>

                  <p className="text-[11px] text-neutral-500 text-center flex items-center justify-center gap-1">
                    <Zap className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Pagamento instantâneo via Pix com confirmação automática.</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Micro-cards de Vantagens da Campanha */}
            <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-neutral-100 bg-neutral-50/80 border-t border-neutral-100">
              <div className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white text-emerald-600 shadow-sm flex items-center justify-center shrink-0 border border-neutral-100">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-neutral-900">
                    100% Auditado pela Loteria Federal
                  </h4>
                  <p className="text-[11px] text-neutral-500">
                    Sorteio baseado na extração oficial da CEF
                  </p>
                </div>
              </div>

              <div className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white text-amber-600 shadow-sm flex items-center justify-center shrink-0 border border-neutral-100">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-neutral-900">
                    Cotas Premiadas Instantâneas
                  </h4>
                  <p className="text-[11px] text-neutral-500">
                    Comprou a cota premiada, recebeu o PIX na hora
                  </p>
                </div>
              </div>

              <div className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white text-emerald-600 shadow-sm flex items-center justify-center shrink-0 border border-neutral-100">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-neutral-900">
                    Pagamento Instantâneo via PIX
                  </h4>
                  <p className="text-[11px] text-neutral-500">
                    Seus números confirmados em menos de 10 segundos
                  </p>
                </div>
              </div>
            </div>
          </section>
        ) : null}

        {/* 3. BARRA DE BUSCA E FILTROS */}
        <section className="w-full flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-neutral-100">
          {/* Tabs Filter */}
          <div className="flex items-center gap-1.5 p-1 bg-neutral-100 rounded-xl shrink-0 overflow-x-auto">
            <button
              onClick={() => setFilterTab("all")}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                filterTab === "all"
                  ? "bg-[#000000] text-white shadow-sm"
                  : "text-neutral-600 hover:text-neutral-900"
              }`}
            >
              Todas as Campanhas
            </button>
            <button
              onClick={() => setFilterTab("active")}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                filterTab === "active"
                  ? "bg-[#000000] text-white shadow-sm"
                  : "text-neutral-600 hover:text-neutral-900"
              }`}
            >
              <span>Em Andamento</span>
              <span className="w-2 h-2 rounded-full bg-[#16A34A]"></span>
            </button>
            <button
              onClick={() => setFilterTab("completed")}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                filterTab === "completed"
                  ? "bg-[#000000] text-white shadow-sm"
                  : "text-neutral-600 hover:text-neutral-900"
              }`}
            >
              Concluídas / Encerradas
            </button>
          </div>

          {/* Search Input */}
          <div className="relative w-full md:max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por prêmio (Hilux, BMW, Pix, etc.)..."
              className="w-full pl-10 pr-4 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs sm:text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all placeholder:text-neutral-400"
            />
          </div>
        </section>

        {/* 4. LISTAGEM SECUNDÁRIA DE SORTEIOS */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-neutral-900 tracking-tight">
                Sorteios Disponíveis
              </h2>
              <p className="text-xs sm:text-sm text-neutral-500">
                Escolha a sua sorte e garanta seus bilhetes antes que acabem
              </p>
            </div>
          </div>

          {filteredCampaigns.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-3xl border border-neutral-100 shadow-sm space-y-2">
              <Trophy className="w-10 h-10 text-neutral-300 mx-auto" />
              <p className="text-sm font-bold text-neutral-700">
                Nenhuma campanha encontrada com esse filtro.
              </p>
              <p className="text-xs text-neutral-500">
                Tente alterar os termos da busca ou selecionar outra aba.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCampaigns.map((camp) => {
                const isCompleted = camp.status === "COMPLETED";

                return (
                  <article
                    key={camp.id}
                    className="flex flex-col bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-neutral-100 group"
                  >
                    {/* Card Image */}
                    <div className="relative h-56 bg-neutral-900 overflow-hidden">
                      <img
                        src={camp.coverImageUrl}
                        alt={camp.title}
                        className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 ${
                          isCompleted ? "grayscale group-hover:grayscale-0" : ""
                        }`}
                      />

                      {/* Status Badges */}
                      <div className="absolute top-3 left-3 flex gap-2">
                        {isCompleted ? (
                          <span className="px-3 py-1 rounded-md bg-[#2D3133] text-white text-[11px] font-extrabold uppercase tracking-wider flex items-center gap-1 shadow-md">
                            <CheckCircle className="w-3.5 h-3.5" />
                            Concluído
                          </span>
                        ) : (
                          <span className="px-3 py-1 rounded-md bg-[#0E7A3E] text-white text-[11px] font-extrabold uppercase tracking-wider flex items-center gap-1 shadow-md">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                            Adquira já!
                          </span>
                        )}
                      </div>

                      {/* Ticket price or Draw Date overlay */}
                      <div className="absolute bottom-3 right-3 px-3 py-1 rounded-lg bg-black/85 backdrop-blur-md text-white font-extrabold text-xs shadow-md">
                        {isCompleted ? (
                          <span>Sorteio Realizado</span>
                        ) : (
                          <span>
                            R$ {camp.ticketPrice.toFixed(2).replace(".", ",")}{" "}
                            <span className="font-normal text-neutral-400 text-[10px]">
                              / cota
                            </span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Card Body */}
                    <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-neutral-500 text-xs">
                          <span className="flex items-center gap-1 text-emerald-700 font-bold">
                            <Calendar className="w-3.5 h-3.5" />
                            Sorteio:{" "}
                            {new Date(camp.drawDate).toLocaleDateString("pt-BR", {
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                            })}
                          </span>
                          <span className="font-medium text-[11px]">Loteria Federal</span>
                        </div>

                        <h3 className="font-extrabold text-base text-neutral-900 line-clamp-2 group-hover:text-emerald-700 transition-colors">
                          {camp.title}
                        </h3>

                        <p className="text-xs text-neutral-500 line-clamp-2">
                          {camp.description}
                        </p>
                      </div>

                      {/* Progress or Winner Card */}
                      <div className="space-y-3 pt-2 border-t border-neutral-100">
                        {isCompleted ? (
                          <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-100 flex items-center gap-2.5">
                            <Trophy className="w-5 h-5 text-amber-500 shrink-0" />
                            <div className="overflow-hidden">
                              <p className="text-[10px] text-neutral-500 font-bold uppercase">
                                Ganhador Oficial
                              </p>
                              <p className="text-xs font-bold text-neutral-900 truncate">
                                {camp.winner?.winnerName || "Ganhador Homologado"}{" "}
                                <span className="text-emerald-700 font-normal">
                                  (Bilhete #{camp.winner?.winningTicketNumber || "000000"})
                                </span>
                              </p>
                            </div>
                          </div>
                        ) : (
                          <div>
                            <div className="flex justify-between text-xs font-bold mb-1">
                              <span className="text-neutral-500">Vendido</span>
                              <span className="text-emerald-700 font-extrabold">
                                {camp.percentSold}%
                              </span>
                            </div>
                            <div className="w-full h-2 rounded-full bg-neutral-200 overflow-hidden">
                              <div
                                className="h-full bg-[#16A34A] rounded-full transition-all duration-700"
                                style={{ width: `${Math.max(5, camp.percentSold)}%` }}
                              ></div>
                            </div>
                          </div>
                        )}

                        {/* Button */}
                        <Link
                          href={`/campanha/${camp.id}`}
                          className={`w-full py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-1.5 shadow-sm active:scale-95 ${
                            isCompleted
                              ? "bg-neutral-100 hover:bg-neutral-200 text-neutral-800"
                              : "bg-[#0E7A3E] hover:bg-[#16A34A] text-white shadow-emerald-900/10"
                          }`}
                        >
                          <span>{isCompleted ? "Ver Resultado e Detalhes" : "Ver Sorteio"}</span>
                          <ArrowRight className="w-4 h-4" />
                        </Link>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
