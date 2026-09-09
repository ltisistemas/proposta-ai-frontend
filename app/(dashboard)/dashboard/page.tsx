"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { PlusCircle, Sparkles, RefreshCw } from "lucide-react";
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
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Olá, {user?.nome?.split(" ")[0] || "Empreendedor"} 👋
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Aqui está o panorama comercial das suas propostas e oportunidades
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => carregarDados()}
            title="Atualizar dados"
            className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          </button>

          <Link href="/propostas/nova">
            <Button
              variant="gradient"
              size="md"
              leftIcon={<PlusCircle className="w-4 h-4" />}
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
          <h2 className="text-lg font-bold text-white tracking-tight">
            Propostas Recentes
          </h2>
          <Link
            href="/propostas"
            className="text-xs font-semibold text-indigo-400 hover:text-indigo-300"
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
