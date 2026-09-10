"use client";

import React, { useEffect, useState, use } from "react";
import Link from "next/link";
import {
  Printer,
  ShieldCheck,
  CheckCircle2,
  PenTool,
  Lock,
  Building2,
  Calendar,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/Common/Button";
import { Badge, BadgeVariant } from "@/components/Common/Badge";
import { Logo } from "@/components/Common/Logo";
import { ToastContainer, useToast } from "@/components/Common/Toast";
import { SignatureModal } from "@/components/Proposta/SignatureModal";
import { DigitalCertificate } from "@/components/Proposta/DigitalCertificate";
import { SignatureManifesto, gerarManifestoHTML } from "@/components/Proposta/SignatureManifesto";

export default function PublicProposalPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const { addToast } = useToast();

  const [proposta, setProposta] = useState<any>(null);
  const [emissor, setEmissor] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isBlockedFree, setIsBlockedFree] = useState(false);
  const [signatureModalOpen, setSignatureModalOpen] = useState(false);

  useEffect(() => {
    async function loadPublicProposal() {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/public/propostas/${resolvedParams.id}`);
        const data = await res.json();

        if (data.sucesso && data.proposta) {
          setProposta(data.proposta);
          setEmissor(data.emissor);
        } else if (data.bloqueadoPlanoFree) {
          setIsBlockedFree(true);
        } else {
          addToast({
            type: "error",
            title: "Proposta não encontrada",
            message: data.erro || "Verifique o link e tente novamente.",
          });
        }
      } catch (err) {
        console.error("Erro ao carregar proposta pública:", err);
      } finally {
        setIsLoading(false);
      }
    }

    loadPublicProposal();
  }, [resolvedParams.id, addToast]);

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    if (printWindow && proposta?.conteudo_html) {
      const manifestoHtml = gerarManifestoHTML(proposta, emissor);
      const htmlCompleto = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Proposta Comercial ${proposta.numero}</title>
          <style>
            @media print {
              body { margin: 0; padding: 0; }
              .signature-manifesto-container { page-break-before: always; break-before: page; }
            }
          </style>
        </head>
        <body>
          ${proposta.conteudo_html}
          ${manifestoHtml}
        </body>
        </html>
      `;
      printWindow.document.write(htmlCompleto);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 500);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FBFBFA] flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs font-semibold text-slate-500">
            Carregando proposta comercial segura...
          </p>
        </div>
      </div>
    );
  }

  if (isBlockedFree) {
    return (
      <div className="min-h-screen bg-[#FBFBFA] flex flex-col items-center justify-center p-4 text-slate-900">
        <ToastContainer />
        <div className="max-w-md w-full bg-white border border-slate-200/90 rounded-3xl p-8 text-center shadow-xl space-y-6">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto shadow-xs">
            <Lock className="w-7 h-7" />
          </div>

          <div className="space-y-2">
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-bold bg-amber-100/70 text-amber-800 border border-amber-200">
              Recurso Exclusivo Plano Pro
            </span>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">
              Visualização Pública Bloqueada
            </h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              Esta proposta foi gerada no plano gratuito do ViraPropo AI!. O compartilhamento público via link e assinatura eletrônica são exclusivos para assinantes do <strong>Plano Pro</strong>.
            </p>
          </div>

          <div className="pt-2 border-t border-slate-100 flex flex-col gap-2">
            <Link href="/login">
              <Button variant="primary" size="md" className="w-full justify-center font-bold">
                Acessar Minha Conta / Fazer Upgrade
              </Button>
            </Link>
            <Link href="/">
              <Button variant="ghost" size="sm" className="w-full justify-center text-xs text-slate-500">
                Conhecer o ViraPropo AI!
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!proposta) {
    return (
      <div className="min-h-screen bg-[#FBFBFA] flex flex-col items-center justify-center p-4 text-center">
        <h2 className="text-lg font-bold text-slate-800">Proposta não encontrada</h2>
        <p className="text-xs text-slate-500 mt-1">Este documento pode ter sido removido ou expirado.</p>
        <Link href="/" className="mt-4">
          <Button variant="outline" size="sm">Página Inicial</Button>
        </Link>
      </div>
    );
  }

  const isAssinada = proposta.status === "aceita" && proposta.assinante_nome;

  return (
    <div className="min-h-screen bg-[#FBFBFA] text-slate-900 flex flex-col antialiased">
      <ToastContainer />

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

      {/* Top Header Bar */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/90 py-3.5 px-4 sm:px-8 shadow-xs">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Logo size="sm" variant="light" href="/" />
            <span className="hidden sm:inline-block text-slate-300">|</span>
            <div className="hidden sm:flex items-center gap-2 text-xs text-slate-600 font-medium">
              <span className="font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-700 font-bold">
                {proposta.numero}
              </span>
              <span>•</span>
              <span className="font-semibold text-slate-900">{proposta.cliente_nome}</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <Badge variant={proposta.status as BadgeVariant} size="md" />

            {!isAssinada ? (
              <Button
                variant="primary"
                size="sm"
                onClick={() => setSignatureModalOpen(true)}
                leftIcon={<PenTool className="w-4 h-4" />}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/20"
              >
                Aceitar & Assinar
              </Button>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-lg">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Assinada
              </span>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={handlePrint}
              leftIcon={<Printer className="w-4 h-4" />}
              className="text-xs font-bold"
            >
              Imprimir / PDF
            </Button>
          </div>
        </div>
      </header>

      {/* Content Canvas */}
      <main className="flex-1 max-w-6xl mx-auto w-full p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Certificate banner if signed */}
        {isAssinada && (
          <DigitalCertificate
            assinanteNome={proposta.assinante_nome}
            assinanteDocumento={proposta.assinante_documento}
            assinadoEm={proposta.assinado_em || proposta.atualizado_em}
            assinaturaIp={proposta.assinatura_ip}
            assinaturaHash={proposta.assinatura_hash}
          />
        )}

        {/* Action callout if awaiting signature */}
        {!isAssinada && (
          <div className="bg-gradient-to-r from-blue-900 via-blue-950 to-slate-900 text-white p-5 sm:p-6 rounded-3xl shadow-lg border border-blue-500/30 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3.5 text-left">
              <div className="w-11 h-11 rounded-2xl bg-blue-600/30 border border-blue-400/40 text-blue-300 flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">
                  Esta proposta comercial aguarda sua aprovação
                </h3>
                <p className="text-xs text-blue-200 mt-0.5">
                  Você pode formalizar o aceite eletronicamente com validade jurídica em menos de 1 minuto.
                </p>
              </div>
            </div>

            <Button
              onClick={() => setSignatureModalOpen(true)}
              variant="primary"
              size="md"
              leftIcon={<PenTool className="w-4 h-4" />}
              className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black shrink-0 shadow-lg shadow-emerald-500/20"
            >
              Assinar Proposta Agora
            </Button>
          </div>
        )}

        {/* Document Viewer Container */}
        <div className="bg-[#F1F5F9] border border-slate-200/90 rounded-3xl p-2 sm:p-6 md:p-10 shadow-sm flex flex-col items-center overflow-x-hidden">
          <div className="w-full max-w-4xl bg-white rounded-2xl overflow-hidden shadow-2xl border border-slate-200/80 min-h-[85vh]">
            <iframe
              srcDoc={proposta.conteudo_html}
              title={`Proposta Comercial ${proposta.numero}`}
              className="w-full min-h-[85vh] h-full border-0 block"
              style={{ minHeight: "85vh" }}
            />
          </div>
        </div>

        {/* Dedicated Signature Manifesto (Printed on final page) */}
        <SignatureManifesto proposta={proposta} emissor={emissor} />
      </main>

      {/* Footer */}
      <footer className="py-6 text-center text-xs text-slate-400 border-t border-slate-200 bg-white">
        Proposta gerada via <strong>ViraPropo AI!</strong> • Plataforma de Inteligência Comercial
      </footer>
    </div>
  );
}
