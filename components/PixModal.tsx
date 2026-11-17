"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import {
  Copy,
  Check,
  Clock,
  QrCode,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Loader2,
  Key,
} from "lucide-react";
import confetti from "canvas-confetti";
import Link from "next/link";

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
  const [currentPixQrCode, setCurrentPixQrCode] = useState(order?.pixQrCode || "");
  const [currentPixCopyPaste, setCurrentPixCopyPaste] = useState(order?.pixCopyPaste || "");

  useEffect(() => {
    if (!isOpen || !order) return;

    // Reset states
    setIsPaid(order.paymentStatus === "PAID");
    setCopied(false);
    setCurrentPixQrCode(order.pixQrCode || "");
    setCurrentPixCopyPaste(order.pixCopyPaste || "");

    // Polling automático a cada 4 segundos: detecta confirmação de pagamento assim que o banco aprovar
    // e atualiza QR Code / Copia e Cola em caso de mudança
    const pollInterval = setInterval(async () => {
      try {
        const res = await fetch(`/api/orders/${order.id}`);
        const data = await res.json();
        if (res.ok && data.order) {
          if (data.order.pixQrCode && data.order.pixQrCode !== currentPixQrCode) {
            setCurrentPixQrCode(data.order.pixQrCode);
          }
          if (data.order.pixCopyPaste && data.order.pixCopyPaste !== currentPixCopyPaste) {
            setCurrentPixCopyPaste(data.order.pixCopyPaste);
          }
          if (data.order.paymentStatus === "PAID") {
            setIsPaid(true);
            setPaidDetails(data.order);
            confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
            if (onPaymentConfirmed) onPaymentConfirmed();
          }
        }
      } catch (err) {
        // Silencioso em caso de oscilação momentânea de rede
      }
    }, 4000);

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
    const textToCopy = currentPixCopyPaste || order.pixCopyPaste;
    if (!textToCopy) return;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/85 backdrop-blur-md transition-opacity"
        onClick={onClose}
      ></div>

      {/* Dialog Responsivo (Mobile-First) */}
      <div className="relative w-full max-w-lg bg-white dark:bg-[#111827] text-slate-900 dark:text-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 z-10 transition-all max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="bg-slate-950 dark:bg-black p-4 sm:p-6 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600/20 text-[#10B981] border border-emerald-500/30 flex items-center justify-center">
              <QrCode className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base tracking-tight">
                {isPaid ? "Pagamento Confirmado!" : "Pagamento Instantâneo via Pix"}
              </h3>
              <p className="text-[11px] sm:text-xs text-slate-400 truncate max-w-[220px] sm:max-w-xs">
                {order.campaign?.title || "Campanha Bolinha da Sorte"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-white/10 transition-colors cursor-pointer text-lg leading-none"
            aria-label="Fechar modal"
          >
            &times;
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4 sm:space-y-5">
          {isPaid ? (
            <div className="text-center py-4 sm:py-6 space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-inner border border-emerald-200 dark:border-emerald-800">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div>
                <h4 className="text-xl font-black text-slate-900 dark:text-white">
                  Parabéns! Suas cotas foram geradas!
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                  Seus {order.quantity} bilhetes já estão homologados e vinculados à sua conta.
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

              <div className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-800 text-left text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">ID do Pedido:</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-slate-100">{order.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Total Pago:</span>
                  <span className="font-extrabold text-emerald-600 dark:text-[#10B981]">
                    R$ {Number(order.totalAmount).toFixed(2).replace(".", ",")}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Quantidade:</span>
                  <span className="font-bold text-slate-900 dark:text-slate-100">{order.quantity} cotas</span>
                </div>
              </div>

              <div className="pt-2 flex flex-col gap-2">
                <Link
                  href="/minhas-compras"
                  onClick={onClose}
                  className="w-full py-3.5 bg-linear-to-r from-emerald-600 to-[#10B981] hover:from-emerald-500 hover:to-emerald-400 text-white font-extrabold text-sm rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-95 transition-all"
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
              {/* Timer Bar */}
              <div className="flex items-center justify-between p-3.5 bg-slate-950 dark:bg-black text-white rounded-2xl border border-slate-800 shadow-sm">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-400 animate-spin" />
                  <span className="text-xs text-slate-300 font-semibold">
                    Números reservados por:
                  </span>
                </div>
                <span className="font-mono text-base font-black text-amber-400 tracking-wider">
                  {formattedTime}
                </span>
              </div>

              {/* Price & Summary */}
              <div className="flex items-center justify-between p-4 bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/60 rounded-2xl">
                <div>
                  <span className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider block">
                    Total a Pagar
                  </span>
                  <p className="text-2xl font-black text-emerald-700 dark:text-[#10B981]">
                    R$ {Number(order.totalAmount).toFixed(2).replace(".", ",")}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                    Cotas Reservadas
                  </span>
                  <p className="text-base font-extrabold text-slate-900 dark:text-white">
                    {order.quantity} bilhetes
                  </p>
                </div>
              </div>

              {/* Barra de Chave Pix do Comprador com Alto Contraste */}
              {order.pixKey && (
                <div className="flex items-center justify-between px-4 py-3 bg-slate-900 dark:bg-slate-950 border border-slate-800 rounded-2xl text-xs shadow-sm">
                  <span className="text-slate-300 font-semibold flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>Sua Chave Pix para prêmios:</span>
                  </span>
                  <span className="font-mono font-black text-[#10B981] bg-emerald-950/90 px-2.5 py-1 rounded-lg border border-emerald-700/80 text-[11px] sm:text-xs truncate max-w-[150px] sm:max-w-none">
                    {order.pixKey}
                  </span>
                </div>
              )}

              {/* QR Code Container Mobile-First */}
              <div className="flex flex-col items-center justify-center p-3 sm:p-5 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl">
                {(currentPixQrCode || order.pixQrCode) ? (
                  <div className="bg-white p-2.5 sm:p-3 rounded-2xl shadow-md border border-slate-200/80">
                    <img
                      src={currentPixQrCode || order.pixQrCode}
                      alt="Pix QR Code"
                      className="w-44 h-44 sm:w-52 sm:h-52 object-contain"
                    />
                  </div>
                ) : (
                  <div className="w-44 h-44 sm:w-52 sm:h-52 bg-slate-200 dark:bg-slate-800 rounded-2xl animate-pulse flex items-center justify-center">
                    <QrCode className="w-10 h-10 text-slate-400" />
                  </div>
                )}
                <p className="text-xs text-slate-600 dark:text-slate-400 font-medium mt-3 text-center">
                  Abra o app do seu banco e aponte a câmera para o QR Code
                </p>
              </div>

              {/* Pix Copia e Cola String de Alto Contraste */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Código Pix Copia e Cola
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    readOnly
                    value={currentPixCopyPaste || order.pixCopyPaste || ""}
                    className="flex-1 px-3.5 py-2.5 bg-slate-100 dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-700 rounded-xl text-xs font-mono font-bold text-slate-900 dark:text-slate-100 truncate select-all focus:outline-hidden focus:border-[#10B981]"
                  />
                  <button
                    type="button"
                    onClick={handleCopy}
                    className={`px-4 sm:px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all shadow-md cursor-pointer active:scale-95 shrink-0 ${
                      copied
                        ? "bg-emerald-600 text-white"
                        : "bg-slate-900 hover:bg-slate-800 dark:bg-[#10B981] dark:hover:bg-emerald-600 text-white"
                    }`}
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Copiado!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        <span>Copiar Código</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Status de Confirmação Automática via Banco / Webhook */}
              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-2.5">
                <div className="flex items-center justify-center gap-2.5 py-3 px-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/90 dark:border-emerald-800/80 text-emerald-800 dark:text-emerald-300 text-xs font-bold shadow-2xs">
                  <Loader2 className="w-4 h-4 animate-spin text-[#10B981] shrink-0" />
                  <span>Aguardando confirmação bancária em tempo real...</span>
                </div>

                <p className="text-[11px] text-slate-500 dark:text-slate-400 text-center flex items-center justify-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-[#10B981] shrink-0" />
                  <span>Seus bilhetes serão liberados automaticamente assim que o Pix for aprovado.</span>
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
