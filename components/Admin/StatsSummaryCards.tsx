"use client";

import React from "react";
import { Users, Zap, ShieldAlert, UserCheck, Shield } from "lucide-react";

interface MetricasAdmin {
  total: number;
  pro: number;
  free: number;
  suspensos: number;
  admins: number;
}

interface StatsSummaryCardsProps {
  metricas: MetricasAdmin;
  isLoading?: boolean;
}

export function StatsSummaryCards({ metricas, isLoading }: StatsSummaryCardsProps) {
  const cards = [
    {
      title: "Total de Usuários",
      value: metricas.total,
      description: "Cadastrados na plataforma",
      icon: <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />,
      bg: "bg-blue-50/80 dark:bg-blue-950/40 border-blue-200/80 dark:border-blue-900/50 text-blue-700 dark:text-blue-400",
    },
    {
      title: "Assinantes PRO",
      value: metricas.pro,
      description: "Planos ativos & concedidos",
      icon: <Zap className="w-5 h-5 text-amber-600 dark:text-amber-400" />,
      bg: "bg-amber-50/80 dark:bg-amber-950/40 border-amber-200/80 dark:border-amber-900/50 text-amber-700 dark:text-amber-400",
    },
    {
      title: "Usuários Free",
      value: metricas.free,
      description: "Até 3 propostas/mês",
      icon: <UserCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />,
      bg: "bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-200/80 dark:border-emerald-900/50 text-emerald-700 dark:text-emerald-400",
    },
    {
      title: "Contas Suspensas",
      value: metricas.suspensos,
      description: "Acesso bloqueado",
      icon: <ShieldAlert className="w-5 h-5 text-rose-600 dark:text-rose-400" />,
      bg: "bg-rose-50/80 dark:bg-rose-950/40 border-rose-200/80 dark:border-rose-900/50 text-rose-700 dark:text-rose-400",
    },
    {
      title: "Administradores",
      value: metricas.admins,
      description: "Acesso ao painel de controle",
      icon: <Shield className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />,
      bg: "bg-indigo-50/80 dark:bg-indigo-950/40 border-indigo-200/80 dark:border-indigo-900/50 text-indigo-700 dark:text-indigo-400",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      {cards.map((card, idx) => (
        <div
          key={idx}
          className="bg-white dark:bg-[#282a36] p-4 rounded-2xl border border-slate-200/80 dark:border-[#44475a] shadow-xs hover:shadow-sm transition-all flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 dark:text-[#cbd5e1] uppercase tracking-wider">
              {card.title}
            </span>
            <div className={`p-2 rounded-xl border ${card.bg}`}>{card.icon}</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900 dark:text-[#f8f8f2]">
              {isLoading ? (
                <div className="h-8 w-16 bg-slate-100 dark:bg-[#343746] animate-pulse rounded-lg" />
              ) : (
                card.value
              )}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-[#cbd5e1] mt-1 truncate">
              {card.description}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
