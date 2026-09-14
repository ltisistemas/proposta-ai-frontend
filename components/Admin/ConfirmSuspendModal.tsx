"use client";

import React, { useState } from "react";
import { X, ShieldAlert, ShieldCheck, AlertTriangle } from "lucide-react";
import { Button } from "@/components/Common/Button";
import { useAuthStore } from "@/lib/auth/useAuthStore";
import { addToast } from "@/components/Common/Toast";
import { UserRow } from "@/lib/db/users";

interface ConfirmSuspendModalProps {
  user: UserRow | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function ConfirmSuspendModal({
  user,
  isOpen,
  onClose,
  onSuccess,
}: ConfirmSuspendModalProps) {
  const { token, user: currentUser } = useAuthStore();
  const [loading, setLoading] = useState(false);

  if (!isOpen || !user) return null;

  const isSuspended = !!user.suspenso;
  const targetAction = isSuspended ? "Reativar" : "Suspender";

  const handleToggle = async () => {
    if (currentUser?.id === user.id && !isSuspended) {
      addToast({
        title: "Ação não permitida",
        message: "Você não pode suspender sua própria conta de administrador.",
        type: "error",
      });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${user.id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          suspenso: !isSuspended,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.sucesso) {
        throw new Error(data.erro || "Falha ao alterar status");
      }

      addToast({
        title: isSuspended ? "Conta reativada!" : "Conta suspensa!",
        message: isSuspended
          ? `O acesso de ${user.nome} foi restabelecido.`
          : `O acesso de ${user.nome} foi bloqueado.`,
        type: isSuspended ? "success" : "info",
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      addToast({
        title: "Erro ao alterar status",
        message: err.message || "Não foi possível alterar o status da conta.",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-[#282a36] rounded-2xl shadow-xl max-w-md w-full p-6 relative animate-in fade-in zoom-in-95 duration-150 my-8 border border-slate-200 dark:border-[#44475a]">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-700 dark:text-[#6272a4] dark:hover:text-[#f8f8f2] hover:bg-slate-100 dark:hover:bg-[#343746] rounded-lg transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div
            className={`p-2.5 rounded-xl border ${
              isSuspended
                ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/50"
                : "bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border-rose-100 dark:border-rose-900/50"
            }`}
          >
            {isSuspended ? (
              <ShieldCheck className="w-6 h-6" />
            ) : (
              <ShieldAlert className="w-6 h-6" />
            )}
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-[#f8f8f2]">
              {targetAction} Conta de Usuário
            </h3>
            <p className="text-xs text-slate-500 dark:text-[#cbd5e1]">
              Confirmação de alteração de acesso à plataforma
            </p>
          </div>
        </div>

        <div className="space-y-3 my-4">
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#21222c]/50 border border-slate-200/80 dark:border-[#44475a] text-xs text-slate-700 dark:text-[#cbd5e1] space-y-1.5">
            <div>
              <span className="text-slate-500 dark:text-[#6272a4] font-semibold">Usuário: </span>
              <strong className="text-slate-900 dark:text-[#f8f8f2]">{user.nome}</strong>
            </div>
            <div>
              <span className="text-slate-500 dark:text-[#6272a4] font-semibold">E-mail: </span>
              <span className="font-mono text-slate-800 dark:text-[#f8f8f2]">{user.email}</span>
            </div>
            <div>
              <span className="text-slate-500 dark:text-[#6272a4] font-semibold">Status Atual: </span>
              <span
                className={`font-bold ${
                  isSuspended ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400"
                }`}
              >
                {isSuspended ? "SUSPENSO" : "ATIVO"}
              </span>
            </div>
          </div>

          {!isSuspended && (
            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-900/50 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <span>
                Ao suspender, o usuário será deslogado imediatamente e não conseguirá
                acessar propostas, templates ou recursos até ser reativado.
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-[#44475a]">
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
            type="button"
            variant={isSuspended ? "primary" : "danger"}
            size="sm"
            isLoading={loading}
            onClick={handleToggle}
          >
            {isSuspended ? "Reativar Usuário" : "Confirmar Suspensão"}
          </Button>
        </div>
      </div>
    </div>
  );
}
