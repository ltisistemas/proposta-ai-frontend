"use client";

import React, { useState } from "react";
import { PenTool, ShieldCheck, Check, User, FileText } from "lucide-react";
import { Modal } from "@/components/Common/Modal";
import { Input } from "@/components/Common/Input";
import { Button } from "@/components/Common/Button";
import { useToast } from "@/components/Common/Toast";

interface SignatureModalProps {
  isOpen: boolean;
  onClose: () => void;
  propostaId: string;
  clienteNomeDefault?: string;
  onSuccess: (propostaAtualizada: any) => void;
}

export function SignatureModal({
  isOpen,
  onClose,
  propostaId,
  clienteNomeDefault = "",
  onSuccess,
}: SignatureModalProps) {
  const { addToast } = useToast();
  const [nome, setNome] = useState(clienteNomeDefault);
  const [documento, setDocumento] = useState("");
  const [concordoTermos, setConcordoTermos] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!nome.trim() || nome.trim().length < 3) {
      addToast({
        type: "warning",
        title: "Nome incompleto",
        message: "Por favor informe o nome completo do signatário.",
      });
      return;
    }

    if (!documento.trim() || documento.trim().length < 11) {
      addToast({
        type: "warning",
        title: "Documento inválido",
        message: "Por favor informe um CPF ou CNPJ válido.",
      });
      return;
    }

    if (!concordoTermos) {
      addToast({
        type: "warning",
        title: "Aceite dos termos",
        message: "É necessário marcar o aceite dos termos e valores da proposta.",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch(`/api/propostas/${propostaId}/assinar`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nome: nome.trim(),
          documento: documento.trim(),
        }),
      });

      const data = await res.json();

      if (data.sucesso && data.proposta) {
        addToast({
          type: "success",
          title: "Proposta assinada com sucesso!",
          message: "O status da proposta foi atualizado para Aceita.",
        });
        onSuccess(data.proposta);
        onClose();
      } else {
        addToast({
          type: "error",
          title: "Erro na assinatura",
          message: data.erro || "Não foi possível registrar a assinatura.",
        });
      }
    } catch (err) {
      console.error("Erro ao assinar proposta:", err);
      addToast({
        type: "error",
        title: "Erro de conexão",
        message: "Verifique sua internet e tente novamente.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md" bodyClassName="p-6 sm:p-7">
      <div className="text-left space-y-5">
        {/* Header */}
        <div className="flex items-center gap-3 pb-3 border-b border-slate-100 pr-6">
          <div className="w-10 h-10 rounded-[4px] bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 shadow-2xs shrink-0">
            <PenTool className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-900 tracking-tight">
              Assinatura Eletrônica & Aceite
            </h3>
            <p className="text-xs text-slate-500">
              Registre sua aprovação formal e gere o certificado de validade.
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Nome Completo do Signatário *"
            required
            placeholder="Ex: João da Silva Santos"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            leftIcon={<User className="w-4 h-4" />}
          />

          <Input
            label="CPF ou CNPJ do Signatário / Empresa *"
            required
            placeholder="000.000.000-00 ou 00.000.000/0001-00"
            value={documento}
            onChange={(e) => setDocumento(e.target.value)}
            leftIcon={<FileText className="w-4 h-4" />}
            helperText="Será gravado no hash de auditoria criptográfica da proposta."
          />

          {/* Legal agreement checkbox */}
          <div className="p-4 rounded-[4px] bg-slate-50 border border-slate-200/90 space-y-2">
            <label className="flex items-start gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={concordoTermos}
                onChange={(e) => setConcordoTermos(e.target.checked)}
                className="mt-0.5 w-4 h-4 text-blue-600 rounded-[2px] border-slate-300 focus:ring-blue-500 cursor-pointer"
              />
              <span className="text-xs text-slate-700 leading-relaxed">
                Declaro que li e concordo integralmente com o escopo, cronograma, valores e condições comerciais apresentadas neste documento.
              </span>
            </label>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-slate-600 bg-blue-50/60 p-3 rounded-[4px] border border-blue-100">
            <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
            <span>Assinatura registrada com data, hora, endereço IP e hash criptográfico SHA-256.</span>
          </div>

          <div className="pt-2 flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="ghost"
              size="md"
              onClick={onClose}
              className="text-slate-600 rounded-[4px]"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={isSubmitting}
              className="font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-sm rounded-[4px]"
              leftIcon={<Check className="w-4 h-4" />}
            >
              Confirmar & Assinar
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
