"use client";

import React, { useState } from "react";
import { X, Sparkles, Infinity as InfinityIcon, Calendar, CheckCircle2, RotateCcw } from "lucide-react";
import { Button } from "@/components/Common/Button";
import { useAuthStore } from "@/lib/auth/useAuthStore";
import { addToast } from "@/components/Common/Toast";
import { UserRow } from "@/lib/db/users";

interface GrantProModalProps {
  user: UserRow | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function GrantProModal({
  user,
  isOpen,
  onClose,
  onSuccess,
}: GrantProModalProps) {
  const { token } = useAuthStore();
  const [opcao, setOpcao] = useState<"vitalicio" | "1" | "3" | "6" | "12" | "free">("vitalicio");
  const [loading, setLoading] = useState(false);

  if (!isOpen || !user) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let bodyData: any = {};
      if (opcao === "vitalicio") {
        bodyData = { tipo: "vitalicio" };
      } else if (opcao === "free") {
        bodyData = { tipo: "free" };
      } else {
        bodyData = { tipo: "temporario", meses: parseInt(opcao, 10) };
      }

      const res = await fetch(`/api/admin/users/${user.id}/plano`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(bodyData),
      });

      const data = await res.json();
      if (!res.ok || !data.sucesso) {
        throw new Error(data.erro || "Falha ao atualizar plano");
      }

      addToast({
        title: "Plano atualizado!",
        message:
          opcao === "free"
            ? `O usuário ${user.nome} voltou ao plano Free.`
            : `Plano PRO concedido com sucesso para ${user.nome}.`,
        type: "success",
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      addToast({
        title: "Erro ao atualizar plano",
        message: err.message || "Não foi possível alterar o plano.",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const options = [
    {
      id: "vitalicio",
      title: "PRO Vitalício",
      subtitle: "Acesso permanente ilimitado sem renovação ou cobranças futuras",
      badge: "Recomendado VIP",
      icon: <InfinityIcon className="w-5 h-5 text-amber-600" />,
      color: "border-amber-400 bg-amber-50/60",
    },
    {
      id: "1",
      title: "PRO 1 Mês",
      subtitle: "Período promocional de 30 dias de acesso PRO",
      icon: <Calendar className="w-5 h-5 text-blue-600" />,
      color: "border-blue-300 bg-blue-50/50",
    },
    {
      id: "3",
      title: "PRO 3 Meses",
      subtitle: "Período promocional de 90 dias (Trimestral)",
      icon: <Calendar className="w-5 h-5 text-blue-600" />,
      color: "border-blue-300 bg-blue-50/50",
    },
    {
      id: "6",
      title: "PRO 6 Meses",
      subtitle: "Período promocional de 180 dias (Semestral)",
      icon: <Calendar className="w-5 h-5 text-indigo-600" />,
      color: "border-indigo-300 bg-indigo-50/50",
    },
    {
      id: "12",
      title: "PRO 12 Meses (1 Ano)",
      subtitle: "Período promocional de 365 dias (Anual)",
      icon: <Calendar className="w-5 h-5 text-indigo-600" />,
      color: "border-indigo-400 bg-indigo-50/50",
    },
    {
      id: "free",
      title: "Reverter para Plano Free",
      subtitle: "Limita o usuário a 3 propostas mensais padrão",
      icon: <RotateCcw className="w-5 h-5 text-slate-500" />,
      color: "border-slate-300 bg-slate-50/70",
    },
  ];

  return (
    <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 relative animate-in fade-in zoom-in-95 duration-150 my-8">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600 border border-amber-100">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              Conceder Plano PRO
            </h3>
            <p className="text-xs text-slate-500">
              Gerencie a concessão administrativa de plano para{" "}
              <strong className="text-slate-700">{user.nome}</strong> ({user.email})
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
            {options.map((opt) => {
              const selected = opcao === opt.id;
              return (
                <div
                  key={opt.id}
                  onClick={() => setOpcao(opt.id as any)}
                  className={`p-3.5 rounded-xl border-2 transition-all cursor-pointer flex items-center justify-between gap-3 ${
                    selected
                      ? "border-blue-600 bg-blue-50/50 shadow-xs ring-1 ring-blue-600/20"
                      : "border-slate-200 hover:border-slate-300 hover:bg-slate-50/60"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2 rounded-lg bg-white border border-slate-200/80 shrink-0">
                      {opt.icon}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900">
                          {opt.title}
                        </span>
                        {opt.badge && (
                          <span className="text-[10px] uppercase font-extrabold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                            {opt.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5 truncate">
                        {opt.subtitle}
                      </p>
                    </div>
                  </div>

                  <div className="shrink-0">
                    {selected ? (
                      <CheckCircle2 className="w-5 h-5 text-blue-600 fill-blue-50" />
                    ) : (
                      <div className="w-5 h-5 rounded-full border-2 border-slate-300" />
                    )}
                  </div>
                </div>
              );
            })}
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
              Confirmar Alteração
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
