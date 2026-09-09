"use client";

import React, { useState, useEffect } from "react";
import {
  Settings,
  Building2,
  FileText,
  Mail,
  Phone,
  User,
  Shield,
  Zap,
  Check,
  ArrowRight,
  ExternalLink,
  Sparkles,
} from "lucide-react";
import { Input } from "@/components/Common/Input";
import { Button } from "@/components/Common/Button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/Common/Card";
import { Badge } from "@/components/Common/Badge";
import { useAuthStore } from "@/lib/auth/useAuthStore";
import { useToast } from "@/components/Common/Toast";

export default function ConfigPage() {
  const { user, token, updateUser, fetchMe } = useAuthStore();
  const { addToast } = useToast();

  const [nome, setNome] = useState(user?.nome || "");
  const [empresaNome, setEmpresaNome] = useState(user?.empresa_nome || "");
  const [empresaCnpj, setEmpresaCnpj] = useState(user?.empresa_cnpj || "");
  const [empresaEmail, setEmpresaEmail] = useState(user?.empresa_email || "");
  const [empresaTelefone, setEmpresaTelefone] = useState(user?.empresa_telefone || "");
  const [empresaLogoUrl, setEmpresaLogoUrl] = useState(user?.empresa_logo_url || "");

  const [isSaving, setIsSaving] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);

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
          empresa_logo_url: empresaLogoUrl || null,
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

  const handleUpgradeCheckout = async () => {
    if (!token) return;
    setIsCheckingOut(true);

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
    } finally {
      setIsCheckingOut(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-16">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
          Configurações da Conta & Plano
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Personalize os dados da sua empresa e gerencie sua assinatura do Proposta Ai!
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Profile Form */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="bg-slate-900/80 border-slate-800 p-6 sm:p-8 rounded-3xl backdrop-blur-xl">
            <div className="flex items-center gap-2.5 pb-4 mb-6 border-b border-slate-800 text-white font-bold text-base">
              <Building2 className="w-5 h-5 text-indigo-400" />
              <span>Dados da Empresa Emissora</span>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <Input
                label="Seu Nome Completo *"
                required
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                leftIcon={<User className="w-4 h-4" />}
                className="bg-slate-950 border-slate-700 text-white"
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Razão Social / Nome Fantasia"
                  placeholder="Minha Empresa Consultoria"
                  value={empresaNome}
                  onChange={(e) => setEmpresaNome(e.target.value)}
                  leftIcon={<Building2 className="w-4 h-4" />}
                  className="bg-slate-950 border-slate-700 text-white"
                />

                <Input
                  label="CNPJ"
                  placeholder="00.000.000/0001-00"
                  value={empresaCnpj}
                  onChange={(e) => setEmpresaCnpj(e.target.value)}
                  leftIcon={<FileText className="w-4 h-4" />}
                  className="bg-slate-950 border-slate-700 text-white"
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
                  className="bg-slate-950 border-slate-700 text-white"
                />

                <Input
                  label="Telefone / WhatsApp"
                  placeholder="(11) 98765-4321"
                  value={empresaTelefone}
                  onChange={(e) => setEmpresaTelefone(e.target.value)}
                  leftIcon={<Phone className="w-4 h-4" />}
                  className="bg-slate-950 border-slate-700 text-white"
                />
              </div>

              <Input
                label="URL do Logotipo da Empresa (Opcional)"
                placeholder="https://suaempresa.com/logo.png"
                value={empresaLogoUrl}
                onChange={(e) => setEmpresaLogoUrl(e.target.value)}
                className="bg-slate-950 border-slate-700 text-white"
                helperText="O logo será incluído automaticamente no cabeçalho das propostas geradas."
              />

              <div className="pt-4 flex justify-end">
                <Button
                  type="submit"
                  variant="primary"
                  isLoading={isSaving}
                >
                  Salvar Alterações
                </Button>
              </div>
            </form>
          </Card>
        </div>

        {/* Right: Plan Status & Billing */}
        <div className="space-y-6">
          <Card className="bg-gradient-to-br from-slate-900 to-indigo-950/60 border-2 border-indigo-500/40 p-6 rounded-3xl backdrop-blur-xl relative overflow-hidden shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-400" />
                <span className="text-sm font-bold text-white">Plano Atual</span>
              </div>
              <Badge variant={user?.plano === "pro" ? "pro" : "free"}>
                {user?.plano?.toUpperCase() || "FREE"}
              </Badge>
            </div>

            {user?.plano === "pro" ? (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-200 text-xs">
                  <p className="font-bold text-sm text-white flex items-center gap-1.5 mb-1">
                    <Check className="w-4 h-4 text-emerald-400" /> Assinatura Pro Ativa
                  </p>
                  Você possui propostas ilimitadas com IA e todas as funcionalidades liberadas.
                </div>
              </div>
            ) : (
              <div className="space-y-5">
                <div>
                  <div className="text-3xl font-black text-white">
                    R$ 45,90 <span className="text-xs text-slate-400 font-normal">/ mês</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Gere quantas propostas comerciais precisar sem nenhum limite.
                  </p>
                </div>

                <ul className="space-y-2.5 text-xs text-slate-300">
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                    <span>Propostas ilimitadas com Gemini IA</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                    <span>Sem marca d'água</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                    <span>Download e compartilhamento direto</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                    <span>Suporte prioritário</span>
                  </li>
                </ul>

                <Button
                  onClick={handleUpgradeCheckout}
                  isLoading={isCheckingOut}
                  variant="gradient"
                  size="md"
                  className="w-full justify-center font-bold"
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                >
                  Fazer Upgrade via Abacate Pay
                </Button>

                <div className="text-center text-[11px] text-slate-500">
                  Pagamento processado via Abacate Pay (Cartão & PIX)
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
