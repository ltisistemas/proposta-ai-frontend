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
  CheckCircle2,
  RefreshCw,
  UserPlus,
  ArrowUpRight,
  ExternalLink,
  Calendar,
  CreditCard,
  Layers,
  Activity,
  MoreVertical,
  Clock,
  Briefcase,
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

function formatarData(data: Date | string | null | undefined): string {
  if (!data) return "—";
  try {
    const d = new Date(data);
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(d);
  } catch {
    return String(data);
  }
}

export function AdminExecutiveDashboard() {
  const { token, user } = useAuthStore();
  const { addToast } = useToast();

  const [metricas, setMetricas] = useState<MetricasAdminDashboard | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTableTab, setActiveTableTab] = useState<"pagamentos" | "usuarios">("pagamentos");

  // Modals state
  const [isCreateUserOpen, setIsCreateUserOpen] = useState(false);
  const [selectedUserForPro, setSelectedUserForPro] = useState<UserRow | null>(null);
  const [selectedUserForDueDate, setSelectedUserForDueDate] = useState<UserRow | null>(null);
  const [selectedUserForSuspend, setSelectedUserForSuspend] = useState<UserRow | null>(null);

  const carregarDados = useCallback(async () => {
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
    <div className="space-y-8 pb-12">
      {/* 1. Executive Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-indigo-900/10 via-blue-900/5 to-transparent dark:from-indigo-950/40 dark:via-[#343746]/40 p-5 rounded-3xl border border-indigo-100/80 dark:border-[#44475a] shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-indigo-600 dark:bg-[#bd93f9] text-white dark:text-[#282a36] flex items-center gap-1 shadow-xs">
              <Shield className="w-3 h-3" /> Painel Executivo
            </span>
            <span className="text-xs text-slate-500 dark:text-[#cbd5e1] font-medium flex items-center gap-1">
              <Activity className="w-3.5 h-3.5 text-emerald-500 animate-pulse" /> Tempo Real
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-[#f8f8f2] tracking-tight">
            Visão Geral Gerencial
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-[#cbd5e1]">
            Acompanhamento de receita de assinaturas, saúde da base de clientes e atividade do ecossistema
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => carregarDados()}
            title="Atualizar métricas agora"
            disabled={isLoading}
            className="p-2.5 rounded-xl bg-white dark:bg-[#343746] border border-slate-200 dark:border-[#44475a] text-slate-700 dark:text-[#f8f8f2] hover:bg-slate-50 dark:hover:bg-[#44475a] transition-colors shadow-xs cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-blue-600 dark:text-[#8be9fd]" : ""}`} />
            <span className="hidden md:inline">Atualizar</span>
          </button>

          <Button
            variant="outline"
            size="md"
            onClick={() => setIsCreateUserOpen(true)}
            className="font-bold border-indigo-200 dark:border-[#6272a4] text-indigo-700 dark:text-[#8be9fd] hover:bg-indigo-50 dark:hover:bg-[#343746]"
          >
            <UserPlus className="w-4 h-4 mr-1.5" /> Adicionar Usuário
          </Button>

          <Link href="/admin">
            <Button
              variant="primary"
              size="md"
              className="font-bold shadow-lg shadow-blue-600/20 bg-blue-600 hover:bg-blue-700 dark:bg-[#bd93f9] dark:hover:bg-[#a77bf3] dark:text-[#282a36]"
            >
              <Users className="w-4 h-4 mr-1.5" /> Gestão de Usuários
            </Button>
          </Link>
        </div>
      </div>

      {/* 2. Financial Revenue & MRR Hero Cards */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold text-slate-900 dark:text-[#f8f8f2] flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-emerald-600 dark:text-[#50fa7b]" />
            Receita & Faturamento com Assinaturas
          </h2>
          <span className="text-xs text-slate-500 dark:text-[#cbd5e1]">
            Plano Pro: R$ 45,90/mês
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Faturamento Hoje */}
          <div className="p-5 rounded-2xl bg-white dark:bg-[#282a36] border border-slate-200/90 dark:border-[#44475a] shadow-xs hover:border-emerald-500/50 dark:hover:border-[#50fa7b]/50 transition-all flex flex-col justify-between relative overflow-hidden group">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-500 dark:text-[#cbd5e1] uppercase tracking-wider">
                Faturamento Hoje
              </span>
              <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-[#50fa7b] border border-emerald-100 dark:border-emerald-900/40">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-[#f8f8f2] tracking-tight">
                {isLoading ? (
                  <div className="h-8 w-24 bg-slate-100 dark:bg-[#343746] animate-pulse rounded-lg" />
                ) : (
                  formatarMoeda(financeiro.totalHoje)
                )}
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-[#cbd5e1] mt-1.5">
                <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-[#50fa7b]">
                  {financeiro.transacoesHojeCount} {financeiro.transacoesHojeCount === 1 ? "pagamento" : "pagamentos"}
                </span>
                <span>confirmados hoje</span>
              </div>
            </div>
          </div>

          {/* Card 2: Faturamento no Mês */}
          <div className="p-5 rounded-2xl bg-white dark:bg-[#282a36] border border-slate-200/90 dark:border-[#44475a] shadow-xs hover:border-blue-500/50 dark:hover:border-[#8be9fd]/50 transition-all flex flex-col justify-between relative overflow-hidden group">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-500 dark:text-[#cbd5e1] uppercase tracking-wider">
                Faturamento no Mês
              </span>
              <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-[#8be9fd] border border-blue-100 dark:border-blue-900/40">
                <Calendar className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-[#f8f8f2] tracking-tight">
                {isLoading ? (
                  <div className="h-8 w-24 bg-slate-100 dark:bg-[#343746] animate-pulse rounded-lg" />
                ) : (
                  formatarMoeda(financeiro.totalMes)
                )}
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-[#cbd5e1] mt-1.5">
                <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-[#8be9fd]">
                  {financeiro.transacoesMesCount} {financeiro.transacoesMesCount === 1 ? "cobrança" : "cobranças"}
                </span>
                <span>no mês corrente</span>
              </div>
            </div>
          </div>

          {/* Card 3: MRR Estimado */}
          <div className="p-5 rounded-2xl bg-white dark:bg-[#282a36] border border-slate-200/90 dark:border-[#44475a] shadow-xs hover:border-purple-500/50 dark:hover:border-[#bd93f9]/50 transition-all flex flex-col justify-between relative overflow-hidden group">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-500 dark:text-[#cbd5e1] uppercase tracking-wider">
                MRR Estimado
              </span>
              <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-[#bd93f9] border border-purple-100 dark:border-purple-900/40">
                <Zap className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-[#f8f8f2] tracking-tight">
                {isLoading ? (
                  <div className="h-8 w-24 bg-slate-100 dark:bg-[#343746] animate-pulse rounded-lg" />
                ) : (
                  formatarMoeda(financeiro.mrrEstimado)
                )}
              </div>
              <div className="text-xs text-slate-500 dark:text-[#cbd5e1] mt-1.5">
                Receita Recorrente ({usuarios.pro} assinantes PRO)
              </div>
            </div>
          </div>

          {/* Card 4: Faturamento Histórico */}
          <div className="p-5 rounded-2xl bg-white dark:bg-[#282a36] border border-slate-200/90 dark:border-[#44475a] shadow-xs hover:border-indigo-500/50 dark:hover:border-indigo-400/50 transition-all flex flex-col justify-between relative overflow-hidden group">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-500 dark:text-[#cbd5e1] uppercase tracking-wider">
                Total Histórico
              </span>
              <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/40">
                <CreditCard className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-[#f8f8f2] tracking-tight">
                {isLoading ? (
                  <div className="h-8 w-24 bg-slate-100 dark:bg-[#343746] animate-pulse rounded-lg" />
                ) : (
                  formatarMoeda(financeiro.totalHistorico)
                )}
              </div>
              <div className="text-xs text-slate-500 dark:text-[#cbd5e1] mt-1.5">
                Volume financeiro total liquidado
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. User Health & Distribution KPIs */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold text-slate-900 dark:text-[#f8f8f2] flex items-center gap-2">
            <Users className="w-4 h-4 text-blue-600 dark:text-[#8be9fd]" />
            Saúde da Base de Usuários & Clientes
          </h2>
          <Link
            href="/admin"
            className="text-xs font-bold text-blue-600 dark:text-[#8be9fd] hover:underline flex items-center gap-1"
          >
            Abrir Gestão Completa <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Usuários Ativos */}
          <div className="p-4 rounded-2xl bg-white dark:bg-[#282a36] border border-slate-200/90 dark:border-[#44475a] shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-500 dark:text-[#cbd5e1] uppercase">
                Usuários Ativos
              </span>
              <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-[#50fa7b]">
                <UserCheck className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-2xl font-black text-slate-900 dark:text-[#f8f8f2]">
                {isLoading ? <div className="h-7 w-12 bg-slate-100 dark:bg-[#343746] animate-pulse rounded" /> : usuarios.ativos}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-[#cbd5e1] mt-1">
                {usuarios.total > 0 ? `${((usuarios.ativos / usuarios.total) * 100).toFixed(0)}% da base total` : "Nenhum usuário"}
              </p>
            </div>
          </div>

          {/* Assinantes PRO */}
          <div className="p-4 rounded-2xl bg-white dark:bg-[#282a36] border border-slate-200/90 dark:border-[#44475a] shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-500 dark:text-[#cbd5e1] uppercase">
                Assinantes PRO
              </span>
              <div className="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-[#ffb86c]">
                <Zap className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-2xl font-black text-slate-900 dark:text-[#f8f8f2]">
                {isLoading ? <div className="h-7 w-12 bg-slate-100 dark:bg-[#343746] animate-pulse rounded" /> : usuarios.pro}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-[#cbd5e1] mt-1">
                {usuarios.proAsaas} pagantes • {usuarios.proCortesia} vitalício/cortesia
              </p>
            </div>
          </div>

          {/* Usuários Free */}
          <div className="p-4 rounded-2xl bg-white dark:bg-[#282a36] border border-slate-200/90 dark:border-[#44475a] shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-500 dark:text-[#cbd5e1] uppercase">
                Usuários Free
              </span>
              <div className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-[#8be9fd]">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-2xl font-black text-slate-900 dark:text-[#f8f8f2]">
                {isLoading ? <div className="h-7 w-12 bg-slate-100 dark:bg-[#343746] animate-pulse rounded" /> : usuarios.free}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-[#cbd5e1] mt-1">
                Base de potenciais upgrades
              </p>
            </div>
          </div>

          {/* Contas Suspensas */}
          <div className="p-4 rounded-2xl bg-white dark:bg-[#282a36] border border-slate-200/90 dark:border-[#44475a] shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-500 dark:text-[#cbd5e1] uppercase">
                Contas Suspensas
              </span>
              <div className="p-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-[#ff5555]">
                <ShieldAlert className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-2xl font-black text-slate-900 dark:text-[#f8f8f2]">
                {isLoading ? <div className="h-7 w-12 bg-slate-100 dark:bg-[#343746] animate-pulse rounded" /> : usuarios.suspensos}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-[#cbd5e1] mt-1">
                {usuarios.suspensos === 0 ? "Nenhum bloqueio ativo" : "Acesso bloqueado"}
              </p>
            </div>
          </div>

          {/* Novos Cadastros */}
          <div className="p-4 rounded-2xl bg-white dark:bg-[#282a36] border border-slate-200/90 dark:border-[#44475a] shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-500 dark:text-[#cbd5e1] uppercase">
                Novos Cadastros
              </span>
              <div className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-[#bd93f9]">
                <UserPlus className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-2xl font-black text-slate-900 dark:text-[#f8f8f2]">
                {isLoading ? <div className="h-7 w-12 bg-slate-100 dark:bg-[#343746] animate-pulse rounded" /> : `+${usuarios.novosMes}`}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-[#cbd5e1] mt-1">
                +{usuarios.novosHoje} hoje • {usuarios.total} total geral
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Global Platform Proposal Volume & Ecosystem KPIs */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold text-slate-900 dark:text-[#f8f8f2] flex items-center gap-2">
            <Layers className="w-4 h-4 text-purple-600 dark:text-[#bd93f9]" />
            Volume Global do Ecossistema de Propostas
          </h2>
          <span className="text-xs text-slate-500 dark:text-[#cbd5e1]">
            Total gerado por todos os usuários do sistema
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-5 rounded-2xl bg-white dark:bg-[#282a36] border border-slate-200/90 dark:border-[#44475a] shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-[#8be9fd] flex items-center justify-center shrink-0 border border-blue-100 dark:border-blue-900/40">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-500 dark:text-[#cbd5e1] uppercase">
                Propostas Geradas no Sistema
              </span>
              <div className="text-2xl font-black text-slate-900 dark:text-[#f8f8f2] mt-0.5">
                {isLoading ? <div className="h-7 w-16 bg-slate-100 dark:bg-[#343746] animate-pulse rounded" /> : plataforma.totalPropostas}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-[#cbd5e1]">
                {plataforma.propostasAceitas} propostas aceitas/assinadas
              </p>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-[#282a36] border border-slate-200/90 dark:border-[#44475a] shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-[#50fa7b] flex items-center justify-center shrink-0 border border-emerald-100 dark:border-emerald-900/40">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-500 dark:text-[#cbd5e1] uppercase">
                Pipeline Global dos Usuários
              </span>
              <div className="text-2xl font-black text-slate-900 dark:text-[#f8f8f2] mt-0.5">
                {isLoading ? <div className="h-7 w-24 bg-slate-100 dark:bg-[#343746] animate-pulse rounded" /> : formatarMoeda(plataforma.volumeTotalPipeline)}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-[#cbd5e1]">
                Volume financeiro negociado no app
              </p>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-[#282a36] border border-slate-200/90 dark:border-[#44475a] shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-[#bd93f9] flex items-center justify-center shrink-0 border border-purple-100 dark:border-purple-900/40">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-500 dark:text-[#cbd5e1] uppercase">
                Volume Fechado & Assinado
              </span>
              <div className="text-2xl font-black text-slate-900 dark:text-[#f8f8f2] mt-0.5">
                {isLoading ? <div className="h-7 w-24 bg-slate-100 dark:bg-[#343746] animate-pulse rounded" /> : formatarMoeda(plataforma.volumeTotalFechado)}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-[#cbd5e1]">
                Taxa de conversão global: {plataforma.taxaConversaoGlobal}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 5. Recent Activity: Pagamentos & Usuários Recentes */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-[#44475a] pb-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTableTab("pagamentos")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                activeTableTab === "pagamentos"
                  ? "bg-blue-600 dark:bg-[#bd93f9] text-white dark:text-[#282a36] shadow-sm"
                  : "bg-white dark:bg-[#282a36] text-slate-600 dark:text-[#cbd5e1] hover:bg-slate-100 dark:hover:bg-[#343746]"
              }`}
            >
              <CreditCard className="w-3.5 h-3.5" />
              Últimos Pagamentos ({metricas?.ultimosPagamentos?.length || 0})
            </button>

            <button
              onClick={() => setActiveTableTab("usuarios")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                activeTableTab === "usuarios"
                  ? "bg-blue-600 dark:bg-[#bd93f9] text-white dark:text-[#282a36] shadow-sm"
                  : "bg-white dark:bg-[#282a36] text-slate-600 dark:text-[#cbd5e1] hover:bg-slate-100 dark:hover:bg-[#343746]"
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              Novos Usuários ({metricas?.ultimosUsuarios?.length || 0})
            </button>
          </div>

          <Link
            href="/admin"
            className="text-xs font-bold text-blue-600 dark:text-[#8be9fd] hover:underline flex items-center gap-1"
          >
            Ver base completa no Painel Admin →
          </Link>
        </div>

        {/* Tab Content 1: Últimos Pagamentos */}
        {activeTableTab === "pagamentos" && (
          <div className="bg-white dark:bg-[#282a36] rounded-2xl border border-slate-200/90 dark:border-[#44475a] overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-[#21222c] border-b border-slate-200 dark:border-[#44475a] text-slate-500 dark:text-[#cbd5e1] font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Cliente / Usuário</th>
                    <th className="py-3 px-4">Plano</th>
                    <th className="py-3 px-4">Valor</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Data Pagamento</th>
                    <th className="py-3 px-4 text-right">Comprovante</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-[#44475a]/50 text-slate-700 dark:text-[#f8f8f2]">
                  {isLoading ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400 dark:text-[#6272a4]">
                        <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-blue-600 dark:text-[#8be9fd]" />
                        Carregando transações recentes...
                      </td>
                    </tr>
                  ) : !metricas?.ultimosPagamentos || metricas.ultimosPagamentos.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400 dark:text-[#6272a4]">
                        Nenhum pagamento registrado até o momento.
                      </td>
                    </tr>
                  ) : (
                    metricas.ultimosPagamentos.map((pag) => (
                      <tr key={pag.id} className="hover:bg-slate-50/70 dark:hover:bg-[#343746]/40 transition-colors">
                        <td className="py-3.5 px-4 font-medium">
                          <div className="font-bold text-slate-900 dark:text-[#f8f8f2]">{pag.usuarioNome}</div>
                          <div className="text-[11px] text-slate-500 dark:text-[#cbd5e1]">{pag.usuarioEmail}</div>
                        </td>
                        <td className="py-3.5 px-4">
                          <Badge variant={pag.usuarioPlano === "pro" ? "pro" : "free"} size="sm">
                            {pag.usuarioPlano?.toUpperCase() || "FREE"}
                          </Badge>
                        </td>
                        <td className="py-3.5 px-4 font-bold text-emerald-600 dark:text-[#50fa7b]">
                          {formatarMoeda(pag.valor)}
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              pag.status === "pago"
                                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-[#50fa7b]"
                                : pag.status === "pendente"
                                ? "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-[#ffb86c]"
                                : "bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-[#ff5555]"
                            }`}
                          >
                            {pag.status?.toUpperCase()}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-600 dark:text-[#cbd5e1]">
                          {formatarData(pag.pagoEm || pag.criadoEm)}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          {pag.invoiceUrl ? (
                            <a
                              href={pag.invoiceUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-blue-600 dark:text-[#8be9fd] hover:underline font-semibold"
                            >
                              Fatura <ExternalLink className="w-3 h-3" />
                            </a>
                          ) : (
                            <span className="text-slate-400 dark:text-[#6272a4]">—</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab Content 2: Novos Usuários Cadastrados */}
        {activeTableTab === "usuarios" && (
          <div className="bg-white dark:bg-[#282a36] rounded-2xl border border-slate-200/90 dark:border-[#44475a] overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-[#21222c] border-b border-slate-200 dark:border-[#44475a] text-slate-500 dark:text-[#cbd5e1] font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Nome & Email</th>
                    <th className="py-3 px-4">Empresa</th>
                    <th className="py-3 px-4">Plano / Role</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Criado em</th>
                    <th className="py-3 px-4 text-right">Ações Rápidas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-[#44475a]/50 text-slate-700 dark:text-[#f8f8f2]">
                  {isLoading ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400 dark:text-[#6272a4]">
                        <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-blue-600 dark:text-[#8be9fd]" />
                        Carregando novos usuários...
                      </td>
                    </tr>
                  ) : !metricas?.ultimosUsuarios || metricas.ultimosUsuarios.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400 dark:text-[#6272a4]">
                        Nenhum usuário cadastrado.
                      </td>
                    </tr>
                  ) : (
                    metricas.ultimosUsuarios.map((u) => (
                      <tr key={u.id} className="hover:bg-slate-50/70 dark:hover:bg-[#343746]/40 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900 dark:text-[#f8f8f2]">{u.nome}</div>
                          <div className="text-[11px] text-slate-500 dark:text-[#cbd5e1]">{u.email}</div>
                        </td>
                        <td className="py-3.5 px-4 text-slate-600 dark:text-[#cbd5e1]">
                          {u.empresaNome || "—"}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <Badge variant={u.plano === "pro" ? "pro" : "free"} size="sm">
                              {u.plano?.toUpperCase()}
                            </Badge>
                            {u.role === "admin" && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-[#bd93f9]">
                                ADMIN
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              u.suspenso
                                ? "bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-[#ff5555]"
                                : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-[#50fa7b]"
                            }`}
                          >
                            {u.suspenso ? "SUSPENSO" : "ATIVO"}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-600 dark:text-[#cbd5e1]">
                          {formatarData(u.criadoEm)}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setSelectedUserForPro(u as any)}
                              title="Conceder ou alterar plano PRO"
                              className="px-2 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-[#ffb86c] hover:bg-amber-100 dark:hover:bg-amber-900/50 font-bold text-[11px] transition-colors cursor-pointer"
                            >
                              Plano PRO
                            </button>
                            <button
                              onClick={() => setSelectedUserForDueDate(u as any)}
                              title="Ajustar data de vencimento"
                              className="px-2 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-[#8be9fd] hover:bg-blue-100 dark:hover:bg-blue-900/50 font-bold text-[11px] transition-colors cursor-pointer"
                            >
                              Vencimento
                            </button>
                            <button
                              onClick={() => setSelectedUserForSuspend(u as any)}
                              title={u.suspenso ? "Reativar usuário" : "Suspender usuário"}
                              className={`px-2 py-1 rounded-lg font-bold text-[11px] transition-colors cursor-pointer ${
                                u.suspenso
                                  ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-[#50fa7b] hover:bg-emerald-100"
                                  : "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-[#ff5555] hover:bg-rose-100"
                              }`}
                            >
                              {u.suspenso ? "Reativar" : "Suspender"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* 6. Action Modals */}
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
