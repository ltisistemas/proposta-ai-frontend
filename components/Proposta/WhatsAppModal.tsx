"use client";

import React, { useState } from "react";
import { MessageCircle, Copy, Check, Phone, Send } from "lucide-react";
import { Modal } from "@/components/Common/Modal";
import { Button } from "@/components/Common/Button";
import { Input } from "@/components/Common/Input";
import { useToast } from "@/components/Common/Toast";
import { gerarTextoWhatsApp, abrirWhatsAppWeb, DadosWhatsApp } from "@/lib/utils/whatsapp";

interface WhatsAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  dados: DadosWhatsApp;
}

export function WhatsAppModal({ isOpen, onClose, dados }: WhatsAppModalProps) {
  const { addToast } = useToast();
  const [telefone, setTelefone] = useState(dados.empresaTelefone || "");
  const [copiado, setCopiado] = useState(false);

  const textoMensagem = gerarTextoWhatsApp(dados);

  const handleCopyText = () => {
    navigator.clipboard.writeText(textoMensagem);
    setCopiado(true);
    addToast({
      type: "success",
      title: "Texto copiado!",
      message: "Texto formatado para WhatsApp copiado com sucesso.",
    });
    setTimeout(() => setCopiado(false), 2500);
  };

  const handleSendWhatsApp = () => {
    abrirWhatsAppWeb(textoMensagem, telefone || undefined);
    addToast({
      type: "info",
      title: "Abrindo WhatsApp...",
      message: "Redirecionando para o WhatsApp com a mensagem formatada.",
    });
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg" bodyClassName="p-6 sm:p-7">
      <div className="text-left space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 pb-3 border-b border-slate-100 dark:border-[#44475a] pr-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-[4px] bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-100 dark:border-emerald-800/40 shadow-2xs shrink-0">
              <MessageCircle className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-slate-900 dark:text-[#f8f8f2] tracking-tight">
                  Texto Formatado para WhatsApp
                </h3>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 px-2 py-0.5 rounded-[4px] border border-emerald-200 dark:border-emerald-800/60">
                  Plano Pro
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-[#cbd5e1] mt-0.5">
                Envie um resumo executivo estruturado diretamente para o WhatsApp do cliente.
              </p>
            </div>
          </div>
        </div>

        {/* Live Message Preview Bubble */}
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-[#f8f8f2] flex items-center justify-between">
            <span>Prévia da Mensagem Formatada</span>
            <span className="text-[11px] font-normal text-slate-400 dark:text-[#cbd5e1]">
              Usa markdown oficial do WhatsApp (*negrito*, _itálico_, links)
            </span>
          </label>

          <div className="bg-[#EFEAE2] dark:bg-[#1e1f29] p-4 rounded-[4px] border border-[#d1c7b7] dark:border-[#44475a] shadow-inner font-sans text-xs text-slate-900 dark:text-[#f8f8f2] leading-relaxed whitespace-pre-line max-h-60 overflow-y-auto">
            <div className="bg-white dark:bg-[#282a36] p-3.5 rounded-[4px] shadow-2xs border border-emerald-900/5 dark:border-[#44475a] max-w-full">
              {textoMensagem}
            </div>
          </div>
        </div>

        {/* Phone Input (Optional) */}
        <div className="pt-1">
          <Input
            label="Número do WhatsApp do Cliente (Opcional)"
            placeholder="(11) 98765-4321"
            value={telefone}
            onChange={(e) => setTelefone(e.target.value)}
            leftIcon={<Phone className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />}
            helperText="Se preenchido, abrirá a conversa diretamente com o cliente no WhatsApp."
          />
        </div>

        {/* Action Buttons */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-100 dark:border-[#44475a]">
          <Button
            type="button"
            variant="outline"
            size="md"
            onClick={handleCopyText}
            leftIcon={
              copiado ? (
                <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <Copy className="w-4 h-4" />
              )
            }
            className="w-full sm:w-auto font-bold text-xs rounded-[4px]"
          >
            {copiado ? "Texto Copiado!" : "Copiar Apenas o Texto"}
          </Button>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <Button
              type="button"
              variant="ghost"
              size="md"
              onClick={onClose}
              className="text-xs text-slate-600 dark:text-[#cbd5e1] dark:hover:text-[#f8f8f2] rounded-[4px]"
            >
              Cancelar
            </Button>

            <Button
              type="button"
              variant="primary"
              size="md"
              onClick={handleSendWhatsApp}
              leftIcon={<Send className="w-4 h-4" />}
              className="w-full sm:w-auto font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm text-xs rounded-[4px]"
            >
              Abrir no WhatsApp
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
