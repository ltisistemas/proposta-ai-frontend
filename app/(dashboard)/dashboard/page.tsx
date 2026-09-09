"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { PlusCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/Common/Button";
import { StatsCards, MetricasDashboard } from "@/components/Dashboard/StatsCards";
import { PropostasTable, PropostaItem } from "@/components/Dashboard/PropostasTable";
import { useAuthStore } from "@/lib/auth/useAuthStore";
import { useToast } from "@/components/Common/Toast";

export default function DashboardPage() {
  const { token, user } = useAuthStore();
  const { addToast } = useToast();

  const [metricas, setMetricas] = useState<MetricasDashboard | null>(null);
  const [propostas, setPropostas] = useState<PropostaItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const carregarDados = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);

    try {
      // 1. Fetch metrics
      const resStats = await fetch("/api/dashboard/stats", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const dataStats = await resStats.json();
      if (dataStats.sucesso) {
        setMetricas(dataStats.metricas);
      }

      // 2. Fetch proposals list
      const resPropostas = await fetch("/api/propostas", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const dataPropostas = await resPropostas.json();
      if (dataPropostas.sucesso) {
        setPropostas(dataPropostas.propostas);
      }
    } catch (err) {
      console.error("Erro ao carregar dados do dashboard:", err);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  const handleDelete = async (id: string) => {
    if (!token) return;

    try {
      const res = await fetch(`/api/propostas/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.sucesso) {
        addToast({
          type: "success",
          title: "Proposta excluída com sucesso!",
        });
        carregarDados();
      } else {
        addToast({
          type: "error",
          title: "Erro ao excluir",
          message: data.erro || "Tente novamente.",
        });
      }
    } catch (err) {
      console.error("Erro ao deletar proposta:", err);
    }
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Olá, {user?.nome?.split(" ")[0] || "Empreendedor"} 👋
          </h1>
          <p className="text-slate-600 text-sm mt-1">
            Aqui está o panorama comercial das suas propostas e oportunidades
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => carregarDados()}
            title="Atualizar dados"
            className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors shadow-xs cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          </button>

          <Link href="/propostas/nova">
            <Button
              variant="primary"
              size="md"
              leftIcon={<PlusCircle className="w-4 h-4" />}
              className="shadow-lg shadow-blue-600/20 font-bold"
            >
              Criar Proposta com IA
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <StatsCards metricas={metricas} />

      {/* Proposals Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">
            Propostas Recentes
          </h2>
          <Link
            href="/propostas"
            className="text-xs font-bold text-blue-600 hover:text-blue-700"
          >
            Ver todas →
          </Link>
        </div>

        <PropostasTable
          propostas={propostas}
          isLoading={isLoading}
          onDelete={handleDelete}
          onRefresh={carregarDados}
        />
      </div>
    </div>
  );
}
