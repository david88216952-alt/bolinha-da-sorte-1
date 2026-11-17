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
  Key,
  QrCode,
} from "lucide-react";
import confetti from "canvas-confetti";
import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";
import {
  generatePixCopyPaste,
  OFFICIAL_PIX_KEY,
  OFFICIAL_PIX_KEY_DISPLAY,
} from "@/lib/pix-emv";

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
  const [copiedKey, setCopiedKey] = useState(false);
  const [isPaid, setIsPaid] = useState(false);
  const [paidDetails, setPaidDetails] = useState<any>(null);
  const [timeLeft, setTimeLeft] = useState(15 * 60); // 15 minutos em segundos
  const [currentPixCopyPaste, setCurrentPixCopyPaste] = useState(order?.pixCopyPaste || "");

  // Gerador oficial de BR Code EMV (com cálculo CRC16) usando a chave +5575991638134 e o valor exato do pedido
  const copyPasteString = useMemo(() => {
    if (currentPixCopyPaste && currentPixCopyPaste.includes("br.gov.bcb.pix")) {
      return currentPixCopyPaste;
    }
    if (order?.pixCopyPaste && order.pixCopyPaste.includes("br.gov.bcb.pix")) {
      return order.pixCopyPaste;
    }
    const amount = Number(order?.totalAmount || 0);
    const txId = (order?.id || "BOLINHA").replace(/[^a-zA-Z0-9]/g, "").slice(0, 25);
    return generatePixCopyPaste(amount, txId, OFFICIAL_PIX_KEY);
  }, [currentPixCopyPaste, order?.pixCopyPaste, order?.totalAmount, order?.id]);

  useEffect(() => {
    if (!isOpen || !order) return;

    // Reset states
    setIsPaid(order.paymentStatus === "PAID");
    setCopied(false);
    setCurrentPixCopyPaste(order.pixCopyPaste || "");

    // Polling automático a cada 4 segundos: detecta confirmação de pagamento real via webhook
    const pollInterval = setInterval(async () => {
      try {
        const res = await fetch(`/api/orders/${order.id}`);
        const data = await res.json();
        if (res.ok && data.order) {
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
      } catch {
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
    if (!copyPasteString) return;
    navigator.clipboard.writeText(copyPasteString);
    setCopied(true);
    setTimeout(() => setCopied(false), 3500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/85 backdrop-blur-md transition-opacity"
        onClick={onClose}
      ></div>

      {/* Dialog Responsivo e Limpo */}
      <div className="relative w-full max-w-lg bg-white dark:bg-[#111827] text-slate-900 dark:text-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 z-10 transition-all max-h-[92vh] flex flex-col">
        {/* Header Superior */}
        <div className="bg-slate-950 dark:bg-black p-4 sm:p-5 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600/20 text-[#10B981] border border-emerald-500/30 flex items-center justify-center">
              <Zap className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base tracking-tight">
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
            className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-white/10 transition-colors cursor-pointer text-lg leading-none"
            aria-label="Fechar modal"
          >
            &times;
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4 sm:space-y-5">
          {isPaid ? (
            /* Tela de Sucesso após Confirmação Bancária */
            <div className="text-center py-4 sm:py-6 space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-inner border border-emerald-200 dark:border-emerald-800">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div>
                <h4 className="text-xl font-black text-slate-900 dark:text-white">
                  Parabéns! Pagamento Confirmado!
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                  Seus {order.quantity} bilhetes já foram homologados e vinculados à sua conta.
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
              {/* Cronômetro de Reserva */}
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

              {/* Layout Limpo de Resumo da Reserva */}
              <div className="p-4 sm:p-5 bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200/90 dark:border-emerald-800/80 rounded-2xl text-center space-y-2 shadow-2xs">
                <span className="inline-block text-[11px] font-black uppercase tracking-wider text-emerald-800 dark:text-emerald-300 bg-emerald-100/90 dark:bg-emerald-900/60 px-3 py-0.5 rounded-full border border-emerald-300 dark:border-emerald-700/60">
                  Resumo da Reserva
                </span>
                <p className="text-sm sm:text-base font-medium text-slate-800 dark:text-slate-200 leading-relaxed">
                  Você está adquirindo{" "}
                  <strong className="font-black text-emerald-700 dark:text-[#10B981]">
                    {order.quantity} {order.quantity === 1 ? "número" : "números"}
                  </strong>{" "}
                  por{" "}
                  <strong className="font-black text-emerald-700 dark:text-[#10B981]">
                    R$ {Number(order.totalAmount).toFixed(2).replace(".", ",")}
                  </strong>{" "}
                  da campanha{" "}
                  <strong className="font-extrabold text-slate-900 dark:text-white">
                    {order.campaign?.title || "Bolinha da Sorte"}
                  </strong>.
                </p>
              </div>

              {/* QR Code Real Gerado Dinamicamente (qrcode.react) */}
              <div className="flex flex-col items-center justify-center p-4 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-3">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300">
                  <QrCode className="w-4 h-4 text-emerald-600 dark:text-[#10B981]" />
                  <span>QR Code Pix para Pagamento</span>
                </div>

                <div className="bg-white p-3.5 rounded-2xl shadow-md border border-slate-200 flex items-center justify-center">
                  <QRCodeSVG
                    value={copyPasteString}
                    size={180}
                    level="M"
                    includeMargin={false}
                    className="w-40 h-40 sm:w-44 sm:h-44"
                  />
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-400 font-medium text-center">
                  Aponte a câmera do aplicativo do seu banco para o QR Code acima
                </p>
              </div>

              {/* Cartão de Identificação da Chave Pix Recebedora Oficial */}
              <div className="p-3.5 sm:p-4 bg-slate-900 dark:bg-black border border-slate-800 rounded-2xl flex items-center justify-between text-xs shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-[#10B981] flex items-center justify-center font-bold shrink-0">
                    <Key className="w-4 h-4 text-[#10B981]" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                      Chave Pix Recebedora Oficial
                    </span>
                    <span className="font-mono font-black text-white text-sm sm:text-base tracking-wide block">
                      {OFFICIAL_PIX_KEY_DISPLAY}
                    </span>
                    <span className="text-[10px] text-emerald-400 block font-medium">
                      Beneficiário: BOLINHA DA SORTE OFICIAL
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(OFFICIAL_PIX_KEY_DISPLAY);
                    setCopiedKey(true);
                    setTimeout(() => setCopiedKey(false), 2500);
                  }}
                  className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 border border-slate-700 active:scale-95"
                  title="Copiar Chave Telefone"
                >
                  {copiedKey ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-[#10B981]" />
                      <span className="text-[#10B981]">Copiada!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-slate-400" />
                      <span>Copiar Chave</span>
                    </>
                  )}
                </button>
              </div>

              {/* Chave Pix para Recebimento de Prêmios (se informada) */}
              {order.pixKey && (
                <div className="flex items-center justify-between px-4 py-2.5 bg-slate-100 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700/80 rounded-xl text-xs">
                  <span className="text-slate-600 dark:text-slate-400 font-medium flex items-center gap-1.5">
                    <span>Sua Chave Pix para premiações:</span>
                  </span>
                  <span className="font-mono font-bold text-slate-900 dark:text-slate-100 truncate max-w-[170px] sm:max-w-none">
                    {order.pixKey}
                  </span>
                </div>
              )}

              {/* Área Direta de Pagamento: Código Pix Copia e Cola Oficial */}
              <div className="space-y-3 pt-1">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Código Pix Copia e Cola Oficial (BR Code EMV)
                  </label>
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-[#10B981] flex items-center gap-1">
                    <Zap className="w-3 h-3" /> Padrão Banco Central
                  </span>
                </div>

                <div className="p-3.5 bg-slate-100 dark:bg-slate-900/90 border-2 border-slate-300 dark:border-slate-700 rounded-2xl shadow-inner">
                  <p className="font-mono text-xs text-slate-800 dark:text-slate-200 break-all select-all leading-relaxed max-h-24 overflow-y-auto">
                    {copyPasteString || "Gerando código Pix oficial..."}
                  </p>
                </div>

                {/* Botão Verde 'Copiar Código Pix' */}
                <button
                  type="button"
                  onClick={handleCopy}
                  className={`w-full py-4 rounded-2xl font-black text-sm sm:text-base flex items-center justify-center gap-2.5 transition-all shadow-lg active:scale-95 cursor-pointer ${
                    copied
                      ? "bg-emerald-700 text-white ring-4 ring-emerald-500/30"
                      : "bg-[#16A34A] hover:bg-[#0E7A3E] text-white shadow-emerald-600/30 hover:shadow-emerald-600/40"
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
                      <span>Copiar Código Pix</span>
                    </>
                  )}
                </button>

                {/* Instruções de Pagamento Rápidas */}
                <div className="p-3.5 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-400 space-y-1">
                  <p className="font-bold text-slate-800 dark:text-slate-200">Como pagar:</p>
                  <p>1. Escaneie o <strong>QR Code</strong> ou clique no botão verde <strong>Copiar Código Pix</strong>.</p>
                  <p>2. Abra o app do seu banco e acesse a opção <strong>Pix &gt; Ler QR Code</strong> ou <strong>Pix Copia e Cola</strong>.</p>
                  <p>3. Confira o valor de <strong>R$ {Number(order.totalAmount).toFixed(2).replace(".", ",")}</strong> e confirme o pagamento.</p>
                </div>
              </div>

              {/* Status Automático em Tempo Real */}
              <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-2">
                <div className="flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/90 dark:border-emerald-800/80 text-emerald-800 dark:text-emerald-300 text-xs font-bold shadow-2xs">
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
