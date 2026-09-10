"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Building2,
  FileText,
  Mail,
  Phone,
  User,
  Check,
  ArrowRight,
  Sparkles,
  Upload,
  Trash2,
  Lock,
  Image as ImageIcon,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  RefreshCw,
} from "lucide-react";
import { Input } from "@/components/Common/Input";
import { Button } from "@/components/Common/Button";
import { Card } from "@/components/Common/Card";
import { Badge } from "@/components/Common/Badge";
import { ConfirmModal } from "@/components/Common/ConfirmModal";
import { UpgradeModal } from "@/components/Billing/UpgradeModal";
import { useAuthStore } from "@/lib/auth/useAuthStore";
import { useToast } from "@/components/Common/Toast";

export default function ConfigPage() {
  const { user, token, updateUser } = useAuthStore();
  const { addToast } = useToast();

  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [confirmDowngradeOpen, setConfirmDowngradeOpen] = useState(false);
  const [isDowngrading, setIsDowngrading] = useState(false);
  const [isReactivating, setIsReactivating] = useState(false);

  const [nome, setNome] = useState(user?.nome || "");
  const [empresaNome, setEmpresaNome] = useState(user?.empresa_nome || "");
  const [empresaCnpj, setEmpresaCnpj] = useState(user?.empresa_cnpj || "");
  const [empresaEmail, setEmpresaEmail] = useState(user?.empresa_email || "");
  const [empresaTelefone, setEmpresaTelefone] = useState(user?.empresa_telefone || "");
  const [empresaLogoUrl, setEmpresaLogoUrl] = useState(user?.empresa_logo_url || "");

  const [isSaving, setIsSaving] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isPro = user?.plano === "pro";

  useEffect(() => {
    if (user) {
      setNome(user.nome || "");
      setEmpresaNome(user.empresa_nome || "");
      setEmpresaCnpj(user.empresa_cnpj || "");
      setEmpresaEmail(user.empresa_email || "");
      setEmpresaTelefone(user.empresa_telefone || "");
      setEmpresaLogoUrl(user.empresa_logo_url || "");
    }
  }, [user]);

  // Handle Logo Upload & Convert to Base64
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!isPro) {
      addToast({
        type: "warning",
        title: "Recurso Exclusivo Pro",
        message: "O upload de logotipo personalizado em Base64 está disponível apenas no Plano Pro.",
      });
      return;
    }

    if (!file.type.startsWith("image/")) {
      addToast({
        type: "error",
        title: "Arquivo inválido",
        message: "Por favor selecione uma imagem (PNG, JPG, SVG ou WEBP).",
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // Canvas compression / resize to max 400x400
        const canvas = document.createElement("canvas");
        const maxDim = 400;
        let width = img.width;
        let height = img.height;

        if (width > height && width > maxDim) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else if (height > maxDim) {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const base64String = canvas.toDataURL("image/png", 0.9);
          setEmpresaLogoUrl(base64String);
          addToast({
            type: "success",
            title: "Logo carregada!",
            message: "Clique em 'Salvar Alterações' para confirmar a logo em Base64.",
          });
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = () => {
    setEmpresaLogoUrl("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setIsSaving(true);

    try {
      const res = await fetch("/api/auth/me", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          nome,
          empresa_nome: empresaNome || null,
          empresa_cnpj: empresaCnpj || null,
          empresa_email: empresaEmail || null,
          empresa_telefone: empresaTelefone || null,
          empresa_logo_url: isPro ? (empresaLogoUrl || null) : null,
        }),
      });

      const data = await res.json();
      if (data.sucesso && data.usuario) {
        updateUser(data.usuario);
        addToast({
          type: "success",
          title: "Dados atualizados com sucesso!",
        });
      } else {
        addToast({
          type: "error",
          title: "Erro ao salvar",
          message: data.erro || "Tente novamente.",
        });
      }
    } catch (err) {
      console.error("Erro ao atualizar perfil:", err);
      addToast({
        type: "error",
        title: "Erro de conexão",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpgradeCheckout = () => {
    setUpgradeModalOpen(true);
  };

  const formatarDataExpiracao = (data?: Date | string | null) => {
    if (!data) return "o fim do ciclo atual";
    try {
      const d = new Date(data);
      if (isNaN(d.getTime())) return "o fim do ciclo atual";
      return d.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    } catch {
      return "o fim do ciclo atual";
    }
  };

  const dataFimFormatada = formatarDataExpiracao(user?.data_proxima_cobranca);

  const handleAgendarDowngrade = async () => {
    if (!token) return;
    setIsDowngrading(true);
    try {
      const res = await fetch("/api/auth/downgrade", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ acao: "agendar" }),
      });
      const data = await res.json();
      if (data.sucesso) {
        updateUser({
          cancelamento_agendado: true,
          ...(data.usuario || {}),
        });
        setConfirmDowngradeOpen(false);
        addToast({
          type: "success",
          title: "Cancelamento agendado",
          message:
            data.mensagem ||
            "Seus recursos Pro permanecerão ativos até o fim do período pago.",
        });
      } else {
        addToast({
          type: "error",
          title: "Erro ao agendar cancelamento",
          message: data.erro || "Tente novamente mais tarde.",
        });
      }
    } catch (err) {
      console.error("Erro ao solicitar cancelamento:", err);
      addToast({
        type: "error",
        title: "Erro de conexão",
        message: "Não foi possível processar a solicitação de cancelamento.",
      });
    } finally {
      setIsDowngrading(false);
    }
  };

  const handleReativarAssinatura = async () => {
    if (!token) return;
    setIsReactivating(true);
    try {
      const res = await fetch("/api/auth/downgrade", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ acao: "reativar" }),
      });
      const data = await res.json();
      if (data.sucesso) {
        updateUser({
          cancelamento_agendado: false,
          ...(data.usuario || {}),
        });
        addToast({
          type: "success",
          title: "Assinatura reativada!",
          message:
            data.mensagem ||
            "Sua assinatura Pro foi reativada com sucesso.",
        });
      } else {
        addToast({
          type: "error",
          title: "Erro ao reativar assinatura",
          message: data.erro || "Tente novamente mais tarde.",
        });
      }
    } catch (err) {
      console.error("Erro ao reativar assinatura:", err);
      addToast({
        type: "error",
        title: "Erro de conexão",
        message: "Não foi possível reativar a assinatura.",
      });
    } finally {
      setIsReactivating(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-16">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          Configurações da Conta & Plano
        </h1>
        <p className="text-slate-600 text-sm mt-1">
          Personalize os dados da sua empresa, logotipo e gerencie sua assinatura do ViraPropo AI!.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Profile Form */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="bg-white border-slate-200/90 p-6 sm:p-8 rounded-3xl shadow-xs">
            <div className="flex items-center gap-2.5 pb-4 mb-6 border-b border-slate-100 text-slate-900 font-bold text-base">
              <Building2 className="w-5 h-5 text-blue-600" />
              <span>Dados da Empresa Emissora</span>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-5">
              <Input
                label="Seu Nome Completo *"
                required
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                leftIcon={<User className="w-4 h-4" />}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Razão Social / Nome Fantasia"
                  placeholder="Minha Empresa Consultoria"
                  value={empresaNome}
                  onChange={(e) => setEmpresaNome(e.target.value)}
                  leftIcon={<Building2 className="w-4 h-4" />}
                />

                <Input
                  label="CNPJ"
                  placeholder="00.000.000/0001-00"
                  value={empresaCnpj}
                  onChange={(e) => setEmpresaCnpj(e.target.value)}
                  leftIcon={<FileText className="w-4 h-4" />}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Email Comercial"
                  type="email"
                  placeholder="contato@minhaempresa.com"
                  value={empresaEmail}
                  onChange={(e) => setEmpresaEmail(e.target.value)}
                  leftIcon={<Mail className="w-4 h-4" />}
                />

                <Input
                  label="Telefone / WhatsApp"
                  placeholder="(11) 98765-4321"
                  value={empresaTelefone}
                  onChange={(e) => setEmpresaTelefone(e.target.value)}
                  leftIcon={<Phone className="w-4 h-4" />}
                />
              </div>

              {/* Logo Section (Pro feature) */}
              <div className="pt-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2 flex items-center justify-between">
                  <span>Logotipo da Empresa (Base64)</span>
                  {!isPro && (
                    <span className="flex items-center gap-1 text-[11px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                      <Lock className="w-3 h-3" /> Exclusivo Plano Pro
                    </span>
                  )}
                </label>

                {isPro ? (
                  <div className="p-4 rounded-2xl border-2 border-dashed border-slate-200 hover:border-blue-300 transition-all bg-slate-50/60">
                    {empresaLogoUrl ? (
                      <div className="flex items-center gap-4">
                        <div className="w-20 h-20 bg-white rounded-xl border border-slate-200 flex items-center justify-center p-2 shrink-0 overflow-hidden shadow-xs">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={empresaLogoUrl}
                            alt="Logo preview"
                            className="max-h-full max-w-full object-contain"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            Logotipo carregada em Base64
                          </p>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            A logo será renderizada no topo de todas as propostas executivas Pro.
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="text-xs text-rose-600 border-rose-200 hover:bg-rose-50"
                              onClick={handleRemoveLogo}
                              leftIcon={<Trash2 className="w-3 h-3" />}
                            >
                              Remover
                            </Button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        className="cursor-pointer flex flex-col items-center justify-center py-4 text-center"
                      >
                        <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mb-2">
                          <Upload className="w-5 h-5" />
                        </div>
                        <p className="text-xs font-bold text-slate-800">
                          Clique para fazer upload da sua logo
                        </p>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          PNG, JPG ou SVG (salvo diretamente em Base64)
                        </p>
                      </div>
                    )}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleLogoUpload}
                    />
                  </div>
                ) : (
                  <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/70 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400">
                        <ImageIcon className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-700">
                          Personalização de Logo em Base64
                        </p>
                        <p className="text-[11px] text-slate-500">
                          Faça upgrade para o Pro para adicionar sua marca oficial nas propostas.
                        </p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleUpgradeCheckout}
                      className="text-xs font-bold text-blue-700 border-blue-200 hover:bg-blue-50 shrink-0"
                    >
                      Desbloquear Logo
                    </Button>
                  </div>
                )}
              </div>

              <div className="pt-4 flex justify-end">
                <Button
                  type="submit"
                  variant="primary"
                  isLoading={isSaving}
                  className="shadow-md shadow-blue-600/20 font-bold"
                >
                  Salvar Alterações
                </Button>
              </div>
            </form>
          </Card>
        </div>

        {/* Right: Plan Status & Billing */}
        <div className="space-y-6">
          <Card className="bg-gradient-to-br from-blue-900 via-blue-950 to-slate-900 border-2 border-blue-600/40 p-6 rounded-3xl text-white relative overflow-hidden shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-blue-300" />
                <span className="text-sm font-bold text-white">Plano Atual</span>
              </div>
              <Badge variant={user?.plano === "pro" ? "pro" : "free"}>
                {user?.plano?.toUpperCase() || "FREE"}
              </Badge>
            </div>

            {user?.plano === "pro" ? (
              <div className="space-y-4">
                {user?.cancelamento_agendado ? (
                  <div className="p-4 rounded-2xl bg-amber-500/15 border border-amber-400/40 text-amber-100 text-xs space-y-3">
                    <div className="flex items-start gap-2.5">
                      <AlertTriangle className="w-4 h-4 text-amber-300 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold text-sm text-white">
                          Cancelamento Agendado
                        </p>
                        <p className="text-amber-200/90 text-xs mt-1 leading-relaxed">
                          Sua assinatura Pro não será renovada. Você continuará com acesso total a todos os recursos Pro até <strong className="text-white underline decoration-amber-400/60">{dataFimFormatada}</strong>.
                        </p>
                      </div>
                    </div>

                    <div className="pt-1">
                      <Button
                        type="button"
                        variant="primary"
                        size="sm"
                        onClick={handleReativarAssinatura}
                        isLoading={isReactivating}
                        leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
                        className="w-full justify-center font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-950/40 text-xs"
                      >
                        Reativar Assinatura Pro
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="p-4 rounded-2xl bg-blue-500/20 border border-blue-400/30 text-blue-100 text-xs">
                      <p className="font-bold text-sm text-white flex items-center gap-1.5 mb-1">
                        <Check className="w-4 h-4 text-emerald-400" /> Assinatura Pro Ativa
                      </p>
                      <p className="text-blue-200/90 text-xs leading-relaxed">
                        Você possui propostas executivas ilimitadas com IA, assinatura eletrônica, exportação em PDF, logo em Base64 e link público liberados.
                      </p>
                      {user?.data_proxima_cobranca && (
                        <div className="flex items-center gap-1.5 mt-3 text-[11px] text-blue-200 font-medium pt-2 border-t border-blue-400/20">
                          <Calendar className="w-3.5 h-3.5 text-blue-300" />
                          <span>Próxima renovação em: <strong>{dataFimFormatada}</strong></span>
                        </div>
                      )}
                    </div>

                    <div className="pt-1 flex justify-end">
                      <button
                        type="button"
                        onClick={() => setConfirmDowngradeOpen(true)}
                        className="text-xs text-rose-300 hover:text-rose-100 underline decoration-rose-400/40 hover:decoration-rose-200 transition-colors cursor-pointer flex items-center gap-1"
                      >
                        Cancelar assinatura do plano
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="space-y-5">
                <div>
                  <div className="text-3xl font-black text-white">
                    R$ 45,90 <span className="text-xs text-blue-200 font-normal">/ mês</span>
                  </div>
                  <p className="text-xs text-slate-300 mt-1">
                    Eleve o nível das suas vendas com recursos comerciais de alto valor.
                  </p>
                </div>

                <ul className="space-y-2.5 text-xs text-slate-200">
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                    <span>Assinatura Eletrônica com certificado</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                    <span>Exportação e Impressão em PDF</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                    <span>Link público e envio direto via WhatsApp</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                    <span>Logotipo em Base64 & Propostas Executivas</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                    <span>Propostas ilimitadas com IA</span>
                  </li>
                </ul>

                <Button
                  onClick={handleUpgradeCheckout}
                  variant="primary"
                  size="md"
                  className="w-full justify-center font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/25"
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                >
                  Fazer Upgrade com PIX (R$ 45,90/mês)
                </Button>

                <div className="text-center text-[11px] text-slate-400">
                  Pagamento instantâneo via PIX Transparente (Abacate Pay)
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>

      <ConfirmModal
        isOpen={confirmDowngradeOpen}
        onClose={() => setConfirmDowngradeOpen(false)}
        onConfirm={handleAgendarDowngrade}
        title="Cancelar Assinatura Pro?"
        description={
          <span>
            Ao agendar o cancelamento, seu plano Pro continuará{" "}
            <strong>100% ativo até {dataFimFormatada}</strong>. Após essa data, sua conta retornará ao plano Free e nenhuma cobrança futura será realizada.
          </span>
        }
        confirmLabel="Confirmar Cancelamento"
        cancelLabel="Manter Plano Pro"
        variant="warning"
        isLoading={isDowngrading}
      />

      <UpgradeModal
        isOpen={upgradeModalOpen}
        onClose={() => setUpgradeModalOpen(false)}
        feature="logo"
      />
    </div>
  );
}
