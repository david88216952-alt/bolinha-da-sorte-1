"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Trophy, Calendar, Phone, Award, ShieldCheck, Ticket, ArrowLeft } from "lucide-react";

interface WinnerItem {
  id: string;
  campaignId: string;
  campaignTitle: string;
  campaignCoverImage: string;
  prizeValue: number;
  winnerName: string;
  maskedPhone: string; // strictly masked: (XX) *****-****
  winningTicketNumber: string;
  winnerPhotoUrl: string | null;
  awardedAt: string;
}

export default function GanhadoresPage() {
  const [winners, setWinners] = useState<WinnerItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadWinners() {
      try {
        const res = await fetch("/api/winners");
        const data = await res.json();
        setWinners(data.winners || []);
      } catch (err) {
        console.error("Error loading winners:", err);
      } finally {
        setLoading(false);
      }
    }
    loadWinners();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 pb-20">
      {/* Navigation / Back Bar */}
      <div className="flex items-center justify-between gap-4">
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-neutral-50 border border-neutral-200 hover:border-neutral-300 text-neutral-800 hover:text-neutral-950 text-xs sm:text-sm font-bold shadow-sm transition-all group"
        >
          <ArrowLeft className="w-4 h-4 text-emerald-600 group-hover:-translate-x-1 transition-transform" />
          <span>Voltar ao Início</span>
        </Link>
        <span className="text-xs text-neutral-500 font-medium">
          Resultados Oficiais
        </span>
      </div>

      {/* Header Banner */}
      <section className="text-center max-w-2xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-100 text-amber-900 border border-amber-200 text-xs font-black uppercase tracking-wider">
          <Trophy className="w-4 h-4 text-amber-600" />
          <span>Galeria de Campeões Oficiais</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-neutral-900 tracking-tight">
          Ganhadores Bolinha da Sorte
        </h1>
        <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed">
          Transparência total em cada extração. Todos os sorteios são auditados e baseados nos resultados oficiais da Loteria Federal.
        </p>
      </section>

      {/* Trust & LGPD Notice Badge */}
      <div className="p-4 bg-white rounded-2xl border border-neutral-100 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5 text-neutral-700">
          <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>
            <strong>Proteção de Dados (LGPD):</strong> Os números de telefone são mascarados no back-end para preservar a privacidade e segurança dos nossos ganhadores.
          </span>
        </div>
        <span className="font-mono text-emerald-700 font-bold bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 shrink-0">
          Mascara: (XX) *****-****
        </span>
      </div>

      {/* Winners Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="h-96 bg-neutral-200 rounded-3xl animate-pulse"></div>
          <div className="h-96 bg-neutral-200 rounded-3xl animate-pulse"></div>
          <div className="h-96 bg-neutral-200 rounded-3xl animate-pulse"></div>
        </div>
      ) : winners.length === 0 ? (
        <div className="p-16 text-center bg-white rounded-3xl border border-neutral-100 shadow-sm space-y-2">
          <Trophy className="w-12 h-12 text-neutral-300 mx-auto" />
          <h3 className="text-base font-bold text-neutral-700">
            Nenhum ganhador registrado ainda
          </h3>
          <p className="text-xs text-neutral-500">
            Participe das campanhas ativas para ser o próximo contemplado!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {winners.map((winner) => (
            <article
              key={winner.id}
              className="bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-neutral-100 flex flex-col justify-between group"
            >
              {/* Image / Avatar Header with Fallback to avoid broken images */}
              <div className="relative h-60 bg-neutral-950 overflow-hidden flex items-center justify-center">
                {winner.winnerPhotoUrl ? (
                  <img
                    src={winner.winnerPhotoUrl}
                    alt={winner.winnerName}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  /* Avatar / Ícone de troféu padrão caso winner_photo_url seja nulo para evitar imagens quebradas */
                  <div className="flex flex-col items-center justify-center text-center p-6 space-y-3">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-300 flex items-center justify-center shadow-2xl ring-4 ring-amber-400/30">
                      <Trophy className="w-10 h-10 text-neutral-950" />
                    </div>
                    <div>
                      <span className="text-white text-xs font-black tracking-wider uppercase">
                        Ganhador Oficial
                      </span>
                      <p className="text-neutral-400 text-[11px]">Sorteio Homologado</p>
                    </div>
                  </div>
                )}

                {/* Floating Trophy Badge */}
                <div className="absolute top-4 left-4">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#FACC15] text-neutral-950 text-xs font-black uppercase tracking-wider shadow-lg">
                    <Award className="w-3.5 h-3.5 text-neutral-950" />
                    Contemplado Oficial
                  </span>
                </div>

                {/* Winning Ticket Tag on Image */}
                <div className="absolute bottom-4 right-4 bg-black/85 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-white/10 text-white font-mono text-xs font-black shadow-lg">
                  Cota: #{winner.winningTicketNumber}
                </div>
              </div>

              {/* Card Body */}
              <div className="p-6 space-y-4 flex-1 flex flex-col justify-between">
                <div className="space-y-3">
                  {/* Winner Name & Masked Phone */}
                  <div>
                    <h3 className="text-xl font-black text-neutral-900 group-hover:text-emerald-700 transition-colors">
                      {winner.winnerName}
                    </h3>
                    <p className="text-xs text-neutral-500 flex items-center gap-1.5 font-mono font-semibold mt-1">
                      <Phone className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{winner.maskedPhone}</span>
                    </p>
                  </div>

                  {/* Prize Details Box */}
                  <div className="p-3.5 rounded-2xl bg-neutral-50 border border-neutral-100 space-y-1">
                    <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider block">
                      Prêmio Conquistado
                    </span>
                    <p className="text-sm font-extrabold text-neutral-900 leading-tight">
                      {winner.campaignTitle}
                    </p>
                  </div>
                </div>

                {/* Date & Audit Info */}
                <div className="pt-4 border-t border-neutral-100 flex items-center justify-between text-xs text-neutral-500">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-emerald-600" />
                    <span>
                      {new Date(winner.awardedAt).toLocaleDateString("pt-BR", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-emerald-700 font-bold text-[11px]">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Loteria Federal</span>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Bottom Back Button */}
      <div className="pt-6 flex justify-center">
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-white hover:bg-neutral-50 border border-neutral-200 text-neutral-800 text-sm font-bold shadow-sm transition-all group"
        >
          <ArrowLeft className="w-4 h-4 text-emerald-600 group-hover:-translate-x-1 transition-transform" />
          <span>Voltar para as Campanhas Ativas</span>
        </Link>
      </div>
    </div>
  );
}
