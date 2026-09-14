"use client";

import React, { useState } from "react";
import { X, Activity, Copy, Check, User, Clock, AlertTriangle, ShieldCheck } from "lucide-react";
import { Button } from "@/components/Common/Button";
import { WebhookEventoRow } from "@/lib/db/webhooks";
import { formatDateTime } from "@/lib/utils/formatters";

interface WebhookAuditModalProps {
  evento: WebhookEventoRow | null;
  isOpen: boolean;
  onClose: () => void;
}

export function WebhookAuditModal({
  evento,
  isOpen,
  onClose,
}: WebhookAuditModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !evento) return null;

  const jsonString = JSON.stringify(evento.payload, null, 2);

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getAcaoBadge = (acao: string | null) => {
    switch (acao) {
      case "DOWNGRADE_TO_FREE":
        return (
          <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60">
            🔻 Downgrade para Free
          </span>
        );
      case "PLAN_ACTIVATED":
        return (
          <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">
            ✨ Plano PRO Ativado
          </span>
        );
      case "DUPLICATE_SKIPPED":
        return (
          <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 dark:bg-[#343746] text-slate-700 dark:text-[#f8f8f2] border border-slate-200 dark:border-[#44475a]">
            ℹ️ Duplicado (Ignorado)
          </span>
        );
      case "UNMATCHED_USER":
        return (
          <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60">
            ⚠️ Usuário Não Localizado
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 dark:bg-[#343746] text-slate-700 dark:text-[#f8f8f2] border border-slate-200 dark:border-[#44475a]">
            {acao || "Processado"}
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-[#282a36] rounded-2xl shadow-2xl max-w-2xl w-full p-6 relative animate-in fade-in zoom-in-95 duration-150 my-8 border border-slate-200 dark:border-[#44475a]">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-700 dark:text-[#6272a4] dark:hover:text-[#f8f8f2] hover:bg-slate-100 dark:hover:bg-[#343746] rounded-lg transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/50">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-slate-900 dark:text-[#f8f8f2]">
                Observabilidade de Webhook
              </h3>
              <span className="text-[10px] font-extrabold uppercase bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 px-2 py-0.5 rounded-full border border-blue-200 dark:border-blue-800/60">
                {evento.gateway.toUpperCase()}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-[#cbd5e1] font-mono mt-0.5">
              ID: {evento.id}
            </p>
          </div>
        </div>

        {/* Event Summary Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-[#21222c]/50 border border-slate-200/80 dark:border-[#44475a] text-xs mb-4">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-[#6272a4] block">
              Evento
            </span>
            <span className="font-bold text-slate-800 dark:text-[#f8f8f2] font-mono text-[11px]">
              {evento.evento}
            </span>
          </div>

          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-[#6272a4] block">
              Ação Executada
            </span>
            <div className="mt-0.5">{getAcaoBadge(evento.acao)}</div>
          </div>

          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-[#6272a4] block">
              Latência
            </span>
            <span className="font-mono text-slate-700 dark:text-[#f8f8f2] font-semibold">
              {evento.duracao_ms !== null ? `${evento.duracao_ms} ms` : "-"}
            </span>
          </div>

          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-[#6272a4] block">
              Recebido em
            </span>
            <span className="text-slate-700 dark:text-[#cbd5e1] text-[11px]">
              {formatDateTime(evento.processado_em)}
            </span>
          </div>
        </div>

        {/* User context if matched */}
        {evento.usuario_id && (
          <div className="mb-4 p-3 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 flex items-center justify-center font-bold text-xs shrink-0">
                <User className="w-4 h-4" />
              </div>
              <div>
                <span className="font-bold text-indigo-950 dark:text-[#f8f8f2]">
                  {evento.usuario_nome || "Usuário Identificado"}
                </span>
                <span className="text-indigo-700 dark:text-indigo-300 block text-[11px]">
                  {evento.usuario_email} ({evento.usuario_id})
                </span>
              </div>
            </div>
            <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/60 px-2 py-0.5 rounded-md">
              Vinculado
            </span>
          </div>
        )}

        {/* JSON Payload Inspector */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-[#f8f8f2]">
              Payload Recebido (JSON Bruto)
            </label>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-[#bd93f9] hover:text-blue-800 dark:hover:text-[#ff79c6] transition-colors cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-[#50fa7b]" />
                  <span className="text-emerald-600 dark:text-[#50fa7b]">Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copiar JSON</span>
                </>
              )}
            </button>
          </div>

          <pre className="p-3.5 rounded-xl bg-slate-900 dark:bg-[#1e1f29] text-slate-100 dark:text-[#f8f8f2] font-mono text-[11px] max-h-[280px] overflow-y-auto leading-relaxed border border-slate-800 dark:border-[#44475a]">
            {jsonString}
          </pre>
        </div>

        <div className="flex justify-end pt-4 mt-4 border-t border-slate-100 dark:border-[#44475a]">
          <Button variant="outline" size="sm" onClick={onClose}>
            Fechar
          </Button>
        </div>
      </div>
    </div>
  );
}
