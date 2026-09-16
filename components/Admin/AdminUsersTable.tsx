"use client";

import React, { useState } from "react";
import {
  Search,
  Filter,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Zap,
  Calendar,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  User as UserIcon,
  Building,
  RotateCcw,
} from "lucide-react";
import { Badge } from "@/components/Common/Badge";
import { Button } from "@/components/Common/Button";
import { UserRow } from "@/lib/db/users";
import { formatDate } from "@/lib/utils/formatters";

interface AdminUsersTableProps {
  usuarios: UserRow[];
  total: number;
  pagina: number;
  totalPaginas: number;
  busca: string;
  setBusca: (val: string) => void;
  planoFiltro: string;
  setPlanoFiltro: (val: string) => void;
  roleFiltro: string;
  setRoleFiltro: (val: string) => void;
  statusFiltro: string;
  setStatusFiltro: (val: string) => void;
  onPageChange: (pag: number) => void;
  onGrantPro: (user: UserRow) => void;
  onAdjustDueDate: (user: UserRow) => void;
  onToggleSuspend: (user: UserRow) => void;
  isLoading?: boolean;
}

export function AdminUsersTable({
  usuarios,
  total,
  pagina,
  totalPaginas,
  busca,
  setBusca,
  planoFiltro,
  setPlanoFiltro,
  roleFiltro,
  setRoleFiltro,
  statusFiltro,
  setStatusFiltro,
  onPageChange,
  onGrantPro,
  onAdjustDueDate,
  onToggleSuspend,
  isLoading,
}: AdminUsersTableProps) {
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  const formatConcessao = (u: UserRow) => {
    if (u.plano !== "pro") return null;
    if (u.pro_tipo_concessao === "manual_vitalicio") {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-950/40 px-1.5 py-0.5 rounded-md">
          <Sparkles className="w-2.5 h-2.5 text-amber-600 dark:text-amber-400" /> Vitalício
        </span>
      );
    }
    if (u.pro_tipo_concessao === "manual_temporario") {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-blue-700 dark:text-blue-400 bg-blue-100 dark:bg-blue-950/40 px-1.5 py-0.5 rounded-md">
          Concessão
        </span>
      );
    }
    if (u.asaas_subscription_id) {
      return (
        <span className="text-[10px] font-medium text-slate-500 dark:text-[#cbd5e1]">
          Asaas Recorrente
        </span>
      );
    }
    return null;
  };

  return (
    <div className="bg-white dark:bg-[#282a36] rounded-2xl border border-slate-200/80 dark:border-[#44475a] shadow-xs overflow-hidden">
      {/* Search & Filter Header Bar */}
      <div className="p-4 border-b border-slate-200/80 dark:border-[#44475a] flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between bg-slate-50/50 dark:bg-[#21222c]/50">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 dark:text-[#6272a4] absolute left-3.5 top-3" />
          <input
            type="text"
            value={busca}
            onChange={(e) => {
              setBusca(e.target.value);
              onPageChange(1);
            }}
            placeholder="Buscar por nome, e-mail ou empresa..."
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-white dark:bg-[#343746] border border-slate-200 dark:border-[#44475a] text-slate-900 dark:text-[#f8f8f2] placeholder:text-slate-400 dark:placeholder:text-[#6272a4] focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:focus:border-[#bd93f9]"
          />
          {busca && (
            <button
              onClick={() => {
                setBusca("");
                onPageChange(1);
              }}
              className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-slate-600 dark:text-[#6272a4] dark:hover:text-[#f8f8f2]"
            >
              ×
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-[#cbd5e1]">
            <Filter className="w-3.5 h-3.5" />
            <span>Filtros:</span>
          </div>

          {/* Role Filter */}
          <select
            value={roleFiltro}
            onChange={(e) => {
              setRoleFiltro(e.target.value);
              onPageChange(1);
            }}
            className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-[#44475a] bg-white dark:bg-[#343746] text-slate-700 dark:text-[#f8f8f2] font-medium focus:outline-hidden focus:border-blue-500 dark:focus:border-[#bd93f9] cursor-pointer"
          >
            <option value="">Perfil (Todos)</option>
            <option value="admin">Admin</option>
            <option value="cliente">Cliente</option>
          </select>

          {/* Plano Filter */}
          <select
            value={planoFiltro}
            onChange={(e) => {
              setPlanoFiltro(e.target.value);
              onPageChange(1);
            }}
            className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-[#44475a] bg-white dark:bg-[#343746] text-slate-700 dark:text-[#f8f8f2] font-medium focus:outline-hidden focus:border-blue-500 dark:focus:border-[#bd93f9] cursor-pointer"
          >
            <option value="">Plano (Todos)</option>
            <option value="pro">Pro</option>
            <option value="free">Free</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFiltro}
            onChange={(e) => {
              setStatusFiltro(e.target.value);
              onPageChange(1);
            }}
            className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-[#44475a] bg-white dark:bg-[#343746] text-slate-700 dark:text-[#f8f8f2] font-medium focus:outline-hidden focus:border-blue-500 dark:focus:border-[#bd93f9] cursor-pointer"
          >
            <option value="">Status (Todos)</option>
            <option value="ativo">Ativos</option>
            <option value="suspenso">Suspensos</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200/80 dark:border-[#44475a] bg-slate-50/70 dark:bg-[#21222c]/70 text-[11px] font-bold text-slate-500 dark:text-[#cbd5e1] uppercase tracking-wider">
              <th className="py-3 px-4">Usuário</th>
              <th className="py-3 px-4">Empresa</th>
              <th className="py-3 px-4">Perfil</th>
              <th className="py-3 px-4">Plano & Concessão</th>
              <th className="py-3 px-4">Próx. Cobrança</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">Cadastro</th>
              <th className="py-3 px-4 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-[#44475a]/50 text-xs">
            {isLoading ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-slate-400 dark:text-[#6272a4]">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <div className="w-6 h-6 border-2 border-blue-600 dark:border-[#bd93f9] border-t-transparent rounded-full animate-spin" />
                    <span>Carregando usuários...</span>
                  </div>
                </td>
              </tr>
            ) : usuarios.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-slate-500 dark:text-[#cbd5e1]">
                  Nenhum usuário encontrado com os filtros selecionados.
                </td>
              </tr>
            ) : (
              usuarios.map((u) => {
                const isSuspended = !!u.suspenso;
                const isAdmin = u.role === "admin";
                const isPro = u.plano === "pro";

                return (
                  <tr
                    key={u.id}
                    className={`hover:bg-slate-50/80 dark:hover:bg-[#343746]/50 transition-colors ${
                      isSuspended ? "bg-rose-50/30 dark:bg-rose-950/20 opacity-80" : ""
                    }`}
                  >
                    {/* User info */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                            isAdmin
                              ? "bg-indigo-100 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-900/50"
                              : "bg-slate-100 dark:bg-[#343746] text-slate-700 dark:text-[#f8f8f2] border border-slate-200 dark:border-[#44475a]"
                          }`}
                        >
                          {u.nome ? u.nome.charAt(0).toUpperCase() : <UserIcon className="w-4 h-4" />}
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-slate-900 dark:text-[#f8f8f2] truncate max-w-[160px]">
                            {u.nome}
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-[#cbd5e1] truncate max-w-[160px]">
                            {u.email}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Company */}
                    <td className="py-3 px-4 text-slate-600 dark:text-[#cbd5e1]">
                      {u.empresa_nome ? (
                        <div className="flex items-center gap-1.5 truncate max-w-[140px]">
                          <Building className="w-3.5 h-3.5 text-slate-400 dark:text-[#6272a4] shrink-0" />
                          <span className="truncate">{u.empresa_nome}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400 dark:text-[#6272a4] text-[11px]">-</span>
                      )}
                    </td>

                    {/* Role */}
                    <td className="py-3 px-4">
                      {isAdmin ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900/50 px-2 py-0.5 rounded-full">
                          <Shield className="w-3 h-3 text-indigo-600 dark:text-indigo-400" /> Admin
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-600 dark:text-[#cbd5e1] bg-slate-100 dark:bg-[#343746] px-2 py-0.5 rounded-full">
                          Cliente
                        </span>
                      )}
                    </td>

                    {/* Plan & Grant */}
                    <td className="py-3 px-4">
                      <div className="flex flex-col gap-1 items-start">
                        <div className="flex items-center gap-1.5">
                          <Badge variant={isPro ? "pro" : "free"} size="sm">
                            {isPro ? "PRO" : "FREE"}
                          </Badge>
                          {isPro && u.ciclo_plano && (
                            <span className="text-[10px] font-bold text-blue-700 dark:text-[#bd93f9] bg-blue-50 dark:bg-[#bd93f9]/20 px-1.5 py-0.5 rounded border border-blue-200/60 dark:border-[#bd93f9]/30">
                              {u.ciclo_plano === "anual" ? "Anual" : "Mensal"}
                            </span>
                          )}
                        </div>
                        {formatConcessao(u)}
                        {u.utm_source && (
                          <span
                            className="inline-flex items-center gap-1 text-[10px] font-semibold text-indigo-700 dark:text-[#8be9fd] bg-indigo-50 dark:bg-indigo-950/40 px-1.5 py-0.5 rounded border border-indigo-200/60 dark:border-indigo-900/50"
                            title={`Campanha: ${u.utm_campaign || "-"} | Medium: ${u.utm_medium || "-"} | Term: ${u.utm_term || "-"}`}
                          >
                            🎯 {u.utm_source}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Due Date */}
                    <td className="py-3 px-4 text-slate-600 dark:text-[#cbd5e1] font-mono text-[11px]">
                      {u.data_proxima_cobranca ? (
                        formatDate(u.data_proxima_cobranca)
                      ) : u.pro_tipo_concessao === "manual_vitalicio" ? (
                        <span className="text-amber-600 dark:text-amber-400 font-bold">Vitalício</span>
                      ) : (
                        <span className="text-slate-400 dark:text-[#6272a4]">-</span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4">
                      {isSuspended ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 px-2 py-0.5 rounded-full">
                          <ShieldAlert className="w-3 h-3 text-rose-600 dark:text-rose-400" /> Suspenso
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 px-2 py-0.5 rounded-full">
                          <ShieldCheck className="w-3 h-3 text-emerald-600 dark:text-emerald-400" /> Ativo
                        </span>
                      )}
                    </td>

                    {/* Created at */}
                    <td className="py-3 px-4 text-slate-500 dark:text-[#cbd5e1] text-[11px]">
                      {formatDate(u.criado_em)}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => onGrantPro(u)}
                          title="Conceder ou alterar plano PRO"
                          className="p-1.5 rounded-lg text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 hover:text-amber-800 dark:hover:text-amber-300 transition-colors cursor-pointer"
                        >
                          <Sparkles className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onAdjustDueDate(u)}
                          title="Modificar data de vencimento/cobrança"
                          className="p-1.5 rounded-lg text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 hover:text-blue-800 dark:hover:text-blue-300 transition-colors cursor-pointer"
                        >
                          <Calendar className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onToggleSuspend(u)}
                          title={isSuspended ? "Reativar conta" : "Suspender conta"}
                          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                            isSuspended
                              ? "text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                              : "text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                          }`}
                        >
                          {isSuspended ? (
                            <ShieldCheck className="w-4 h-4" />
                          ) : (
                            <ShieldAlert className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="p-4 border-t border-slate-200/80 dark:border-[#44475a] flex items-center justify-between text-xs text-slate-500 dark:text-[#cbd5e1] bg-slate-50/50 dark:bg-[#21222c]/50">
        <div>
          Mostrando <strong>{usuarios.length}</strong> de{" "}
          <strong>{total}</strong> usuários
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
  );
}
