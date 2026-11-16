"use client";

import { useState, useEffect, useRef } from "react";
import AdminLayout from "@/components/AdminLayout";
import {
  Plus,
  UploadCloud,
  X,
  Trash2,
  CheckCircle,
  AlertCircle,
  FileEdit,
  PowerOff,
  Star,
  Layers,
  Sparkles,
  DollarSign,
  Ticket,
} from "lucide-react";

export default function AdminCampanhasPage() {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterTab, setFilterTab] = useState<"ALL" | "ACTIVE" | "COMPLETED">("ALL");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<any>(null);

  // Form Fields
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [description, setDescription] = useState("");
  const [prizeValue, setPrizeValue] = useState<number | string>(350000);
  const [ticketPrice, setTicketPrice] = useState<number | string>(0.06);
  const [totalTickets, setTotalTickets] = useState<number | string>(1000000);
  const [coverImageUrl, setCoverImageUrl] = useState("");
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [promoPackages, setPromoPackages] = useState<number[]>([30, 50, 100, 2000]);
  const [newPackageInput, setNewPackageInput] = useState("");

  // Upload & status states
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingGallery, setUploadingGallery] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const coverInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const loadCampaigns = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/campaigns");
      const data = await res.json();
      setCampaigns(data.campaigns || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCampaigns();
  }, []);

  const openCreateModal = () => {
    setSelectedCampaign(null);
    setTitle("");
    setSubtitle("");
    setDescription("");
    setPrizeValue(350000);
    setTicketPrice(0.06);
    setTotalTickets(1000000);
    setCoverImageUrl("");
    setGalleryImages([]);
    setPromoPackages([30, 50, 100, 2000]);
    setNewPackageInput("");
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  const openEditModal = (camp: any) => {
    setSelectedCampaign(camp);
    setTitle(camp.title || "");
    setSubtitle(camp.subtitle || "");
    setDescription(camp.description || "");
    setPrizeValue(camp.prizeValue || 0);
    setTicketPrice(camp.ticketPrice || 0.06);
    setTotalTickets(camp.totalTickets || 1000000);
    setCoverImageUrl(camp.coverImageUrl || "");
    setGalleryImages(camp.galleryImages || []);

    try {
      const parsed = Array.isArray(camp.promoPackages)
        ? camp.promoPackages
        : JSON.parse(camp.promoPackages || "[30, 50, 100, 2000]");
      setPromoPackages(parsed);
    } catch {
      setPromoPackages([30, 50, 100, 2000]);
    }

    setNewPackageInput("");
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  // Upload Foto Principal
  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingCover(true);
    setErrorMsg(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || "Falha ao enviar foto principal.");
        return;
      }

      setCoverImageUrl(data.url);
    } catch {
      setErrorMsg("Erro ao enviar foto principal.");
    } finally {
      setUploadingCover(false);
    }
  };

  // Upload Fotos Extras (Galeria)
  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingGallery(true);
    setErrorMsg(null);

    try {
      const newUrls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const formData = new FormData();
        formData.append("file", files[i]);

        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });
        const data = await res.json();
        if (res.ok && data.url) {
          newUrls.push(data.url);
        }
      }

      setGalleryImages((prev) => [...prev, ...newUrls]);
    } catch {
      setErrorMsg("Erro ao enviar fotos da galeria.");
    } finally {
      setUploadingGallery(false);
    }
  };

  const removeGalleryImage = (idx: number) => {
    setGalleryImages((prev) => prev.filter((_, i) => i !== idx));
  };

  // Manipulação de Pacotes Promocionais
  const handleAddPackage = () => {
    const num = parseInt(newPackageInput.trim(), 10);
    if (!isNaN(num) && num > 0 && !promoPackages.includes(num)) {
      setPromoPackages((prev) => [...prev, num].sort((a, b) => a - b));
      setNewPackageInput("");
    }
  };

  const handleRemovePackage = (pkg: number) => {
    setPromoPackages((prev) => prev.filter((p) => p !== pkg));
  };

  // Encerrar Campanha
  const handleCloseCampaign = async (camp: any) => {
    if (camp.status === "COMPLETED") {
      alert("Esta campanha já está concluída.");
      return;
    }

    if (!confirm(`Deseja realmente encerrar a campanha "${camp.title}"?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/campaigns/${camp.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...camp,
          status: "COMPLETED",
        }),
      });

      if (res.ok) {
        loadCampaigns();
      } else {
        alert("Erro ao encerrar campanha.");
      }
    } catch (err) {
      console.error(err);
      alert("Erro de comunicação ao encerrar campanha.");
    }
  };

  // Excluir Campanha com Confirmação e Cascata
  const handleDeleteCampaign = async (camp: any) => {
    if (
      !confirm(
        `Tem certeza que deseja excluir permanentemente a campanha "${camp.title}"?\n\nEsta ação apagará todos os dados vinculados a ela (pedidos, bilhetes e ganhadores). Ideal para limpar rifas de teste.`
      )
    ) {
      return;
    }

    try {
      const res = await fetch(`/api/campaigns/${camp.id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        loadCampaigns();
      } else {
        const data = await res.json();
        alert(data.error || "Erro ao excluir campanha.");
      }
    } catch (err) {
      console.error(err);
      alert("Erro de comunicação ao excluir campanha.");
    }
  };

  // Salvar Alterações / Criar
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveLoading(true);
    setErrorMsg(null);

    if (!title.trim()) {
      setErrorMsg("Informe o título da campanha.");
      setSaveLoading(false);
      return;
    }

    const payload = {
      title: title.trim(),
      subtitle: subtitle.trim() || undefined,
      description: description.trim() || undefined,
      prizeValue: Number(prizeValue),
      ticketPrice: Number(ticketPrice),
      totalTickets: Number(totalTickets),
      promoPackages,
      coverImageUrl:
        coverImageUrl ||
        "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&q=80&w=800",
      galleryImages,
      status: selectedCampaign?.status || "ACTIVE",
    };

    try {
      if (selectedCampaign) {
        // Atualizar
        const res = await fetch(`/api/campaigns/${selectedCampaign.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const data = await res.json();
        if (!res.ok) {
          setErrorMsg(data.error || "Erro ao salvar alterações.");
          setSaveLoading(false);
          return;
        }
      } else {
        // Criar
        const res = await fetch("/api/campaigns", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const data = await res.json();
        if (!res.ok) {
          setErrorMsg(data.error || "Erro ao criar campanha.");
          setSaveLoading(false);
          return;
        }
      }

      setIsModalOpen(false);
      loadCampaigns();
    } catch {
      setErrorMsg("Erro ao salvar campanha.");
    } finally {
      setSaveLoading(false);
    }
  };

  const activeCampaigns = campaigns.filter((c) => c.status === "ACTIVE");
  const completedCampaigns = campaigns.filter((c) => c.status === "COMPLETED");

  const displayedCampaigns = campaigns.filter((c) => {
    if (filterTab === "ACTIVE") return c.status === "ACTIVE";
    if (filterTab === "COMPLETED") return c.status === "COMPLETED";
    return true;
  });

  const maxActivePrize =
    activeCampaigns.length > 0
      ? Math.max(...activeCampaigns.map((c) => Number(c.prizeValue) || 0))
      : -1;

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Topo da página: Título à esquerda e botão verde à direita */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
          <div>
            <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
              Gerenciamento de Rifas e Prêmios
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Cadastre novos sorteios, atualize fotos dos prêmios e configure pacotes de cotas
            </p>
          </div>

          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 bg-[#10B981] hover:bg-[#0EA271] text-white px-4 py-2.5 rounded-xl font-bold text-xs shadow-sm transition-all cursor-pointer self-start sm:self-center"
          >
            <Plus className="w-4 h-4" />
            <span>Nova Rifa</span>
          </button>
        </div>

        {/* Abas de Filtro: Todas / Ativas / Encerradas */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
          <button
            type="button"
            onClick={() => setFilterTab("ALL")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
              filterTab === "ALL"
                ? "bg-[#10B981] text-white shadow-2xs font-extrabold"
                : "bg-white dark:bg-[#111827] text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800"
            }`}
          >
            Todas ({campaigns.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterTab("ACTIVE")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
              filterTab === "ACTIVE"
                ? "bg-[#10B981] text-white shadow-2xs font-extrabold"
                : "bg-white dark:bg-[#111827] text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800"
            }`}
          >
            Ativas ({activeCampaigns.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterTab("COMPLETED")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
              filterTab === "COMPLETED"
                ? "bg-[#10B981] text-white shadow-2xs font-extrabold"
                : "bg-white dark:bg-[#111827] text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800"
            }`}
          >
            Encerradas ({completedCampaigns.length})
          </button>
        </div>

        {/* Lista em Grid de Cards (3 colunas no desktop, 1 no mobile) */}
        {loading ? (
          <div className="py-16 text-center text-xs text-slate-400 font-medium">
            Carregando catálogo de rifas...
          </div>
        ) : displayedCampaigns.length === 0 ? (
          <div className="bg-white dark:bg-[#111827] p-10 rounded-2xl border border-slate-200 dark:border-slate-800 text-center text-slate-500 text-sm shadow-2xs">
            Nenhuma campanha cadastrada nesta aba. Clique em "+ Nova Rifa" para começar.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayedCampaigns.map((camp) => {
              const isActive = camp.status === "ACTIVE";
              const isHighlight =
                isActive &&
                maxActivePrize > 0 &&
                Number(camp.prizeValue) === maxActivePrize;

              return (
                <div
                  key={camp.id}
                  className="bg-white dark:bg-[#111827] rounded-2xl shadow-2xs border border-slate-200/80 dark:border-slate-800 overflow-hidden flex flex-col justify-between hover:shadow-md transition-shadow duration-200"
                >
                  <div>
                    {/* Imagem do prêmio (aspect-video object-cover) */}
                    <div className="relative aspect-video w-full bg-slate-100 overflow-hidden">
                      <img
                        src={camp.coverImageUrl}
                        alt={camp.title}
                        className="w-full h-full object-cover"
                      />

                      {/* Selo Destaque na Home */}
                      {isHighlight && (
                        <div className="absolute top-3 left-3">
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-black bg-amber-400 text-amber-950 shadow-md border border-amber-300">
                            <Star className="w-3.5 h-3.5 fill-amber-950" />
                            Destaque na Home
                          </span>
                        </div>
                      )}

                      <div className="absolute top-3 right-3">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black shadow-xs ${
                            isActive
                              ? "bg-[#10B981] text-white"
                              : "bg-slate-700 text-white"
                          }`}
                        >
                          {isActive ? "Ativa" : "Concluída"}
                        </span>
                      </div>
                    </div>

                    {/* Informações da Campanha */}
                    <div className="p-5 space-y-3">
                      <h3
                        className="font-bold text-base text-slate-900 truncate leading-snug"
                        title={camp.title}
                      >
                        {camp.title}
                      </h3>

                      <div className="grid grid-cols-2 gap-2 text-xs p-2.5 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-100 dark:border-slate-800">
                        <div>
                          <span className="text-slate-400 text-[10px] uppercase font-bold block">
                            Valor da Cota
                          </span>
                          <strong className="text-slate-900 font-extrabold text-sm">
                            R${" "}
                            {Number(camp.ticketPrice).toLocaleString("pt-BR", {
                              minimumFractionDigits: 2,
                            })}
                          </strong>
                        </div>
                        <div>
                          <span className="text-slate-400 text-[10px] uppercase font-bold block">
                            Prêmio Estimado
                          </span>
                          <span className="text-[#10B981] font-extrabold text-sm">
                            R$ {Number(camp.prizeValue).toLocaleString("pt-BR")}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Botões de Ação no rodapé do card */}
                  <div className="p-5 pt-0 border-t border-slate-100 dark:border-slate-800 mt-2 space-y-2">
                    <button
                      type="button"
                      onClick={() => openEditModal(camp)}
                      className="w-full py-2.5 px-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <FileEdit className="w-3.5 h-3.5 text-slate-600" />
                      <span>Editar / Trocar Fotos</span>
                    </button>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => handleCloseCampaign(camp)}
                        disabled={!isActive}
                        className={`w-full py-2 px-2 text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1 cursor-pointer ${
                          isActive
                            ? "bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200"
                            : "bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200"
                        }`}
                      >
                        <PowerOff className="w-3.5 h-3.5" />
                        <span>{isActive ? "Encerrar" : "Encerrada"}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteCampaign(camp)}
                        className="w-full py-2 px-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1 cursor-pointer"
                        title="Excluir campanha e bilhetes vinculados"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                        <span>Excluir</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Modal de Criação / Edição de Rifa */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="fixed inset-0 bg-black/60 backdrop-blur-2xs transition-opacity"
              onClick={() => setIsModalOpen(false)}
            ></div>

            <div className="relative bg-white dark:bg-[#111827] text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-800 w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden z-10 max-h-[92vh] flex flex-col">
              {/* Header do Modal */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0B1120]">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-[#10B981]/20 text-[#10B981] flex items-center justify-center">
                    <Layers className="w-4 h-4" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900">
                    {selectedCampaign ? "Editar Rifa & Prêmios" : "Cadastrar Nova Rifa"}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Formulário em 2 Colunas */}
              <form onSubmit={handleSave} className="overflow-y-auto p-6 flex-1 space-y-6">
                {errorMsg && (
                  <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-xl flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Coluna Esquerda: Upload de Imagens */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                        Foto Principal do Prêmio
                      </label>

                      <div className="relative aspect-video w-full rounded-2xl bg-slate-100 border-2 border-dashed border-slate-300 overflow-hidden flex flex-col items-center justify-center group">
                        {coverImageUrl ? (
                          <>
                            <img
                              src={coverImageUrl}
                              alt="Pré-visualização"
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <button
                                type="button"
                                onClick={() => coverInputRef.current?.click()}
                                className="bg-white text-slate-900 text-xs font-bold px-3 py-1.5 rounded-lg shadow-sm cursor-pointer"
                              >
                                Trocar Foto
                              </button>
                            </div>
                          </>
                        ) : (
                          <div
                            onClick={() => coverInputRef.current?.click()}
                            className="cursor-pointer text-center p-4 space-y-1.5"
                          >
                            <UploadCloud className="w-8 h-8 text-slate-400 mx-auto" />
                            <p className="text-xs font-bold text-slate-700">
                              Clique para fazer upload da foto
                            </p>
                            <p className="text-[11px] text-slate-400">
                              Formatos aceitos: JPG, PNG ou WEBP
                            </p>
                          </div>
                        )}
                      </div>

                      <input
                        type="file"
                        ref={coverInputRef}
                        onChange={handleCoverUpload}
                        accept="image/jpeg,image/png,image/webp"
                        className="hidden"
                      />

                      {uploadingCover && (
                        <p className="text-xs text-[#10B981] font-semibold mt-1">
                          Enviando foto principal...
                        </p>
                      )}
                    </div>

                    {/* Galeria de Fotos Extras */}
                    <div className="pt-2 border-t border-slate-100">
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                          Galeria de Fotos Extras
                        </label>
                        <button
                          type="button"
                          onClick={() => galleryInputRef.current?.click()}
                          disabled={uploadingGallery}
                          className="text-xs text-[#10B981] hover:underline font-bold cursor-pointer"
                        >
                          + Adicionar Fotos
                        </button>
                      </div>

                      <input
                        type="file"
                        ref={galleryInputRef}
                        onChange={handleGalleryUpload}
                        accept="image/jpeg,image/png,image/webp"
                        multiple
                        className="hidden"
                      />

                      {galleryImages.length === 0 ? (
                        <p className="text-[11px] text-slate-400 italic">
                          Nenhuma foto adicional cadastrada.
                        </p>
                      ) : (
                        <div className="grid grid-cols-4 gap-2">
                          {galleryImages.map((img, i) => (
                            <div
                              key={i}
                              className="relative aspect-square rounded-xl bg-slate-100 overflow-hidden border border-slate-200 group"
                            >
                              <img
                                src={img}
                                alt={`Extra ${i}`}
                                className="w-full h-full object-cover"
                              />
                              <button
                                type="button"
                                onClick={() => removeGalleryImage(i)}
                                className="absolute top-1 right-1 p-1 bg-rose-600 text-white rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Coluna Direita: Dados e Pacotes Promocionais */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Título da Campanha
                      </label>
                      <input
                        type="text"
                        required
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Ex: CAMINHÃO FORD F4000 CUSTOMIZADO"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#10B981]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Regras do Sorteio / Detalhes
                      </label>
                      <textarea
                        rows={2}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Regras oficiais do sorteio pela Loteria Federal..."
                        className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#10B981]"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                          Prêmio Estimado (R$)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          required
                          value={prizeValue}
                          onChange={(e) => setPrizeValue(e.target.value)}
                          placeholder="500000"
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#10B981]"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                          Preço da Cota (R$)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          required
                          value={ticketPrice}
                          onChange={(e) => setTicketPrice(e.target.value)}
                          placeholder="0.06"
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#10B981]"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Total de Bilhetes da Rifa
                      </label>
                      <input
                        type="number"
                        required
                        value={totalTickets}
                        onChange={(e) => setTotalTickets(e.target.value)}
                        placeholder="1000000"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#10B981]"
                      />
                    </div>

                    {/* Pacotes Promocionais Configuráveis */}
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                          Pacotes Promocionais na Página de Compra
                        </label>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        {promoPackages.map((pkg) => (
                          <span
                            key={pkg}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 text-slate-800 text-xs font-black rounded-lg shadow-2xs"
                          >
                            <span>+{pkg}</span>
                            <button
                              type="button"
                              onClick={() => handleRemovePackage(pkg)}
                              className="text-slate-400 hover:text-rose-600 cursor-pointer"
                              title="Remover pacote"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </span>
                        ))}
                      </div>

                      <div className="flex items-center gap-2 pt-1">
                        <input
                          type="number"
                          value={newPackageInput}
                          onChange={(e) => setNewPackageInput(e.target.value)}
                          placeholder="Ex: 500"
                          className="w-28 px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#10B981]"
                        />
                        <button
                          type="button"
                          onClick={handleAddPackage}
                          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
                        >
                          + Adicionar Pacote
                        </button>
                      </div>
                      <p className="text-[11px] text-slate-400">
                        Estes botões aparecerão como atalhos para os compradores adicionarem cotas rapidamente no carrinho.
                      </p>
                    </div>

                    {/* Botão de Envio */}
                    <div className="pt-2">
                      <button
                        type="submit"
                        disabled={saveLoading}
                        className="w-full py-3 bg-[#10B981] hover:bg-[#0EA271] text-white font-black text-sm rounded-xl shadow-md transition-colors cursor-pointer disabled:opacity-50"
                      >
                        {saveLoading ? "Salvando Campanha..." : "Salvar Rifa"}
                      </button>
                    </div>
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
