"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  DollarSign,
  TrendingUp,
  Users,
  UserCheck,
  Zap,
  ShieldAlert,
  Shield,
  FileText,
  RefreshCw,
  UserPlus,
  ArrowUpRight,
  ExternalLink,
  Calendar,
  CreditCard,
  Layers,
  Activity,
  UserX,
  Plus,
} from "lucide-react";
import { Button } from "@/components/Common/Button";
import { Badge } from "@/components/Common/Badge";
import { useToast } from "@/components/Common/Toast";
import { useAuthStore } from "@/lib/auth/useAuthStore";
import { CreateUserModal } from "@/components/Admin/CreateUserModal";
import { GrantProModal } from "@/components/Admin/GrantProModal";
import { AdjustDueDateModal } from "@/components/Admin/AdjustDueDateModal";
import { ConfirmSuspendModal } from "@/components/Admin/ConfirmSuspendModal";
import { UserRow } from "@/lib/db/users";
import { MetricasAdminDashboard } from "@/lib/db/admin-dashboard";

function formatarMoeda(valor: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(valor || 0);
}

function formatarDataCurta(data: Date | string | null | undefined): string {
  if (!data) return "—";
  try {
    const d = new Date(data);
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(d);
  } catch {
    return String(data);
  }
}

export function AdminExecutiveDashboard() {
  const { token } = useAuthStore();
  const { addToast } = useToast();

  const [metricas, setMetricas] = useState<MetricasAdminDashboard | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Modals state
  const [isCreateUserOpen, setIsCreateUserOpen] = useState(false);
  const [selectedUserForPro, setSelectedUserForPro] = useState<UserRow | null>(null);
  const [selectedUserForDueDate, setSelectedUserForDueDate] = useState<UserRow | null>(null);
  const [selectedUserForSuspend, setSelectedUserForSuspend] = useState<UserRow | null>(null);

  const carregarDados = useCallback(async (isManual: boolean = false) => {
    if (!token) return;
    setIsLoading(true);

    try {
      const res = await fetch("/api/admin/dashboard/stats", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      if (data.sucesso && data.metricas) {
        setMetricas(data.metricas);
        if (isManual) {
          addToast({
            type: "success",
            title: "Métricas atualizadas!",
            message: "Os dados do painel foram recarregados com sucesso.",
          });
        }
      } else {
        addToast({
          type: "error",
          title: "Erro ao carregar dados",
          message: data.erro || "Não foi possível carregar as métricas administrativas.",
        });
      }
    } catch (err: any) {
      console.error("Erro ao buscar métricas admin:", err);
      addToast({
        type: "error",
        title: "Erro de conexão",
        message: "Falha na comunicação com o servidor.",
      });
    } finally {
      setIsLoading(false);
    }
  }, [token, addToast]);

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  const financeiro = metricas?.financeiro || {
    totalHoje: 0,
    totalMes: 0,
    totalHistorico: 0,
    mrrEstimado: 0,
    transacoesHojeCount: 0,
    transacoesMesCount: 0,
    ticketMedio: 0,
  };

  const usuarios = metricas?.usuarios || {
    total: 0,
    ativos: 0,
    suspensos: 0,
    pro: 0,
    proAsaas: 0,
    proCortesia: 0,
    free: 0,
    admins: 0,
    novosHoje: 0,
    novosMes: 0,
    taxaConversaoPro: 0,
  };

  const plataforma = metricas?.plataforma || {
    totalPropostas: 0,
    propostasAceitas: 0,
    volumeTotalPipeline: 0,
    volumeTotalFechado: 0,
    taxaConversaoGlobal: 0,
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-4">
      {/* 1. Cockpit Header (Ultra-Compact) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-[#21222c] px-4 py-3 rounded-2xl border border-slate-200/90 dark:border-[#44475a] shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-indigo-600 dark:bg-[#bd93f9] text-white dark:text-[#282a36] shadow-xs">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-black text-slate-900 dark:text-[#f8f8f2] tracking-tight">
                Cockpit Gerencial
              </h1>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-[#50fa7b]">
                <Activity className="w-2.5 h-2.5 animate-pulse" /> Ao Vivo
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-[#cbd5e1]">
              Visão executiva em tempo real de receita, usuários e atividade
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => carregarDados(true)}
            title="Atualizar métricas agora"
            disabled={isLoading}
            className="font-bold border-slate-200 dark:border-[#44475a] text-slate-700 dark:text-[#f8f8f2] hover:bg-slate-100 dark:hover:bg-[#343746] text-xs py-1.5 px-3 flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-blue-600 dark:text-[#8be9fd]" : ""}`} />
            <span>Atualizar</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsCreateUserOpen(true)}
            className="font-bold border-indigo-200 dark:border-[#6272a4] text-indigo-700 dark:text-[#8be9fd] hover:bg-indigo-50 dark:hover:bg-[#343746] text-xs py-1.5 px-3"
          >
            <Plus className="w-3.5 h-3.5 mr-1" /> Novo Usuário
          </Button>

          <Link href="/admin">
            <Button
              variant="primary"
              size="sm"
              className="font-bold bg-blue-600 hover:bg-blue-700 dark:bg-[#bd93f9] dark:hover:bg-[#a77bf3] dark:text-[#282a36] text-xs py-1.5 px-3 shadow-xs"
            >
              <Users className="w-3.5 h-3.5 mr-1" /> Painel Geral
            </Button>
          </Link>
        </div>
      </div>

      {/* 2. Primary Financial & Health Cards (4 Columns - High Density) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Card 1: Faturamento Hoje */}
        <div className="p-3.5 rounded-2xl bg-white dark:bg-[#282a36] border border-slate-200/90 dark:border-[#44475a] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-bold text-slate-500 dark:text-[#cbd5e1] uppercase tracking-wider">
              Faturamento Hoje
            </span>
            <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-[#50fa7b]">
              <TrendingUp className="w-3.5 h-3.5" />
            </div>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-[#f8f8f2] tracking-tight">
              {isLoading ? <div className="h-6 w-20 bg-slate-100 dark:bg-[#343746] animate-pulse rounded" /> : formatarMoeda(financeiro.totalHoje)}
            </div>
            <div className="text-[10px] text-slate-500 dark:text-[#cbd5e1] mt-0.5 flex items-center gap-1">
              <span className="font-bold text-emerald-600 dark:text-[#50fa7b]">{financeiro.transacoesHojeCount} pagamentos</span> hoje
            </div>
          </div>
        </div>

        {/* Card 2: Faturamento Mês */}
        <div className="p-3.5 rounded-2xl bg-white dark:bg-[#282a36] border border-slate-200/90 dark:border-[#44475a] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-bold text-slate-500 dark:text-[#cbd5e1] uppercase tracking-wider">
              Faturamento no Mês
            </span>
            <div className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-[#8be9fd]">
              <Calendar className="w-3.5 h-3.5" />
            </div>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-[#f8f8f2] tracking-tight">
              {isLoading ? <div className="h-6 w-20 bg-slate-100 dark:bg-[#343746] animate-pulse rounded" /> : formatarMoeda(financeiro.totalMes)}
            </div>
            <div className="text-[10px] text-slate-500 dark:text-[#cbd5e1] mt-0.5 flex items-center gap-1">
              <span className="font-bold text-blue-600 dark:text-[#8be9fd]">{financeiro.transacoesMesCount} cobranças</span> no mês
            </div>
          </div>
        </div>

        {/* Card 3: MRR Recorrente */}
        <div className="p-3.5 rounded-2xl bg-white dark:bg-[#282a36] border border-slate-200/90 dark:border-[#44475a] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-bold text-slate-500 dark:text-[#cbd5e1] uppercase tracking-wider">
              MRR Estimado
            </span>
            <div className="p-1.5 rounded-lg bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-[#bd93f9]">
              <Zap className="w-3.5 h-3.5" />
            </div>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-[#f8f8f2] tracking-tight">
              {isLoading ? <div className="h-6 w-20 bg-slate-100 dark:bg-[#343746] animate-pulse rounded" /> : formatarMoeda(financeiro.mrrEstimado)}
            </div>
            <div className="text-[10px] text-slate-500 dark:text-[#cbd5e1] mt-0.5">
              Receita mensal de {usuarios.pro} assinantes PRO
            </div>
          </div>
        </div>

        {/* Card 4: Usuários Ativos & Base */}
        <div className="p-3.5 rounded-2xl bg-white dark:bg-[#282a36] border border-slate-200/90 dark:border-[#44475a] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-bold text-slate-500 dark:text-[#cbd5e1] uppercase tracking-wider">
              Usuários Ativos
            </span>
            <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-[#50fa7b]">
              <UserCheck className="w-3.5 h-3.5" />
            </div>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-[#f8f8f2] tracking-tight">
              {isLoading ? <div className="h-6 w-16 bg-slate-100 dark:bg-[#343746] animate-pulse rounded" /> : `${usuarios.ativos} / ${usuarios.total}`}
            </div>
            <div className="text-[10px] text-slate-500 dark:text-[#cbd5e1] mt-0.5">
              {usuarios.total > 0 ? `${((usuarios.ativos / usuarios.total) * 100).toFixed(0)}% da base ativa` : "Base vazia"}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Consolidated Operational Mini-Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
        <div className="p-2.5 rounded-xl bg-white dark:bg-[#282a36] border border-slate-200/80 dark:border-[#44475a] flex items-center justify-between">
          <div>
            <div className="text-[10px] text-slate-500 dark:text-[#cbd5e1] font-semibold uppercase">Assinantes PRO</div>
            <div className="text-base font-black text-slate-900 dark:text-[#f8f8f2]">{usuarios.pro}</div>
          </div>
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-[#ffb86c]">
            {usuarios.proAsaas} pag
          </span>
        </div>

        <div className="p-2.5 rounded-xl bg-white dark:bg-[#282a36] border border-slate-200/80 dark:border-[#44475a] flex items-center justify-between">
          <div>
            <div className="text-[10px] text-slate-500 dark:text-[#cbd5e1] font-semibold uppercase">Usuários Free</div>
            <div className="text-base font-black text-slate-900 dark:text-[#f8f8f2]">{usuarios.free}</div>
          </div>
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-[#8be9fd]">
            {usuarios.taxaConversaoPro}% conv
          </span>
        </div>

        <div className="p-2.5 rounded-xl bg-white dark:bg-[#282a36] border border-slate-200/80 dark:border-[#44475a] flex items-center justify-between">
          <div>
            <div className="text-[10px] text-slate-500 dark:text-[#cbd5e1] font-semibold uppercase">Contas Suspensas</div>
            <div className="text-base font-black text-slate-900 dark:text-[#f8f8f2]">{usuarios.suspensos}</div>
          </div>
          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${usuarios.suspensos > 0 ? "bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-[#ff5555]" : "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-[#50fa7b]"}`}>
            {usuarios.suspensos > 0 ? "Bloqueadas" : "Ok"}
          </span>
        </div>

        <div className="p-2.5 rounded-xl bg-white dark:bg-[#282a36] border border-slate-200/80 dark:border-[#44475a] flex items-center justify-between">
          <div>
            <div className="text-[10px] text-slate-500 dark:text-[#cbd5e1] font-semibold uppercase">Novos no Mês</div>
            <div className="text-base font-black text-slate-900 dark:text-[#f8f8f2]">+{usuarios.novosMes}</div>
          </div>
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-[#bd93f9]">
            +{usuarios.novosHoje} hoje
          </span>
        </div>

        <div className="col-span-2 sm:col-span-1 p-2.5 rounded-xl bg-white dark:bg-[#282a36] border border-slate-200/80 dark:border-[#44475a] flex items-center justify-between">
          <div>
            <div className="text-[10px] text-slate-500 dark:text-[#cbd5e1] font-semibold uppercase">Propostas no App</div>
            <div className="text-base font-black text-slate-900 dark:text-[#f8f8f2]">{plataforma.totalPropostas}</div>
          </div>
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-[#bd93f9]">
            {formatarMoeda(plataforma.volumeTotalPipeline)}
          </span>
        </div>
      </div>

      {/* 4. High-Density Side-by-Side Activity Split (Single-Screen Fit) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
        {/* Left Widget: Últimos Pagamentos */}
        <div className="bg-white dark:bg-[#282a36] rounded-2xl border border-slate-200/90 dark:border-[#44475a] p-3.5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-[#44475a]/60 mb-2">
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-emerald-600 dark:text-[#50fa7b]" />
              <h2 className="text-xs font-bold text-slate-900 dark:text-[#f8f8f2] uppercase tracking-wider">
                Últimos Pagamentos Confirmados
              </h2>
            </div>
            <span className="text-[11px] text-slate-500 dark:text-[#cbd5e1]">
              Total: {formatarMoeda(financeiro.totalHistorico)}
            </span>
          </div>

          <div className="space-y-1.5 overflow-hidden">
            {isLoading ? (
              <div className="py-6 text-center text-xs text-slate-400 dark:text-[#6272a4]">
                <RefreshCw className="w-4 h-4 animate-spin mx-auto mb-1 text-blue-600 dark:text-[#8be9fd]" />
                Carregando transações...
              </div>
            ) : !metricas?.ultimosPagamentos || metricas.ultimosPagamentos.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400 dark:text-[#6272a4]">
                Nenhum pagamento registrado ainda.
              </div>
            ) : (
              metricas.ultimosPagamentos.slice(0, 5).map((pag) => (
                <div
                  key={pag.id}
                  className="flex items-center justify-between p-2 rounded-xl bg-slate-50/70 dark:bg-[#21222c]/60 hover:bg-slate-100/80 dark:hover:bg-[#343746]/60 transition-colors text-xs"
                >
                  <div className="min-w-0 pr-2">
                    <div className="font-bold text-slate-900 dark:text-[#f8f8f2] truncate">
                      {pag.usuarioNome}
                    </div>
                    <div className="text-[10px] text-slate-500 dark:text-[#cbd5e1] truncate">
                      {pag.usuarioEmail} • {formatarDataCurta(pag.pagoEm || pag.criadoEm)}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="font-black text-emerald-600 dark:text-[#50fa7b]">
                      {formatarMoeda(pag.valor)}
                    </span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-[#50fa7b]">
                      {pag.status?.toUpperCase()}
                    </span>
                    {pag.invoiceUrl && (
                      <a
                        href={pag.invoiceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Ver fatura no gateway"
                        className="p-1 rounded-md text-blue-600 dark:text-[#8be9fd] hover:bg-blue-50 dark:hover:bg-[#343746]"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-[#44475a]/60 mt-2 flex justify-between items-center text-[11px]">
            <span className="text-slate-500 dark:text-[#cbd5e1]">Assinatura Pro: R$ 45,90/mês</span>
            <Link href="/admin" className="font-bold text-blue-600 dark:text-[#8be9fd] hover:underline flex items-center gap-0.5">
              Ver todos <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* Right Widget: Novos Usuários & Ações Rápidas */}
        <div className="bg-white dark:bg-[#282a36] rounded-2xl border border-slate-200/90 dark:border-[#44475a] p-3.5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-[#44475a]/60 mb-2">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-600 dark:text-[#8be9fd]" />
              <h2 className="text-xs font-bold text-slate-900 dark:text-[#f8f8f2] uppercase tracking-wider">
                Novos Usuários & Ações Rápidas
              </h2>
            </div>
            <span className="text-[11px] text-slate-500 dark:text-[#cbd5e1]">
              Base: {usuarios.total} usuários
            </span>
          </div>

          <div className="space-y-1.5 overflow-hidden">
            {isLoading ? (
              <div className="py-6 text-center text-xs text-slate-400 dark:text-[#6272a4]">
                <RefreshCw className="w-4 h-4 animate-spin mx-auto mb-1 text-blue-600 dark:text-[#8be9fd]" />
                Carregando usuários...
              </div>
            ) : !metricas?.ultimosUsuarios || metricas.ultimosUsuarios.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400 dark:text-[#6272a4]">
                Nenhum usuário cadastrado.
              </div>
            ) : (
              metricas.ultimosUsuarios.slice(0, 5).map((u) => (
                <div
                  key={u.id}
                  className="flex items-center justify-between p-2 rounded-xl bg-slate-50/70 dark:bg-[#21222c]/60 hover:bg-slate-100/80 dark:hover:bg-[#343746]/60 transition-colors text-xs"
                >
                  <div className="min-w-0 pr-2">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-slate-900 dark:text-[#f8f8f2] truncate">{u.nome}</span>
                      <Badge variant={u.plano === "pro" ? "pro" : "free"} size="sm">
                        {u.plano?.toUpperCase()}
                      </Badge>
                      {u.suspenso && (
                        <span className="px-1 py-0.2 rounded text-[9px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-[#ff5555]">
                          SUSPENSO
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-slate-500 dark:text-[#cbd5e1] truncate">
                      {u.email} • {formatarDataCurta(u.criadoEm)}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => setSelectedUserForPro(u as any)}
                      title="Conceder ou alterar plano PRO"
                      className="px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-[#ffb86c] hover:bg-amber-100 font-bold text-[10px] transition-colors cursor-pointer"
                    >
                      PRO
                    </button>
                    <button
                      onClick={() => setSelectedUserForDueDate(u as any)}
                      title="Ajustar data de vencimento"
                      className="px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-[#8be9fd] hover:bg-blue-100 font-bold text-[10px] transition-colors cursor-pointer"
                    >
                      Data
                    </button>
                    <button
                      onClick={() => setSelectedUserForSuspend(u as any)}
                      title={u.suspenso ? "Reativar usuário" : "Suspender usuário"}
                      className={`px-2 py-0.5 rounded-md font-bold text-[10px] transition-colors cursor-pointer ${
                        u.suspenso
                          ? "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-[#50fa7b] hover:bg-emerald-100"
                          : "bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-[#ff5555] hover:bg-rose-100"
                      }`}
                    >
                      {u.suspenso ? "Reativar" : "Suspender"}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-[#44475a]/60 mt-2 flex justify-between items-center text-[11px]">
            <span className="text-slate-500 dark:text-[#cbd5e1]">Ativos: {usuarios.ativos} ({usuarios.suspensos} suspensos)</span>
            <Link href="/admin" className="font-bold text-blue-600 dark:text-[#8be9fd] hover:underline flex items-center gap-0.5">
              Gestão Completa <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>

      {/* 5. Action Modals */}
      <CreateUserModal
        isOpen={isCreateUserOpen}
        onClose={() => setIsCreateUserOpen(false)}
        onSuccess={() => carregarDados()}
      />

      <GrantProModal
        user={selectedUserForPro}
        isOpen={!!selectedUserForPro}
        onClose={() => setSelectedUserForPro(null)}
        onSuccess={() => carregarDados()}
      />

      <AdjustDueDateModal
        user={selectedUserForDueDate}
        isOpen={!!selectedUserForDueDate}
        onClose={() => setSelectedUserForDueDate(null)}
        onSuccess={() => carregarDados()}
      />

      <ConfirmSuspendModal
        user={selectedUserForSuspend}
        isOpen={!!selectedUserForSuspend}
        onClose={() => setSelectedUserForSuspend(null)}
        onSuccess={() => carregarDados()}
      />
    </div>
  );
}
