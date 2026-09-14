"use client";

import React, { useState } from "react";
import {
  Activity,
  Search,
  Filter,
  RefreshCw,
  Eye,
  ChevronLeft,
  ChevronRight,
  Zap,
  RotateCcw,
  AlertTriangle,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/Common/Button";
import { WebhookEventoRow } from "@/lib/db/webhooks";
import { formatDateTime } from "@/lib/utils/formatters";

interface WebhookLogsTableProps {
  eventos: WebhookEventoRow[];
  total: number;
  pagina: number;
  totalPaginas: number;
  metricas: {
    total: number;
    sucesso: number;
    downgrades: number;
    ativacoes: number;
    erros: number;
  };
  gatewayFiltro: string;
  setGatewayFiltro: (val: string) => void;
  statusFiltro: string;
  setStatusFiltro: (val: string) => void;
  eventoBusca: string;
  setEventoBusca: (val: string) => void;
  onPageChange: (pag: number) => void;
  onSelectEvento: (evento: WebhookEventoRow) => void;
  onRefresh: () => void;
  isLoading?: boolean;
}

export function WebhookLogsTable({
  eventos,
  total,
  pagina,
  totalPaginas,
  metricas,
  gatewayFiltro,
  setGatewayFiltro,
  statusFiltro,
  setStatusFiltro,
  eventoBusca,
  setEventoBusca,
  onPageChange,
  onSelectEvento,
  onRefresh,
  isLoading,
}: WebhookLogsTableProps) {
  const getAcaoBadge = (acao: string | null) => {
    switch (acao) {
      case "DOWNGRADE_TO_FREE":
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-200/80 dark:border-rose-900/50 px-2 py-0.5 rounded-md">
            🔻 Downgrade Free
          </span>
        );
      case "PLAN_ACTIVATED":
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-900/50 px-2 py-0.5 rounded-md">
            ✨ Ativação PRO
          </span>
        );
      case "DUPLICATE_SKIPPED":
        return (
          <span className="text-[10px] font-medium text-slate-500 dark:text-[#cbd5e1] bg-slate-100 dark:bg-[#343746] px-1.5 py-0.5 rounded-md">
            Duplicado
          </span>
        );
      case "UNMATCHED_USER":
        return (
          <span className="text-[10px] font-semibold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 px-1.5 py-0.5 rounded-md">
            Sem Vínculo
          </span>
        );
      default:
        return (
          <span className="text-[10px] text-slate-600 dark:text-[#cbd5e1] font-medium">
            {acao || "-"}
          </span>
        );
    }
  };

  const getStatusIcon = (status: string) => {
    if (status === "sucesso") {
      return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />;
    }
    if (status === "erro") {
      return <XCircle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />;
    }
    if (status === "aviso") {
      return <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />;
    }
    return <CheckCircle2 className="w-3.5 h-3.5 text-slate-400 dark:text-[#6272a4]" />;
  };

  return (
    <div className="space-y-4">
      {/* Mini Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 bg-white dark:bg-[#282a36] rounded-xl border border-slate-200/80 dark:border-[#44475a] shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 dark:text-[#6272a4] uppercase">
              Total Webhooks
            </span>
            <div className="text-xl font-bold text-slate-900 dark:text-[#f8f8f2] mt-0.5">
              {metricas.total}
            </div>
          </div>
          <Activity className="w-5 h-5 text-blue-600 dark:text-blue-400" />
        </div>

        <div className="p-3 bg-white dark:bg-[#282a36] rounded-xl border border-slate-200/80 dark:border-[#44475a] shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 dark:text-[#6272a4] uppercase">
              Downgrades Executados
            </span>
            <div className="text-xl font-bold text-rose-600 dark:text-rose-400 mt-0.5">
              {metricas.downgrades}
            </div>
          </div>
          <RotateCcw className="w-5 h-5 text-rose-600 dark:text-rose-400" />
        </div>

        <div className="p-3 bg-white dark:bg-[#282a36] rounded-xl border border-slate-200/80 dark:border-[#44475a] shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 dark:text-[#6272a4] uppercase">
              Ativações PRO
            </span>
            <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
              {metricas.ativacoes}
            </div>
          </div>
          <Zap className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
        </div>

        <div className="p-3 bg-white dark:bg-[#282a36] rounded-xl border border-slate-200/80 dark:border-[#44475a] shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 dark:text-[#6272a4] uppercase">
              Erros de Processamento
            </span>
            <div className="text-xl font-bold text-slate-800 dark:text-[#f8f8f2] mt-0.5">
              {metricas.erros}
            </div>
          </div>
          <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
        </div>
      </div>

      {/* Main Table Container */}
      <div className="bg-white dark:bg-[#282a36] rounded-2xl border border-slate-200/80 dark:border-[#44475a] shadow-xs overflow-hidden">
        {/* Search & Filters */}
        <div className="p-4 border-b border-slate-200/80 dark:border-[#44475a] flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between bg-slate-50/50 dark:bg-[#21222c]/50">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 dark:text-[#6272a4] absolute left-3.5 top-3" />
            <input
              type="text"
              value={eventoBusca}
              onChange={(e) => {
                setEventoBusca(e.target.value);
                onPageChange(1);
              }}
              placeholder="Buscar por tipo de evento (ex: SUBSCRIPTION_CANCELED)..."
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-white dark:bg-[#343746] border border-slate-200 dark:border-[#44475a] text-slate-900 dark:text-[#f8f8f2] placeholder:text-slate-400 dark:placeholder:text-[#6272a4] focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:focus:border-[#bd93f9]"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-[#cbd5e1]">
              <Filter className="w-3.5 h-3.5" />
              <span>Filtros:</span>
            </div>

            <select
              value={gatewayFiltro}
              onChange={(e) => {
                setGatewayFiltro(e.target.value);
                onPageChange(1);
              }}
              className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-[#44475a] bg-white dark:bg-[#343746] text-slate-700 dark:text-[#f8f8f2] font-medium focus:outline-hidden focus:border-blue-500 dark:focus:border-[#bd93f9] cursor-pointer"
            >
              <option value="">Gateway (Todos)</option>
              <option value="asaas">Asaas</option>
              <option value="abacate">Abacate Pay</option>
            </select>

            <select
              value={statusFiltro}
              onChange={(e) => {
                setStatusFiltro(e.target.value);
                onPageChange(1);
              }}
              className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-[#44475a] bg-white dark:bg-[#343746] text-slate-700 dark:text-[#f8f8f2] font-medium focus:outline-hidden focus:border-blue-500 dark:focus:border-[#bd93f9] cursor-pointer"
            >
              <option value="">Status (Todos)</option>
              <option value="sucesso">Sucesso</option>
              <option value="aviso">Aviso</option>
              <option value="erro">Erro</option>
              <option value="duplicado">Duplicado</option>
            </select>

            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              disabled={isLoading}
              title="Atualizar registros de webhook"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </div>

        {/* Logs Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200/80 dark:border-[#44475a] bg-slate-50/70 dark:bg-[#21222c]/70 text-[11px] font-bold text-slate-500 dark:text-[#cbd5e1] uppercase tracking-wider">
                <th className="py-3 px-4">Status & Evento</th>
                <th className="py-3 px-4">Gateway</th>
                <th className="py-3 px-4">Ação Executada</th>
                <th className="py-3 px-4">Usuário Identificado</th>
                <th className="py-3 px-4">Latência</th>
                <th className="py-3 px-4">Data e Hora</th>
                <th className="py-3 px-4 text-right">Inspecionar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-[#44475a]/50 text-xs">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 dark:text-[#6272a4]">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="w-6 h-6 border-2 border-blue-600 dark:border-[#bd93f9] border-t-transparent rounded-full animate-spin" />
                      <span>Carregando logs de webhooks...</span>
                    </div>
                  </td>
                </tr>
              ) : eventos.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500 dark:text-[#cbd5e1]">
                    Nenhum registro de webhook encontrado com os filtros selecionados.
                  </td>
                </tr>
              ) : (
                eventos.map((ev) => (
                  <tr
                    key={ev.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-[#343746]/50 transition-colors"
                  >
                    {/* Event Name */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(ev.status)}
                        <div>
                          <div className="font-bold text-slate-900 dark:text-[#f8f8f2] font-mono text-[11px]">
                            {ev.evento}
                          </div>
                          <div className="text-[10px] text-slate-400 dark:text-[#6272a4] font-mono truncate max-w-[140px]">
                            {ev.id}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Gateway */}
                    <td className="py-3 px-4">
                      <span className="text-[10px] font-extrabold uppercase bg-slate-100 dark:bg-[#343746] text-slate-700 dark:text-[#f8f8f2] px-2 py-0.5 rounded-md">
                        {ev.gateway}
                      </span>
                    </td>

                    {/* Action */}
                    <td className="py-3 px-4">{getAcaoBadge(ev.acao)}</td>

                    {/* User */}
                    <td className="py-3 px-4 text-slate-700 dark:text-[#f8f8f2]">
                      {ev.usuario_nome || ev.usuario_email ? (
                        <div className="truncate max-w-[160px]">
                          <span className="font-semibold block truncate">
                            {ev.usuario_nome || "Usuário"}
                          </span>
                          <span className="text-[11px] text-slate-500 dark:text-[#cbd5e1] block truncate">
                            {ev.usuario_email}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-400 dark:text-[#6272a4] text-[11px]">-</span>
                      )}
                    </td>

                    {/* Latency */}
                    <td className="py-3 px-4 text-slate-600 dark:text-[#cbd5e1] font-mono text-[11px]">
                      {ev.duracao_ms !== null ? `${ev.duracao_ms} ms` : "-"}
                    </td>

                    {/* Date */}
                    <td className="py-3 px-4 text-slate-500 dark:text-[#cbd5e1] text-[11px]">
                      {formatDateTime(ev.processado_em)}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onSelectEvento(ev)}
                        title="Ver payload JSON e detalhes"
                      >
                        <Eye className="w-3.5 h-3.5 mr-1" /> Detalhes
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-4 border-t border-slate-200/80 dark:border-[#44475a] flex items-center justify-between text-xs text-slate-500 dark:text-[#cbd5e1] bg-slate-50/50 dark:bg-[#21222c]/50">
          <div>
            Mostrando <strong>{eventos.length}</strong> de{" "}
            <strong>{total}</strong> eventos
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={pagina <= 1 || isLoading}
              onClick={() => onPageChange(pagina - 1)}
            >
              <ChevronLeft className="w-3.5 h-3.5" /> Anterior
            </Button>
            <span className="font-semibold text-slate-700 dark:text-[#f8f8f2]">
              {pagina} / {totalPaginas || 1}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={pagina >= totalPaginas || isLoading}
              onClick={() => onPageChange(pagina + 1)}
            >
              Próximo <ChevronRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
