"use client";

import { useState, useEffect, useRef } from "react";
import AdminLayout from "@/components/AdminLayout";
import DraggableTable from "@/components/DraggableTable";
import { useConfirm } from "@/components/ConfirmDialogProvider";
import {
  Trophy,
  UploadCloud,
  Trash2,
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  UserCheck,
  Search,
  Loader2,
  CheckCircle2,
  Sparkles,
  Ticket,
} from "lucide-react";

export default function AdminGanhadoresPage() {
  const { confirm, alert } = useConfirm();
  const [winners, setWinners] = useState<any[]>([]);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  // Form Fields
  const [selectedCampaignId, setSelectedCampaignId] = useState("");
  const [winningTicketNumber, setWinningTicketNumber] = useState("");
  const [winnerPhotoUrl, setWinnerPhotoUrl] = useState("");
  const [awardedAt, setAwardedAt] = useState(new Date().toISOString().substring(0, 10));

  // Validação e busca automática de bilhete
  const [isSearchingTicket, setIsSearchingTicket] = useState(false);
  const [ticketLookupResult, setTicketLookupResult] = useState<any>(null);

  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [wRes, cRes] = await Promise.all([
        fetch("/api/winners"),
        fetch("/api/campaigns"),
      ]);
      const wData = await wRes.json();
      const cData = await cRes.json();

      setWinners(wData.winners || []);
      setCampaigns(cData.campaigns || []);

      if (cData.campaigns?.length > 0 && !selectedCampaignId) {
        setSelectedCampaignId(cData.campaigns[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Busca automática do comprador ao digitar o número do bilhete
  useEffect(() => {
    if (!winningTicketNumber.trim() || !selectedCampaignId) {
      setTicketLookupResult(null);
      setIsSearchingTicket(false);
      return;
    }

    setIsSearchingTicket(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/admin/tickets/lookup?campaignId=${selectedCampaignId}&ticketNumber=${encodeURIComponent(
            winningTicketNumber.trim()
          )}`
        );
        const data = await res.json();
        setTicketLookupResult(data);
      } catch (err) {
        console.error("Erro na busca do bilhete:", err);
      } finally {
        setIsSearchingTicket(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [winningTicketNumber, selectedCampaignId]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingPhoto(true);
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
        setErrorMsg(data.error || "Falha ao enviar foto do ganhador.");
        return;
      }

      setWinnerPhotoUrl(data.url);
    } catch {
      setErrorMsg("Erro ao enviar foto do ganhador.");
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleRegisterWinner = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg(null);
    setErrorMsg(null);

    if (!ticketLookupResult?.found) {
      setErrorMsg("O bilhete informado não foi encontrado nesta campanha. Digite um bilhete válido.");
      return;
    }

    if (!ticketLookupResult?.isPaid) {
      setErrorMsg(
        "Atenção: O bilhete informado pertence a um pedido pendente (não pago). Somente bilhetes devidamente pagos podem ser homologados como ganhadores."
      );
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch("/api/winners", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaignId: selectedCampaignId,
          winningTicketNumber: winningTicketNumber.trim(),
          winnerPhotoUrl: winnerPhotoUrl || null,
          awardedAt: awardedAt ? new Date(awardedAt) : new Date(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || "Erro ao homologar ganhador.");
        setSubmitting(false);
        return;
      }

      setSuccessMsg(
        `Ganhador homologado com sucesso! Parabéns a ${ticketLookupResult.buyer?.fullName}. A campanha foi marcada como concluída.`
      );
      setWinningTicketNumber("");
      setWinnerPhotoUrl("");
      setTicketLookupResult(null);
      loadData();
    } catch {
      setErrorMsg("Erro de comunicação ao salvar ganhador.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteWinner = async (id: string) => {
    const confirmed = await confirm({
      title: "Remover Ganhador",
      message: "Deseja realmente remover este registro de ganhador oficial?",
      confirmLabel: "Sim, Remover Ganhador",
      cancelLabel: "Cancelar",
      variant: "danger",
    });

    if (!confirmed) return;

    try {
      const res = await fetch(`/api/winners?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        loadData();
        await alert({
          title: "Registro Removido",
          message: "O registro de ganhador foi removido com sucesso.",
          variant: "success",
        });
      } else {
        await alert({
          title: "Erro ao Remover",
          message: "Não foi possível remover o registro de ganhador.",
          variant: "danger",
        });
      }
    } catch (err) {
      console.error(err);
      await alert({
        title: "Erro de Comunicação",
        message: "Erro ao comunicar com o servidor.",
        variant: "danger",
      });
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Topo do Módulo */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
          <div>
            <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
              Sorteios Oficiais & Homologação de Ganhadores
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Validação automática do bilhete sorteado, identificação do comprador e registro de vencedores
            </p>
          </div>
        </div>

        {/* Formulário de Homologação em Card Branco */}
        <section className="bg-white dark:bg-[#111827] p-6 rounded-2xl shadow-2xs border border-slate-200/80 dark:border-slate-800">
          <div className="flex items-center gap-2 pb-4 border-b border-slate-100 mb-6">
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <Trophy className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-slate-900">
              Homologar Novo Ganhador
            </h3>
          </div>

          {successMsg && (
            <div className="mb-4 p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-xl flex items-center gap-2">
              <CheckCircle className="w-4 h-4 shrink-0 text-[#10B981]" />
              <span>{successMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div className="mb-4 p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleRegisterWinner} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Campanha */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Campanha Sorteada
                </label>
                <select
                  value={selectedCampaignId}
                  onChange={(e) => setSelectedCampaignId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#10B981]"
                >
                  {campaigns.map((camp) => (
                    <option key={camp.id} value={camp.id}>
                      {camp.title} ({camp.status === "ACTIVE" ? "Ativa" : "Concluída"})
                    </option>
                  ))}
                </select>
              </div>

              {/* Número do Bilhete */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Número do Bilhete Premiado
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: 0030627"
                  value={winningTicketNumber}
                  onChange={(e) => setWinningTicketNumber(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#10B981]"
                />
              </div>

              {/* Data do Sorteio */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Data da Premiação
                </label>
                <input
                  type="date"
                  required
                  value={awardedAt}
                  onChange={(e) => setAwardedAt(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#10B981]"
                />
              </div>
            </div>

            {/* Card de Busca e Validação Automática do Comprador */}
            {winningTicketNumber.trim() && (
              <div className="rounded-xl transition-all">
                {isSearchingTicket ? (
                  <div className="flex items-center gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-500 font-semibold">
                    <Loader2 className="w-4 h-4 animate-spin text-[#10B981]" />
                    <span>Buscando dados do comprador do bilhete {winningTicketNumber}...</span>
                  </div>
                ) : ticketLookupResult?.found && ticketLookupResult?.isPaid ? (
                  <div className="bg-emerald-50/80 border border-emerald-200 p-4 rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-[#10B981] shrink-0" />
                        <span className="text-xs font-bold text-emerald-950 uppercase tracking-wider">
                          Comprador Identificado • Bilhete Quitado
                        </span>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-[#10B981] text-white shadow-2xs">
                        ✓ Pronto para Homologar
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
                      <div>
                        <span className="text-slate-500 block text-[10px] uppercase font-bold">
                          Nome do Ganhador
                        </span>
                        <strong className="text-slate-900 text-sm">
                          {ticketLookupResult.buyer?.fullName}
                        </strong>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px] uppercase font-bold">
                          Telefone / WhatsApp
                        </span>
                        <span className="font-semibold text-slate-800">
                          {ticketLookupResult.buyer?.phone}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px] uppercase font-bold">
                          Pedido Vinculado
                        </span>
                        <span className="font-semibold text-slate-800">
                          #{ticketLookupResult.order?.id?.slice(0, 8)} • {ticketLookupResult.order?.quantity} cotas
                        </span>
                      </div>
                    </div>
                  </div>
                ) : ticketLookupResult?.found && !ticketLookupResult?.isPaid ? (
                  <div className="bg-amber-50 border border-amber-300 p-4 rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                        <span className="text-xs font-bold text-amber-900 uppercase tracking-wider">
                          Atenção: Pedido Pendente de Pagamento!
                        </span>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500 text-white shadow-2xs">
                        Bloqueado (Pendente)
                      </span>
                    </div>

                    <p className="text-xs text-amber-800 font-medium">
                      O bilhete <strong>{winningTicketNumber}</strong> pertence a{" "}
                      <strong>{ticketLookupResult.buyer?.fullName}</strong>, porém o pedido #
                      {ticketLookupResult.order?.id?.slice(0, 8)} está com status{" "}
                      <strong>PENDENTE</strong>. Somente bilhetes pagos podem ser homologados como
                      ganhadores. Realize a aprovação manual no módulo de Pedidos Pix caso o pagamento tenha sido efetuado.
                    </p>
                  </div>
                ) : (
                  <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-slate-400 shrink-0" />
                    <div>
                      <p className="text-xs font-bold text-slate-700">
                        Bilhete não localizado para esta campanha
                      </p>
                      <p className="text-[11px] text-slate-500">
                        Nenhum comprador foi encontrado para o número {winningTicketNumber}. Verifique se o número foi digitado corretamente ou se a cota já foi adquirida.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Foto do Ganhador */}
            <div className="pt-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Foto do Ganhador (Opcional)
              </label>

              <div className="flex items-center gap-3">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                />

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingPhoto}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl border border-slate-300 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <UploadCloud className="w-4 h-4 text-slate-600" />
                  <span>{uploadingPhoto ? "Enviando..." : "Selecionar Foto"}</span>
                </button>

                {winnerPhotoUrl && (
                  <div className="flex items-center gap-2">
                    <img
                      src={winnerPhotoUrl}
                      alt="Ganhador"
                      className="w-9 h-9 rounded-xl object-cover border border-slate-200"
                    />
                    <button
                      type="button"
                      onClick={() => setWinnerPhotoUrl("")}
                      className="text-rose-500 hover:text-rose-700 text-xs font-medium cursor-pointer"
                    >
                      Remover foto
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="text-xs text-slate-500">
                {!winningTicketNumber.trim() ? (
                  <span>Digite o número do bilhete para validar o comprador antes de homologar.</span>
                ) : ticketLookupResult?.found && ticketLookupResult?.isPaid ? (
                  <span className="text-[#10B981] font-bold flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5" /> Bilhete validado com sucesso para {ticketLookupResult.buyer?.fullName}.
                  </span>
                ) : ticketLookupResult?.found && !ticketLookupResult?.isPaid ? (
                  <span className="text-amber-700 font-semibold flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" /> Bilhete pertence a um pedido não pago.
                  </span>
                ) : (
                  <span className="text-slate-500 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" /> Bilhete não encontrado.
                  </span>
                )}
              </div>

              <button
                type="submit"
                disabled={submitting || !ticketLookupResult?.found || !ticketLookupResult?.isPaid}
                className="px-5 py-2.5 bg-[#10B981] hover:bg-[#0EA271] text-white font-black text-xs rounded-xl transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-sm self-end"
              >
                {submitting ? "Homologando..." : "Homologar Ganhador"}
              </button>
            </div>
          </form>
        </section>

        {/* Tabela de Ganhadores em Card Branco */}
        <section className="bg-white dark:bg-[#111827] p-6 rounded-2xl shadow-2xs border border-slate-200/80 dark:border-slate-800">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-4">
            <h3 className="text-base font-bold text-slate-900">
              Histórico Oficial de Ganhadores
            </h3>
            <span className="text-xs text-slate-500 font-semibold">
              {winners.length} ganhador(es) homologado(s)
            </span>
          </div>

          <DraggableTable>
            <table className="w-full text-left text-xs min-w-[650px]">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/75 dark:bg-[#0B1120]/80 text-slate-500 uppercase font-semibold text-[11px] tracking-wider">
                  <th className="py-3 px-3">Ganhador</th>
                  <th className="py-3 px-3">Campanha</th>
                  <th className="py-3 px-3 text-center">Bilhete Premiado</th>
                  <th className="py-3 px-3">Telefone</th>
                  <th className="py-3 px-3">Data</th>
                  <th className="py-3 px-3 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium text-slate-800 dark:text-slate-200">
                {winners.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      Nenhum ganhador homologado ainda.
                    </td>
                  </tr>
                ) : (
                  winners.map((w: any) => (
                    <tr key={w.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="py-3.5 px-3 font-bold text-slate-900 flex items-center gap-2.5">
                        {w.winnerPhotoUrl ? (
                          <img
                            src={w.winnerPhotoUrl}
                            alt={w.winnerName}
                            className="w-8 h-8 rounded-full object-cover shrink-0 border border-slate-200"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                            <Trophy className="w-4 h-4" />
                          </div>
                        )}
                        <span className="truncate max-w-[160px]">{w.winnerName}</span>
                      </td>
                      <td className="py-3.5 px-3 text-slate-600 max-w-[200px] truncate" title={w.campaignTitle}>
                        {w.campaignTitle}
                      </td>
                      <td className="py-3.5 px-3 text-center font-black text-[#10B981]">
                        #{w.winningTicketNumber}
                      </td>
                      <td className="py-3.5 px-3 text-slate-500 font-mono text-[11px]">
                        {w.maskedPhone}
                      </td>
                      <td className="py-3.5 px-3 text-slate-500">
                        {new Date(w.awardedAt).toLocaleDateString("pt-BR")}
                      </td>
                      <td className="py-3.5 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleDeleteWinner(w.id)}
                          className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Remover registro de ganhador"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </DraggableTable>
        </section>
      </div>
    </AdminLayout>
  );
}
