"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ShieldCheck,
  Zap,
  Calendar,
  Truck,
  Flame,
  Award,
  Trophy,
  Lock,
  ChevronDown,
  Check,
  Share2,
  Copy,
  Plus,
  Minus,
  AlertCircle,
  HelpCircle,
  Sparkles,
  ArrowRight,
  ArrowLeft,
} from "lucide-react";
import AuthModal from "@/components/AuthModal";
import PixModal from "@/components/PixModal";
import { WhatsAppIcon, InstagramIcon, FacebookIcon } from "@/components/SocialIcons";

export default function CampaignPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const campaignId = params.id as string;

  const [campaign, setCampaign] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string>("");
  const [quantity, setQuantity] = useState<number>(100);

  // Chave Pix do comprador
  const [pixKeyType, setPixKeyType] = useState<"CPF" | "TELEFONE" | "EMAIL" | "ALEATORIA">("CPF");
  const [pixKey, setPixKey] = useState("");

  // Modais
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [pixModalOpen, setPixModalOpen] = useState(false);
  const [currentOrder, setCurrentOrder] = useState<any>(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Link copy toast
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedInstagram, setCopiedInstagram] = useState(false);

  // Countdown timer state
  const [countdown, setCountdown] = useState("03h : 24m : 18s");

  useEffect(() => {
    // Cronômetro dinâmico de promoção
    const timer = setInterval(() => {
      const now = new Date();
      const endOfDay = new Date();
      endOfDay.setHours(23, 59, 59, 999);
      const diff = Math.max(0, Math.floor((endOfDay.getTime() - now.getTime()) / 1000));
      const hours = String(Math.floor(diff / 3600)).padStart(2, "0");
      const mins = String(Math.floor((diff % 3600) / 60)).padStart(2, "0");
      const secs = String(diff % 60).padStart(2, "0");
      setCountdown(`${hours}h : ${mins}m : ${secs}s`);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Carregar dados da campanha
  const fetchCampaign = async () => {
    try {
      const res = await fetch(`/api/campaigns/${campaignId}`);
      const data = await res.json();
      if (res.ok) {
        setCampaign(data.campaign);
        setSelectedImage(data.campaign.coverImageUrl);

        // Se veio quantidade via URL (?qty=50)
        const queryQty = searchParams.get("qty");
        if (queryQty && !isNaN(parseInt(queryQty, 10))) {
          setQuantity(parseInt(queryQty, 10));
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (campaignId) {
      fetchCampaign();
    }
  }, [campaignId]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="w-full h-96 bg-neutral-200 rounded-3xl animate-pulse"></div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="max-w-md mx-auto my-20 p-8 bg-white rounded-3xl text-center shadow-md space-y-4">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
        <h2 className="text-xl font-bold">Campanha não encontrada</h2>
        <p className="text-xs text-neutral-500">
          A rifa solicitada não existe ou foi removida.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 py-3 px-6 bg-neutral-900 hover:bg-black text-white rounded-xl text-xs font-bold transition-all shadow-md"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar para as Campanhas</span>
        </Link>
      </div>
    );
  }

  const ticketPrice = campaign.ticketPrice || 0.06;
  const totalAmount = parseFloat((quantity * ticketPrice).toFixed(2));

  // Handler de compra / checkout
  const handleCheckout = async () => {
    setErrorMsg(null);

    if (!pixKey.trim()) {
      setErrorMsg("Por favor, informe sua Chave Pix (CPF, telefone, e-mail ou aleatória) antes de gerar o pagamento.");
      return;
    }

    setCheckoutLoading(true);

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaignId: campaign.id,
          quantity,
          pixKey: `${pixKeyType}: ${pixKey.trim()}`,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.requireLogin) {
          setAuthModalOpen(true);
        } else {
          setErrorMsg(data.error || "Erro ao processar pedido.");
        }
        setCheckoutLoading(false);
        return;
      }

      // Pedido criado com sucesso -> Abrir modal Pix
      setCurrentOrder(data.order);
      setPixModalOpen(true);
    } catch {
      setErrorMsg("Erro de conexão ao gerar pedido.");
    } finally {
      setCheckoutLoading(false);
    }
  };

  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  const handleInstagramShare = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopiedInstagram(true);
      setTimeout(() => setCopiedInstagram(false), 3000);
      window.open("https://www.instagram.com/", "_blank");
    }
  };

  const isCompleted = campaign.status === "COMPLETED";

  return (
    <div className="flex flex-col w-full pb-20">
      {/* Top Banner Ribbon */}
      <div className="w-full bg-[#16A34A] text-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-300 animate-bounce" />
            <p className="font-bold">
              <strong className="uppercase text-amber-300">
                {campaign.promoBannerText || "4x Mais Chances!"}
              </strong>
            </p>
          </div>
          <div className="flex items-center gap-2 bg-black/30 backdrop-blur px-3.5 py-1 rounded-full font-mono font-bold text-amber-300 shadow-inner">
            <span className="text-white text-[11px] font-sans">Termina em:</span>
            <span>{countdown}</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-6">
        {/* Navigation & Voltar Bar */}
        <div className="flex items-center justify-between gap-4 mb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-neutral-50 border border-neutral-200 hover:border-neutral-300 text-neutral-800 hover:text-neutral-950 text-xs sm:text-sm font-bold shadow-sm transition-all group"
          >
            <ArrowLeft className="w-4 h-4 text-emerald-600 group-hover:-translate-x-1 transition-transform" />
            <span>Voltar para as Campanhas</span>
          </Link>

          <button
            onClick={handleCopyLink}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white hover:bg-neutral-50 border border-neutral-200 text-neutral-700 hover:text-neutral-900 text-xs font-semibold shadow-sm transition-all"
          >
            {copiedLink ? (
              <>
                <Check className="w-4 h-4 text-emerald-600" />
                <span className="text-emerald-700 font-bold">Link Copiado!</span>
              </>
            ) : (
              <>
                <Share2 className="w-4 h-4 text-neutral-500" />
                <span className="hidden sm:inline">Compartilhar Rifa</span>
                <span className="sm:hidden">Compartilhar</span>
              </>
            )}
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* LEFT COLUMN: VISUALS, DETAILS, INSTANT PRIZES & PODIUM (7 cols) */}
          <div className="lg:col-span-7 flex flex-col gap-8">
            {/* Main Image Showcase Card */}
            <div className="bg-white rounded-3xl shadow-md overflow-hidden border border-neutral-100">
              <div className="relative w-full aspect-[16/10] bg-neutral-950 overflow-hidden">
                <img
                  src={selectedImage || campaign.coverImageUrl}
                  alt={campaign.title}
                  className="w-full h-full object-cover transition-all duration-500"
                />

                {/* Badges Over Image */}
                <div className="absolute top-4 left-4 flex flex-wrap gap-2 z-10">
                  <span className="inline-flex items-center gap-1 bg-[#16A34A] text-white text-xs px-3 py-1 rounded-full uppercase tracking-wider font-extrabold shadow-lg">
                    <Flame className="w-3.5 h-3.5" />
                    {isCompleted ? "Concluído" : "Adquira Já!"}
                  </span>
                  <span className="inline-flex items-center gap-1 bg-black/80 backdrop-blur text-emerald-400 text-xs px-3 py-1 rounded-full uppercase tracking-wider font-bold shadow-lg">
                    <Award className="w-3.5 h-3.5" /> Cota Homologada
                  </span>
                </div>

                {/* Price highlight pill */}
                <div className="absolute bottom-4 right-4 bg-black/90 backdrop-blur text-white px-4 py-2 rounded-2xl shadow-xl flex flex-col items-end">
                  <span className="text-[10px] text-neutral-400 uppercase font-bold tracking-wider">
                    Valor por Cota
                  </span>
                  <span className="text-2xl font-black text-[#4ADE80] leading-none">
                    R$ {ticketPrice.toFixed(2).replace(".", ",")}{" "}
                    <span className="text-xs text-neutral-400 font-normal">/ cota</span>
                  </span>
                </div>
              </div>

              {/* Thumbnails Row */}
              {campaign.galleryImages && campaign.galleryImages.length > 0 && (
                <div className="p-4 bg-neutral-50 flex items-center gap-3 overflow-x-auto border-t border-neutral-100">
                  <button
                    onClick={() => setSelectedImage(campaign.coverImageUrl)}
                    className={`w-20 h-14 rounded-xl overflow-hidden shrink-0 border-2 transition-all ${
                      selectedImage === campaign.coverImageUrl
                        ? "border-emerald-600 shadow-md scale-105"
                        : "border-transparent opacity-70 hover:opacity-100"
                    }`}
                  >
                    <img
                      src={campaign.coverImageUrl}
                      alt="Capa"
                      className="w-full h-full object-cover"
                    />
                  </button>
                  {campaign.galleryImages.map((imgUrl: string, idx: number) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedImage(imgUrl)}
                      className={`w-20 h-14 rounded-xl overflow-hidden shrink-0 border-2 transition-all ${
                        selectedImage === imgUrl
                          ? "border-emerald-600 shadow-md scale-105"
                          : "border-transparent opacity-70 hover:opacity-100"
                      }`}
                    >
                      <img
                        src={imgUrl}
                        alt={`Galeria ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Campaign Presentation Details */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-neutral-100 space-y-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-emerald-700 text-xs font-bold uppercase tracking-wider">
                  <ShieldCheck className="w-4 h-4" />
                  <span>{campaign.subtitle || "Edição Oficial"}</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-black text-neutral-900 tracking-tight leading-tight">
                  {campaign.title}
                </h1>
                <p className="text-sm text-neutral-600 leading-relaxed">
                  {campaign.description}
                </p>
              </div>

              {/* Schedule & Metadata Ribbon */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-neutral-50 p-4 rounded-2xl border border-neutral-100">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                    <Calendar className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-[10px] text-neutral-500 uppercase font-bold tracking-wider block">
                      Extração Oficial
                    </span>
                    <span className="text-xs sm:text-sm font-extrabold text-neutral-900 block">
                      {new Date(campaign.drawDate).toLocaleDateString("pt-BR", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                    <span className="text-[11px] text-neutral-500">Pela Loteria Federal</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                    <Truck className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-[10px] text-neutral-500 uppercase font-bold tracking-wider block">
                      Frete &amp; Documentação
                    </span>
                    <span className="text-xs sm:text-sm font-extrabold text-neutral-900 block">
                      100% Grátis no Brasil
                    </span>
                    <span className="text-[11px] text-neutral-500">Entregue na sua garagem</span>
                  </div>
                </div>
              </div>

              {/* Progress Bar & Velocity Metric */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs font-bold">
                  <span className="text-neutral-600">Progresso das reservas</span>
                  <span className="text-emerald-700 font-extrabold">
                    {campaign.soldTickets.toLocaleString("pt-BR")} /{" "}
                    {campaign.totalTickets.toLocaleString("pt-BR")} cotas ({campaign.percentSold}%)
                  </span>
                </div>
                <div className="w-full h-3.5 bg-neutral-100 rounded-full overflow-hidden p-0.5 border border-neutral-200">
                  <div
                    className="h-full bg-gradient-to-r from-[#0E7A3E] to-[#16A34A] rounded-full transition-all duration-1000 shadow-sm"
                    style={{ width: `${Math.max(5, campaign.percentSold)}%` }}
                  ></div>
                </div>
                <div className="flex justify-between items-center text-[11px] text-neutral-500">
                  <span>Ritmo acelerado de vendas</span>
                  <span className="text-emerald-700 font-bold flex items-center gap-1">
                    <Zap className="w-3.5 h-3.5" /> Sorteio antecipado caso esgote
                  </span>
                </div>
              </div>
            </div>

            {/* SECTION: COTAS PREMIADAS (BILHETES INSTANTÂNEOS) */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-neutral-100 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-neutral-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg sm:text-xl font-black text-neutral-900">
                      Cotas Premiadas Instantâneas
                    </h2>
                    <p className="text-xs text-neutral-500">
                      Comprou o número premiado, recebeu o Pix direto na hora!
                    </p>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1.5 bg-neutral-100 text-neutral-800 text-xs font-bold px-3 py-1.5 rounded-full self-start sm:self-auto">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  Premiação Instantânea
                </span>
              </div>

              {/* Cards Matrix of Instant Prizes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {campaign.instantPrizes && campaign.instantPrizes.length > 0 ? (
                  campaign.instantPrizes.map((ip: any) => {
                    return (
                      <div
                        key={ip.id}
                        className={`p-4 rounded-2xl flex items-center justify-between shadow-sm border transition-all ${
                          ip.isClaimed
                            ? "bg-emerald-50/60 border-emerald-200"
                            : "bg-neutral-50 border-neutral-200/80"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs ${
                              ip.isClaimed
                                ? "bg-[#16A34A] text-white shadow-sm"
                                : "bg-neutral-200 text-neutral-600"
                            }`}
                          >
                            {ip.isClaimed ? (
                              <Trophy className="w-4 h-4" />
                            ) : (
                              <Lock className="w-4 h-4" />
                            )}
                          </div>
                          <div>
                            <span
                              className={`font-mono font-black text-sm block ${
                                ip.isClaimed ? "text-emerald-800" : "text-neutral-900"
                              }`}
                            >
                              #{ip.ticketNumber}
                            </span>
                            <span className="text-xs font-bold text-emerald-700">
                              R$ {Number(ip.prizeValue).toLocaleString("pt-BR")},00 no PIX
                            </span>
                          </div>
                        </div>

                        <div>
                          {ip.isClaimed ? (
                            <div className="text-right">
                              <span className="bg-[#16A34A] text-white text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase inline-block">
                                Resgatada
                              </span>
                              <p className="text-[11px] font-bold text-neutral-800 mt-0.5 truncate max-w-[110px]">
                                {ip.claimedByName || "Ganhador"} 🏆
                              </p>
                            </div>
                          ) : (
                            <span className="bg-neutral-200 text-neutral-700 text-[11px] font-bold px-3 py-1 rounded-full">
                              Disponível
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-xs text-neutral-500 col-span-2">
                    Nenhuma cota premiada configurada para esta campanha.
                  </p>
                )}
              </div>
            </div>

            {/* SECTION: RANKING DE COMPRADORES (PODIUM) */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-neutral-100 space-y-6">
              <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-400/20 text-amber-700 flex items-center justify-center shrink-0">
                    <Trophy className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <h2 className="text-lg sm:text-xl font-black text-neutral-900">
                      Top Compradores da Campanha
                    </h2>
                    <p className="text-xs text-neutral-500">
                      Bônus e prêmios garantidos para os líderes da rodada!
                    </p>
                  </div>
                </div>
                <span className="text-xs font-bold text-amber-700 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
                  Prêmio Extra p/ Líderes
                </span>
              </div>

              {/* Podium: 2º, 1º, 3º */}
              {campaign.ranking && campaign.ranking.length >= 3 && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-4">
                  {/* 2nd Place */}
                  <div className="order-2 md:order-1 bg-neutral-50 border border-neutral-200/80 rounded-2xl p-4 flex flex-col items-center text-center relative shadow-sm">
                    <div className="w-10 h-10 rounded-full bg-neutral-200 text-neutral-700 flex items-center justify-center font-black text-base -mt-7 shadow-md">
                      🥈
                    </div>
                    <span className="text-[10px] text-neutral-500 uppercase font-black tracking-wider mt-2">
                      2º Lugar
                    </span>
                    <span className="text-xs font-bold text-neutral-900 mt-1 truncate max-w-[150px]">
                      {campaign.ranking[1].fullName}
                    </span>
                    <span className="text-xs font-extrabold text-[#16A34A] mt-0.5">
                      {campaign.ranking[1].quantity.toLocaleString("pt-BR")} cotas
                    </span>
                    <span className="text-[11px] text-neutral-500">
                      R$ {campaign.ranking[1].totalAmount.toFixed(2)}
                    </span>
                    <div className="mt-3 w-full bg-neutral-200/60 py-1 rounded-lg text-[10px] font-bold text-neutral-700">
                      🎁 Ganha R$ 2.500 no Pix
                    </div>
                  </div>

                  {/* 1st Place (Champion) */}
                  <div className="order-1 md:order-2 bg-gradient-to-b from-amber-50 via-white to-amber-50/30 border-2 border-amber-300 rounded-2xl p-4 flex flex-col items-center text-center relative shadow-lg transform md:-translate-y-2">
                    <div className="w-12 h-12 rounded-full bg-amber-400 text-neutral-950 flex items-center justify-center font-black text-lg -mt-8 shadow-lg ring-4 ring-white">
                      🥇
                    </div>
                    <span className="text-[10px] text-amber-800 uppercase font-black tracking-wider mt-2">
                      1º Lugar &bull; Campeão
                    </span>
                    <span className="text-sm font-black text-neutral-900 mt-1 truncate max-w-[160px]">
                      {campaign.ranking[0].fullName}
                    </span>
                    <span className="text-sm font-black text-[#16A34A] mt-0.5">
                      {campaign.ranking[0].quantity.toLocaleString("pt-BR")} cotas
                    </span>
                    <span className="text-xs text-neutral-500">
                      R$ {campaign.ranking[0].totalAmount.toFixed(2)}
                    </span>
                    <div className="mt-3 w-full bg-amber-400/30 border border-amber-400/40 py-1.5 rounded-lg text-xs font-extrabold text-amber-900 shadow-sm">
                      🏆 Bônus: iPhone 16 Pro Max
                    </div>
                  </div>

                  {/* 3rd Place */}
                  <div className="order-3 bg-neutral-50 border border-neutral-200/80 rounded-2xl p-4 flex flex-col items-center text-center relative shadow-sm">
                    <div className="w-10 h-10 rounded-full bg-amber-200/70 text-amber-900 flex items-center justify-center font-black text-base -mt-7 shadow-md">
                      🥉
                    </div>
                    <span className="text-[10px] text-neutral-500 uppercase font-black tracking-wider mt-2">
                      3º Lugar
                    </span>
                    <span className="text-xs font-bold text-neutral-900 mt-1 truncate max-w-[150px]">
                      {campaign.ranking[2].fullName}
                    </span>
                    <span className="text-xs font-extrabold text-[#16A34A] mt-0.5">
                      {campaign.ranking[2].quantity.toLocaleString("pt-BR")} cotas
                    </span>
                    <span className="text-[11px] text-neutral-500">
                      R$ {campaign.ranking[2].totalAmount.toFixed(2)}
                    </span>
                    <div className="mt-3 w-full bg-neutral-200/60 py-1 rounded-lg text-[10px] font-bold text-neutral-700">
                      🎁 Ganha R$ 1.000 no Pix
                    </div>
                  </div>
                </div>
              )}

              {/* 4th and beyond rows */}
              {campaign.ranking && campaign.ranking.length > 3 && (
                <div className="space-y-2 pt-2">
                  {campaign.ranking.slice(3, 6).map((buyer: any) => (
                    <div
                      key={buyer.userId}
                      className="flex items-center justify-between p-3 bg-neutral-50 rounded-xl text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-black text-neutral-400 w-5 text-center">
                          {buyer.position}º
                        </span>
                        <span className="font-bold text-neutral-800">{buyer.fullName}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-neutral-500">
                          {buyer.quantity.toLocaleString("pt-BR")} cotas
                        </span>
                        <span className="font-extrabold text-emerald-700">
                          R$ {buyer.totalAmount.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* SECTION: RULES ACCORDION */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-neutral-100 space-y-4">
              <h2 className="text-lg sm:text-xl font-black text-neutral-900">
                Regulamento e Informações
              </h2>

              <div className="space-y-3">
                <details className="group bg-neutral-50 rounded-2xl p-4 border border-neutral-200/80 cursor-pointer" open>
                  <summary className="flex items-center justify-between text-xs sm:text-sm font-bold text-neutral-900 list-none">
                    <span className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      Como funciona a apuração pela Loteria Federal?
                    </span>
                    <ChevronDown className="w-4 h-4 text-neutral-400 transition-transform group-open:rotate-180" />
                  </summary>
                  <p className="text-xs text-neutral-600 mt-3 pt-3 border-t border-neutral-200/60 leading-relaxed">
                    O sorteio terá como base os 5 números premiados da extração oficial da Loteria Federal na data estipulada. O número contemplado é apurado diretamente pela combinação das dezenas finais, garantindo total transparência e auditoria pública.
                  </p>
                </details>

                <details className="group bg-neutral-50 rounded-2xl p-4 border border-neutral-200/80 cursor-pointer">
                  <summary className="flex items-center justify-between text-xs sm:text-sm font-bold text-neutral-900 list-none">
                    <span className="flex items-center gap-2">
                      <Truck className="w-4 h-4 text-emerald-600" />
                      Entrega do Prêmio e Custos de Envio
                    </span>
                    <ChevronDown className="w-4 h-4 text-neutral-400 transition-transform group-open:rotate-180" />
                  </summary>
                  <p className="text-xs text-neutral-600 mt-3 pt-3 border-t border-neutral-200/60 leading-relaxed">
                    O prêmio é entregue diretamente no endereço residencial do vencedor em qualquer cidade do Brasil, com transporte em caminhão fechado, documentação e IPVA 100% quitados, sem nenhum custo para o ganhador.
                  </p>
                </details>

                <details className="group bg-neutral-50 rounded-2xl p-4 border border-neutral-200/80 cursor-pointer">
                  <summary className="flex items-center justify-between text-xs sm:text-sm font-bold text-neutral-900 list-none">
                    <span className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-emerald-600" />
                      Pagamento via Pix e Atribuição dos Números
                    </span>
                    <ChevronDown className="w-4 h-4 text-neutral-400 transition-transform group-open:rotate-180" />
                  </summary>
                  <p className="text-xs text-neutral-600 mt-3 pt-3 border-t border-neutral-200/60 leading-relaxed">
                    Após pagar o Pix com código dinâmico gerado na tela, o sistema confirma a transação automaticamente em menos de 10 segundos, emitindo seus números oficiais na sua conta.
                  </p>
                </details>
              </div>

              {/* Social Share Buttons */}
              <div className="pt-4 flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold text-neutral-700 mr-1">
                  Compartilhar:
                </span>

                {/* WhatsApp */}
                <a
                  href={`https://api.whatsapp.com/send?text=${encodeURIComponent(
                    `Participe da rifa ${campaign.title} na Bolinha da Sorte! Acesse: `
                  )}${encodeURIComponent(typeof window !== "undefined" ? window.location.href : "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-2 bg-[#25D366] hover:bg-[#20bd5a] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm transition-all active:scale-95 cursor-pointer"
                  title="Compartilhar no WhatsApp"
                >
                  <WhatsAppIcon className="w-4 h-4 fill-white" />
                  <span>WhatsApp</span>
                </a>

                {/* Instagram */}
                <button
                  type="button"
                  onClick={handleInstagramShare}
                  className="px-3.5 py-2 bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] hover:opacity-95 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm transition-all active:scale-95 cursor-pointer"
                  title="Compartilhar no Instagram"
                >
                  <InstagramIcon className="w-4 h-4 fill-white" />
                  <span>{copiedInstagram ? "Link Copiado!" : "Instagram"}</span>
                </button>

                {/* Facebook */}
                <a
                  href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
                    typeof window !== "undefined" ? window.location.href : ""
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-2 bg-[#1877F2] hover:bg-[#166fe5] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm transition-all active:scale-95 cursor-pointer"
                  title="Compartilhar no Facebook"
                >
                  <FacebookIcon className="w-4 h-4 fill-white" />
                  <span>Facebook</span>
                </a>

                {/* Copiar Link */}
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="px-3.5 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors border border-neutral-200 cursor-pointer"
                  title="Copiar Link da Rifa"
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-neutral-500" />}
                  <span>{copiedLink ? "Link Copiado!" : "Copiar Link"}</span>
                </button>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: STICKY INTERACTIVE CART WIDGET (5 cols) */}
          <div className="lg:col-span-5 sticky top-24 space-y-6">
            <div className="bg-white rounded-3xl shadow-xl p-6 sm:p-7 border border-neutral-100 space-y-6">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[11px] font-extrabold uppercase text-emerald-700 tracking-wider">
                    Passo 1 de 2: Escolha sua quantia
                  </span>
                  <h2 className="text-xl sm:text-2xl font-black text-neutral-900 tracking-tight">
                    Selecione suas Cotas
                  </h2>
                </div>
                <div className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1 rounded-full text-[11px] font-bold flex items-center gap-1">
                  <Zap className="w-3 h-3 text-emerald-600" /> PIX Automático
                </div>
              </div>

              {/* Preset Packages Grid */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-neutral-500">
                  <span className="font-semibold">Pacotes populares:</span>
                  <span className="text-emerald-700 font-bold">Quanto mais cotas, mais chances!</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-2.5">
                  {/* +30 cotas */}
                  <button
                    type="button"
                    onClick={() => setQuantity(30)}
                    className={`p-3.5 rounded-2xl border text-left transition-all flex flex-col justify-between cursor-pointer ${
                      quantity === 30
                        ? "border-emerald-600 bg-emerald-50/70 shadow-sm ring-2 ring-emerald-500/30"
                        : "border-neutral-200 bg-neutral-50 hover:bg-neutral-100"
                    }`}
                  >
                    <div className="flex justify-between items-center w-full">
                      <span className="text-lg font-black text-neutral-900">+30</span>
                      <span className="text-[11px] text-neutral-500">cotas</span>
                    </div>
                    <span className="text-xs font-bold text-neutral-700 mt-1">
                      R$ {(30 * ticketPrice).toFixed(2).replace(".", ",")}
                    </span>
                  </button>

                  {/* +50 cotas */}
                  <button
                    type="button"
                    onClick={() => setQuantity(50)}
                    className={`p-3.5 rounded-2xl border text-left transition-all flex flex-col justify-between cursor-pointer ${
                      quantity === 50
                        ? "border-emerald-600 bg-emerald-50/70 shadow-sm ring-2 ring-emerald-500/30"
                        : "border-neutral-200 bg-neutral-50 hover:bg-neutral-100"
                    }`}
                  >
                    <div className="flex justify-between items-center w-full">
                      <span className="text-lg font-black text-neutral-900">+50</span>
                      <span className="text-[11px] text-neutral-500">cotas</span>
                    </div>
                    <span className="text-xs font-bold text-neutral-700 mt-1">
                      R$ {(50 * ticketPrice).toFixed(2).replace(".", ",")}
                    </span>
                  </button>

                  {/* +100 cotas (Popular) */}
                  <button
                    type="button"
                    onClick={() => setQuantity(100)}
                    className={`p-3.5 rounded-2xl border text-left transition-all flex flex-col justify-between cursor-pointer relative ${
                      quantity === 100
                        ? "border-emerald-600 bg-emerald-50/70 shadow-sm ring-2 ring-emerald-500/30"
                        : "border-neutral-200 bg-neutral-50 hover:bg-neutral-100"
                    }`}
                  >
                    <span className="absolute -top-2 right-2 bg-amber-400 text-neutral-950 text-[9px] font-black uppercase px-2 py-0.5 rounded-full shadow-sm">
                      Popular
                    </span>
                    <div className="flex justify-between items-center w-full">
                      <span className="text-lg font-black text-neutral-900">+100</span>
                      <span className="text-[11px] text-neutral-500">cotas</span>
                    </div>
                    <span className="text-xs font-bold text-neutral-700 mt-1">
                      R$ {(100 * ticketPrice).toFixed(2).replace(".", ",")}
                    </span>
                  </button>

                  {/* +2000 cotas (4x mais chances) */}
                  <button
                    type="button"
                    onClick={() => setQuantity(2000)}
                    className={`p-3.5 rounded-2xl border text-left transition-all flex flex-col justify-between cursor-pointer relative ${
                      quantity === 2000
                        ? "border-emerald-600 bg-emerald-50/70 shadow-sm ring-2 ring-emerald-500/30"
                        : "border-neutral-200 bg-neutral-50 hover:bg-neutral-100"
                    }`}
                  >
                    <span className="absolute -top-2 right-2 bg-emerald-600 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded-full shadow-sm">
                      4x Chances
                    </span>
                    <div className="flex justify-between items-center w-full">
                      <span className="text-lg font-black text-neutral-900">+2.000</span>
                      <span className="text-[11px] text-neutral-500">cotas</span>
                    </div>
                    <span className="text-xs font-bold text-neutral-700 mt-1">
                      R$ {(2000 * ticketPrice).toFixed(2).replace(".", ",")}
                    </span>
                  </button>
                </div>
              </div>

              {/* Manual Counter Input */}
              <div className="space-y-2 pt-2">
                <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider">
                  Ou digite a quantidade desejada:
                </label>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setQuantity((prev) => Math.max(10, prev - 10))}
                    className="w-12 h-12 rounded-2xl bg-neutral-100 hover:bg-neutral-200 text-neutral-800 flex items-center justify-center font-black transition-colors cursor-pointer"
                  >
                    <Minus className="w-5 h-5" />
                  </button>
                  <input
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      setQuantity(isNaN(val) ? 0 : Math.max(1, val));
                    }}
                    className="flex-1 h-12 text-center text-xl font-black bg-neutral-50 border-2 border-neutral-200 rounded-2xl focus:outline-none focus:border-emerald-500 text-neutral-900"
                  />
                  <button
                    type="button"
                    onClick={() => setQuantity((prev) => prev + 10)}
                    className="w-12 h-12 rounded-2xl bg-neutral-100 hover:bg-neutral-200 text-neutral-800 flex items-center justify-center font-black transition-colors cursor-pointer"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Order Calculation Preview */}
              <div className="p-4 bg-neutral-50 rounded-2xl border border-neutral-100 space-y-2 text-xs">
                <div className="flex justify-between text-neutral-600">
                  <span>Quantidade selecionada:</span>
                  <span className="font-bold text-neutral-900">{quantity} bilhetes</span>
                </div>
                <div className="flex justify-between text-neutral-600">
                  <span>Preço unitário:</span>
                  <span className="font-bold text-neutral-900">
                    R$ {ticketPrice.toFixed(2).replace(".", ",")}
                  </span>
                </div>
                <div className="pt-2 border-t border-neutral-200 flex justify-between items-baseline">
                  <span className="font-black text-sm text-neutral-900">Total a Pagar:</span>
                  <span className="text-2xl font-black text-[#16A34A]">
                    R$ {totalAmount.toFixed(2).replace(".", ",")}
                  </span>
                </div>
              </div>

              {/* Informação Obrigatória da Chave Pix */}
              <div className="p-4 bg-emerald-50/70 rounded-2xl border border-emerald-200/90 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-black text-emerald-950 uppercase tracking-wider">
                    <Zap className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Sua Chave Pix para Recebimento</span>
                  </div>
                  <span className="text-[10px] bg-emerald-200/80 text-emerald-900 px-2 py-0.5 rounded-full font-extrabold">
                    Obrigatório
                  </span>
                </div>

                {/* Seletores de Tipo de Chave */}
                <div className="grid grid-cols-4 gap-1.5 text-[11px] font-bold">
                  {(["CPF", "TELEFONE", "EMAIL", "ALEATORIA"] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setPixKeyType(t)}
                      className={`py-1.5 px-1 rounded-lg text-center transition-all cursor-pointer truncate ${
                        pixKeyType === t
                          ? "bg-[#0E7A3E] text-white shadow-2xs font-extrabold"
                          : "bg-white text-neutral-600 hover:bg-neutral-100 border border-neutral-200"
                      }`}
                    >
                      {t === "CPF"
                        ? "CPF"
                        : t === "TELEFONE"
                        ? "Celular"
                        : t === "EMAIL"
                        ? "E-mail"
                        : "Aleatória"}
                    </button>
                  ))}
                </div>

                {/* Campo de Texto da Chave Pix */}
                <input
                  type="text"
                  required
                  value={pixKey}
                  onChange={(e) => setPixKey(e.target.value)}
                  placeholder={
                    pixKeyType === "CPF"
                      ? "Digite seu CPF (ex: 000.000.000-00)"
                      : pixKeyType === "TELEFONE"
                      ? "Digite seu Celular/WhatsApp com DDD"
                      : pixKeyType === "EMAIL"
                      ? "Digite seu e-mail cadastrado no Pix"
                      : "Cole sua chave Pix aleatória (EVP)"
                  }
                  className="w-full px-3 py-2 bg-white border border-neutral-300 rounded-xl text-xs font-semibold text-neutral-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />

                <p className="text-[10px] text-neutral-500 leading-tight">
                  Sua chave é necessária para identificação do pedido e pagamento imediato caso você tire uma cota premiada ou ganhe o prêmio principal.
                </p>
              </div>

              {errorMsg && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Green Action Checkout Button */}
              {isCompleted ? (
                <div className="w-full py-4 rounded-2xl bg-neutral-200 text-neutral-600 font-bold text-center text-sm">
                  Campanha Concluída / Vendas Encerradas
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleCheckout}
                  disabled={checkoutLoading || quantity <= 0}
                  className="w-full py-4 px-6 rounded-2xl bg-[#0E7A3E] hover:bg-[#16A34A] text-white font-extrabold text-base transition-all duration-200 flex items-center justify-between shadow-[0_8px_25px_rgba(14,122,62,0.35)] active:scale-[0.98] disabled:opacity-50 cursor-pointer"
                >
                  <span>
                    {checkoutLoading ? "Gerando Pix..." : "Participar do Sorteio"}
                  </span>
                  <span className="text-emerald-100 font-black">
                    R$ {totalAmount.toFixed(2).replace(".", ",")}
                  </span>
                </button>
              )}

              <p className="text-[11px] text-neutral-400 text-center flex items-center justify-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-emerald-600" />
                <span>Ambiente Seguro • Seus números chegam em segundos</span>
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Voltar Navigation Bar */}
        <div className="mt-12 pt-8 border-t border-neutral-200/80 flex flex-col sm:flex-row items-center justify-between gap-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-white hover:bg-neutral-50 border border-neutral-200 hover:border-neutral-300 text-neutral-800 hover:text-neutral-950 text-xs sm:text-sm font-bold shadow-sm transition-all group"
          >
            <ArrowLeft className="w-4 h-4 text-emerald-600 group-hover:-translate-x-1 transition-transform" />
            <span>Voltar para todas as campanhas</span>
          </Link>
          <p className="text-xs text-neutral-500 font-medium text-center sm:text-right">
            Quer ver outros prêmios da Bolinha da Sorte? Confira nossa vitrine completa.
          </p>
        </div>
      </div>

      {/* Auth Modal if checkout requires login */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={() => {
          setAuthModalOpen(false);
          handleCheckout(); // Resume checkout
        }}
      />

      {/* Pix Modal when order is created */}
      <PixModal
        isOpen={pixModalOpen}
        order={currentOrder}
        onClose={() => setPixModalOpen(false)}
        onPaymentConfirmed={() => {
          fetchCampaign();
        }}
      />
    </div>
  );
}
