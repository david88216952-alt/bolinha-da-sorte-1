"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import AdminLayout from "@/components/AdminLayout";
import DraggableTable from "@/components/DraggableTable";
import { useConfirm } from "@/components/ConfirmDialogProvider";
import {
  DollarSign,
  Ticket,
  Layers,
  ShoppingCart,
  Filter,
  Eye,
  CheckCircle,
  AlertCircle,
  X,
  Loader2,
  Sparkles,
  TrendingUp,
  CreditCard,
  Plus,
  Trophy,
  ArrowUpRight,
  Clock,
} from "lucide-react";

export default function AdminDashboardPage() {
  const { confirm, alert } = useConfirm();
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [chartPeriod, setChartPeriod] = useState<"7days" | "30days">("7days");
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>("all");

  // Modal de visualização de bilhetes
  const [ticketModalOpen, setTicketModalOpen] = useState(false);
  const [loadingTickets, setLoadingTickets] = useState(false);
  const [selectedOrderDetails, setSelectedOrderDetails] = useState<any>(null);

  // Status de aprovação manual
  const [approvingOrderId, setApprovingOrderId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const loadMetrics = async (p = chartPeriod, cId = selectedCampaignId) => {
    try {
      setLoading(true);
      const url = `/api/admin/metrics?period=${p}${
        cId && cId !== "all" ? `&campaignId=${cId}` : ""
      }`;
      const res = await fetch(url);
      const data = await res.json();
      setMetrics(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMetrics(chartPeriod, selectedCampaignId);
  }, [chartPeriod, selectedCampaignId]);

  // Função para abrir modal e carregar bilhetes do pedido
  const handleOpenTickets = async (orderId: string) => {
    setTicketModalOpen(true);
    setLoadingTickets(true);
    setSelectedOrderDetails(null);

    try {
      const res = await fetch(`/api/orders/${orderId}`);
      const data = await res.json();
      if (res.ok && data.order) {
        setSelectedOrderDetails(data.order);
      } else {
        await alert({
          title: "Atenção",
          message: "Não foi possível carregar os bilhetes deste pedido.",
          variant: "warning",
        });
        setTicketModalOpen(false);
      }
    } catch (err) {
      console.error(err);
      await alert({
        title: "Erro de Comunicação",
        message: "Erro ao buscar bilhetes do pedido. Tente novamente.",
        variant: "danger",
      });
      setTicketModalOpen(false);
    } finally {
      setLoadingTickets(false);
    }
  };

  // Função para aprovar manualmente um pedido pendente
  const handleApproveOrder = async (
    orderId: string,
    buyerName: string,
    totalAmount: number
  ) => {
    const formattedVal = Number(totalAmount).toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
    });
    const confirmed = await confirm({
      title: "Aprovação Manual de Pagamento",
      message: `Deseja realmente aprovar manualmente o pedido de "${buyerName}" no valor de R$ ${formattedVal}?\n\nOs bilhetes serão gerados e vinculados imediatamente ao comprador.`,
      confirmLabel: "Sim, Aprovar Pagamento",
      cancelLabel: "Cancelar",
      variant: "warning",
    });
    if (!confirmed) {
      return;
    }

    setApprovingOrderId(orderId);
    setToastMessage(null);

    try {
      const res = await fetch(`/api/admin/orders/${orderId}/approve`, {
        method: "POST",
      });
      const data = await res.json();

      if (res.ok) {
        setToastMessage({
          type: "success",
          text: `Pedido de ${buyerName} aprovado com sucesso! ${
            data.ticketsCreated || ""
          } cotas emitidas.`,
        });

        if (selectedOrderDetails?.id === orderId) {
          handleOpenTickets(orderId);
        }

        loadMetrics(chartPeriod, selectedCampaignId);
      } else {
        setToastMessage({
          type: "error",
          text: data.error || "Erro ao aprovar pedido manualmente.",
        });
      }
    } catch (err) {
      console.error(err);
      setToastMessage({
        type: "error",
        text: "Erro de comunicação ao aprovar pedido.",
      });
    } finally {
      setApprovingOrderId(null);
    }
  };

  const kpis = metrics?.kpis || {
    totalRevenue: 0,
    totalTicketsSold: 0,
    paidTickets: 0,
    pendingTickets: 0,
    activeCampaignsCount: 0,
    averageTicket: 0,
  };

  const chartData = metrics?.dailyChartData || [];
  const maxVal = Math.max(...chartData.map((d: any) => d.revenue || 0), 100);
  const campaignsList = metrics?.allCampaigns || [];

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Topo: Boas-vindas e Filtro por Campanha */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
          <div>
            <h2 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Visão Geral do Centro de Comando
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Métricas consolidadas de vendas, fluxo financeiro Pix e atividade recente
            </p>
          </div>

          {/* Filtro por Campanha */}
          <div className="flex items-center gap-2 bg-white dark:bg-[#111827] px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs self-start sm:self-center">
            <Filter className="w-4 h-4 text-[#10B981] shrink-0" />
            <label
              htmlFor="campaignFilter"
              className="text-xs font-bold text-slate-700 whitespace-nowrap"
            >
              Campanha:
            </label>
            <select
              id="campaignFilter"
              value={selectedCampaignId}
              onChange={(e) => setSelectedCampaignId(e.target.value)}
              className="text-xs font-semibold text-slate-900 bg-transparent border-none focus:outline-none cursor-pointer pr-3"
            >
              <option value="all">Todas as Campanhas</option>
              {campaignsList.map((camp: any) => (
                <option key={camp.id} value={camp.id}>
                  {camp.title}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Notificação Toast de Ação */}
        {toastMessage && (
          <div
            className={`p-4 rounded-xl text-xs font-bold flex items-center justify-between shadow-sm animate-fade-in ${
              toastMessage.type === "success"
                ? "bg-emerald-50 border border-emerald-200 text-emerald-800"
                : "bg-rose-50 border border-rose-200 text-rose-700"
            }`}
          >
            <div className="flex items-center gap-2">
              {toastMessage.type === "success" ? (
                <CheckCircle className="w-4 h-4 text-[#10B981] shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span>{toastMessage.text}</span>
            </div>
            <button
              type="button"
              onClick={() => setToastMessage(null)}
              className="text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Linha 1 — 5 Cards de Resumo Executivo */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Card 1: Faturamento Total */}
          <div className="bg-white dark:bg-[#111827] p-5 rounded-2xl shadow-2xs border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Faturamento Total
              </span>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-[#10B981] flex items-center justify-center shrink-0">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <div>
              <p className="text-2xl font-black text-slate-900 dark:text-white truncate">
                R$ {Number(kpis.totalRevenue).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </p>
              <span className="text-[10px] text-[#10B981] font-bold flex items-center gap-1 mt-1">
                <TrendingUp className="w-3 h-3" /> Receita confirmada Pix
              </span>
            </div>
          </div>

          {/* Card 2: Cotas Pagas */}
          <div className="bg-white dark:bg-[#111827] p-5 rounded-2xl shadow-2xs border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Cotas Pagas
              </span>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-[#10B981] flex items-center justify-center shrink-0">
                <Ticket className="w-4 h-4" />
              </div>
            </div>
            <div>
              <p className="text-2xl font-black text-slate-900 dark:text-white truncate">
                {Number(kpis.paidTickets || kpis.totalTicketsSold).toLocaleString("pt-BR")}
              </p>
              <span className="text-[10px] text-slate-500 font-medium block mt-1">
                Números da sorte ativos
              </span>
            </div>
          </div>

          {/* Card 3: Pedidos Pendentes */}
          <div className="bg-white dark:bg-[#111827] p-5 rounded-2xl shadow-2xs border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Aguardando Pix
              </span>
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div>
              <p className="text-2xl font-black text-amber-600 truncate">
                {Number(kpis.pendingTickets).toLocaleString("pt-BR")}
              </p>
              <span className="text-[10px] text-amber-700 font-medium block mt-1">
                Cotas reservadas
              </span>
            </div>
          </div>

          {/* Card 4: Ticket Médio */}
          <div className="bg-white dark:bg-[#111827] p-5 rounded-2xl shadow-2xs border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Ticket Médio
              </span>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-[#10B981] flex items-center justify-center shrink-0">
                <ShoppingCart className="w-4 h-4" />
              </div>
            </div>
            <div>
              <p className="text-2xl font-black text-slate-900 dark:text-white truncate">
                R$ {Number(kpis.averageTicket).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </p>
              <span className="text-[10px] text-slate-500 font-medium block mt-1">
                Média por pedido
              </span>
            </div>
          </div>

          {/* Card 5: Rifas Ativas */}
          <div className="bg-white dark:bg-[#111827] p-5 rounded-2xl shadow-2xs border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Rifas Ativas
              </span>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-[#10B981] flex items-center justify-center shrink-0">
                <Layers className="w-4 h-4" />
              </div>
            </div>
            <div>
              <p className="text-2xl font-black text-slate-900 dark:text-white truncate">
                {kpis.activeCampaignsCount}
              </p>
              <span className="text-[10px] text-slate-500 font-medium block mt-1">
                Sorteios abertos
              </span>
            </div>
          </div>
        </section>

        {/* Atalhos de Ação Rápida */}
        <section className="bg-gradient-to-r from-slate-900 to-[#090D16] p-5 rounded-2xl shadow-sm text-white flex flex-col sm:flex-row items-center justify-between gap-4 border border-slate-800">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-[#10B981]/20 border border-[#10B981]/40 flex items-center justify-center text-[#10B981] shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-white">
                Centro Operacional de Ações Rápidas
              </h3>
              <p className="text-xs text-slate-400">
                Gerencie rifas, audite pagamentos Pix ou homologue novos vencedores em um clique
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <Link
              href="/admin/campanhas"
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-[#10B981] hover:bg-[#0EA271] text-white text-xs font-bold rounded-xl transition-all shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nova Rifa</span>
            </Link>

            <Link
              href="/admin/pedidos"
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl transition-all border border-slate-700"
            >
              <CreditCard className="w-3.5 h-3.5 text-[#10B981]" />
              <span>Pedidos Pix</span>
            </Link>

            <Link
              href="/admin/ganhadores"
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl transition-all border border-slate-700"
            >
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
              <span>Sorteios</span>
            </Link>
          </div>
        </section>

        {/* Linha 2 — Gráfico de Vendas (Evolução de Faturamento) */}
        <section className="bg-white dark:bg-[#111827] p-6 rounded-2xl shadow-2xs border border-slate-200/80 dark:border-slate-800">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-6">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Evolução de Vendas</h3>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                {selectedCampaignId !== "all"
                  ? "Entradas registradas para a campanha selecionada"
                  : "Entradas consolidadas de todas as campanhas ativas"}
              </p>
            </div>

            {/* Alternador 7 dias / 30 dias */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-bold">
              <button
                type="button"
                onClick={() => setChartPeriod("7days")}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                  chartPeriod === "7days"
                    ? "bg-white dark:bg-slate-700 text-[#10B981] shadow-2xs font-extrabold"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                7 dias
              </button>
              <button
                type="button"
                onClick={() => setChartPeriod("30days")}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                  chartPeriod === "30days"
                    ? "bg-white dark:bg-slate-700 text-[#10B981] shadow-2xs font-extrabold"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                30 dias
              </button>
            </div>
          </div>

          {/* Gráfico de Barras Responsivo */}
          <div className="w-full h-[280px] flex items-end justify-between gap-1 sm:gap-2 pt-8 pb-2 relative select-none">
            {chartData.length === 0 ? (
              <div className="w-full h-full flex items-center justify-center text-xs text-slate-400 dark:text-slate-500">
                Nenhum dado de vendas no período
              </div>
            ) : (
              chartData.map((d: any, idx: number) => {
                const is30Days = chartPeriod === "30days";
                const heightPercent =
                  d.revenue > 0 && maxVal > 0
                    ? Math.max(10, Math.min(100, Math.round((d.revenue / maxVal) * 100)))
                    : 4;

                const shouldShowDate = is30Days
                  ? idx === 0 ||
                    idx === Math.floor(chartData.length * 0.25) ||
                    idx === Math.floor(chartData.length * 0.5) ||
                    idx === Math.floor(chartData.length * 0.75) ||
                    idx === chartData.length - 1
                  : true;

                return (
                  <div
                    key={idx}
                    className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group relative cursor-pointer"
                  >
                    {/* Tooltip Interativo Flutuante */}
                    <div
                      className={`absolute bottom-[calc(100%+10px)] z-30 hidden group-hover:flex flex-col gap-1.5 px-3 py-2.5 rounded-xl bg-slate-900/95 dark:bg-slate-950/95 backdrop-blur-md text-white text-xs shadow-2xl border border-slate-700/60 pointer-events-none whitespace-nowrap transition-all duration-150 ${
                        idx < 3
                          ? "left-0"
                          : idx > chartData.length - 4
                          ? "right-0"
                          : "left-1/2 -translate-x-1/2"
                      }`}
                    >
                      <div className="flex items-center gap-1.5 font-bold text-slate-200 border-b border-slate-700/60 pb-1 text-[11px]">
                        <Clock className="w-3 h-3 text-[#10B981]" />
                        <span>
                          {d.date} ({d.dayName})
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-4 text-[11px]">
                        <span className="text-slate-400">Arrecadação:</span>
                        <span className="font-extrabold text-[#10B981]">
                          R${" "}
                          {Number(d.revenue || 0).toLocaleString("pt-BR", {
                            minimumFractionDigits: 2,
                          })}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-4 text-[11px]">
                        <span className="text-slate-400">Cotas vendidas:</span>
                        <span className="font-bold text-slate-200">
                          {Number(d.tickets || 0).toLocaleString("pt-BR")} cotas
                        </span>
                      </div>
                      {/* Setinha apontando para a barra */}
                      <div
                        className={`absolute top-full -mt-1 w-2 h-2 rotate-45 bg-slate-900 dark:bg-slate-950 border-r border-b border-slate-700/60 ${
                          idx < 3
                            ? "left-3"
                            : idx > chartData.length - 4
                            ? "right-3"
                            : "left-1/2 -translate-x-1/2"
                        }`}
                      />
                    </div>

                    {/* Valor acima da barra (oculta 'R$ 0' e valores vazios) */}
                    {d.revenue > 0 ? (
                      <span
                        className={`text-[9px] sm:text-[10px] font-bold text-emerald-600 dark:text-emerald-400 group-hover:text-emerald-500 transition-colors truncate ${
                          is30Days ? "hidden md:block text-[8px]" : ""
                        }`}
                      >
                        R${" "}
                        {d.revenue >= 1000
                          ? `${(d.revenue / 1000).toFixed(1)}k`
                          : Number(d.revenue).toLocaleString("pt-BR")}
                      </span>
                    ) : (
                      <span className="h-3 sm:h-4" />
                    )}

                    {/* Barra */}
                    <div
                      className={`w-full ${
                        is30Days
                          ? "max-w-[14px] sm:max-w-[20px]"
                          : "max-w-[42px] sm:max-w-[54px]"
                      } bg-slate-100 dark:bg-slate-800/80 rounded-t-xl overflow-hidden h-full flex items-end`}
                    >
                      <div
                        className={`w-full rounded-t-xl transition-all duration-300 ${
                          d.revenue > 0
                            ? "bg-linear-to-t from-emerald-600 to-[#10B981] group-hover:from-emerald-500 group-hover:to-emerald-400 shadow-md shadow-emerald-500/20"
                            : "bg-slate-200/70 dark:bg-slate-700/50 group-hover:bg-slate-300 dark:group-hover:bg-slate-600"
                        }`}
                        style={{ height: `${heightPercent}%` }}
                      ></div>
                    </div>

                    {/* Eixo X com datas reais DD/MM espaçadas */}
                    <div className="h-5 flex items-center justify-center">
                      {is30Days ? (
                        shouldShowDate ? (
                          <span className="text-[9px] sm:text-[10px] text-slate-500 dark:text-slate-400 font-semibold whitespace-nowrap">
                            {d.date}
                          </span>
                        ) : (
                          <span className="w-1 h-1 bg-slate-300 dark:bg-slate-700 rounded-full" />
                        )
                      ) : (
                        <div className="flex flex-col items-center leading-tight">
                          <span className="text-[10px] sm:text-xs text-slate-700 dark:text-slate-300 font-semibold truncate">
                            {d.dayName}
                          </span>
                          <span className="text-[9px] text-slate-400 dark:text-slate-500">
                            {d.date}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>

        {/* Linha 3 — Últimas Vendas em Tempo Real */}
        <section className="bg-white dark:bg-[#111827] p-6 rounded-2xl shadow-2xs border border-slate-200/80 dark:border-slate-800">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Últimas Vendas em Tempo Real
              </h3>
              <p className="text-xs text-slate-400">
                Acesso aos bilhetes emitidos e opção de aprovação manual para Pix pendentes
              </p>
            </div>

            <Link
              href="/admin/pedidos"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#10B981] hover:underline"
            >
              <span>Ver Todos os Pedidos Pix</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <DraggableTable>
            <table className="w-full text-left text-xs min-w-[650px]">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 uppercase font-semibold text-[11px] tracking-wider">
                  <th className="pb-3 px-3">Comprador</th>
                  <th className="pb-3 px-3">Campanha</th>
                  <th className="pb-3 px-3 text-center">Qtd. Cotas</th>
                  <th className="pb-3 px-3 text-right">Valor (R$)</th>
                  <th className="pb-3 px-3 text-center">Status</th>
                  <th className="pb-3 px-3 text-center">Ações Operacionais</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium text-slate-800 dark:text-slate-200">
                {metrics?.recentTransactions?.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      Nenhuma compra encontrada para os filtros selecionados
                    </td>
                  </tr>
                ) : (
                  metrics?.recentTransactions?.map((tx: any) => {
                    const isPaid = tx.paymentStatus === "PAID";
                    const isApproving = approvingOrderId === tx.id;

                    return (
                      <tr key={tx.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-3 font-bold text-slate-900">
                          {tx.buyerName}
                        </td>
                        <td
                          className="py-3.5 px-3 text-slate-600 max-w-[200px] truncate"
                          title={tx.campaignTitle}
                        >
                          {tx.campaignTitle}
                        </td>
                        <td className="py-3.5 px-3 text-center font-bold text-slate-900">
                          {tx.quantity}
                        </td>
                        <td className="py-3.5 px-3 text-right font-black text-slate-900">
                          R${" "}
                          {Number(tx.totalAmount).toLocaleString("pt-BR", {
                            minimumFractionDigits: 2,
                          })}
                        </td>
                        <td className="py-3.5 px-3 text-center">
                          <span
                            className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-extrabold ${
                              isPaid
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-amber-100 text-amber-800"
                            }`}
                          >
                            {isPaid ? "Pago" : "Pendente"}
                          </span>
                        </td>
                        <td className="py-3.5 px-3 text-center">
                          <div className="flex items-center justify-center gap-2">
                            {/* Botão Ver Bilhetes */}
                            <button
                              type="button"
                              onClick={() => handleOpenTickets(tx.id)}
                              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold text-[11px] transition-colors flex items-center gap-1 cursor-pointer"
                              title="Visualizar bilhetes emitidos"
                            >
                              <Eye className="w-3.5 h-3.5 text-slate-500" />
                              <span>Bilhetes</span>
                            </button>

                            {/* Botão Aprovação Manual */}
                            {!isPaid ? (
                              <button
                                type="button"
                                onClick={() =>
                                  handleApproveOrder(tx.id, tx.buyerName, tx.totalAmount)
                                }
                                disabled={isApproving}
                                className="px-2.5 py-1 bg-[#10B981] hover:bg-[#0EA271] text-white rounded-lg font-bold text-[11px] transition-colors flex items-center gap-1 cursor-pointer shadow-2xs"
                                title="Aprovar pagamento manualmente e emitir bilhetes"
                              >
                                {isApproving ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <CheckCircle className="w-3.5 h-3.5" />
                                )}
                                <span>{isApproving ? "Aprovando..." : "Aprovar"}</span>
                              </button>
                            ) : (
                              <span className="text-[11px] text-[#10B981] font-bold px-2 py-1">
                                ✓ Quitado
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </DraggableTable>
        </section>

        {/* Modal: Ver Bilhetes do Pedido */}
        {ticketModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="fixed inset-0 bg-black/60 backdrop-blur-2xs transition-opacity"
              onClick={() => setTicketModalOpen(false)}
            ></div>

            <div className="relative bg-white dark:bg-[#111827] text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-800 w-full max-w-2xl rounded-2xl shadow-xl overflow-hidden z-10 max-h-[90vh] flex flex-col">
              {/* Cabeçalho do Modal */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-[#0B1120]">
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Bilhetes do Pedido
                  </h3>
                  <p className="text-xs text-slate-500">
                    {selectedOrderDetails
                      ? `Pedido #${selectedOrderDetails.id.slice(0, 8)} • ${
                          selectedOrderDetails.user?.fullName || "Comprador"
                        }`
                      : "Carregando..."}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setTicketModalOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Corpo do Modal */}
              <div className="p-6 overflow-y-auto space-y-4">
                {loadingTickets ? (
                  <div className="py-12 flex flex-col items-center justify-center text-xs text-slate-400 gap-2">
                    <Loader2 className="w-6 h-6 animate-spin text-[#10B981]" />
                    <span>Buscando bilhetes do pedido...</span>
                  </div>
                ) : !selectedOrderDetails ? (
                  <div className="py-8 text-center text-xs text-slate-400">
                    Detalhes do pedido não encontrados.
                  </div>
                ) : (
                  <>
                    {/* Resumo do Pedido */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">
                          Campanha
                        </span>
                        <span
                          className="font-bold text-slate-800 truncate block"
                          title={selectedOrderDetails.campaign?.title}
                        >
                          {selectedOrderDetails.campaign?.title}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">
                          Quantidade
                        </span>
                        <span className="font-bold text-slate-800">
                          {selectedOrderDetails.quantity} cotas
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">
                          Valor Total
                        </span>
                        <span className="font-bold text-slate-900">
                          R${" "}
                          {Number(selectedOrderDetails.totalAmount).toLocaleString("pt-BR", {
                            minimumFractionDigits: 2,
                          })}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">
                          Status
                        </span>
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full font-bold text-[10px] ${
                            selectedOrderDetails.paymentStatus === "PAID"
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {selectedOrderDetails.paymentStatus === "PAID" ? "Pago" : "Pendente"}
                        </span>
                      </div>
                    </div>

                    {/* Exibição dos Bilhetes */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                          Números Emitidos ({selectedOrderDetails.tickets?.length || 0})
                        </span>
                        {selectedOrderDetails.tickets?.some((t: any) => t.isInstantPrize) && (
                          <span className="text-[11px] font-bold text-amber-600 flex items-center gap-1">
                            <Sparkles className="w-3.5 h-3.5" />
                            Contém Cota Premiada!
                          </span>
                        )}
                      </div>

                      {selectedOrderDetails.tickets?.length === 0 ? (
                        <div className="p-6 bg-amber-50 rounded-xl border border-amber-200 text-center space-y-3">
                          <p className="text-xs font-semibold text-amber-800">
                            Nenhum bilhete emitido ainda para este pedido.
                          </p>
                          <p className="text-[11px] text-amber-700">
                            Os números da sorte são gerados automaticamente após a confirmação via
                            Pix ou através da aprovação manual pelo administrador.
                          </p>
                          {selectedOrderDetails.paymentStatus !== "PAID" && (
                            <button
                              type="button"
                              onClick={() =>
                                handleApproveOrder(
                                  selectedOrderDetails.id,
                                  selectedOrderDetails.user?.fullName || "Comprador",
                                  selectedOrderDetails.totalAmount
                                )
                              }
                              className="px-4 py-2 bg-[#10B981] hover:bg-[#0EA271] text-white text-xs font-bold rounded-xl shadow-sm transition-colors cursor-pointer"
                            >
                              Aprovar Manualmente Agora
                            </button>
                          )}
                        </div>
                      ) : (
                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 max-h-64 overflow-y-auto p-3 bg-slate-50 rounded-xl border border-slate-200">
                          {selectedOrderDetails.tickets.map((t: any) => (
                            <div
                              key={t.id}
                              className={`p-2 rounded-lg text-center font-mono text-xs font-bold border transition-colors ${
                                t.isInstantPrize
                                  ? "bg-amber-100 border-amber-300 text-amber-900 shadow-2xs"
                                  : "bg-white border-slate-200 text-slate-800"
                              }`}
                            >
                              <span>{t.ticketNumber}</span>
                              {t.isInstantPrize && (
                                <span className="block text-[9px] font-black text-amber-700 mt-0.5">
                                  R$ {t.instantPrizeValue}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>

              {/* Rodapé do Modal */}
              <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex justify-end">
                <button
                  type="button"
                  onClick={() => setTicketModalOpen(false)}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
