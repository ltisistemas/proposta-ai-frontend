"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Search,
  FileText,
  Trash2,
  Copy,
  PlusCircle,
  Eye,
  Check,
  MessageCircle,
} from "lucide-react";
import { Badge, BadgeVariant } from "@/components/Common/Badge";
import { Button } from "@/components/Common/Button";
import { ConfirmModal } from "@/components/Common/ConfirmModal";
import { useToast } from "@/components/Common/Toast";
import { useAuthStore } from "@/lib/auth/useAuthStore";
import { UpgradeModal, UpgradeFeatureType } from "@/components/Billing/UpgradeModal";
import { WhatsAppModal } from "@/components/Proposta/WhatsAppModal";
import { DadosWhatsApp } from "@/lib/utils/whatsapp";

export interface PropostaItem {
  id: string;
  numero: string;
  cliente_nome: string;
  cliente_empresa?: string | null;
  total: number;
  status: "rascunho" | "enviada" | "aceita" | "recusada";
  criado_em: string | Date;
}

interface PropostasTableProps {
  propostas: PropostaItem[];
  isLoading?: boolean;
  onDelete?: (id: string) => void;
  onRefresh?: () => void;
}

function formatarMoeda(valor: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(valor);
}

function formatarData(data: string | Date): string {
  return new Date(data).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export const PropostasTable: React.FC<PropostasTableProps> = ({
  propostas,
  isLoading,
  onDelete,
}) => {
  const { user } = useAuthStore();
  const { addToast } = useToast();
  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState<string>("todos");
  const [copiadoId, setCopiadoId] = useState<string | null>(null);
  const [propostaParaExcluir, setPropostaParaExcluir] = useState<PropostaItem | null>(null);
  const [isExcluindo, setIsExcluindo] = useState(false);

  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [upgradeFeature, setUpgradeFeature] = useState<UpgradeFeatureType>("link");

  const [whatsAppData, setWhatsAppData] = useState<DadosWhatsApp | null>(null);
  const [whatsAppModalOpen, setWhatsAppModalOpen] = useState(false);

  const isPro = user?.plano === "pro";

  const statusOptions = [
    { value: "todos", label: "Todas" },
    { value: "rascunho", label: "Rascunhos" },
    { value: "enviada", label: "Enviadas" },
    { value: "aceita", label: "Aceitas" },
    { value: "recusada", label: "Recusadas" },
  ];

  const propostasFiltradas = propostas.filter((p) => {
    const matchesStatus =
      filtroStatus === "todos" || p.status === filtroStatus;
    const matchesBusca =
      p.cliente_nome.toLowerCase().includes(busca.toLowerCase()) ||
      p.numero.toLowerCase().includes(busca.toLowerCase()) ||
      (p.cliente_empresa &&
        p.cliente_empresa.toLowerCase().includes(busca.toLowerCase()));
    return matchesStatus && matchesBusca;
  });

  const handleCopyLink = (id: string) => {
    if (!isPro) {
      setUpgradeFeature("link");
      setUpgradeModalOpen(true);
      return;
    }

    const url = `${window.location.origin}/p/${id}`;
    navigator.clipboard.writeText(url);
    setCopiadoId(id);
    addToast({
      type: "success",
      title: "Link copiado!",
      message: "Link da proposta copiado para a área de transferência.",
    });
    setTimeout(() => setCopiadoId(null), 2500);
  };

  const handleOpenWhatsApp = (p: PropostaItem) => {
    if (!isPro) {
      setUpgradeFeature("link");
      setUpgradeModalOpen(true);
      return;
    }

    const publicUrl = `${window.location.origin}/p/${p.id}`;
    setWhatsAppData({
      numero: p.numero,
      clienteNome: p.cliente_nome,
      clienteEmpresa: p.cliente_empresa,
      empresaNome: user?.empresa_nome || user?.nome,
      empresaTelefone: user?.empresa_telefone,
      total: p.total,
      publicUrl,
    });
    setWhatsAppModalOpen(true);
  };

  return (
    <>
      <UpgradeModal
        isOpen={upgradeModalOpen}
        onClose={() => setUpgradeModalOpen(false)}
        feature={upgradeFeature}
      />

      {whatsAppData && (
        <WhatsAppModal
          isOpen={whatsAppModalOpen}
          onClose={() => {
            setWhatsAppModalOpen(false);
            setWhatsAppData(null);
          }}
          dados={whatsAppData}
        />
      )}

      <div className="bg-white dark:bg-[#282a36] border border-slate-200/90 dark:border-[#44475a] rounded-[4px] overflow-hidden shadow-2xs">
        {/* Table Header Controls */}
        <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-[#44475a] flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            {statusOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setFiltroStatus(opt.value)}
                className={`px-3 py-1.5 rounded-[4px] text-xs font-semibold transition-all cursor-pointer ${
                  filtroStatus === opt.value
                    ? "bg-blue-600 dark:bg-[#bd93f9] text-white dark:text-[#282a36] shadow-2xs"
                    : "bg-slate-100 dark:bg-[#343746] text-slate-600 dark:text-[#f8f8f2]/80 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/80 dark:hover:bg-[#44475a]"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 dark:text-[#94a3b8] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por cliente, número..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="w-full bg-slate-50 dark:bg-[#21222c] border border-slate-200 dark:border-[#44475a] rounded-[4px] pl-9 pr-3.5 py-2 text-xs font-medium text-slate-900 dark:text-[#f8f8f2] placeholder:text-slate-400 dark:placeholder:text-[#6272a4] focus:bg-white dark:focus:bg-[#21222c] focus:outline-none focus:border-blue-600 dark:focus:border-[#bd93f9] focus:ring-2 focus:ring-blue-600/20 dark:focus:ring-[#bd93f9]/20 transition-all"
            />
          </div>
        </div>

        {/* Table Content */}
        {isLoading ? (
          <div className="p-12 text-center text-slate-400 dark:text-[#cbd5e1] text-sm">
            Carregando propostas...
          </div>
        ) : propostasFiltradas.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 rounded-[4px] bg-blue-50 dark:bg-[#bd93f9]/20 border border-blue-100 dark:border-[#bd93f9]/30 text-blue-600 dark:text-[#bd93f9] flex items-center justify-center mx-auto mb-4">
              <FileText className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-slate-900 dark:text-[#f8f8f2]">Nenhuma proposta encontrada</h4>
            <p className="text-xs text-slate-500 dark:text-[#cbd5e1] mt-1 max-w-sm mx-auto">
              {busca || filtroStatus !== "todos"
                ? "Tente ajustar os filtros de busca para encontrar o que procura."
                : "Você ainda não criou nenhuma proposta comercial. Gere sua primeira proposta com IA!"}
            </p>
            {!busca && filtroStatus === "todos" && (
              <div className="mt-5">
                <Link href="/propostas/nova">
                  <Button variant="primary" size="sm" leftIcon={<PlusCircle className="w-4 h-4" />}>
                    Criar Nova Proposta
                  </Button>
                </Link>
              </div>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700 dark:text-[#f8f8f2]">
              <thead className="bg-slate-50/80 dark:bg-[#21222c] text-slate-500 dark:text-[#cbd5e1] uppercase font-bold border-b border-slate-200 dark:border-[#44475a] text-[11px] tracking-wider">
                <tr>
                  <th className="p-4 pl-6">Número</th>
                  <th className="p-4">Cliente / Empresa</th>
                  <th className="p-4">Data</th>
                  <th className="p-4 text-right">Valor Total</th>
                  <th className="p-4 text-center">Status</th>
                  <th className="p-4 pr-6 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-[#44475a]/70">
                {propostasFiltradas.map((p) => (
                  <tr
                    key={p.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-[#343746]/60 transition-colors group"
                  >
                    <td className="p-4 pl-6 font-mono font-bold text-blue-600 dark:text-[#8be9fd]">
                      <Link
                        href={`/propostas/${p.id}`}
                        className="hover:underline flex items-center gap-1.5"
                      >
                        <FileText className="w-3.5 h-3.5 text-slate-400 dark:text-[#94a3b8]" />
                        {p.numero}
                      </Link>
                    </td>
                    <td className="p-4">
                      <div className="font-bold text-slate-900 dark:text-[#f8f8f2]">{p.cliente_nome}</div>
                      {p.cliente_empresa && (
                        <div className="text-[11px] text-slate-500 dark:text-[#cbd5e1]">
                          {p.cliente_empresa}
                        </div>
                      )}
                    </td>
                    <td className="p-4 text-slate-500 dark:text-[#cbd5e1]">
                      {formatarData(p.criado_em)}
                    </td>
                    <td className="p-4 text-right font-bold text-slate-900 dark:text-[#f8f8f2]">
                      {formatarMoeda(p.total)}
                    </td>
                    <td className="p-4 text-center">
                      <Badge variant={p.status as BadgeVariant} size="sm" />
                    </td>
                    <td className="p-4 pr-6 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link href={`/propostas/${p.id}`}>
                          <button
                            title="Visualizar Proposta"
                            className="p-1.5 rounded-[4px] bg-slate-100 dark:bg-[#343746] hover:bg-slate-200 dark:hover:bg-[#44475a] text-slate-700 dark:text-[#f8f8f2] transition-colors cursor-pointer"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </Link>

                        <button
                          onClick={() => handleOpenWhatsApp(p)}
                          title="Enviar / Copiar Texto WhatsApp"
                          className="p-1.5 rounded-[4px] bg-emerald-50 dark:bg-[#50fa7b]/15 hover:bg-emerald-100 dark:hover:bg-[#50fa7b]/30 text-emerald-700 dark:text-[#50fa7b] transition-colors cursor-pointer"
                        >
                          <MessageCircle className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => handleCopyLink(p.id)}
                          title="Copiar Link Público"
                          className="p-1.5 rounded-[4px] bg-slate-100 dark:bg-[#343746] hover:bg-blue-100/70 dark:hover:bg-[#8be9fd]/20 text-slate-700 dark:text-[#f8f8f2] hover:text-blue-800 dark:hover:text-[#8be9fd] transition-colors cursor-pointer"
                        >
                          {copiadoId === p.id ? (
                            <Check className="w-4 h-4 text-emerald-600 dark:text-[#50fa7b]" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>

                        {onDelete && (
                          <button
                            onClick={() => setPropostaParaExcluir(p)}
                            title="Excluir"
                            className="p-1.5 rounded-[4px] bg-slate-100 dark:bg-[#343746] hover:bg-rose-100/70 dark:hover:bg-[#ff5555]/20 text-slate-700 dark:text-[#f8f8f2] hover:text-rose-800 dark:hover:text-[#ff5555] transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Confirmation Modal for Proposal Deletion */}
      <ConfirmModal
        isOpen={!!propostaParaExcluir}
        onClose={() => setPropostaParaExcluir(null)}
        title="Excluir proposta comercial?"
        description={
          propostaParaExcluir ? (
            <span>
              Tem certeza que deseja excluir a proposta{" "}
              <strong className="text-slate-900 dark:text-[#f8f8f2] font-semibold">{propostaParaExcluir.numero}</strong>{" "}
              do cliente <strong className="text-slate-900 dark:text-[#f8f8f2] font-semibold">{propostaParaExcluir.cliente_nome}</strong>?
              Esta ação removerá a proposta e não poderá ser desfeita.
            </span>
          ) : null
        }
        confirmLabel="Sim, excluir proposta"
        cancelLabel="Cancelar"
        variant="danger"
        isLoading={isExcluindo}
        onConfirm={async () => {
          if (propostaParaExcluir && onDelete) {
            try {
              setIsExcluindo(true);
              await onDelete(propostaParaExcluir.id);
            } finally {
              setIsExcluindo(false);
              setPropostaParaExcluir(null);
            }
          }
        }}
      />
    </>
  );
};
