"use client";

import { useState } from "react";
import Link from "next/link";
import {
  HelpCircle,
  ChevronDown,
  ShoppingBag,
  Receipt,
  ShieldCheck,
  Truck,
  Sparkles,
  ArrowLeft,
} from "lucide-react";
import { WhatsAppIcon } from "@/components/SocialIcons";

export default function AjudaPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      title: "Acessando suas compras",
      icon: ShoppingBag,
      // Texto estritamente obrigatório da especificação:
      content:
        "Existem duas formas de você conseguir acessar suas compras, a primeira é logando no site, abrindo o menu do site e clicando em 'Entrar' e a segunda forma é visitando o sorteio e clicando em 'Compras' logo abaixo do nome 'Cotas'.",
      isMandatory: true,
    },
    {
      title: "Como envio o comprovante?",
      icon: Receipt,
      // Texto estritamente obrigatório da especificação:
      content:
        "Caso você tenha feito o pagamento via Pix QR Code ou copiando o código, não é necessário enviar o comprovante, aguardando até 5 minutos após o pagamento, o sistema irá dar baixa automaticamente, para mais dúvidas entre em contato conosco pelo whatsapp.",
      isMandatory: true,
    },
    {
      title: "Como funciona o sorteio pela Loteria Federal?",
      icon: ShieldCheck,
      content:
        "Todos os nossos sorteios oficiais são diretamente atrelados aos 5 prêmios da extração oficial da Loteria Federal (CEF) do dia indicado. O bilhete contemplado utiliza a combinação direta dos dígitos finais divulgados publicamente pela Caixa, garantindo 100% de segurança e impossibilidade de qualquer manipulação.",
    },
    {
      title: "O que são as Cotas Premiadas e como recebo?",
      icon: Sparkles,
      content:
        "As Cotas Premiadas são bilhetes da sorte especiais com valores instantâneos (como R$ 2.500, R$ 5.000 ou R$ 10.000). Caso você selecione ou receba um desses números na sua compra, o sistema identifica na hora e nossa equipe realiza a transferência Pix instantaneamente para a sua chave cadastrada sem burocracia.",
    },
    {
      title: "Quem paga o frete e a documentação do veículo?",
      icon: Truck,
      content:
        "O ganhador não paga absolutamente nada! O veículo é transportado em caminhão cegonha fechado com seguro total até a porta da sua casa em qualquer estado ou município do Brasil, com frete, emplacamento, IPVA e transferência de titularidade 100% pagos pela Bolinha da Sorte.",
    },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 pb-20">
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
          Central de Suporte
        </span>
      </div>

      {/* Header Banner */}
      <section className="text-center max-w-xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-200 text-xs font-black uppercase tracking-wider">
          <HelpCircle className="w-4 h-4 text-emerald-700" />
          <span>Central de Ajuda e Suporte</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-neutral-900 tracking-tight">
          Perguntas Frequentes (FAQ)
        </h1>
        <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed">
          Tire suas dúvidas sobre acesso a compras, confirmação do Pix, cotas premiadas e entrega de prêmios.
        </p>
      </section>

      {/* Accordion Component with Mandatory Topics */}
      <section className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-neutral-100 space-y-4">
        {faqs.map((faq, idx) => {
          const isOpen = openIndex === idx;
          const Icon = faq.icon;

          return (
            <div
              key={idx}
              className={`rounded-2xl border transition-all overflow-hidden ${
                isOpen
                  ? "bg-neutral-50 border-emerald-300 shadow-sm"
                  : "bg-white border-neutral-200/80 hover:border-neutral-300"
              }`}
            >
              <button
                type="button"
                onClick={() => setOpenIndex(isOpen ? null : idx)}
                className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 cursor-pointer select-none"
              >
                <div className="flex items-center gap-3.5">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                      isOpen
                        ? "bg-[#16A34A] text-white"
                        : "bg-neutral-100 text-neutral-600"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="text-sm sm:text-base font-extrabold text-neutral-900">
                    {faq.title}
                  </span>
                </div>
                <ChevronDown
                  className={`w-5 h-5 text-neutral-400 transition-transform duration-200 shrink-0 ${
                    isOpen ? "rotate-180 text-emerald-600" : ""
                  }`}
                />
              </button>

              {isOpen && (
                <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-neutral-600 leading-relaxed border-t border-neutral-200/60 mt-1">
                  <p>{faq.content}</p>
                </div>
              )}
            </div>
          );
        })}
      </section>

      {/* WhatsApp Support Card */}
      <section className="p-6 sm:p-8 bg-gradient-to-br from-neutral-950 via-neutral-900 to-black text-white rounded-3xl border border-neutral-800 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-6 text-center sm:text-left">
        <div className="space-y-1.5 max-w-md">
          <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">
            Ainda precisa de ajuda?
          </span>
          <h3 className="text-xl font-black text-white">
            Fale com a nossa equipe no WhatsApp
          </h3>
          <p className="text-xs text-neutral-400">
            Atendimento disponível todos os dias para esclarecer dúvidas sobre seus bilhetes e pagamentos.
          </p>
        </div>

        <a
          href="https://api.whatsapp.com"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2.5 px-6 py-3.5 bg-[#25D366] hover:bg-[#20bd5a] text-white font-extrabold text-sm rounded-2xl shadow-lg transition-all active:scale-95 shrink-0"
        >
          <WhatsAppIcon className="w-5 h-5 fill-white" />
          <span>Chamar no WhatsApp</span>
        </a>
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
    </div>
  );
}
