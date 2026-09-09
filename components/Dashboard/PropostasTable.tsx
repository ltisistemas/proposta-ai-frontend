"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Search,
  FileText,
  ExternalLink,
  Trash2,
  Copy,
  PlusCircle,
  Eye,
  Check,
} from "lucide-react";
import { Badge, BadgeVariant } from "@/components/Common/Badge";
import { Button } from "@/components/Common/Button";
import { useToast } from "@/components/Common/Toast";

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
  const { addToast } = useToast();
  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState<string>("todos");
  const [copiadoId, setCopiadoId] = useState<string | null>(null);

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
    const url = `${window.location.origin}/propostas/${id}`;
    navigator.clipboard.writeText(url);
    setCopiadoId(id);
    addToast({
      type: "success",
      title: "Link copiado!",
      message: "Link da proposta copiado para a área de transferência.",
    });
    setTimeout(() => setCopiadoId(null), 2500);
  };

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-3xl overflow-hidden backdrop-blur-xl">
      {/* Table Header Controls */}
      <div className="p-5 sm:p-6 border-b border-slate-800 flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {statusOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setFiltroStatus(opt.value)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                filtroStatus === opt.value
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "bg-slate-800/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por cliente, número..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-9 pr-3.5 py-1.5 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Table Content */}
      {isLoading ? (
        <div className="p-12 text-center text-slate-400 text-sm">
          Carregando propostas...
        </div>
      ) : propostasFiltradas.length === 0 ? (
        <div className="p-12 text-center">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto mb-4">
            <FileText className="w-6 h-6" />
          </div>
          <h4 className="text-base font-bold text-white">Nenhuma proposta encontrada</h4>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            {busca || filtroStatus !== "todos"
              ? "Tente ajustar os filtros de busca para encontrar o que procura."
              : "Você ainda não criou nenhuma proposta comercial. Gere sua primeira proposta com IA!"}
          </p>
          {!busca && filtroStatus === "todos" && (
            <div className="mt-5">
              <Link href="/propostas/nova">
                <Button variant="gradient" size="sm" leftIcon={<PlusCircle className="w-4 h-4" />}>
                  Criar Nova Proposta
                </Button>
              </Link>
            </div>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/50 text-slate-400 uppercase font-semibold border-b border-slate-800">
              <tr>
                <th className="p-4 pl-6">Número</th>
                <th className="p-4">Cliente / Empresa</th>
                <th className="p-4">Data</th>
                <th className="p-4 text-right">Valor Total</th>
                <th className="p-4 text-center">Status</th>
                <th className="p-4 pr-6 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {propostasFiltradas.map((p) => (
                <tr
                  key={p.id}
                  className="hover:bg-slate-800/30 transition-colors group"
                >
                  <td className="p-4 pl-6 font-mono font-bold text-indigo-400">
                    <Link
                      href={`/propostas/${p.id}`}
                      className="hover:underline flex items-center gap-1.5"
                    >
                      <FileText className="w-3.5 h-3.5 text-slate-500" />
                      {p.numero}
                    </Link>
                  </td>
                  <td className="p-4">
                    <div className="font-bold text-white">{p.cliente_nome}</div>
                    {p.cliente_empresa && (
                      <div className="text-[11px] text-slate-400">
                        {p.cliente_empresa}
                      </div>
                    )}
                  </td>
                  <td className="p-4 text-slate-400">
                    {formatarData(p.criado_em)}
                  </td>
                  <td className="p-4 text-right font-bold text-white">
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
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </Link>

                      <button
                        onClick={() => handleCopyLink(p.id)}
                        title="Copiar Link"
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-indigo-300 transition-colors cursor-pointer"
                      >
                        {copiadoId === p.id ? (
                          <Check className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>

                      {onDelete && (
                        <button
                          onClick={() => {
                            if (confirm("Tem certeza que deseja excluir esta proposta?")) {
                              onDelete(p.id);
                            }
                          }}
                          title="Excluir"
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-900/40 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
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
  );
};
