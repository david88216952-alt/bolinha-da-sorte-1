"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ShieldAlert,
  Search,
  ShoppingBag,
  CheckCircle2,
  Clock,
  QrCode,
  Ticket as TicketIcon,
  Sparkles,
  User as UserIcon,
  AlertCircle,
  ExternalLink,
  ArrowLeft,
} from "lucide-react";
import PixModal from "@/components/PixModal";
import AuthModal from "@/components/AuthModal";

export default function MinhasComprasPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [user, setUser] = useState<any>(null);

  // Modais
  const [pixModalOpen, setPixModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  // Carregar usuário e pedidos
  const loadOrders = async (query?: string) => {
    setLoading(true);
    try {
      // 1. Carregar usuário atual
      const userRes = await fetch("/api/auth/me");
      const userData = await userRes.json();
      setUser(userData.user || null);

      // 2. Carregar pedidos
      let url = "/api/orders";
      if (query && query.trim()) {
        url += `?query=${encodeURIComponent(query.trim())}`;
      }
      const res = await fetch(url);
      const data = await res.json();
      setOrders(data.orders || []);
    } catch (err) {
      console.error("Error loading orders:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadOrders(searchQuery);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
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
          Área do Comprador
        </span>
      </div>

      {/* 1. CARD DE ALERTA ANTIFRAUDE FIXO NO TOPO DA PÁGINA (TEXTO OBRIGATÓRIO RIGOROSO) */}
      <section className="w-full bg-gradient-to-r from-red-950 via-neutral-950 to-red-950 text-white p-5 sm:p-6 rounded-3xl border-2 border-red-800/80 shadow-xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start gap-4 z-10 relative">
          <div className="w-12 h-12 rounded-2xl bg-red-600/30 text-red-400 border border-red-500/50 flex items-center justify-center shrink-0 shadow-lg">
            <ShieldAlert className="w-7 h-7" />
          </div>

          <div className="space-y-1.5 flex-1">
            <h2 className="text-base sm:text-lg font-black text-red-300 tracking-tight flex items-center gap-2">
              <span>ALERTA DE SEGURANÇA E ANTIFRAUDE</span>
            </h2>
            <p className="text-xs sm:text-sm text-neutral-200 leading-relaxed font-medium">
              Fique atento: Nunca solicitamos video chamadas ou acesso remoto à sua tela. Não exigimos pagamento de taxas para retirada de prêmios. Não enviamos links por WhatsApp pedindo dados bancários. Caso receba esse tipo de contato, não responda. Trata-se de golpe.
            </p>
          </div>
        </div>
      </section>

      {/* Page Header & Search Bar */}
      <section className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl shadow-sm border border-neutral-100">
        <div>
          <h1 className="text-2xl font-black text-neutral-900 tracking-tight flex items-center gap-2">
            <ShoppingBag className="w-6 h-6 text-[#16A34A]" />
            Minhas Compras e Bilhetes
          </h1>
          <p className="text-xs text-neutral-500 mt-0.5">
            {user
              ? `Conectado como ${user.fullName} (${user.email})`
              : "Consulte seus bilhetes pelo seu CPF ou telefone"}
          </p>
        </div>

        {/* Search by CPF or Phone */}
        <form onSubmit={handleSearchSubmit} className="flex gap-2 w-full md:max-w-md">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por Telefone ou CPF..."
              className="w-full pl-10 pr-3 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs sm:text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <button
            type="submit"
            className="px-5 py-2.5 bg-[#0E7A3E] hover:bg-[#16A34A] text-white font-bold text-xs sm:text-sm rounded-xl transition-all shadow-sm active:scale-95 cursor-pointer"
          >
            Buscar
          </button>
        </form>
      </section>

      {/* Login Prompt for Guests */}
      {!user && (
        <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <UserIcon className="w-5 h-5 text-emerald-700 shrink-0" />
            <span className="text-emerald-950 font-medium">
              Faça login para ver automaticamente todos os seus pedidos e bilhetes cadastrados.
            </span>
          </div>
          <button
            onClick={() => setAuthModalOpen(true)}
            className="px-4 py-2 bg-[#16A34A] hover:bg-[#0E7A3E] text-white font-bold rounded-xl shrink-0 shadow-sm transition-all"
          >
            Entrar na Minha Conta
          </button>
        </div>
      )}

      {/* Orders List */}
      <section className="space-y-6">
        {loading ? (
          <div className="space-y-4">
            <div className="w-full h-44 bg-neutral-200 rounded-3xl animate-pulse"></div>
            <div className="w-full h-44 bg-neutral-200 rounded-3xl animate-pulse"></div>
          </div>
        ) : orders.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-3xl border border-neutral-100 shadow-sm space-y-4">
            <ShoppingBag className="w-12 h-12 text-neutral-300 mx-auto" />
            <div>
              <h3 className="text-base font-bold text-neutral-800">
                Nenhum pedido encontrado
              </h3>
              <p className="text-xs text-neutral-500 mt-1 max-w-sm mx-auto">
                Você ainda não realizou compras com este cadastro ou a busca por CPF/telefone não retornou resultados.
              </p>
            </div>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#16A34A] hover:bg-[#0E7A3E] text-white font-bold text-xs sm:text-sm rounded-xl shadow-md transition-all"
            >
              <span>Ver Campanhas Disponíveis</span>
            </Link>
          </div>
        ) : (
          orders.map((order) => {
            const isPaid = order.paymentStatus === "PAID";
            const isPending = order.paymentStatus === "PENDING";
            const isExpired = order.paymentStatus === "EXPIRED";

            return (
              <article
                key={order.id}
                className="bg-white rounded-3xl border border-neutral-100 shadow-sm p-6 space-y-5 transition-all hover:shadow-md"
              >
                {/* Order Top Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-neutral-100">
                  <div className="flex items-center gap-3">
                    <img
                      src={order.campaign?.coverImageUrl || "/placeholder-raffle.jpg"}
                      alt={order.campaign?.title}
                      className="w-14 h-14 rounded-2xl object-cover bg-neutral-900 border border-neutral-100"
                    />
                    <div>
                      <h3 className="text-sm sm:text-base font-extrabold text-neutral-900 leading-tight">
                        {order.campaign?.title}
                      </h3>
                      <p className="text-xs text-neutral-500 mt-0.5">
                        Pedido em{" "}
                        {new Date(order.createdAt).toLocaleDateString("pt-BR", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div>
                    {isPaid && (
                      <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-black uppercase">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        Pago via Pix
                      </span>
                    )}
                    {isPending && (
                      <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-amber-50 text-amber-800 border border-amber-300 text-xs font-black uppercase">
                        <Clock className="w-4 h-4 text-amber-600" />
                        Aguardando Pix
                      </span>
                    )}
                    {isExpired && (
                      <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-neutral-100 text-neutral-600 text-xs font-black uppercase">
                        Expirado
                      </span>
                    )}
                  </div>
                </div>

                {/* Order Details Metrics */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-neutral-50 p-4 rounded-2xl border border-neutral-100 text-xs">
                  <div>
                    <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider block">
                      Quantidade
                    </span>
                    <span className="text-sm font-black text-neutral-900">
                      {order.quantity} cotas
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider block">
                      Valor Total
                    </span>
                    <span className="text-sm font-black text-emerald-700">
                      R$ {Number(order.totalAmount).toFixed(2).replace(".", ",")}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider block">
                      Método
                    </span>
                    <span className="text-xs font-bold text-neutral-800">
                      Pix Instantâneo
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider block">
                      Sorteio
                    </span>
                    <span className="text-xs font-bold text-neutral-800">
                      {order.campaign?.drawDate
                        ? new Date(order.campaign.drawDate).toLocaleDateString("pt-BR")
                        : "Loteria Federal"}
                    </span>
                  </div>
                </div>

                {/* If Pending, Show Pay with Pix Button */}
                {isPending && (
                  <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <QrCode className="w-5 h-5 text-amber-700 shrink-0" />
                      <p className="text-xs text-amber-950 font-medium">
                        Seu pagamento ainda não foi concluído. Seus números estão reservados temporariamente.
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedOrder(order);
                        setPixModalOpen(true);
                      }}
                      className="px-5 py-2.5 bg-[#16A34A] hover:bg-[#0E7A3E] text-white font-extrabold text-xs rounded-xl shadow-sm transition-all shrink-0 cursor-pointer"
                    >
                      Pagar Agora via Pix
                    </button>
                  </div>
                )}

                {/* If Paid, List all Ticket Numbers */}
                {isPaid && (
                  <div className="space-y-3 pt-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-neutral-800 uppercase tracking-wider flex items-center gap-1.5">
                        <TicketIcon className="w-4 h-4 text-emerald-600" />
                        Seus Bilhetes Homologados ({order.tickets?.length || 0}):
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto p-1">
                      {order.tickets && order.tickets.length > 0 ? (
                        order.tickets.map((t: any) => (
                          <div
                            key={t.id}
                            className={`px-3 py-1.5 rounded-xl font-mono text-xs font-extrabold flex items-center gap-1.5 border shadow-sm ${
                              t.isInstantPrize
                                ? "bg-amber-400 text-neutral-950 border-amber-500 ring-2 ring-amber-400/50"
                                : "bg-neutral-100 text-neutral-900 border-neutral-200"
                            }`}
                          >
                            <span>#{t.ticketNumber}</span>
                            {t.isInstantPrize && (
                              <span className="inline-flex items-center text-[10px] bg-neutral-950 text-amber-300 px-1.5 py-0.2 rounded-md font-sans font-bold">
                                🏆 Premiado R$ {t.instantPrizeValue}
                              </span>
                            )}
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-neutral-500">
                          Bilhetes em processamento...
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </article>
            );
          })
        )}
      </section>

      {/* Bottom Back Button */}
      <div className="pt-2 flex justify-center">
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-white hover:bg-neutral-50 border border-neutral-200 text-neutral-800 text-sm font-bold shadow-sm transition-all group"
        >
          <ArrowLeft className="w-4 h-4 text-emerald-600 group-hover:-translate-x-1 transition-transform" />
          <span>Voltar para a Página Inicial</span>
        </Link>
      </div>

      {/* Pix Modal */}
      <PixModal
        isOpen={pixModalOpen}
        order={selectedOrder}
        onClose={() => setPixModalOpen(false)}
        onPaymentConfirmed={() => {
          loadOrders(searchQuery);
        }}
      />

      {/* Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={() => {
          setAuthModalOpen(false);
          loadOrders();
        }}
      />
    </div>
  );
}
