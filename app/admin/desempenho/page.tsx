"use client";

import { useState, useEffect } from "react";
import AdminLayout from "@/components/AdminLayout";
import { TrendingUp, TrendingDown } from "lucide-react";

export default function AdminDesempenhoPage() {
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadMetrics() {
      try {
        setLoading(true);
        const res = await fetch("/api/admin/metrics");
        const data = await res.json();
        setMetrics(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadMetrics();
  }, []);

  const bestSellers = metrics?.bestSellers || [];
  const worstSellers = metrics?.worstSellers || [];

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Topo da página */}
        <div className="pb-2">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Desempenho de Vendas
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Comparativo de saída de bilhetes por campanha
          </p>
        </div>

        {/* Layout em 2 Colunas Lado a Lado (grid-cols-1 lg:grid-cols-2 gap-6) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          {/* Coluna Esquerda — Mais Vendidas */}
          <div className="bg-white dark:bg-[#111827] p-6 rounded-xl shadow-sm border border-slate-200/80 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-[#0E7A3E] flex items-center justify-center shrink-0">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Mais Vendidas
                </h2>
              </div>
              <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">
                Maior saída de cotas
              </span>
            </div>

            {loading ? (
              <p className="text-xs text-slate-400 dark:text-slate-500 py-4 text-center">Carregando dados...</p>
            ) : bestSellers.length === 0 ? (
              <p className="text-xs text-slate-400 dark:text-slate-500 py-4 text-center">Nenhuma rifa registrada.</p>
            ) : (
              <div className="space-y-4">
                {bestSellers.map((camp: any, idx: number) => (
                  <div
                    key={camp.id}
                    className="flex items-center gap-3 p-3 rounded-lg bg-slate-50/80 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800"
                  >
                    {/* Miniatura */}
                    <img
                      src={camp.coverImageUrl}
                      alt={camp.title}
                      className="w-14 h-14 rounded-lg object-cover bg-slate-200 dark:bg-slate-700 shrink-0"
                    />

                    {/* Dados */}
                    <div className="flex-1 min-w-0 space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="text-xs font-bold text-slate-900 dark:text-white truncate" title={camp.title}>
                          {idx + 1}. {camp.title}
                        </h3>
                        <span className="text-xs font-extrabold text-[#0E7A3E] shrink-0">
                          {camp.percentSold}%
                        </span>
                      </div>

                      {/* Barra de progresso verde */}
                      <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                        <div
                          className="h-full bg-[#0E7A3E] rounded-full"
                          style={{ width: `${Math.max(4, camp.percentSold)}%` }}
                        ></div>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                        <span>{Number(camp.soldTickets).toLocaleString("pt-BR")} cotas</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          R$ {Number(camp.revenue || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Coluna Direita — Menos Vendidas */}
          <div className="bg-white dark:bg-[#111827] p-6 rounded-xl shadow-sm border border-slate-200/80 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                  <TrendingDown className="w-4 h-4" />
                </div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Menos Vendidas
                </h2>
              </div>
              <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">
                Demanda atenção
              </span>
            </div>

            {loading ? (
              <p className="text-xs text-slate-400 dark:text-slate-500 py-4 text-center">Carregando dados...</p>
            ) : worstSellers.length === 0 ? (
              <p className="text-xs text-slate-400 dark:text-slate-500 py-4 text-center">Nenhuma rifa registrada.</p>
            ) : (
              <div className="space-y-4">
                {worstSellers.map((camp: any, idx: number) => (
                  <div
                    key={camp.id}
                    className="flex items-center gap-3 p-3 rounded-lg bg-slate-50/80 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800"
                  >
                    {/* Miniatura */}
                    <img
                      src={camp.coverImageUrl}
                      alt={camp.title}
                      className="w-14 h-14 rounded-lg object-cover bg-slate-200 dark:bg-slate-700 shrink-0"
                    />

                    {/* Dados */}
                    <div className="flex-1 min-w-0 space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="text-xs font-bold text-slate-900 dark:text-white truncate" title={camp.title}>
                          {idx + 1}. {camp.title}
                        </h3>
                        <span className="text-xs font-extrabold text-amber-600 shrink-0">
                          {camp.percentSold}%
                        </span>
                      </div>

                      {/* Barra de progresso amarela */}
                      <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                        <div
                          className="h-full bg-amber-500 rounded-full"
                          style={{ width: `${Math.max(4, camp.percentSold)}%` }}
                        ></div>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                        <span>{Number(camp.soldTickets).toLocaleString("pt-BR")} cotas</span>
                        <span className="font-semibold text-gray-700">
                          R$ {Number(camp.revenue || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
