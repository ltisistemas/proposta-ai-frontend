"use client";

import React, { useEffect, useState, useCallback, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Printer,
  Copy,
  CheckCircle,
  XCircle,
  Trash2,
  Send,
  Check,
  Building2,
  Calendar,
  PenTool,
  Lock,
  MessageCircle,
  FileText,
  Sparkles,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/Common/Button";
import { Badge, BadgeVariant } from "@/components/Common/Badge";
import { ConfirmModal } from "@/components/Common/ConfirmModal";
import { useAuthStore } from "@/lib/auth/useAuthStore";
import { useToast } from "@/components/Common/Toast";
import { UpgradeModal, UpgradeFeatureType } from "@/components/Billing/UpgradeModal";
import { SignatureModal } from "@/components/Proposta/SignatureModal";
import { DigitalCertificate } from "@/components/Proposta/DigitalCertificate";
import { WhatsAppModal } from "@/components/Proposta/WhatsAppModal";
import { ajustarHtmlResponsivoProposta } from "@/lib/utils/proposal-html";

export default function VisualizarPropostaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams =
    params && typeof (params as any).then === "function" ? use(params) : (params as any);
  const router = useRouter();
  const { token, user } = useAuthStore();
  const addToast = useToast((state) => state.addToast);

  const [proposta, setProposta] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [copiado, setCopiado] = useState(false);

  // Modals state
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [upgradeFeature, setUpgradeFeature] = useState<UpgradeFeatureType>("general");
  const [signatureModalOpen, setSignatureModalOpen] = useState(false);
  const [whatsAppModalOpen, setWhatsAppModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [regerarModalOpen, setRegerarModalOpen] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);

  const isPro = user?.plano === "pro";

  const carregarProposta = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);

    try {
      const res = await fetch(`/api/propostas/${resolvedParams.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.sucesso && data.proposta) {
        setProposta(data.proposta);
      } else {
        addToast({
          type: "error",
          title: "Proposta não encontrada",
        });
        router.push("/propostas");
      }
    } catch (err) {
      console.error("Erro ao carregar proposta:", err);
    } finally {
      setIsLoading(false);
    }
  }, [token, resolvedParams.id, addToast, router]);

  useEffect(() => {
    carregarProposta();
  }, [carregarProposta]);

  const handleUpdateStatus = async (novoStatus: string) => {
    if (!isPro) {
      setUpgradeFeature("status");
      setUpgradeModalOpen(true);
      return;
    }

    if (!token) return;
    setIsUpdating(true);

    try {
      const res = await fetch(`/api/propostas/${resolvedParams.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: novoStatus }),
      });
      const data = await res.json();
      if (data.sucesso) {
        setProposta((prev: any) => ({ ...prev, status: novoStatus }));
        addToast({
          type: "success",
          title: "Status atualizado!",
          message: `Proposta marcada como ${novoStatus}.`,
        });
      }
    } catch (err) {
      console.error("Erro ao atualizar status:", err);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleMarcarEnviada = async () => {
    if (!token) return;

    try {
      const res = await fetch(`/api/propostas/${resolvedParams.id}/enviar`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ email: proposta.cliente_email }),
      });
      const data = await res.json();
      if (data.sucesso) {
        setProposta((prev: any) => ({ ...prev, status: "enviada" }));
        addToast({
          type: "success",
          title: "Proposta enviada!",
          message: "Status atualizado para Enviada.",
        });
      }
    } catch (err) {
      console.error("Erro ao enviar:", err);
    }
  };

  const handleCopyLink = () => {
    if (!isPro) {
      setUpgradeFeature("link");
      setUpgradeModalOpen(true);
      return;
    }

    const publicUrl = `${window.location.origin}/p/${proposta.id}`;
    navigator.clipboard.writeText(publicUrl);
    setCopiado(true);
    addToast({
      type: "success",
      title: "Link público copiado!",
      message: "Link de visualização e assinatura pronto para enviar ao cliente.",
    });
    setTimeout(() => setCopiado(false), 2500);
  };

  const handleOpenWhatsAppModal = () => {
    if (!isPro) {
      setUpgradeFeature("link");
      setUpgradeModalOpen(true);
      return;
    }
    setWhatsAppModalOpen(true);
  };

  const handlePrint = () => {
    if (!isPro) {
      setUpgradeFeature("pdf");
      setUpgradeModalOpen(true);
      return;
    }

    const printWindow = window.open("", "_blank");
    if (printWindow && proposta?.conteudo_html) {
      const htmlResponsivo = ajustarHtmlResponsivoProposta(proposta.conteudo_html);
      printWindow.document.write(htmlResponsivo);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 500);
    }
  };

  const handleOpenSignature = () => {
    if (!isPro) {
      setUpgradeFeature("signature");
      setUpgradeModalOpen(true);
      return;
    }
    setSignatureModalOpen(true);
  };

  const handleRegenerarIA = async () => {
    if (!token) return;
    setIsRegenerating(true);

    try {
      const res = await fetch(`/api/propostas/${resolvedParams.id}/regerar-ia`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (data.sucesso && data.proposta) {
        setProposta(data.proposta);
        addToast({
          type: "success",
          title: "Proposta reescrita com sucesso!",
          message: "A IA consultiva re-analisou e expandiu o escopo comercial.",
        });
        setRegerarModalOpen(false);
      } else {
        addToast({
          type: "error",
          title: "Não foi possível regerar",
          message: data.erro || "Tente novamente mais tarde.",
        });
      }
    } catch (err) {
      console.error("Erro ao regerar proposta:", err);
      addToast({
        type: "error",
        title: "Erro de conexão",
        message: "Falha ao conectar com o serviço de IA.",
      });
    } finally {
      setIsRegenerating(false);
    }
  };

  const executeDelete = async () => {
    if (!token) return;

    try {
      setIsDeleting(true);
      const res = await fetch(`/api/propostas/${resolvedParams.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.sucesso) {
        addToast({
          type: "success",
          title: "Proposta excluída com sucesso!",
        });
        router.push("/propostas");
      } else {
        addToast({
          type: "error",
          title: "Erro ao excluir",
          message: data.erro || "Tente novamente.",
        });
      }
    } catch (err) {
      console.error("Erro ao excluir proposta:", err);
      addToast({
        type: "error",
        title: "Erro de conexão",
        message: "Não foi possível excluir a proposta no momento.",
      });
    } finally {
      setIsDeleting(false);
      setDeleteModalOpen(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-16 text-center text-slate-500">
        Carregando proposta comercial...
      </div>
    );
  }

  if (!proposta) return null;

  const isAssinada = proposta.status === "aceita" && proposta.assinante_nome;
  const publicUrl = typeof window !== "undefined" ? `${window.location.origin}/p/${proposta.id}` : "";

  return (
    <>
      <UpgradeModal
        isOpen={upgradeModalOpen}
        onClose={() => setUpgradeModalOpen(false)}
        feature={upgradeFeature}
      />

      <SignatureModal
        isOpen={signatureModalOpen}
        onClose={() => setSignatureModalOpen(false)}
        propostaId={proposta.id}
        clienteNomeDefault={proposta.cliente_nome}
        onSuccess={(propostaAtualizada) => {
          setProposta((prev: any) => ({
            ...prev,
            ...propostaAtualizada,
            status: "aceita",
          }));
        }}
      />

      <WhatsAppModal
        isOpen={whatsAppModalOpen}
        onClose={() => setWhatsAppModalOpen(false)}
        dados={{
          numero: proposta.numero,
          clienteNome: proposta.cliente_nome,
          clienteEmpresa: proposta.cliente_empresa,
          empresaNome: user?.empresa_nome || user?.nome,
          empresaTelefone: proposta.cliente_telefone || user?.empresa_telefone,
          descricao: proposta.descricao,
          total: proposta.total,
          prazoPagamento: proposta.prazo_pagamento,
          validadeDias: proposta.validade_dias,
          itens: proposta.itens,
          publicUrl,
        }}
      />

      <div className="space-y-6 max-w-6xl mx-auto pb-16">
        {/* Breadcrumbs & Navigation */}
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
          <Link
            href="/propostas"
            className="hover:text-blue-600 transition-colors flex items-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Minhas Propostas</span>
          </Link>
          <span>/</span>
          <span className="text-slate-800 font-mono">{proposta.numero}</span>
        </div>

        {/* Top Executive Header Card */}
        <div className="bg-white border border-slate-200/90 p-4 sm:p-6 rounded-3xl shadow-xs space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  {proposta.cliente_nome}
                </h1>
                <Badge variant={proposta.status as BadgeVariant} />
                {!isPro && (
                  <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                    Modo Notepad Free
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 mt-2 font-medium">
                <span className="font-mono bg-slate-100 px-2.5 py-0.5 rounded-md text-slate-700 font-bold">
                  {proposta.numero}
                </span>
                {proposta.cliente_empresa && (
                  <span className="flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5 text-slate-400" />
                    {proposta.cliente_empresa}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  Criada em {new Date(proposta.criado_em).toLocaleDateString("pt-BR")}
                </span>
              </div>
            </div>

            {/* Action Group */}
            <div className="flex flex-wrap items-center gap-2 pt-2 lg:pt-0">
              {/* Electronic Signature Trigger */}
              {!isAssinada ? (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleOpenSignature}
                  leftIcon={<PenTool className="w-4 h-4" />}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/20"
                >
                  Assinar Eletronicamente
                </Button>
              ) : null}

              {/* Status Quick Changer */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
                <button
                  onClick={() => handleUpdateStatus("aceita")}
                  disabled={isUpdating}
                  title={isPro ? "Marcar como Aceita" : "Disponível no Plano Pro"}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                    proposta.status === "aceita"
                      ? "bg-emerald-600 text-white shadow-xs"
                      : "text-slate-700 hover:text-emerald-800 hover:bg-emerald-100/70"
                  }`}
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>Aceita</span>
                  {!isPro && <Lock className="w-3 h-3 text-slate-400" />}
                </button>

                <button
                  onClick={() => handleUpdateStatus("recusada")}
                  disabled={isUpdating}
                  title={isPro ? "Marcar como Recusada" : "Disponível no Plano Pro"}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                    proposta.status === "recusada"
                      ? "bg-rose-600 text-white shadow-xs"
                      : "text-slate-700 hover:text-rose-800 hover:bg-rose-100/70"
                  }`}
                >
                  <XCircle className="w-3.5 h-3.5" />
                  <span>Recusada</span>
                  {!isPro && <Lock className="w-3 h-3 text-slate-400" />}
                </button>
              </div>

              {/* AI Redeploy / Regenerate Button (Max 3x per proposal) */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setRegerarModalOpen(true)}
                disabled={
                  isRegenerating ||
                  (proposta.regeneracoes_restantes ?? (3 - (proposta.regeneracoes_ia || 0))) <= 0 ||
                  proposta.status === "aceita"
                }
                leftIcon={
                  <Sparkles
                    className={`w-4 h-4 ${
                      isRegenerating
                        ? "animate-spin text-amber-600"
                        : "text-amber-600"
                    }`}
                  />
                }
                title={
                  proposta.status === "aceita"
                    ? "Propostas aceitas ou assinadas não podem ser alteradas"
                    : (proposta.regeneracoes_restantes ?? (3 - (proposta.regeneracoes_ia || 0))) <= 0
                    ? "Limite máximo de 3 regenerações por IA atingido para esta proposta"
                    : "Re-analisar escopo comercial e expandir com copywriting consultivo de alta conversão"
                }
                className="text-xs font-bold border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 shadow-xs transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                <span className="flex items-center gap-1.5">
                  <span>Regerar com IA</span>
                  <span className="text-[10px] bg-amber-200/90 text-amber-950 px-1.5 py-0.5 rounded-full font-mono font-bold">
                    {proposta.regeneracoes_restantes ?? (3 - (proposta.regeneracoes_ia || 0))} restantes
                  </span>
                </span>
              </Button>

              {/* Share & Copy Link */}
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyLink}
                leftIcon={
                  copiado ? (
                    <Check className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )
                }
                className="text-xs font-bold"
              >
                {copiado ? "Copiado!" : "Copiar Link"}
                {!isPro && <Lock className="w-3 h-3 text-slate-400 ml-1" />}
              </Button>

              {/* WhatsApp Formatted Share */}
              <Button
                variant="outline"
                size="sm"
                onClick={handleOpenWhatsAppModal}
                leftIcon={<MessageCircle className="w-4 h-4 text-emerald-600" />}
                className="text-xs font-bold"
                title="Abrir prévia e envio formatado no WhatsApp"
              >
                WhatsApp
                {!isPro && <Lock className="w-3 h-3 text-slate-400 ml-1" />}
              </Button>

              {/* Print / PDF */}
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrint}
                leftIcon={<Printer className="w-4 h-4" />}
                className="text-xs font-bold"
              >
                Imprimir / PDF
                {!isPro && <Lock className="w-3 h-3 text-slate-400 ml-1" />}
              </Button>

              {proposta.status === "rascunho" && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleMarcarEnviada}
                  leftIcon={<Send className="w-4 h-4" />}
                  className="shadow-md shadow-blue-600/20 font-bold text-xs"
                >
                  Marcar Enviada
                </Button>
              )}

              <button
                onClick={() => setDeleteModalOpen(true)}
                title="Excluir proposta"
                className="p-2 text-slate-600 hover:text-rose-800 hover:bg-rose-100/70 rounded-xl transition-colors cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Digital Certificate of Acceptance Seal if Signed */}
        {isAssinada && (
          <DigitalCertificate
            assinanteNome={proposta.assinante_nome}
            assinanteDocumento={proposta.assinante_documento}
            assinadoEm={proposta.assinado_em || proposta.atualizado_em}
            assinaturaIp={proposta.assinatura_ip}
            assinaturaHash={proposta.assinatura_hash}
          />
        )}

        {/* Document Reader Container (Executive Canvas with Mobile Optimization) */}
        <div className="bg-[#F1F5F9] border border-slate-200/90 rounded-2xl sm:rounded-3xl p-1.5 sm:p-6 md:p-10 shadow-sm flex flex-col items-center overflow-x-hidden w-full">
          <div className="w-full max-w-4xl bg-white rounded-xl sm:rounded-2xl overflow-hidden shadow-2xl border border-slate-200/80 min-h-[85vh]">
            <iframe
              srcDoc={ajustarHtmlResponsivoProposta(proposta.conteudo_html)}
              title={`Proposta Comercial ${proposta.numero}`}
              className="w-full min-h-[85vh] h-full border-0 block"
              style={{ minHeight: "85vh" }}
            />
          </div>
        </div>

        {/* AI Regeneration Confirmation Modal */}
        <ConfirmModal
          isOpen={regerarModalOpen}
          onClose={() => !isRegenerating && setRegerarModalOpen(false)}
          title="Reescrever proposta com IA Consultiva?"
          description={
            <div className="space-y-3 text-slate-600 text-sm">
              <p>
                A Inteligência Artificial re-analisará a descrição do projeto e enriquecerá a seção{" "}
                <strong className="text-slate-900 font-semibold">1. Diagnóstico, Escopo & Metodologia de Entrega</strong>{" "}
                com metodologia consultiva (SPIN Selling), detalhamento de fases estratégicas e entregáveis de alto valor.
              </p>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-900 space-y-1.5">
                <div className="flex items-center gap-1.5 font-bold text-amber-950">
                  <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>
                    Restam {proposta.regeneracoes_restantes ?? (3 - (proposta.regeneracoes_ia || 0))} de 3 tentativas para esta proposta
                  </span>
                </div>
                <p className="text-amber-800">
                  Os itens financeiros, valores e prazos cadastrados serão preservados intactos.
                </p>
              </div>
            </div>
          }
          confirmLabel={isRegenerating ? "Reescrevendo com IA..." : "Sim, regerar proposta"}
          cancelLabel="Cancelar"
          variant="primary"
          isLoading={isRegenerating}
          onConfirm={handleRegenerarIA}
        />

        {/* Delete Confirmation Modal */}
        <ConfirmModal
          isOpen={deleteModalOpen}
          onClose={() => setDeleteModalOpen(false)}
          title="Excluir esta proposta comercial?"
          description={
            proposta ? (
              <span>
                Tem certeza que deseja excluir a proposta{" "}
                <strong className="text-slate-900 font-semibold">{proposta.numero}</strong>{" "}
                do cliente <strong className="text-slate-900 font-semibold">{proposta.cliente_nome}</strong>?
                Esta ação moverá o documento e não poderá ser desfeita.
              </span>
            ) : (
              "Esta ação removerá a proposta e não poderá ser desfeita."
            )
          }
          confirmLabel="Sim, excluir proposta"
          cancelLabel="Cancelar"
          variant="danger"
          isLoading={isDeleting}
          onConfirm={executeDelete}
        />
      </div>
    </>
  );
}
