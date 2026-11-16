"use client";

import { useState, useEffect } from "react";
import AdminLayout from "@/components/AdminLayout";
import DraggableTable from "@/components/DraggableTable";
import {
  Users,
  Trophy,
  Search,
  MessageCircle,
  X,
  Loader2,
  DollarSign,
  Ticket,
  Sparkles,
  ShoppingBag,
  UserCheck,
  Calendar,
} from "lucide-react";

export default function AdminClientesPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"RANKING" | "BASE">("RANKING");
  const [searchTerm, setSearchTerm] = useState("");

  const loadClients = async (search = searchTerm) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search.trim()) params.append("search", search.trim());

      const res = await fetch(`/api/admin/clients?${params.toString()}`);
      const result = await res.json();
      setData(result);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadClients(searchTerm);
    }, 250);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const ranking = data?.ranking || [];
  const clients = data?.clients || [];
  const stats = data?.stats || { totalClients: 0, activeBuyers: 0, topBuyer: null };

  const getPositionBadge = (pos: number) => {
    if (pos === 1) {
      return (
        <span className="w-7 h-7 rounded-full bg-amber-400 text-amber-950 font-black text-xs flex items-center justify-center shadow-xs">
          🥇 1
        </span>
      );
    }
    if (pos === 2) {
      return (
        <span className="w-7 h-7 rounded-full bg-slate-300 text-slate-800 font-black text-xs flex items-center justify-center shadow-xs">
          🥈 2
        </span>
      );
    }
    if (pos === 3) {
      return (
        <span className="w-7 h-7 rounded-full bg-amber-700 text-amber-100 font-black text-xs flex items-center justify-center shadow-xs">
          🥉 3
        </span>
      );
    }
    return (
      <span className="w-7 h-7 rounded-full bg-slate-100 text-slate-600 font-bold text-xs flex items-center justify-center">
        {pos}º
      </span>
    );
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Topo do Módulo */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
          <div>
            <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
              Gestão de Clientes & Ranking de Compradores
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Identifique os clientes mais ativos, audite volume de compras e acione suporte via WhatsApp
            </p>
          </div>
        </div>

        {/* 3 Cards de Resumo */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-[#111827] p-5 rounded-2xl shadow-2xs border border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Clientes Cadastrados
              </span>
              <p className="text-2xl font-black text-slate-900">{stats.totalClients}</p>
              <span className="text-[10px] text-slate-400 font-medium mt-1 block">
                Total de contas registradas
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white dark:bg-[#111827] p-5 rounded-2xl shadow-2xs border border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Compradores Ativos
              </span>
              <p className="text-2xl font-black text-[#10B981]">{stats.activeBuyers}</p>
              <span className="text-[10px] text-[#10B981] font-bold mt-1 block">
                Usuários com compras quitadas
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#10B981] flex items-center justify-center">
              <UserCheck className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white dark:bg-[#111827] p-5 rounded-2xl shadow-2xs border border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Maior Comprador
              </span>
              <p className="text-lg font-black text-slate-900 truncate max-w-[180px]">
                {stats.topBuyer?.fullName || "—"}
              </p>
              <span className="text-[10px] text-amber-600 font-bold mt-1 block">
                {stats.topBuyer
                  ? `R$ ${Number(stats.topBuyer.totalSpent).toLocaleString("pt-BR", {
                      minimumFractionDigits: 2,
                    })} (${stats.topBuyer.totalTickets} cotas)`
                  : "Nenhum comprador ainda"}
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Trophy className="w-5 h-5" />
            </div>
          </div>
        </section>

        {/* Abas e Barra de Pesquisa */}
        <div className="bg-white dark:bg-[#111827] p-4 rounded-2xl shadow-2xs border border-slate-200/80 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab("RANKING")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-2 ${
                activeTab === "RANKING"
                  ? "bg-[#10B981] text-white shadow-2xs font-extrabold"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
              }`}
            >
              <Trophy className="w-3.5 h-3.5" />
              <span>Ranking dos Maiores Compradores</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("BASE")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-2 ${
                activeTab === "BASE"
                  ? "bg-[#10B981] text-white shadow-2xs font-extrabold"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Base Completa de Clientes</span>
            </button>
          </div>

          {activeTab === "BASE" && (
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por nome, CPF ou fone..."
                className="w-full pl-9 pr-3.5 py-2 bg-slate-50 dark:bg-[#1F2937] text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#10B981]"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Conteúdo da Aba 1: Ranking dos Top Compradores */}
        {activeTab === "RANKING" && (
          <section className="bg-white dark:bg-[#111827] rounded-2xl shadow-2xs border border-slate-200/80 dark:border-slate-800 overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Top Compradores da Plataforma
                </h3>
                <p className="text-xs text-slate-400">
                  Ranqueados rigorosamente pela quantidade total de cotas adquiridas e pagas
                </p>
              </div>
              <span className="px-3 py-1 bg-amber-50 text-amber-700 text-xs font-bold rounded-lg border border-amber-200 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Top Clientes VIP</span>
              </span>
            </div>

            <DraggableTable>
              <table className="w-full text-left text-xs min-w-[720px]">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/75 dark:bg-[#0B1120]/80 text-slate-500 uppercase font-semibold text-[11px] tracking-wider">
                    <th className="py-3 px-4 text-center w-16">Posição</th>
                    <th className="py-3 px-4">Comprador</th>
                    <th className="py-3 px-4">WhatsApp / Telefone</th>
                    <th className="py-3 px-4 text-center">Cotas Compradas</th>
                    <th className="py-3 px-4 text-center">Pedidos Pagos</th>
                    <th className="py-3 px-4 text-right">Total Investido</th>
                    <th className="py-3 px-4 text-center">Atendimento</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium text-slate-800 dark:text-slate-200">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400">
                        <Loader2 className="w-5 h-5 animate-spin mx-auto text-[#10B981] mb-2" />
                        Carregando ranking...
                      </td>
                    </tr>
                  ) : ranking.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400">
                        Nenhum comprador registrado ainda.
                      </td>
                    </tr>
                  ) : (
                    ranking.map((buyer: any) => (
                      <tr key={buyer.userId} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="py-3.5 px-4 text-center">
                          <div className="flex justify-center">
                            {getPositionBadge(buyer.position)}
                          </div>
                        </td>

                        <td className="py-3.5 px-4 font-bold text-slate-900">
                          {buyer.fullName}
                        </td>

                        <td className="py-3.5 px-4 text-slate-600 font-mono text-[11px]">
                          {buyer.phone}
                        </td>

                        <td className="py-3.5 px-4 text-center">
                          <span className="inline-block px-2.5 py-1 bg-emerald-50 text-[#10B981] rounded-lg font-black text-xs">
                            {Number(buyer.totalTickets).toLocaleString("pt-BR")} cotas
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-center font-bold text-slate-700">
                          {buyer.totalOrders}
                        </td>

                        <td className="py-3.5 px-4 text-right font-black text-slate-900 text-sm">
                          R${" "}
                          {Number(buyer.totalSpent).toLocaleString("pt-BR", {
                            minimumFractionDigits: 2,
                          })}
                        </td>

                        <td className="py-3.5 px-4 text-center">
                          {buyer.whatsappUrl ? (
                            <a
                              href={buyer.whatsappUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#25D366] hover:bg-[#20BD5A] text-white rounded-lg font-bold text-[11px] shadow-2xs transition-colors"
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                              <span>WhatsApp</span>
                            </a>
                          ) : (
                            <span className="text-slate-400 text-[11px]">—</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </DraggableTable>
          </section>
        )}

        {/* Conteúdo da Aba 2: Base Completa de Clientes */}
        {activeTab === "BASE" && (
          <section className="bg-white dark:bg-[#111827] rounded-2xl shadow-2xs border border-slate-200/80 dark:border-slate-800 overflow-hidden">
            <DraggableTable>
              <table className="w-full text-left text-xs min-w-[720px]">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/75 dark:bg-[#0B1120]/80 text-slate-500 uppercase font-semibold text-[11px] tracking-wider">
                    <th className="py-3 px-4">Nome do Cliente</th>
                    <th className="py-3 px-4">Contato (Telefone / Email)</th>
                    <th className="py-3 px-4 text-center">Cadastro</th>
                    <th className="py-3 px-4 text-center">Pedidos</th>
                    <th className="py-3 px-4 text-center">Total de Cotas</th>
                    <th className="py-3 px-4 text-right">Valor Gasto</th>
                    <th className="py-3 px-4 text-center">Contato</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium text-slate-800 dark:text-slate-200">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400">
                        <Loader2 className="w-5 h-5 animate-spin mx-auto text-[#10B981] mb-2" />
                        Carregando clientes...
                      </td>
                    </tr>
                  ) : clients.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400">
                        Nenhum cliente localizado para esta busca.
                      </td>
                    </tr>
                  ) : (
                    clients.map((c: any) => (
                      <tr key={c.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-slate-900">
                          {c.fullName}
                          {c.role === "ADMIN" && (
                            <span className="ml-2 px-1.5 py-0.5 bg-slate-800 text-white text-[9px] font-black rounded uppercase">
                              Admin
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 px-4">
                          <p className="text-slate-800 font-mono text-[11px]">{c.phone}</p>
                          <p className="text-slate-400 text-[10px]">{c.email}</p>
                        </td>

                        <td className="py-3.5 px-4 text-center text-slate-500 text-[11px]">
                          {new Date(c.createdAt).toLocaleDateString("pt-BR")}
                        </td>

                        <td className="py-3.5 px-4 text-center font-bold text-slate-800">
                          {c.totalPaidOrders}
                        </td>

                        <td className="py-3.5 px-4 text-center font-black text-[#10B981]">
                          {c.totalTicketsBought}
                        </td>

                        <td className="py-3.5 px-4 text-right font-black text-slate-900">
                          R${" "}
                          {Number(c.totalAmountSpent).toLocaleString("pt-BR", {
                            minimumFractionDigits: 2,
                          })}
                        </td>

                        <td className="py-3.5 px-4 text-center">
                          {c.whatsappUrl ? (
                            <a
                              href={c.whatsappUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#25D366] hover:bg-[#20BD5A] text-white rounded-lg font-bold text-[11px] shadow-2xs transition-colors"
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                              <span>WhatsApp</span>
                            </a>
                          ) : (
                            <span className="text-slate-400 text-[11px]">—</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </DraggableTable>
          </section>
        )}
      </div>
    </AdminLayout>
  );
}
