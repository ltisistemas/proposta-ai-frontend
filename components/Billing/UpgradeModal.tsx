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
  X,
} from "lucide-react";
import { Modal } from "@/components/Common/Modal";
import { Button } from "@/components/Common/Button";
import { useAuthStore } from "@/lib/auth/useAuthStore";
import { useToast } from "@/components/Common/Toast";

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
  expiresAt: string;
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
    title: "Desbloqueie todo o poder do Proposta Ai! Pro",
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
  const [isSimulating, setIsSimulating] = useState(false);

  const pollingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const config = FEATURE_CONFIG[feature] || FEATURE_CONFIG.general;

  // Limpa estados ao fechar ou reabrir
  useEffect(() => {
    if (!isOpen) {
      if (pollingTimerRef.current) clearInterval(pollingTimerRef.current);
      setTimeout(() => {
        setStep("DETAILS");
        setPixData(null);
        setHasCopied(false);
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
            addToast({
              type: "success",
              title: "🎉 Pagamento Confirmado!",
              message: "Seu plano Pro foi ativado com sucesso.",
            });
          }
        } catch (err) {
          console.error("Erro no polling do PIX:", err);
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
          expiresAt: data.expiresAt,
          devMode: data.devMode,
        });
        setStep("PIX");
        addToast({
          type: "info",
          title: "PIX gerado com sucesso!",
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
      console.error("Erro ao gerar checkout PIX:", err);
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
    navigator.clipboard.writeText(pixData.brCode);
    setHasCopied(true);
    addToast({
      type: "success",
      title: "Código PIX Copiado!",
      message: "Cole no aplicativo do seu banco para pagar.",
    });
    setTimeout(() => setHasCopied(false), 3000);
  };

  const handleSimularPagamento = async () => {
    if (!pixData?.chargeId || !token) return;
    setIsSimulating(true);

    try {
      const res = await fetch("/api/checkout/status", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          chargeId: pixData.chargeId,
          simulatePaid: true,
        }),
      });

      const data = await res.json();

      if (data.sucesso || data.isPro || data.status === "PAID") {
        updateUser({ plano: "pro" });
        await fetchMe();
        setStep("SUCCESS");
        addToast({
          type: "success",
          title: "Pagamento Simulado com Sucesso!",
          message: "Plano Pro ativado.",
        });
      }
    } catch (err) {
      console.error("Erro ao simular pagamento:", err);
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size={step === "PIX" ? "lg" : "md"}
      bodyClassName="p-6 sm:p-7"
    >
      <div className="text-left space-y-6">
        {/* STEP 1: DETALHES & BENEFÍCIOS */}
        {step === "DETAILS" && (
          <>
            {/* Header with feature icon */}
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-[4px] bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0 shadow-2xs">
                {config.icon}
              </div>
              <div className="min-w-0 flex-1 pr-6">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[4px] text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200 mb-1">
                  <Sparkles className="w-3 h-3 text-blue-600" /> PLANO PRO
                </span>
                <h3 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight leading-snug">
                  {config.title}
                </h3>
                <p className="text-xs text-slate-600 mt-0.5">{config.subtitle}</p>
              </div>
            </div>

            {/* Pricing Card */}
            <div className="bg-gradient-to-br from-blue-900 via-blue-950 to-slate-900 rounded-[4px] p-5 text-white border border-blue-500/30 shadow-md relative overflow-hidden">
              <div className="flex items-baseline justify-between mb-4 pb-3 border-b border-white/10">
                <div>
                  <div className="text-[11px] text-blue-200 font-bold uppercase tracking-wider">
                    Assinatura Mensal
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-white mt-0.5">
                    R$ 45,90{" "}
                    <span className="text-xs text-blue-200 font-normal">/ mês</span>
                  </div>
                </div>
                <span className="text-[11px] bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-2.5 py-1 rounded-[4px] font-bold">
                  PIX Instantâneo
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-200">
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                  <span>Assinatura Eletrônica</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                  <span>Impressão / Exportar PDF</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                  <span>Link Público & WhatsApp</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                  <span>Logotipo em Base64</span>
                </div>
                <div className="flex items-center gap-2 sm:col-span-2">
                  <Check className="w-3.5 h-3.5 text-blue-400 shrink-0" />
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
                className="w-full justify-center text-xs text-slate-500 hover:text-slate-700 rounded-[4px]"
              >
                Continuar no plano gratuito
              </Button>
            </div>

            <div className="text-center text-[11px] text-slate-400 border-t border-slate-100 pt-3">
              Pagamento instantâneo e seguro via Abacate Pay (PIX Transparente).
            </div>
          </>
        )}

        {/* STEP 2: CHECKOUT TRANSPARENTE PIX */}
        {step === "PIX" && pixData && (
          <div className="space-y-5">
            {/* Top Bar */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <button
                onClick={() => setStep("DETAILS")}
                className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 transition font-medium cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Voltar
              </button>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[4px] bg-amber-50 border border-amber-200/60 text-amber-800 text-[11px] font-semibold animate-pulse">
                <RefreshCw className="w-3 h-3 animate-spin text-amber-600" />
                Aguardando pagamento...
              </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
              {/* QR Code Container */}
              <div className="md:col-span-5 flex flex-col items-center justify-center p-4 bg-slate-50 border border-slate-200/80 rounded-[4px]">
                <div className="p-2.5 bg-white rounded-[4px] border border-slate-200 shadow-2xs">
                  {pixData.brCodeBase64 ? (
                    <img
                      src={pixData.brCodeBase64}
                      alt="QR Code PIX Abacate Pay"
                      className="w-40 h-40 object-contain rounded-[2px]"
                    />
                  ) : (
                    <div className="w-40 h-40 flex items-center justify-center bg-slate-100 rounded-[2px]">
                      <QrCode className="w-16 h-16 text-slate-400" />
                    </div>
                  )}
                </div>

                <div className="text-center mt-3">
                  <span className="text-[11px] uppercase tracking-wider text-slate-500 font-bold">
                    Valor total
                  </span>
                  <div className="text-2xl font-black text-slate-900">
                    R$ {pixData.amount.toFixed(2).replace(".", ",")}
                  </div>
                </div>
              </div>

              {/* Instructions & Copy Container */}
              <div className="md:col-span-7 space-y-3.5">
                <div>
                  <h4 className="text-sm sm:text-base font-bold text-slate-900">
                    Pague pelo aplicativo do seu banco
                  </h4>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Abra o app do seu banco, escolha <strong>PIX Copia e Cola</strong> ou aponte a câmera para o QR Code.
                  </p>
                </div>

                {/* Copy & Paste Code */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
                    Código PIX Copia e Cola
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      readOnly
                      value={pixData.brCode}
                      className="flex-1 px-3 py-2 text-xs font-mono bg-slate-100 border border-slate-200 rounded-[4px] text-slate-700 select-all focus:outline-hidden"
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

                {/* Steps guide */}
                <div className="bg-blue-50/70 border border-blue-100 rounded-[4px] p-3 text-xs text-slate-700 space-y-1">
                  <div className="font-bold text-blue-900 flex items-center gap-1.5 text-[11px] uppercase tracking-wide">
                    <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                    Como funciona a ativação:
                  </div>
                  <ol className="list-decimal list-inside space-y-0.5 text-slate-600 text-[11px] pl-1">
                    <li>Realize o pagamento no app do seu banco.</li>
                    <li>O Abacate Pay confirma a transação em segundos.</li>
                    <li>Sua conta é atualizada para o <strong>Plano Pro</strong> automaticamente.</li>
                  </ol>
                </div>

                {/* Dev Mode Sandbox Simulator Button */}
                <div className="pt-0.5">
                  <Button
                    onClick={handleSimularPagamento}
                    isLoading={isSimulating}
                    variant="secondary"
                    size="sm"
                    className="w-full text-xs font-semibold border-dashed border-emerald-300 bg-emerald-50/70 text-emerald-800 hover:bg-emerald-100/80 justify-center rounded-[4px]"
                    leftIcon={<Zap className="w-3.5 h-3.5 text-emerald-600" />}
                  >
                    ⚡ Simular Pagamento Instantâneo (Ambiente de Testes)
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-100 pt-3">
              <span className="inline-flex items-center gap-1">
                <Clock className="w-3 h-3" /> PIX válido por 1 hora
              </span>
              <span>Abacate Pay Gateway Oficial</span>
            </div>
          </div>
        )}

        {/* STEP 3: SUCESSO & ATIVAÇÃO */}
        {step === "SUCCESS" && (
          <div className="text-center py-3 space-y-5">
            <div className="w-14 h-14 rounded-[4px] bg-emerald-100 border border-emerald-300 flex items-center justify-center mx-auto shadow-sm">
              <CheckCircle2 className="w-8 h-8 text-emerald-600" />
            </div>

            <div className="space-y-1">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-[4px] text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                <Sparkles className="w-3 h-3 text-emerald-600" /> PLANO PRO ATIVADO
              </span>
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Parabéns! Sua assinatura está ativa
              </h3>
              <p className="text-xs text-slate-600 max-w-sm mx-auto">
                Todos os recursos exclusivos foram desbloqueados. Crie propostas ilimitadas com IA, exporte PDFs executivos e colete assinaturas eletrônicas.
              </p>
            </div>

            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-[4px] max-w-md mx-auto grid grid-cols-2 gap-2 text-left text-xs text-slate-700">
              <div className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Assinatura Eletrônica</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Exportar PDF</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Link Público WhatsApp</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Logotipo Personalizado</span>
              </div>
            </div>

            <Button
              onClick={onClose}
              variant="primary"
              size="lg"
              className="w-full font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/20 justify-center rounded-[4px]"
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Começar a Usar Recursos Pro
            </Button>
          </div>
        )}
      </div>
    </Modal>
  );
}
