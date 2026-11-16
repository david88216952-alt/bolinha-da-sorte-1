"use client";

import { useState, useEffect } from "react";
import AdminLayout from "@/components/AdminLayout";
import DraggableTable from "@/components/DraggableTable";
import {
  CreditCard,
  Search,
  Filter,
  Eye,
  CheckCircle,
  AlertCircle,
  Clock,
  DollarSign,
  Copy,
  Check,
  X,
  Loader2,
  Sparkles,
  QrCode,
  Ticket,
} from "lucide-react";

export default function AdminPedidosPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Filtros
  const [statusFilter, setStatusFilter] = useState<"ALL" | "PAID" | "PENDING">("ALL");
  const [searchTerm, setSearchTerm] = useState("");

  // Modal Ver Bilhetes
  const [selectedOrderDetails, setSelectedOrderDetails] = useState<any>(null);
  const [ticketModalOpen, setTicketModalOpen] = useState(false);
  const [loadingTickets, setLoadingTickets] = useState(false);

  // Ações de cópia e aprovação
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [approvingOrderId, setApprovingOrderId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const loadOrders = async (status = statusFilter, search = searchTerm) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (status !== "ALL") params.append("status", status);
      if (search.trim()) params.append("search", search.trim());

      const res = await fetch(`/api/admin/orders?${params.toString()}`);
      const data = await res.json();
      setOrders(data.orders || []);
      setStats(data.stats || null);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadOrders(statusFilter, searchTerm);
    }, 250);
    return () => clearTimeout(timer);
  }, [statusFilter, searchTerm]);

  // Visualizar Bilhetes
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
        alert("Não foi possível carregar os bilhetes deste pedido.");
        setTicketModalOpen(false);
      }
    } catch (err) {
      console.error(err);
      alert("Erro ao buscar bilhetes.");
      setTicketModalOpen(false);
    } finally {
      setLoadingTickets(false);
    }
  };

  // Aprovação Manual
  const handleApproveOrder = async (order: any) => {
    const formattedVal = Number(order.totalAmount).toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
    });

    if (
      !confirm(
        `Confirmar aprovação manual do pedido #${order.id.slice(0, 8)} de "${order.buyerName}" no valor de R$ ${formattedVal}?\n\nOs bilhetes serão gerados imediatamente.`
      )
    ) {
      return;
    }

    setApprovingOrderId(order.id);
    setToastMessage(null);

    try {
      const res = await fetch(`/api/admin/orders/${order.id}/approve`, {
        method: "POST",
      });
      const data = await res.json();

      if (res.ok) {
        setToastMessage({
          type: "success",
          text: `Pedido aprovado com sucesso! ${data.ticketsCreated || ""} bilhetes emitidos.`,
        });

        if (selectedOrderDetails?.id === order.id) {
          handleOpenTickets(order.id);
        }

        loadOrders(statusFilter, searchTerm);
      } else {
        setToastMessage({
          type: "error",
          text: data.error || "Erro ao aprovar pedido.",
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

  // Copiar Pix Copia e Cola
  const handleCopyPix = (pixCode: string, id: string) => {
    if (!pixCode) {
      alert("Código Pix não disponível para este pedido.");
      return;
    }
    navigator.clipboard.writeText(pixCode);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Topo do Módulo */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
          <div>
            <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
              Gestão de Pedidos e Pagamentos Pix
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Auditoria de transações financeiras, confirmação de recebimento e consulta de cotas
            </p>
          </div>
        </div>

        {/* Notificação Toast */}
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

        {/* 4 Cards de Resumo Operacional */}
        {stats && (
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-[#111827] p-5 rounded-2xl shadow-2xs border border-slate-200/80 dark:border-slate-800">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Faturamento Total
              </span>
              <p className="text-2xl font-black text-slate-900">
                R${" "}
                {Number(stats.totalRevenue).toLocaleString("pt-BR", {
                  minimumFractionDigits: 2,
                })}
              </p>
              <span className="text-[10px] text-[#10B981] font-bold mt-1 block">
                {stats.totalPaidTickets?.toLocaleString("pt-BR")} cotas pagas
              </span>
            </div>

            <div className="bg-white dark:bg-[#111827] p-5 rounded-2xl shadow-2xs border border-slate-200/80 dark:border-slate-800">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Total de Pedidos
              </span>
              <p className="text-2xl font-black text-slate-900">{stats.totalOrders}</p>
              <span className="text-[10px] text-slate-400 font-medium mt-1 block">
                Histórico geral
              </span>
            </div>

            <div className="bg-white dark:bg-[#111827] p-5 rounded-2xl shadow-2xs border border-slate-200/80 dark:border-slate-800">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Pedidos Pagos
              </span>
              <p className="text-2xl font-black text-[#10B981]">{stats.paidOrders}</p>
              <span className="text-[10px] text-slate-400 font-medium mt-1 block">
                Baixas confirmadas
              </span>
            </div>

            <div className="bg-white dark:bg-[#111827] p-5 rounded-2xl shadow-2xs border border-slate-200/80 dark:border-slate-800">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Aguardando Pagamento
              </span>
              <p className="text-2xl font-black text-amber-600">{stats.pendingOrders}</p>
              <span className="text-[10px] text-amber-700 font-medium mt-1 block">
                Pix em aberto
              </span>
            </div>
          </section>
        )}

        {/* Filtros e Barra de Pesquisa */}
        <div className="bg-white dark:bg-[#111827] p-4 rounded-2xl shadow-2xs border border-slate-200/80 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Abas de Status */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setStatusFilter("ALL")}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                statusFilter === "ALL"
                  ? "bg-[#10B981] text-white shadow-2xs font-extrabold"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
              }`}
            >
              Todos ({stats?.totalOrders ?? 0})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("PAID")}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                statusFilter === "PAID"
                  ? "bg-[#10B981] text-white shadow-2xs font-extrabold"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
              }`}
            >
              Pagos ({stats?.paidOrders ?? 0})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("PENDING")}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                statusFilter === "PENDING"
                  ? "bg-[#10B981] text-white shadow-2xs font-extrabold"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
              }`}
            >
              Pendentes ({stats?.pendingOrders ?? 0})
            </button>
          </div>

          {/* Campo de Busca em Tempo Real */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por comprador, fone ou ID..."
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
        </div>

        {/* Tabela de Pedidos */}
        <section className="bg-white dark:bg-[#111827] rounded-2xl shadow-2xs border border-slate-200/80 dark:border-slate-800 overflow-hidden p-4">
          <DraggableTable>
            <table className="w-full text-left text-xs min-w-[720px]">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/75 dark:bg-[#0B1120]/80 text-slate-500 uppercase font-semibold text-[11px] tracking-wider">
                  <th className="py-3 px-4">Pedido / Data</th>
                  <th className="py-3 px-4">Comprador</th>
                  <th className="py-3 px-4">Campanha</th>
                  <th className="py-3 px-4 text-center">Cotas</th>
                  <th className="py-3 px-4 text-right">Valor Total</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-center">Ações Operacionais</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium text-slate-800 dark:text-slate-200">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      <Loader2 className="w-5 h-5 animate-spin mx-auto text-[#10B981] mb-2" />
                      Carregando pedidos Pix...
                    </td>
                  </tr>
                ) : orders.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      Nenhum pedido localizado com os filtros informados.
                    </td>
                  </tr>
                ) : (
                  orders.map((o) => {
                    const isPaid = o.paymentStatus === "PAID";
                    const isApproving = approvingOrderId === o.id;

                    return (
                      <tr key={o.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                        {/* ID e Data */}
                        <td className="py-3.5 px-4 font-mono text-slate-500">
                          <span className="font-bold text-slate-900 block font-sans">
                            #{o.id.slice(0, 8)}
                          </span>
                          <span className="text-[11px]">
                            {new Date(o.createdAt).toLocaleString("pt-BR", {
                              day: "2-digit",
                              month: "2-digit",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </td>

                        {/* Comprador */}
                        <td className="py-3.5 px-4">
                          <p className="font-bold text-slate-900">{o.buyerName}</p>
                          <p className="text-[11px] text-slate-500">{o.buyerPhone}</p>
                        </td>

                        {/* Campanha */}
                        <td className="py-3.5 px-4 max-w-[220px] truncate" title={o.campaignTitle}>
                          <span className="text-slate-700 font-semibold">{o.campaignTitle}</span>
                        </td>

                        {/* Cotas */}
                        <td className="py-3.5 px-4 text-center font-bold text-slate-900">
                          {o.quantity}
                        </td>

                        {/* Valor */}
                        <td className="py-3.5 px-4 text-right font-black text-slate-900">
                          R${" "}
                          {Number(o.totalAmount).toLocaleString("pt-BR", {
                            minimumFractionDigits: 2,
                          })}
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-4 text-center">
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

                        {/* Ações */}
                        <td className="py-3.5 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            {/* Ver Bilhetes */}
                            <button
                              type="button"
                              onClick={() => handleOpenTickets(o.id)}
                              className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold text-[11px] transition-colors flex items-center gap-1 cursor-pointer"
                              title="Visualizar bilhetes do pedido"
                            >
                              <Eye className="w-3.5 h-3.5 text-slate-500" />
                              <span>Bilhetes</span>
                            </button>

                            {/* Copiar Pix Copia e Cola */}
                            {o.pixCopyPaste && !isPaid && (
                              <button
                                type="button"
                                onClick={() => handleCopyPix(o.pixCopyPaste, o.id)}
                                className="px-2 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold text-[11px] transition-colors flex items-center gap-1 cursor-pointer"
                                title="Copiar código Pix copia e cola"
                              >
                                {copiedId === o.id ? (
                                  <Check className="w-3.5 h-3.5 text-[#10B981]" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5 text-slate-500" />
                                )}
                              </button>
                            )}

                            {/* Aprovação Manual */}
                            {!isPaid ? (
                              <button
                                type="button"
                                onClick={() => handleApproveOrder(o)}
                                disabled={isApproving}
                                className="px-2.5 py-1.5 bg-[#10B981] hover:bg-[#0EA271] text-white rounded-lg font-bold text-[11px] transition-colors flex items-center gap-1 cursor-pointer shadow-2xs"
                                title="Aprovar pagamento manualmente e emitir cotas"
                              >
                                {isApproving ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <CheckCircle className="w-3.5 h-3.5" />
                                )}
                                <span>{isApproving ? "..." : "Aprovar"}</span>
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

        {/* Modal: Ver Bilhetes */}
        {ticketModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="fixed inset-0 bg-black/60 backdrop-blur-2xs transition-opacity"
              onClick={() => setTicketModalOpen(false)}
            ></div>

            <div className="relative bg-white dark:bg-[#111827] text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-800 w-full max-w-2xl rounded-2xl shadow-xl overflow-hidden z-10 max-h-[90vh] flex flex-col">
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-[#0B1120]">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Bilhetes do Pedido</h3>
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

              <div className="p-6 overflow-y-auto space-y-4">
                {loadingTickets ? (
                  <div className="py-12 flex flex-col items-center justify-center text-xs text-slate-400 gap-2">
                    <Loader2 className="w-6 h-6 animate-spin text-[#10B981]" />
                    <span>Carregando bilhetes...</span>
                  </div>
                ) : !selectedOrderDetails ? (
                  <div className="py-8 text-center text-xs text-slate-400">
                    Detalhes do pedido não encontrados.
                  </div>
                ) : (
                  <>
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
                            Os números da sorte são emitidos após o pagamento do Pix ou aprovação manual.
                          </p>
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
