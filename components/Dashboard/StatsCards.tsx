import React from "react";
import { FileText, CheckCircle, Clock, DollarSign } from "lucide-react";
import { Card } from "@/components/Common/Card";

export interface MetricasDashboard {
  totalPropostas: number;
  propostasAceitas: number;
  propostasEnviadas: number;
  propostasRascunho: number;
  propostasRecusadas: number;
  valorTotalPipeline: number;
  valorTotalFechado: number;
  taxaConversao: string;
}

function formatarMoeda(valor: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(valor);
}

export const StatsCards: React.FC<{ metricas?: MetricasDashboard | null }> = ({
  metricas,
}) => {
  const stats = [
    {
      label: "Total de Propostas",
      value: metricas?.totalPropostas ?? 0,
      subtext: `${metricas?.propostasRascunho ?? 0} rascunhos em aberto`,
      icon: <FileText className="w-5 h-5 text-blue-600" />,
      bgIcon: "bg-blue-50 border-blue-100",
    },
    {
      label: "Propostas Aceitas",
      value: metricas?.propostasAceitas ?? 0,
      subtext: `Taxa de conversão: ${metricas?.taxaConversao ?? "0%"}`,
      icon: <CheckCircle className="w-5 h-5 text-emerald-600" />,
      bgIcon: "bg-emerald-50 border-emerald-100",
    },
    {
      label: "Pipeline em Negociação",
      value: formatarMoeda(metricas?.valorTotalPipeline ?? 0),
      subtext: `${metricas?.propostasEnviadas ?? 0} propostas enviadas`,
      icon: <Clock className="w-5 h-5 text-sky-600" />,
      bgIcon: "bg-sky-50 border-sky-100",
    },
    {
      label: "Valor Total Fechado",
      value: formatarMoeda(metricas?.valorTotalFechado ?? 0),
      subtext: "Receita confirmada com clientes",
      icon: <DollarSign className="w-5 h-5 text-amber-600" />,
      bgIcon: "bg-amber-50 border-amber-100",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
      {stats.map((stat, idx) => (
        <Card
          key={idx}
          className="bg-white border-slate-200/90 p-5 rounded-2xl shadow-xs hover:border-blue-300 transition-all"
        >
          <div className="flex items-start justify-between">
            <div>
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                {stat.label}
              </div>
              <div className="text-2xl font-black text-slate-900 mt-1.5 tracking-tight">
                {stat.value}
              </div>
            </div>
            <div
              className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${stat.bgIcon}`}
            >
              {stat.icon}
            </div>
          </div>
          <div className="text-xs text-slate-500 mt-3 pt-3 border-t border-slate-100">
            {stat.subtext}
          </div>
        </Card>
      ))}
    </div>
  );
};
