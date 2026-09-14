"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Sparkles,
  PenTool,
  CheckCircle,
  XCircle,
  Send,
  Copy,
  Check,
  MessageCircle,
  Printer,
  Trash2,
  Lock,
  X,
  ChevronUp,
  Layers,
} from "lucide-react";

export interface ProposalFloatingActionsProps {
  proposta: {
    id: string;
    numero: string;
    cliente_nome: string;
    status: string;
    assinante_nome?: string;
    regeneracoes_ia?: number;
    regeneracoes_restantes?: number;
  };
  isPro: boolean;
  isAssinada: boolean;
  copiado: boolean;
  isRegenerating: boolean;
  isUpdating: boolean;
  onOpenSignature: () => void;
  onUpdateStatus: (novoStatus: string) => void;
  onMarcarEnviada: () => void;
  onCopyLink: () => void;
  onOpenWhatsApp: () => void;
  onPrint: () => void;
  onOpenRegerarModal: () => void;
  onOpenDeleteModal: () => void;
}

export const ProposalFloatingActions: React.FC<ProposalFloatingActionsProps> = ({
  proposta,
  isPro,
  isAssinada,
  copiado,
  isRegenerating,
  isUpdating,
  onOpenSignature,
  onUpdateStatus,
  onMarcarEnviada,
  onCopyLink,
  onOpenWhatsApp,
  onPrint,
  onOpenRegerarModal,
  onOpenDeleteModal,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const regeneracoesRestantes =
    proposta.regeneracoes_restantes ??
    Math.max(0, 3 - (proposta.regeneracoes_ia || 0));

  const podeRegerar =
    !isRegenerating &&
    regeneracoesRestantes > 0 &&
    proposta.status !== "aceita";

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      const timer = setTimeout(() => {
        document.addEventListener("mousedown", handleClickOutside);
      }, 0);
      return () => {
        clearTimeout(timer);
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [isOpen]);

  const handleAction = (actionFn: () => void) => {
    actionFn();
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className="fixed bottom-6 right-6 z-40 flex flex-col items-end">
      {/* Backdrop for Mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs transition-opacity sm:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Floating Speed Dial / Executive Actions Card */}
      {isOpen && (
        <div
          id="proposal-fab-menu"
          role="menu"
          aria-label="Ações da Proposta"
          className="mb-3 w-[92vw] max-w-sm sm:w-84 bg-white/95 dark:bg-[#282a36]/95 backdrop-blur-md rounded-2xl shadow-2xl border border-slate-200/90 dark:border-[#44475a] overflow-hidden transform animate-in slide-in-from-bottom-4 fade-in duration-200 text-slate-800 dark:text-[#f8f8f2]"
        >
          {/* Header */}
          <div className="px-4 py-3 bg-slate-900 dark:bg-[#21222c] text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-400 dark:text-[#bd93f9]" />
              <span className="text-xs font-bold tracking-tight">
                Ações da Proposta
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono bg-slate-800 dark:bg-[#343746] px-2 py-0.5 rounded text-slate-300 dark:text-[#f8f8f2] font-semibold">
                {proposta.numero}
              </span>
              <button
                onClick={() => setIsOpen(false)}
                title="Fechar menu"
                className="p-1 text-slate-400 dark:text-[#94a3b8] hover:text-white rounded transition-colors cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="p-3 space-y-3 max-h-[75vh] overflow-y-auto">
            {/* Primary Workflow Actions (Assinatura / Envio) */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold text-slate-400 dark:text-[#cbd5e1] uppercase tracking-wider px-1">
                Fechamento & Assinatura
              </span>

              {!isAssinada ? (
                <button
                  type="button"
                  onClick={() => handleAction(onOpenSignature)}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-[#50fa7b]/15 dark:hover:bg-[#50fa7b]/25 border border-emerald-200 dark:border-[#50fa7b]/30 text-emerald-900 dark:text-[#50fa7b] transition-all font-bold text-xs shadow-xs cursor-pointer group"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform">
                      <PenTool className="w-3.5 h-3.5" />
                    </div>
                    <div className="text-left">
                      <div className="font-bold text-emerald-950 dark:text-[#f8f8f2]">Assinar Eletronicamente</div>
                      <div className="text-[10px] text-emerald-700 dark:text-[#cbd5e1] font-normal">Validade jurídica com hash SHA-256</div>
                    </div>
                  </div>
                  {!isPro && <Lock className="w-3.5 h-3.5 text-emerald-600 dark:text-[#50fa7b] shrink-0" />}
                </button>
              ) : null}

              {/* Status Quick Switchers */}
              <div className="grid grid-cols-2 gap-1.5 pt-0.5">
                <button
                  type="button"
                  onClick={() => handleAction(() => onUpdateStatus("aceita"))}
                  disabled={isUpdating}
                  className={`flex items-center justify-center gap-1.5 p-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    proposta.status === "aceita"
                      ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                      : "bg-slate-50 hover:bg-slate-100 dark:bg-[#343746] dark:hover:bg-[#44475a] border-slate-200 dark:border-[#44475a] text-slate-700 dark:text-[#f8f8f2] hover:text-emerald-900 dark:hover:text-[#50fa7b]"
                  }`}
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>Marcar Aceita</span>
                  {!isPro && <Lock className="w-3 h-3 text-slate-400 dark:text-[#94a3b8]" />}
                </button>

                <button
                  type="button"
                  onClick={() => handleAction(() => onUpdateStatus("recusada"))}
                  disabled={isUpdating}
                  className={`flex items-center justify-center gap-1.5 p-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    proposta.status === "recusada"
                      ? "bg-rose-600 text-white border-rose-600 shadow-xs"
                      : "bg-slate-50 hover:bg-slate-100 dark:bg-[#343746] dark:hover:bg-[#44475a] border-slate-200 dark:border-[#44475a] text-slate-700 dark:text-[#f8f8f2] hover:text-rose-900 dark:hover:text-[#ff5555]"
                  }`}
                >
                  <XCircle className="w-3.5 h-3.5" />
                  <span>Recusada</span>
                  {!isPro && <Lock className="w-3 h-3 text-slate-400 dark:text-[#94a3b8]" />}
                </button>
              </div>

              {proposta.status === "rascunho" && (
                <button
                  type="button"
                  onClick={() => handleAction(onMarcarEnviada)}
                  className="w-full flex items-center justify-between p-2 rounded-xl bg-blue-50 hover:bg-blue-100 dark:bg-[#8be9fd]/15 dark:hover:bg-[#8be9fd]/25 border border-blue-200 dark:border-[#8be9fd]/30 text-blue-900 dark:text-[#8be9fd] text-xs font-bold transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <Send className="w-3.5 h-3.5 text-blue-600 dark:text-[#8be9fd]" />
                    <span>Marcar como Enviada</span>
                  </div>
                  <span className="text-[10px] bg-blue-200/80 dark:bg-[#8be9fd]/30 text-blue-900 dark:text-[#8be9fd] px-1.5 py-0.5 rounded font-medium">
                    Status
                  </span>
                </button>
              )}
            </div>

            {/* AI Intelligence Section */}
            <div className="space-y-1.5 pt-1 border-t border-slate-100 dark:border-[#44475a]">
              <span className="text-[10px] font-bold text-slate-400 dark:text-[#cbd5e1] uppercase tracking-wider px-1">
                Inteligência Artificial
              </span>

              <button
                type="button"
                onClick={() => handleAction(onOpenRegerarModal)}
                disabled={!podeRegerar}
                title={
                  proposta.status === "aceita"
                    ? "Propostas aceitas não podem ser alteradas"
                    : regeneracoesRestantes <= 0
                    ? "Limite de 3 regenerações atingido"
                    : "Reescrever escopo com copywriting consultivo"
                }
                className="w-full flex items-center justify-between p-2.5 rounded-xl bg-amber-50/90 hover:bg-amber-100 dark:bg-[#ffb86c]/15 dark:hover:bg-[#ffb86c]/25 border border-amber-200/90 dark:border-[#ffb86c]/30 text-amber-950 dark:text-[#ffb86c] transition-all font-bold text-xs disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                  <div className="text-left">
                    <div className="font-bold text-amber-950 dark:text-[#f8f8f2]">Regerar com IA</div>
                    <div className="text-[10px] text-amber-800 dark:text-[#cbd5e1] font-normal">
                      Metodologia SPIN Selling
                    </div>
                  </div>
                </div>
                <span className="text-[10px] bg-amber-200/90 dark:bg-[#ffb86c]/30 text-amber-950 dark:text-[#ffb86c] font-mono font-bold px-2 py-0.5 rounded-full shrink-0">
                  {regeneracoesRestantes} restantes
                </span>
              </button>
            </div>

            {/* Sharing & Export Section */}
            <div className="space-y-1.5 pt-1 border-t border-slate-100 dark:border-[#44475a]">
              <span className="text-[10px] font-bold text-slate-400 dark:text-[#cbd5e1] uppercase tracking-wider px-1">
                Compartilhamento & Exportação
              </span>

              <button
                type="button"
                onClick={() => handleAction(onOpenWhatsApp)}
                className="w-full flex items-center justify-between p-2 rounded-xl bg-slate-50 hover:bg-emerald-50/80 dark:bg-[#343746] dark:hover:bg-[#50fa7b]/20 border border-slate-200 dark:border-[#44475a] hover:border-emerald-200 text-slate-700 dark:text-[#f8f8f2] hover:text-emerald-950 dark:hover:text-[#50fa7b] text-xs font-semibold transition-all cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <MessageCircle className="w-4 h-4 text-emerald-600 dark:text-[#50fa7b]" />
                  <span>Enviar no WhatsApp</span>
                </div>
                {!isPro && <Lock className="w-3.5 h-3.5 text-slate-400 dark:text-[#94a3b8]" />}
              </button>

              <button
                type="button"
                onClick={() => handleAction(onCopyLink)}
                className="w-full flex items-center justify-between p-2 rounded-xl bg-slate-50 hover:bg-blue-50/80 dark:bg-[#343746] dark:hover:bg-[#8be9fd]/20 border border-slate-200 dark:border-[#44475a] hover:border-blue-200 text-slate-700 dark:text-[#f8f8f2] hover:text-blue-950 dark:hover:text-[#8be9fd] text-xs font-semibold transition-all cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  {copiado ? (
                    <Check className="w-4 h-4 text-emerald-600 dark:text-[#50fa7b]" />
                  ) : (
                    <Copy className="w-4 h-4 text-slate-600 dark:text-[#94a3b8]" />
                  )}
                  <span>{copiado ? "Link Copiado!" : "Copiar Link Público"}</span>
                </div>
                {!isPro && <Lock className="w-3.5 h-3.5 text-slate-400 dark:text-[#94a3b8]" />}
              </button>

              <button
                type="button"
                onClick={() => handleAction(onPrint)}
                className="w-full flex items-center justify-between p-2 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-[#343746] dark:hover:bg-[#44475a] border border-slate-200 dark:border-[#44475a] text-slate-800 dark:text-[#f8f8f2] text-xs font-semibold transition-all cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Printer className="w-4 h-4 text-slate-600 dark:text-[#94a3b8]" />
                  <span>Imprimir / Salvar PDF</span>
                </div>
                {!isPro && <Lock className="w-3.5 h-3.5 text-slate-400 dark:text-[#94a3b8]" />}
              </button>
            </div>

            {/* Danger Zone */}
            <div className="pt-1 border-t border-slate-100 dark:border-[#44475a]">
              <button
                type="button"
                onClick={() => handleAction(onOpenDeleteModal)}
                className="w-full flex items-center gap-2 p-2 rounded-xl text-rose-600 dark:text-[#ff5555] hover:bg-rose-50 dark:hover:bg-[#ff5555]/15 hover:text-rose-800 dark:hover:text-[#ff7777] text-xs font-semibold transition-all cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Excluir Proposta Comercial</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Floating Trigger Button (FAB) */}
      <button
        type="button"
        id="proposal-fab-trigger"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-controls="proposal-fab-menu"
        title={isOpen ? "Fechar ações" : "Abrir menu de ações da proposta"}
        className={`group flex items-center gap-2.5 px-4 py-3 rounded-full shadow-2xl transition-all duration-300 transform active:scale-95 cursor-pointer ${
          isOpen
            ? "bg-slate-900 text-white ring-4 ring-slate-900/20 rotate-0"
            : "bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white hover:shadow-blue-500/25 ring-4 ring-blue-600/20 hover:scale-105"
        }`}
      >
        <div className="relative flex items-center justify-center">
          {isOpen ? (
            <X className="w-5 h-5 transition-transform duration-200" />
          ) : (
            <Sparkles className="w-5 h-5 text-amber-300 animate-pulse" />
          )}

          {/* Unread/Active badge indicator if quota remaining */}
          {!isOpen && regeneracoesRestantes > 0 && proposta.status !== "aceita" && (
            <span className="absolute -top-1.5 -right-1.5 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500" />
            </span>
          )}
        </div>

        <span className="text-xs font-black tracking-wide uppercase pr-1">
          {isOpen ? "Fechar" : "Ações"}
        </span>

        {!isOpen && (
          <ChevronUp className="w-3.5 h-3.5 text-blue-200 group-hover:-translate-y-0.5 transition-transform" />
        )}
      </button>
    </div>
  );
};
