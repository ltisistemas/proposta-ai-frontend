"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { PlusCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/Common/Button";
import { PropostasTable, PropostaItem } from "@/components/Dashboard/PropostasTable";
import { useAuthStore } from "@/lib/auth/useAuthStore";
import { useToast } from "@/components/Common/Toast";

export default function PropostasListPage() {
  const { token } = useAuthStore();
  const { addToast } = useToast();

  const [propostas, setPropostas] = useState<PropostaItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const carregarPropostas = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);

    try {
      const res = await fetch("/api/propostas", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.sucesso) {
        setPropostas(data.propostas);
      }
    } catch (err) {
      console.error("Erro ao carregar propostas:", err);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    carregarPropostas();
  }, [carregarPropostas]);

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
        carregarPropostas();
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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-[#f8f8f2] tracking-tight">
            Minhas Propostas Comerciais
          </h1>
          <p className="text-slate-600 dark:text-[#cbd5e1] text-sm mt-1">
            Gerencie, compartilhe e acompanhe o status de todas as suas propostas
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => carregarPropostas()}
            className="p-2.5 rounded-xl bg-white dark:bg-[#343746] border border-slate-200 dark:border-[#44475a] text-slate-600 dark:text-[#f8f8f2] hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-[#44475a] transition-colors shadow-xs cursor-pointer"
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
              Nova Proposta
            </Button>
          </Link>
        </div>
      </div>

      <PropostasTable
        propostas={propostas}
        isLoading={isLoading}
        onDelete={handleDelete}
        onRefresh={carregarPropostas}
      />
    </div>
  );
}
