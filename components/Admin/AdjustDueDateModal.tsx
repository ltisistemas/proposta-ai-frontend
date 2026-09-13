"use client";

import React, { useState, useEffect } from "react";
import { X, Calendar, Clock, AlertCircle } from "lucide-react";
import { Button } from "@/components/Common/Button";
import { useAuthStore } from "@/lib/auth/useAuthStore";
import { addToast } from "@/components/Common/Toast";
import { UserRow } from "@/lib/db/users";

interface AdjustDueDateModalProps {
  user: UserRow | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function AdjustDueDateModal({
  user,
  isOpen,
  onClose,
  onSuccess,
}: AdjustDueDateModalProps) {
  const { token } = useAuthStore();
  const [dataVencimento, setDataVencimento] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user?.data_proxima_cobranca) {
      const d = new Date(user.data_proxima_cobranca);
      setDataVencimento(d.toISOString().split("T")[0]);
    } else {
      // Default to 30 days ahead from today
      const d = new Date();
      d.setDate(d.getDate() + 30);
      setDataVencimento(d.toISOString().split("T")[0]);
    }
  }, [user]);

  if (!isOpen || !user) return null;

  const handleShortcut = (days: number) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    setDataVencimento(d.toISOString().split("T")[0]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dataVencimento) {
      addToast({
        title: "Data obrigatória",
        message: "Selecione uma data válida para a cobrança.",
        type: "error",
      });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${user.id}/vencimento`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          data_proxima_cobranca: new Date(`${dataVencimento}T23:59:59Z`).toISOString(),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.sucesso) {
        throw new Error(data.erro || "Falha ao atualizar vencimento");
      }

      addToast({
        title: "Vencimento atualizado!",
        message: `Novo dia de cobrança/vencimento salvo para ${user.nome}.`,
        type: "success",
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      addToast({
        title: "Erro ao atualizar vencimento",
        message: err.message || "Não foi possível salvar a data.",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 relative animate-in fade-in zoom-in-95 duration-150 my-8">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              Modificar Vencimento
            </h3>
            <p className="text-xs text-slate-500">
              Altere a data da próxima cobrança para{" "}
              <strong className="text-slate-700">{user.nome}</strong>.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Data de Vencimento / Renovação
            </label>
            <div className="relative">
              <input
                type="date"
                required
                value={dataVencimento}
                onChange={(e) => setDataVencimento(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">
              Atalhos Rápidos:
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleShortcut(30)}
                className="py-1.5 px-2 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
              >
                +30 Dias
              </button>
              <button
                type="button"
                onClick={() => handleShortcut(60)}
                className="py-1.5 px-2 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
              >
                +60 Dias
              </button>
              <button
                type="button"
                onClick={() => handleShortcut(90)}
                className="py-1.5 px-2 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
              >
                +90 Dias
              </button>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-[11px] text-slate-600 flex items-start gap-2">
            <Clock className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
            <span>
              Ao atualizar esta data, a verificação automática de status de assinatura
              considerará este novo prazo antes de aplicar tolerância ou downgrade.
            </span>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={loading}
            >
              Salvar Vencimento
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
