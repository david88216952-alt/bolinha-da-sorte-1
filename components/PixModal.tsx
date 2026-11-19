"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Copy,
  Check,
  Clock,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Loader2,
  Zap,
  Sparkles,
} from "lucide-react";
import confetti from "canvas-confetti";
import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";

interface PixModalProps {
  isOpen: boolean;
  order: any;
  onClose: () => void;
  onPaymentConfirmed?: () => void;
}

export default function PixModal({
  isOpen,
  order,
  onClose,
  onPaymentConfirmed,
}: PixModalProps) {
  const [copied, setCopied] = useState(false);
  const [isPaid, setIsPaid] = useState(false);
  const [paidDetails, setPaidDetails] = useState<any>(null);
  const [timeLeft, setTimeLeft] = useState(15 * 60); // 15 minutos em segundos
  const [currentPixCopyPaste, setCurrentPixCopyPaste] = useState(order?.pixCopyPaste || "");
  const [isVerifying, setIsVerifying] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Código Pix oficial gerado pelo Mercado Pago
  const pixCopyPaste = useMemo(() => {
    return currentPixCopyPaste || order?.pixCopyPaste || "";
  }, [currentPixCopyPaste, order?.pixCopyPaste]);

  useEffect(() => {
    if (!isOpen || !order) return;

    // Reset states
    setIsPaid(order.paymentStatus === "PAID");
    setCopied(false);
    setIsVerifying(false);
    setStatusMessage(null);
    setCurrentPixCopyPaste(order.pixCopyPaste || "");
    setPaidDetails(order.paymentStatus === "PAID" ? order : null);

    // Consulta inicial ativa na rota oficial /api/orders/[id]/status
    fetch(`/api/orders/${order.id}/status`, {
      cache: "no-store",
      headers: { "Cache-Control": "no-cache, no-store, must-revalidate" },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.isPaid || data.order?.paymentStatus === "PAID") {
          setIsPaid(true);
          setPaidDetails(data.order);
          confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
          if (onPaymentConfirmed) onPaymentConfirmed();
        }
      })
      .catch(() => {});

    // Polling contínuo automático a cada 3 segundos: consulta status em tempo real sem cache
    const pollInterval = setInterval(async () => {
      try {
        const res = await fetch(`/api/orders/${order.id}/status`, {
          cache: "no-store",
          headers: { "Cache-Control": "no-cache, no-store, must-revalidate" },
        });
        const data = await res.json();
        if (res.ok) {
          if (data.order?.pixCopyPaste && data.order.pixCopyPaste !== currentPixCopyPaste) {
            setCurrentPixCopyPaste(data.order.pixCopyPaste);
          }
          if (data.isPaid || data.order?.paymentStatus === "PAID") {
            setIsPaid(true);
            setPaidDetails(data.order);
            confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
            if (onPaymentConfirmed) onPaymentConfirmed();
          }
        }
      } catch {
        // Silencioso em caso de oscilação momentânea de rede
      }
    }, 3000);

    // Calcular tempo restante com base no expiresAt
    if (order.expiresAt) {
      const remaining = Math.max(
        0,
        Math.floor((new Date(order.expiresAt).getTime() - Date.now()) / 1000)
      );
      setTimeLeft(remaining > 0 ? remaining : 15 * 60);
    } else {
      setTimeLeft(15 * 60);
    }

    // Intervalo do cronômetro de 15 minutos
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(timer);
      clearInterval(pollInterval);
    };
  }, [isOpen, order]);

  if (!isOpen || !order) return null;

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formattedTime = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

  const handleCopy = () => {
    if (!pixCopyPaste) return;
    navigator.clipboard.writeText(pixCopyPaste);
    setCopied(true);
    setTimeout(() => setCopied(false), 3500);
  };

  // Consulta estrita a GET /api/orders/[id]/status (sem auto-aprovação fraudulenta)
  const handleConfirmPayment = async () => {
    if (isVerifying || isPaid) return;
    setIsVerifying(true);
    setStatusMessage(null);

    try {
      const res = await fetch(`/api/orders/${order.id}/status`, {
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
        },
      });
      const data = await res.json();

      if (data.isPaid || data.order?.paymentStatus === "PAID") {
        setIsPaid(true);
        setPaidDetails(data.order || order);
        confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
        if (onPaymentConfirmed) onPaymentConfirmed();
      } else {
        setStatusMessage("Pagamento ainda não identificado pelo banco.");
      }
    } catch (err) {
      console.error("Erro ao verificar status junto ao banco:", err);
      setStatusMessage("Erro ao contatar o servidor. Tente novamente em instantes.");
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
      {/* Backdrop com desfoque suave */}
      <div
        className="fixed inset-0 bg-black/85 backdrop-blur-md transition-opacity"
        onClick={onClose}
      ></div>

      {/* Modal Dialog Responsivo, Limpo e Sem Bagunça */}
      <div className="relative w-full max-w-lg bg-white dark:bg-[#111827] text-slate-900 dark:text-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 z-10 transition-all max-h-[92vh] flex flex-col">
        {/* Header Superior Limpo */}
        <div className="bg-slate-950 dark:bg-black p-4 sm:p-5 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600/20 text-[#10B981] border border-emerald-500/30 flex items-center justify-center shrink-0">
              <Zap className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div className="min-w-0">
              <h3 className="font-extrabold text-sm sm:text-base tracking-tight truncate">
                {isPaid ? "Pagamento Confirmado!" : "Pagamento Instantâneo Pix"}
              </h3>
              <p className="text-[11px] sm:text-xs text-slate-400 truncate max-w-[220px] sm:max-w-xs">
                {order.campaign?.title || "Campanha Bolinha da Sorte"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-white/10 transition-colors cursor-pointer text-xl leading-none"
            aria-label="Fechar modal"
          >
            &times;
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4 sm:space-y-5">
          {isPaid ? (
            /* Tela de Sucesso Verde após Confirmação */
            <div className="text-center py-4 sm:py-6 space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-inner border border-emerald-200 dark:border-emerald-800 animate-bounce">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div>
                <h4 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                  Parabéns! Pagamento Confirmado!
                </h4>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
                  Seus {order.quantity} bilhetes oficiais já foram homologados e vinculados à sua conta.
                </p>
              </div>

              {paidDetails?.instantPrizesWon?.length > 0 && (
                <div className="p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700 rounded-2xl text-amber-900 dark:text-amber-200 text-xs">
                  <p className="font-extrabold text-sm">
                    🎉 VOCÊ ACHOU UMA COTA PREMIADA!
                  </p>
                  <p className="mt-1">
                    Bilhete premiado com transferência Pix imediata!
                  </p>
                </div>
              )}

              <div className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-800 text-left text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">ID do Pedido:</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-slate-100">{order.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Total Pago:</span>
                  <span className="font-black text-emerald-600 dark:text-[#10B981] text-sm">
                    R$ {Number(order.totalAmount).toFixed(2).replace(".", ",")}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Quantidade:</span>
                  <span className="font-bold text-slate-900 dark:text-slate-100">{order.quantity} cotas</span>
                </div>
              </div>

              {/* Exibição Imediata dos Números Gerados (Padrão 4 dígitos de 0000 a 9999) */}
              {((paidDetails?.tickets && paidDetails.tickets.length > 0) || (order.tickets && order.tickets.length > 0)) && (
                <div className="space-y-2 text-left">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                    <span className="flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      Seus Números Gerados (0000 a 9999) ({(paidDetails?.tickets || order.tickets).length}):
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto p-2.5 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800">
                    {(paidDetails?.tickets || order.tickets).map((t: any) => (
                      <span
                        key={t.id || t.ticketNumber}
                        className={`px-2.5 py-1 rounded-lg font-mono text-xs font-black border shadow-2xs ${
                          t.isInstantPrize
                            ? "bg-amber-400 text-neutral-950 border-amber-500 ring-2 ring-amber-400/50"
                            : "bg-white dark:bg-slate-800 text-slate-900 dark:text-white border-slate-200 dark:border-slate-700"
                        }`}
                      >
                        #{t.ticketNumber}
                        {t.isInstantPrize && " 🏆"}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-2 flex flex-col gap-2">
                <Link
                  href="/minhas-compras"
                  onClick={onClose}
                  className="w-full py-3.5 bg-linear-to-r from-emerald-600 to-[#10B981] hover:from-emerald-500 hover:to-emerald-400 text-white font-extrabold text-sm rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-95 transition-all cursor-pointer"
                >
                  <span>Ver Meus Bilhetes em Minhas Compras</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full py-2.5 text-xs text-slate-500 dark:text-slate-400 font-semibold hover:text-slate-900 dark:hover:text-white cursor-pointer"
                >
                  Fechar janela
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* 1. Card de Resumo Financeiro em Destaque no Topo */}
              <div className="p-4 bg-slate-950 dark:bg-black rounded-2xl border border-slate-800 text-white flex items-center justify-between shadow-md">
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
                    Valor a Pagar
                  </span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl sm:text-3xl font-black text-[#10B981] tracking-tight">
                      R$ {Number(order.totalAmount).toFixed(2).replace(".", ",")}
                    </span>
                    <span className="text-xs text-slate-400 font-medium">
                      ({order.quantity} {order.quantity === 1 ? "cota" : "cotas"})
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
                    Reserva expira em:
                  </span>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 font-mono font-bold text-xs sm:text-sm mt-0.5">
                    <Clock className="w-3.5 h-3.5 animate-spin" />
                    <span>{formattedTime}</span>
                  </div>
                </div>
              </div>

              {/* 2. QR Code Oficial Centralizado e Nítido */}
              <div className="flex flex-col items-center justify-center pt-1">
                <div className="bg-white p-3.5 sm:p-4 rounded-2xl mx-auto w-48 h-48 sm:w-56 sm:h-56 flex items-center justify-center shadow-lg border border-slate-200">
                  {order.pixQrCode ? (
                    <img
                      src={
                        order.pixQrCode.startsWith("data:")
                          ? order.pixQrCode
                          : `data:image/png;base64,${order.pixQrCode}`
                      }
                      alt="QR Code Pix Oficial"
                      className="w-full h-full object-contain"
                    />
                  ) : pixCopyPaste ? (
                    <QRCodeSVG
                      value={pixCopyPaste}
                      size={200}
                      level="M"
                      includeMargin={true}
                      className="w-full h-full"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-slate-400 text-xs">
                      <Loader2 className="w-6 h-6 animate-spin mb-2" />
                      <span>Gerando QR Code...</span>
                    </div>
                  )}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium text-center mt-2.5">
                  Aponte a câmera do seu banco para o QR Code ou copie o código Pix abaixo
                </p>
              </div>

              {/* 3. Botões de Ação: Copiar Código Pix + Botão de Confirmação */}
              <div className="space-y-2.5 pt-1">
                {/* Botão Verde Principal: Copiar Código Pix */}
                <button
                  type="button"
                  onClick={handleCopy}
                  className={`w-full py-3.5 sm:py-4 rounded-2xl font-black text-sm sm:text-base flex items-center justify-center gap-2.5 transition-all shadow-lg active:scale-95 cursor-pointer ${
                    copied
                      ? "bg-emerald-700 text-white ring-4 ring-emerald-500/30"
                      : "bg-[#16A34A] hover:bg-[#15803D] text-white shadow-emerald-600/30 hover:shadow-emerald-600/40"
                  }`}
                >
                  {copied ? (
                    <>
                      <Check className="w-5 h-5 text-white" />
                      <span>✓ Código Pix Copiado com Sucesso!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-5 h-5" />
                      <span>Copiar Código Pix (Copia e Cola)</span>
                    </>
                  )}
                </button>

                {/* Botão Oficial de Confirmação de Pagamento via Banco */}
                <button
                  type="button"
                  onClick={handleConfirmPayment}
                  disabled={isVerifying}
                  className="w-full py-3.5 sm:py-4 rounded-2xl font-extrabold text-sm sm:text-base flex items-center justify-center gap-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white border border-slate-700 shadow-md transition-all active:scale-95 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isVerifying ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin text-[#10B981]" />
                      <span>Consultando recebimento no banco...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-5 h-5 text-[#10B981]" />
                      <span>Já fiz o pagamento / Confirmar</span>
                    </>
                  )}
                </button>

                {statusMessage && (
                  <div className="text-xs text-amber-700 dark:text-amber-300 font-semibold text-center bg-amber-50 dark:bg-amber-950/60 p-3 rounded-xl border border-amber-300 dark:border-amber-700/80 shadow-xs flex items-center justify-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-amber-500 shrink-0" />
                    <span>{statusMessage}</span>
                  </div>
                )}
              </div>

              {/* Chave Pix para Recebimento de Prêmios (Discreta no rodapé do modal) */}
              {order.pixKey && (
                <div className="text-[11px] text-slate-500 dark:text-slate-400 text-center">
                  Sua chave cadastrada para premiações: <strong className="font-mono text-slate-700 dark:text-slate-300">{order.pixKey}</strong>
                </div>
              )}

              {/* 5. Instruções Rápidas + Status em Tempo Real */}
              <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-2">
                <div className="flex items-center justify-center gap-2.5 py-2.5 px-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/90 dark:border-emerald-800/80 text-emerald-800 dark:text-emerald-300 text-xs font-bold shadow-2xs">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-[#10B981] shrink-0" />
                  <span>Aguardando confirmação bancária em tempo real...</span>
                </div>

                <p className="text-[11px] text-slate-500 dark:text-slate-400 text-center flex items-center justify-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-[#10B981] shrink-0" />
                  <span>Seus bilhetes de 4 dígitos (0000 a 9999) serão liberados na hora.</span>
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
