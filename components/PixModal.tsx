"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Copy, Check, Clock, QrCode, ShieldCheck, CheckCircle2, AlertTriangle, ArrowRight } from "lucide-react";
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
  const [simulating, setSimulating] = useState(false);
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

    // Polling dinâmico a cada 3.5 segundos: atualiza QR Code / Copia e Cola caso o admin mude a chave
    // e detecta automaticamente confirmação de pagamento
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
        // Silencioso em caso de oscilação de rede
      }
    }, 3500);

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

  // Simular confirmação imediata de pagamento através do Webhook oficial
  const handleSimulatePayment = async () => {
    setSimulating(true);
    try {
      const res = await fetch("/api/webhook/pix", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: order.id,
          externalPaymentId: order.externalPaymentId,
          status: "PAID",
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setIsPaid(true);
        setPaidDetails(data);

        // Disparar confetes festivos!
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });

        if (onPaymentConfirmed) {
          onPaymentConfirmed();
        }
      }
    } catch (err) {
      console.error("Simulation error:", err);
    } finally {
      setSimulating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/85 backdrop-blur-md transition-opacity"
        onClick={onClose}
      ></div>

      {/* Dialog */}
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden border border-neutral-100 z-10 transition-all max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="bg-[#000000] p-5 sm:p-6 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
              <QrCode className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-base tracking-tight">
                {isPaid ? "Pagamento Confirmado!" : "Pagamento Instantâneo via Pix"}
              </h3>
              <p className="text-xs text-neutral-400">
                {order.campaign?.title || "Campanha Bolinha da Sorte"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-white p-1 rounded-lg transition-colors"
          >
            &times;
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-5">
          {isPaid ? (
            <div className="text-center py-6 space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div>
                <h4 className="text-xl font-black text-neutral-900">
                  Parabéns! Suas cotas foram geradas!
                </h4>
                <p className="text-xs text-neutral-600 mt-1">
                  Seus {order.quantity} bilhetes já estão homologados e vinculados à sua conta.
                </p>
              </div>

              {paidDetails?.instantPrizesWon?.length > 0 && (
                <div className="p-4 bg-amber-50 border border-amber-300 rounded-2xl text-amber-900 text-xs">
                  <p className="font-extrabold text-sm text-amber-900">
                    🎉 VOCÊ ACHOU UMA COTA PREMIADA!
                  </p>
                  <p className="mt-1">
                    Bilhete premiado com transferência Pix imediata!
                  </p>
                </div>
              )}

              <div className="p-4 bg-neutral-50 rounded-2xl border border-neutral-100 text-left text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-neutral-500">ID do Pedido:</span>
                  <span className="font-mono font-bold text-neutral-900">{order.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">Total Pago:</span>
                  <span className="font-bold text-emerald-700">
                    R$ {Number(order.totalAmount).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">Quantidade:</span>
                  <span className="font-bold text-neutral-900">{order.quantity} cotas</span>
                </div>
              </div>

              <div className="pt-2 flex flex-col gap-2">
                <Link
                  href="/minhas-compras"
                  onClick={onClose}
                  className="w-full py-3 bg-[#16A34A] hover:bg-[#0E7A3E] text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 shadow-lg"
                >
                  <span>Ver Meus Bilhetes em Minhas Compras</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <button
                  onClick={onClose}
                  className="w-full py-2.5 text-xs text-neutral-600 font-semibold hover:text-neutral-900"
                >
                  Fechar janela
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Timer Bar */}
              <div className="flex items-center justify-between p-3.5 bg-neutral-950 text-white rounded-2xl">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-400 animate-spin" />
                  <span className="text-xs text-neutral-300 font-semibold">
                    Números reservados por:
                  </span>
                </div>
                <span className="font-mono text-base font-black text-amber-400 tracking-wider">
                  {formattedTime}
                </span>
              </div>

              {/* Price & Summary */}
              <div className="flex items-center justify-between p-4 bg-emerald-50/60 border border-emerald-100 rounded-2xl">
                <div>
                  <span className="text-[11px] font-bold text-neutral-500 uppercase">
                    Total a Pagar
                  </span>
                  <p className="text-2xl font-black text-emerald-700">
                    R$ {Number(order.totalAmount).toFixed(2)}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[11px] font-bold text-neutral-500 uppercase">
                    Cotas Reservadas
                  </span>
                  <p className="text-base font-extrabold text-neutral-900">
                    {order.quantity} bilhetes
                  </p>
                </div>
              </div>

              {/* Chave Pix Cadastrada no Pedido */}
              {order.pixKey && (
                <div className="flex items-center justify-between px-4 py-2.5 bg-neutral-100/90 border border-neutral-200/80 rounded-xl text-xs">
                  <span className="text-neutral-500 font-medium">Chave Pix para prêmios:</span>
                  <span className="font-bold text-neutral-900">{order.pixKey}</span>
                </div>
              )}

              {/* QR Code Container */}
              <div className="flex flex-col items-center justify-center p-4 bg-neutral-50 border border-neutral-200 rounded-2xl">
                {(currentPixQrCode || order.pixQrCode) ? (
                  <div className="bg-white p-3 rounded-xl shadow-md border border-neutral-100">
                    <img
                      src={currentPixQrCode || order.pixQrCode}
                      alt="Pix QR Code"
                      className="w-52 h-52 object-contain"
                    />
                  </div>
                ) : (
                  <div className="w-52 h-52 bg-neutral-200 rounded-xl animate-pulse flex items-center justify-center">
                    <QrCode className="w-12 h-12 text-neutral-400" />
                  </div>
                )}
                <p className="text-xs text-neutral-500 font-medium mt-3 text-center">
                  Abra o app do seu banco e aponte a câmera para o QR Code
                </p>
              </div>

              {/* Pix Copia e Cola String */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider">
                  Código Pix Copia e Cola
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    readOnly
                    value={currentPixCopyPaste || order.pixCopyPaste || ""}
                    className="flex-1 px-3 py-2.5 bg-neutral-100 border border-neutral-200 rounded-xl text-xs font-mono text-neutral-700 truncate select-all focus:outline-none"
                  />
                  <button
                    onClick={handleCopy}
                    className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm ${
                      copied
                        ? "bg-emerald-600 text-white"
                        : "bg-neutral-900 hover:bg-neutral-800 text-white"
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
                        <span>Copiar</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Auto Baixa Webhook Simulator Button */}
              <div className="pt-2 border-t border-neutral-100 space-y-2">
                <button
                  type="button"
                  onClick={handleSimulatePayment}
                  disabled={simulating}
                  className="w-full py-3 bg-[#16A34A] hover:bg-[#0E7A3E] text-white font-extrabold text-sm rounded-xl transition-all shadow-md active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>
                    {simulating
                      ? "Processando baixa automática..."
                      : "Simular Baixa Automática Pix (Webhook)"}
                  </span>
                </button>

                <p className="text-[11px] text-neutral-500 text-center flex items-center justify-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>
                    Baixa automática via webhook em até 5 minutos após o pagamento.
                  </span>
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
