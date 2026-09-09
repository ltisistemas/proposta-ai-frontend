"use client";

import React, { useState } from "react";
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

const FEATURE_CONFIG: Record<
  UpgradeFeatureType,
  { title: string; subtitle: string; icon: React.ReactNode }
> = {
  pdf: {
    title: "Impressão e PDF Exclusivos do Plano Pro",
    subtitle: "Exporte propostas comerciais em PDF de alta qualidade e com design executivo.",
    icon: <FileDown className="w-6 h-6 text-blue-600" />,
  },
  link: {
    title: "Compartilhamento por Link Exclusivo Pro",
    subtitle: "Gere links públicos e compartilhe suas propostas com clientes via WhatsApp e redes.",
    icon: <LinkIcon className="w-6 h-6 text-blue-600" />,
  },
  signature: {
    title: "Assinatura Eletrônica Exclusiva do Plano Pro",
    subtitle: "Colete assinaturas digitais com certificado de conformidade jurídica e hash de auditoria.",
    icon: <PenTool className="w-6 h-6 text-blue-600" />,
  },
  status: {
    title: "Gestão de Status & Fechamento Pro",
    subtitle: "Acompanhe seu pipeline comercial marcando propostas como Aceitas ou Recusadas.",
    icon: <ShieldCheck className="w-6 h-6 text-blue-600" />,
  },
  logo: {
    title: "Logotipo Personalizado em Base64",
    subtitle: "Adicione sua marca oficial no cabeçalho de todas as propostas para máxima credibilidade.",
    icon: <ImageIcon className="w-6 h-6 text-blue-600" />,
  },
  limit: {
    title: "Você atingiu o limite de propostas gratuitas",
    subtitle: "Desbloqueie geração ilimitada de propostas comerciais com inteligência artificial.",
    icon: <Zap className="w-6 h-6 text-blue-600" />,
  },
  general: {
    title: "Desbloqueie todo o poder do Proposta Ai! Pro",
    subtitle: "Aumente sua taxa de conversão com propostas executivas e ferramentas de fechamento.",
    icon: <Sparkles className="w-6 h-6 text-blue-600" />,
  },
};

export function UpgradeModal({
  isOpen,
  onClose,
  feature = "general",
}: UpgradeModalProps) {
  const { token } = useAuthStore();
  const { addToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const config = FEATURE_CONFIG[feature] || FEATURE_CONFIG.general;

  const handleCheckout = async () => {
    if (!token) return;
    setIsLoading(true);

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (data.sucesso && data.checkoutUrl) {
        addToast({
          type: "info",
          title: "Redirecionando para pagamento seguro...",
        });
        window.location.href = data.checkoutUrl;
      } else {
        addToast({
          type: "error",
          title: "Erro ao iniciar checkout",
          message: data.erro || "Tente novamente mais tarde.",
        });
      }
    } catch (err) {
      console.error("Erro no checkout:", err);
      addToast({
        type: "error",
        title: "Erro de conexão",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <div className="text-left space-y-6 pt-1">
        {/* Header with feature icon */}
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0 shadow-xs">
            {config.icon}
          </div>
          <div>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800 border border-blue-200 mb-1">
              <Sparkles className="w-3 h-3 text-blue-600" /> PLANO PRO
            </span>
            <h3 className="text-xl font-black text-slate-900 tracking-tight leading-snug">
              {config.title}
            </h3>
            <p className="text-xs text-slate-600 mt-1">{config.subtitle}</p>
          </div>
        </div>

        {/* Pricing Card */}
        <div className="bg-gradient-to-br from-blue-900 via-blue-950 to-slate-900 rounded-2xl p-5 text-white border border-blue-500/30 shadow-lg relative overflow-hidden">
          <div className="flex items-baseline justify-between mb-4 pb-3 border-b border-white/10">
            <div>
              <div className="text-xs text-blue-200 font-bold uppercase tracking-wider">
                Assinatura Mensal
              </div>
              <div className="text-3xl font-black text-white mt-0.5">
                R$ 45,90{" "}
                <span className="text-xs text-blue-200 font-normal">/ mês</span>
              </div>
            </div>
            <span className="text-[11px] bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-2 py-1 rounded-lg font-bold">
              Sem fidelidade
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
        <div className="space-y-2 pt-2">
          <Button
            onClick={handleCheckout}
            isLoading={isLoading}
            variant="primary"
            size="lg"
            className="w-full justify-center font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/30"
            rightIcon={<ArrowRight className="w-4 h-4" />}
          >
            Fazer Upgrade Agora (R$ 45,90/mês)
          </Button>

          <Button
            onClick={onClose}
            variant="ghost"
            size="sm"
            className="w-full justify-center text-xs text-slate-500 hover:text-slate-700"
          >
            Continuar no plano gratuito
          </Button>
        </div>

        <div className="text-center text-[11px] text-slate-400 border-t border-slate-100 pt-3">
          Pagamento processado com segurança máxima via Abacate Pay (PIX ou Cartão).
        </div>
      </div>
    </Modal>
  );
}
