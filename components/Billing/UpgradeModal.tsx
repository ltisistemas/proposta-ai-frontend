"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Sparkles,
  Check,
  ArrowRight,
  ShieldCheck,
  FileDown,
  Link as LinkIcon,
  PenTool,
  Image as ImageIcon,
  Zap,
  QrCode,
  Copy,
  CheckCircle2,
  RefreshCw,
  ArrowLeft,
  Clock,
  ExternalLink,
} from "lucide-react";
import { Modal } from "@/components/Common/Modal";
import { Button } from "@/components/Common/Button";
import { useAuthStore } from "@/lib/auth/useAuthStore";
import { useToast } from "@/components/Common/Toast";
import { tracker } from "@/lib/analytics/tracker";

export type UpgradeFeatureType =
  | "pdf"
  | "link"
  | "signature"
  | "status"
  | "logo"
  | "limit"
  | "general";

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  feature?: UpgradeFeatureType;
}

interface PixChargeData {
  chargeId: string;
  amount: number;
  brCode: string;
  brCodeBase64: string;
  invoiceUrl?: string;
  expiresAt?: string;
  devMode?: boolean;
}

const FEATURE_CONFIG: Record<
  UpgradeFeatureType,
  { title: string; subtitle: string; icon: React.ReactNode }
> = {
  pdf: {
    title: "Impressão e PDF Exclusivos do Plano Pro",
    subtitle: "Exporte propostas comerciais em PDF de alta qualidade e com design executivo.",
    icon: <FileDown className="w-5 h-5 text-blue-600" />,
  },
  link: {
    title: "Compartilhamento por Link Exclusivo Pro",
    subtitle: "Gere links públicos e compartilhe suas propostas com clientes via WhatsApp e redes.",
    icon: <LinkIcon className="w-5 h-5 text-blue-600" />,
  },
  signature: {
    title: "Assinatura Eletrônica Exclusiva do Plano Pro",
    subtitle: "Colete assinaturas digitais com certificado de conformidade jurídica e hash de auditoria.",
    icon: <PenTool className="w-5 h-5 text-blue-600" />,
  },
  status: {
    title: "Gestão de Status & Fechamento Pro",
    subtitle: "Acompanhe seu pipeline comercial marcando propostas como Aceitas ou Recusadas.",
    icon: <ShieldCheck className="w-5 h-5 text-blue-600" />,
  },
  logo: {
    title: "Logotipo Personalizado em Base64",
    subtitle: "Adicione sua marca oficial no cabeçalho de todas as propostas para máxima credibilidade.",
    icon: <ImageIcon className="w-5 h-5 text-blue-600" />,
  },
  limit: {
    title: "Você atingiu o limite de propostas gratuitas",
    subtitle: "Desbloqueie geração ilimitada de propostas comerciais com inteligência artificial.",
    icon: <Zap className="w-5 h-5 text-blue-600" />,
  },
  general: {
    title: "Desbloqueie todo o poder do ViraPropo AI! Pro",
    subtitle: "Aumente sua taxa de conversão com propostas executivas e ferramentas de fechamento.",
    icon: <Sparkles className="w-5 h-5 text-blue-600" />,
  },
};

export function UpgradeModal({
  isOpen,
  onClose,
  feature = "general",
}: UpgradeModalProps) {
  const { token, updateUser, fetchMe } = useAuthStore();
  const { addToast } = useToast();

  const [step, setStep] = useState<"DETAILS" | "PIX" | "SUCCESS">("DETAILS");
  const [isLoading, setIsLoading] = useState(false);
  const [pixData, setPixData] = useState<PixChargeData | null>(null);
  const [hasCopied, setHasCopied] = useState(false);
  const [imgError, setImgError] = useState(false);

  const pollingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const config = FEATURE_CONFIG[feature] || FEATURE_CONFIG.general;

  const getQrCodeSrc = (base64Str?: string): string | null => {
    if (!base64Str) return null;
    const trimmed = base64Str.trim();
    if (!trimmed) return null;
    if (trimmed.startsWith("data:")) return trimmed;
    return `data:image/png;base64,${trimmed}`;
  };

  const isValidInvoiceUrl = (url?: string): boolean => {
    if (!url || typeof url !== "string") return false;
    try {
      const parsed = new URL(url);
      return parsed.protocol === "http:" || parsed.protocol === "https:";
    } catch {
      return false;
    }
  };

  // Limpa estados ao fechar ou reabrir
  useEffect(() => {
    if (!isOpen) {
      if (pollingTimerRef.current) clearInterval(pollingTimerRef.current);
      setTimeout(() => {
        setStep("DETAILS");
        setPixData(null);
        setHasCopied(false);
        setImgError(false);
      }, 300);
    }
  }, [isOpen]);

  // Polling de status enquanto na tela do PIX
  useEffect(() => {
    if (step === "PIX" && pixData?.chargeId && token) {
      const checkStatus = async () => {
        try {
          const res = await fetch(
            `/api/checkout/status?chargeId=${encodeURIComponent(pixData.chargeId)}`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );
          const data = await res.json();

          if (data.status === "PAID" || data.isPro) {
            updateUser({ plano: "pro" });
            await fetchMe();
            setStep("SUCCESS");
            if (pollingTimerRef.current) clearInterval(pollingTimerRef.current);
            try {
              tracker.purchase({
                transaction_id: pixData.chargeId,
                value: pixData.amount || 45.9,
                currency: "BRL",
                content_name: "Assinatura ViraPropo AI! Pro",
              });
            } catch (trackErr) {
              console.warn("Aviso ao rastrear Purchase:", trackErr);
            }
            addToast({
              type: "success",
              title: "🎉 Pagamento Confirmado!",
              message: "Seu plano Pro foi ativado com sucesso.",
            });
          }
        } catch (err) {
          console.error("Erro no polling do PIX Asaas:", err);
        }
      };

      pollingTimerRef.current = setInterval(checkStatus, 3000);

      return () => {
        if (pollingTimerRef.current) clearInterval(pollingTimerRef.current);
      };
    }
  }, [step, pixData?.chargeId, token, updateUser, fetchMe, addToast]);

  const handleGerarPix = async () => {
    if (!token) {
      addToast({
        type: "error",
        title: "Faça login para continuar",
      });
      return;
    }

    setIsLoading(true);
    setImgError(false);

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const data = await res.json();

      if (data.sucesso && data.brCode) {
        setPixData({
          chargeId: data.chargeId,
          amount: data.amount || 45.9,
          brCode: data.brCode,
          brCodeBase64: data.brCodeBase64,
          invoiceUrl: data.invoiceUrl,
          expiresAt: data.expiresAt,
          devMode: data.devMode,
        });
        setStep("PIX");
        try {
          tracker.initiateCheckout({
            value: data.amount || 45.9,
            currency: "BRL",
            content_name: "Assinatura ViraPropo AI! Pro",
          });
        } catch (trackErr) {
          console.warn("Aviso ao rastrear InitiateCheckout:", trackErr);
        }
        addToast({
          type: "info",
          title: "PIX gerado com sucesso via Asaas!",
          message: "Escaneie o QR Code ou copie a chave para pagar.",
        });
      } else {
        addToast({
          type: "error",
          title: "Erro ao gerar PIX",
          message: data.erro || "Tente novamente mais tarde.",
        });
      }
    } catch (err) {
      console.error("Erro ao gerar checkout Asaas:", err);
      addToast({
        type: "error",
        title: "Erro de conexão",
        message: "Não foi possível contatar o serviço de pagamento.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyPix = () => {
    if (!pixData?.brCode) return;
    try {
      if (navigator?.clipboard?.writeText) {
        navigator.clipboard.writeText(pixData.brCode);
      } else {
        const input = document.getElementById("pix-copia-cola-input") as HTMLInputElement;
        if (input) {
          input.select();
          document.execCommand("copy");
        }
      }
      setHasCopied(true);
      addToast({
        type: "success",
        title: "Código PIX Copiado!",
        message: "Cole no aplicativo do seu banco para pagar.",
      });
      setTimeout(() => setHasCopied(false), 3000);
    } catch (err) {
      console.warn("Falha ao copiar PIX via clipboard API:", err);
      setHasCopied(true);
      setTimeout(() => setHasCopied(false), 3000);
    }
  };

  const handleFinalizarAtivacao = () => {
    onClose();
    if (typeof window !== "undefined") {
      window.location.reload();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <div className="p-4 sm:p-6 space-y-5 text-slate-900 dark:text-[#f8f8f2]">
        {/* STEP 1: APRESENTAÇÃO DO PLANO E RECURSOS */}
        {step === "DETAILS" && (
          <>
            {/* Header */}
            <div className="flex items-start gap-3.5 pb-4 border-b border-slate-100 dark:border-[#44475a]">
              <div className="w-10 h-10 rounded-[4px] bg-blue-50 dark:bg-[#bd93f9]/20 border border-blue-200 dark:border-[#bd93f9]/30 flex items-center justify-center shrink-0">
                {config.icon}
              </div>
              <div className="space-y-0.5">
                <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[4px] text-[11px] font-bold bg-blue-100 dark:bg-[#bd93f9]/20 text-blue-800 dark:text-[#bd93f9] uppercase tracking-wider">
                  <Sparkles className="w-3 h-3 text-blue-600 dark:text-[#bd93f9]" /> Plano Pro
                </div>
                <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-[#f8f8f2] tracking-tight">
                  {config.title}
                </h3>
                <p className="text-xs text-slate-600 dark:text-[#cbd5e1]">
                  {config.subtitle}
                </p>
              </div>
            </div>

            {/* Pricing Box */}
            <div className="p-4 sm:p-5 rounded-[4px] bg-gradient-to-br from-slate-900 via-slate-800 to-blue-950 dark:from-[#21222c] dark:via-[#282a36] dark:to-[#1e1f29] text-white shadow-sm border border-slate-700 dark:border-[#44475a]">
              <div className="flex items-baseline justify-between mb-4 pb-3 border-b border-white/10">
                <div>
                  <div className="text-[11px] text-blue-200 dark:text-[#bd93f9] font-bold uppercase tracking-wider">
                    Assinatura Mensal
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-white mt-0.5">
                    R$ 45,90{" "}
                    <span className="text-xs text-blue-200 dark:text-[#cbd5e1] font-normal">/ mês</span>
                  </div>
                </div>
                <span className="text-[11px] bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-2.5 py-1 rounded-[4px] font-bold">
                  PIX Instantâneo
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-200">
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-blue-400 dark:text-[#50fa7b] shrink-0" />
                  <span>Assinatura Eletrônica</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-blue-400 dark:text-[#50fa7b] shrink-0" />
                  <span>Impressão / Exportar PDF</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-blue-400 dark:text-[#50fa7b] shrink-0" />
                  <span>Link Público & WhatsApp</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-blue-400 dark:text-[#50fa7b] shrink-0" />
                  <span>Logotipo em Base64</span>
                </div>
                <div className="flex items-center gap-2 sm:col-span-2">
                  <Check className="w-3.5 h-3.5 text-blue-400 dark:text-[#50fa7b] shrink-0" />
                  <span>Propostas executivas ilimitadas com IA</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-2 pt-1">
              <Button
                onClick={handleGerarPix}
                isLoading={isLoading}
                variant="primary"
                size="lg"
                className="w-full justify-center font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/20 rounded-[4px]"
                leftIcon={<QrCode className="w-5 h-5" />}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Pagar com PIX (R$ 45,90/mês)
              </Button>

              <Button
                onClick={onClose}
                variant="ghost"
                size="sm"
                className="w-full justify-center text-xs text-slate-500 dark:text-[#cbd5e1] hover:text-slate-700 dark:hover:text-white rounded-[4px]"
              >
                Continuar no plano gratuito
              </Button>
            </div>

            <div className="text-center text-[11px] text-slate-400 dark:text-[#94a3b8] border-t border-slate-100 dark:border-[#44475a] pt-3">
              Pagamento instantâneo e seguro via Asaas Gateway Oficial.
            </div>
          </>
        )}

        {/* STEP 2: CHECKOUT TRANSPARENTE PIX */}
        {step === "PIX" && pixData && (
          <div className="space-y-5">
            {/* Top Bar */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[#44475a]">
              <button
                onClick={() => setStep("DETAILS")}
                className="inline-flex items-center gap-1.5 text-xs text-slate-500 dark:text-[#cbd5e1] hover:text-slate-800 dark:hover:text-white transition font-medium cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Voltar
              </button>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[4px] bg-amber-50 dark:bg-[#ffb86c]/15 border border-amber-200/60 dark:border-[#ffb86c]/30 text-amber-800 dark:text-[#ffb86c] text-[11px] font-semibold animate-pulse">
                <RefreshCw className="w-3 h-3 animate-spin text-amber-600 dark:text-[#ffb86c]" />
                Aguardando confirmação do Asaas...
              </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
              {/* QR Code Container */}
              <div className="md:col-span-5 flex flex-col items-center justify-center p-4 bg-slate-50 dark:bg-[#21222c] border border-slate-200/80 dark:border-[#44475a] rounded-[4px]">
                <div className="p-2.5 bg-white dark:bg-[#343746] rounded-[4px] border border-slate-200 dark:border-[#44475a] shadow-2xs">
                  {getQrCodeSrc(pixData.brCodeBase64) && !imgError ? (
                    <img
                      src={getQrCodeSrc(pixData.brCodeBase64)!}
                      alt="QR Code PIX Asaas"
                      className="w-40 h-40 object-contain rounded-[2px]"
                      onError={() => setImgError(true)}
                    />
                  ) : (
                    <div className="w-40 h-40 flex flex-col items-center justify-center bg-slate-100 dark:bg-[#282a36] rounded-[2px] p-2 text-center">
                      <QrCode className="w-14 h-14 text-slate-400 dark:text-[#94a3b8] mb-1" />
                      <span className="text-[10px] text-slate-500 dark:text-[#cbd5e1] font-medium leading-tight">
                        Utilize o código PIX Copia e Cola ao lado
                      </span>
                    </div>
                  )}
                </div>

                <div className="text-center mt-3">
                  <span className="text-[11px] uppercase tracking-wider text-slate-500 dark:text-[#cbd5e1] font-bold">
                    Valor total
                  </span>
                  <div className="text-2xl font-black text-slate-900 dark:text-[#f8f8f2]">
                    R$ {pixData.amount.toFixed(2).replace(".", ",")}
                  </div>
                </div>
              </div>

              {/* Instructions & Copy Container */}
              <div className="md:col-span-7 space-y-3.5">
                <div>
                  <h4 className="text-sm sm:text-base font-bold text-slate-900 dark:text-[#f8f8f2]">
                    Pague pelo aplicativo do seu banco
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-[#cbd5e1] mt-0.5">
                    Abra o app do seu banco, escolha <strong>PIX Copia e Cola</strong> ou aponte a câmera para o QR Code.
                  </p>
                </div>

                {/* Copy & Paste Code */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-[#cbd5e1]">
                    Código PIX Copia e Cola
                  </label>
                  <div className="flex gap-2">
                    <input
                      id="pix-copia-cola-input"
                      type="text"
                      readOnly
                      value={pixData.brCode}
                      className="flex-1 px-3 py-2 text-xs font-mono bg-slate-100 dark:bg-[#343746] border border-slate-200 dark:border-[#44475a] rounded-[4px] text-slate-700 dark:text-[#f8f8f2] select-all focus:outline-hidden"
                    />
                    <Button
                      onClick={handleCopyPix}
                      variant={hasCopied ? "secondary" : "primary"}
                      size="sm"
                      className={`font-semibold shrink-0 transition-all rounded-[4px] ${
                        hasCopied
                          ? "bg-emerald-600 text-white hover:bg-emerald-700"
                          : "bg-blue-600 hover:bg-blue-700 text-white"
                      }`}
                      leftIcon={
                        hasCopied ? (
                          <CheckCircle2 className="w-4 h-4 text-white" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )
                      }
                    >
                      {hasCopied ? "Copiado!" : "Copiar Código"}
                    </Button>
                  </div>
                </div>

                {/* Invoice Link Option */}
                {isValidInvoiceUrl(pixData.invoiceUrl) && (
                  <div className="pt-0.5">
                    <a
                      href={pixData.invoiceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-1.5 w-full py-2 px-3 text-xs font-semibold text-blue-700 dark:text-[#8be9fd] bg-blue-50/80 dark:bg-[#8be9fd]/15 hover:bg-blue-100/90 dark:hover:bg-[#8be9fd]/25 border border-blue-200 dark:border-[#8be9fd]/30 rounded-[4px] transition shadow-2xs"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-blue-600 dark:text-[#8be9fd]" />
                      Visualizar Fatura Completa no Asaas
                    </a>
                  </div>
                )}

                {/* Steps guide */}
                <div className="bg-blue-50/70 dark:bg-[#bd93f9]/15 border border-blue-100 dark:border-[#bd93f9]/30 rounded-[4px] p-3 text-xs text-slate-700 dark:text-[#f8f8f2] space-y-1">
                  <div className="font-bold text-blue-900 dark:text-[#bd93f9] flex items-center gap-1.5 text-[11px] uppercase tracking-wide">
                    <ShieldCheck className="w-3.5 h-3.5 text-blue-600 dark:text-[#bd93f9]" />
                    Como funciona a ativação:
                  </div>
                  <ol className="list-decimal list-inside space-y-0.5 text-slate-600 dark:text-[#cbd5e1] text-[11px] pl-1">
                    <li>Realize o pagamento no app do seu banco ou via fatura Asaas.</li>
                    <li>O Asaas confirma o recebimento automaticamente.</li>
                    <li>Sua conta é atualizada para o <strong>Plano Pro</strong> na hora.</li>
                  </ol>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-400 dark:text-[#94a3b8] border-t border-slate-100 dark:border-[#44475a] pt-3">
              <span className="inline-flex items-center gap-1">
                <Clock className="w-3 h-3" /> PIX emitido via Asaas
              </span>
              <span>Asaas Pagamentos Inteligentes</span>
            </div>
          </div>
        )}

        {/* STEP 3: SUCESSO & ATIVAÇÃO */}
        {step === "SUCCESS" && (
          <div className="text-center py-3 space-y-5">
            <div className="w-14 h-14 rounded-[4px] bg-emerald-100 dark:bg-[#50fa7b]/20 border border-emerald-300 dark:border-[#50fa7b]/40 flex items-center justify-center mx-auto shadow-sm">
              <CheckCircle2 className="w-8 h-8 text-emerald-600 dark:text-[#50fa7b]" />
            </div>

            <div className="space-y-1">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-[4px] text-xs font-bold bg-emerald-100 dark:bg-[#50fa7b]/20 text-emerald-800 dark:text-[#50fa7b] border border-emerald-200 dark:border-[#50fa7b]/40">
                <Sparkles className="w-3 h-3 text-emerald-600 dark:text-[#50fa7b]" /> PLANO PRO ATIVADO
              </span>
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-[#f8f8f2] tracking-tight">
                Parabéns! Sua assinatura está ativa
              </h3>
              <p className="text-xs text-slate-600 dark:text-[#cbd5e1] max-w-sm mx-auto">
                Todos os recursos exclusivos foram desbloqueados. Crie propostas ilimitadas com IA, exporte PDFs executivos e colete assinaturas eletrônicas.
              </p>
            </div>

            <div className="p-3.5 bg-slate-50 dark:bg-[#21222c] border border-slate-200 dark:border-[#44475a] rounded-[4px] max-w-md mx-auto grid grid-cols-2 gap-2 text-left text-xs text-slate-700 dark:text-[#f8f8f2]">
              <div className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-[#50fa7b] shrink-0" />
                <span>Assinatura Eletrônica</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-[#50fa7b] shrink-0" />
                <span>Exportar PDF</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-[#50fa7b] shrink-0" />
                <span>Link Público WhatsApp</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-[#50fa7b] shrink-0" />
                <span>Logotipo em Base64</span>
              </div>
            </div>

            <div className="pt-2">
              <Button
                onClick={handleFinalizarAtivacao}
                variant="primary"
                size="lg"
                className="w-full max-w-xs mx-auto justify-center font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-[4px]"
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Começar a Usar Recursos Pro
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
