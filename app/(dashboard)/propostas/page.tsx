"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { PlusCircle, FileText, RefreshCw } from "lucide-react";
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
          <h1 className="text-2xl font-black text-white tracking-tight">
            Minhas Propostas Comerciais
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Gerencie, compartilhe e acompanhe o status de todas as suas propostas
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => carregarPropostas()}
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
