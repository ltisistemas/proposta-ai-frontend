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
      icon: <Users className="w-5 h-5 text-blue-600" />,
      bg: "bg-blue-50/80 border-blue-200/80 text-blue-700",
    },
    {
      title: "Assinantes PRO",
      value: metricas.pro,
      description: "Planos ativos & concedidos",
      icon: <Zap className="w-5 h-5 text-amber-600" />,
      bg: "bg-amber-50/80 border-amber-200/80 text-amber-700",
    },
    {
      title: "Usuários Free",
      value: metricas.free,
      description: "Até 3 propostas/mês",
      icon: <UserCheck className="w-5 h-5 text-emerald-600" />,
      bg: "bg-emerald-50/80 border-emerald-200/80 text-emerald-700",
    },
    {
      title: "Contas Suspensas",
      value: metricas.suspensos,
      description: "Acesso bloqueado",
      icon: <ShieldAlert className="w-5 h-5 text-rose-600" />,
      bg: "bg-rose-50/80 border-rose-200/80 text-rose-700",
    },
    {
      title: "Administradores",
      value: metricas.admins,
      description: "Acesso ao painel de controle",
      icon: <Shield className="w-5 h-5 text-indigo-600" />,
      bg: "bg-indigo-50/80 border-indigo-200/80 text-indigo-700",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      {cards.map((card, idx) => (
        <div
          key={idx}
          className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-sm transition-all flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              {card.title}
            </span>
            <div className={`p-2 rounded-xl border ${card.bg}`}>{card.icon}</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900">
              {isLoading ? (
                <div className="h-8 w-16 bg-slate-100 animate-pulse rounded-lg" />
              ) : (
                card.value
              )}
            </div>
            <p className="text-[11px] text-slate-500 mt-1 truncate">
              {card.description}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
