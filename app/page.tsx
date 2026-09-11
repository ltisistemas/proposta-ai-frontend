"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Check,
  ShieldCheck,
  Clock,
  ChevronDown,
  ChevronUp,
  Star,
  Smartphone,
  TrendingUp,
  MessageCircle,
  Menu,
  X,
  FileCheck,
  Zap,
  Building2,
  FileText,
  MousePointerClick,
} from "lucide-react";
import { Button } from "@/components/Common/Button";
import { Logo } from "@/components/Common/Logo";

interface DemoPreset {
  id: string;
  label: string;
  client: string;
  service: string;
  scope: string;
  price: string;
  terms: string;
}

const DEMO_PRESETS: DemoPreset[] = [
  {
    id: "dev",
    label: "Desenvolvimento Web & App",
    client: "TechFlow Brasil Ltda",
    service: "Desenvolvimento de Web App & Integrações",
    scope:
      "Construção de aplicação web moderna com Next.js, arquitetura serverless, integração com gateway de pagamentos e painel administrativo responsivo.",
    price: "7.800,00",
    terms: "50% de entrada + 50% na homologação final",
  },
  {
    id: "marketing",
    label: "Marketing & Tráfego Pago",
    client: "Studio Bella Estética",
    service: "Gestão Estratégica de Tráfego & SEO",
    scope:
      "Planejamento e execução de campanhas de alta performance no Meta Ads e Google Ads, otimização de conversão na landing page e relatórios semanais.",
    price: "3.200,00",
    terms: "Mensalidade com renovação a cada 30 dias",
  },
  {
    id: "branding",
    label: "Design & Identidade Visual",
    client: "Café Origem Artesanal",
    service: "Identidade Visual & Branding Completo",
    scope:
      "Criação de logotipo vetorial, manual de marca, paleta de cores, tipografia corporativa, papelaria institucional e templates prontos para redes sociais.",
    price: "4.500,00",
    terms: "Entrada de 40% + 2x de 30%",
  },
  {
    id: "consultoria",
    label: "Consultoria & Processos",
    client: "Vanguarda Logística",
    service: "Diagnóstico & Automação de Processos",
    scope:
      "Mapeamento de gargalos operacionais, implementação de esteira de automação com IA e treinamento da equipe para redução de 35% nos custos.",
    price: "9.600,00",
    terms: "Pagamento único via PIX à vista com 5% de desconto",
  },
];

const FAQS = [
  {
    question: "Preciso cadastrar cartão de crédito para começar?",
    answer:
      "Não! O plano gratuito do ViraPropo AI! não exige nenhum dado de pagamento. Você pode se cadastrar em 30 segundos e criar até 3 propostas comerciais completas por mês gratuitamente.",
  },
  {
    question: "Como o meu cliente recebe e visualiza a proposta?",
    answer:
      "Você pode enviar um link interativo direto pelo WhatsApp (onde o cliente visualiza a proposta formatada no celular ou computador) ou exportar um PDF impecável de alta resolução pronto para impressão ou assinatura digital.",
  },
  {
    question: "Como funciona a assinatura do Plano Pro?",
    answer:
      "O Plano Pro custa R$ 45,90/mês e libera propostas ilimitadas com IA, personalização completa com a sua logomarca no cabeçalho, templates comerciais exclusivos e suporte prioritário via WhatsApp. O pagamento é 100% instantâneo e seguro via PIX pelo Asaas.",
  },
  {
    question: "Posso cancelar minha assinatura quando quiser?",
    answer:
      "Sim! Você pode cancelar a qualquer momento com apenas 1 clique diretamente no painel da sua conta, sem multas, carências ou burocracias.",
  },
];

export default function LandingPage() {
  const [selectedPreset, setSelectedPreset] = useState<DemoPreset>(
    DEMO_PRESETS[0]
  );
  const [copiedNotification, setCopiedNotification] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleCopyWhatsApp = () => {
    const text = `Olá, ${selectedPreset.client}! Segue a nossa proposta comercial para ${selectedPreset.service} no valor de R$ ${selectedPreset.price}. Condições: ${selectedPreset.terms}. Acesse a proposta completa: https://proposta-ai-pra-mim.vercel.app/propostas/demo`;
    navigator.clipboard.writeText(text);
    setCopiedNotification(true);
    setTimeout(() => setCopiedNotification(false), 2500);
  };

  return (
    <div className="min-h-screen bg-[#FBFBFA] text-slate-900 relative overflow-hidden font-sans">
      {/* Subtle Warm Light Background Accents */}
      <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none -z-0 opacity-60" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[450px] bg-gradient-to-b from-blue-100/50 via-sky-50/30 to-transparent blur-3xl pointer-events-none -z-0" />

      {/* =========================================================================
          1. HEADER / NAVBAR (Light Theme)
      ========================================================================= */}
      <nav className="sticky top-0 z-50 backdrop-blur-xl bg-[#FBFBFA]/90 border-b border-slate-200/80 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <Logo href="/" size="md" variant="light" />

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-600">
            <a
              href="#demonstracao"
              className="hover:text-blue-600 transition-colors"
            >
              Demonstração
            </a>
            <a
              href="#como-funciona"
              className="hover:text-blue-600 transition-colors"
            >
              Como Funciona
            </a>
            <a
              href="#recursos"
              className="hover:text-blue-600 transition-colors"
            >
              Recursos
            </a>
            <a
              href="#precos"
              className="hover:text-blue-600 transition-colors"
            >
              Planos & Preços
            </a>
            <a
              href="#faq"
              className="hover:text-blue-600 transition-colors"
            >
              Dúvidas
            </a>
          </div>

          {/* Action CTAs */}
          <div className="hidden sm:flex items-center gap-3">
            <Link href="/login">
              <Button
                variant="ghost"
                size="sm"
                className="text-slate-700 hover:text-slate-900 hover:bg-slate-100 font-semibold text-xs"
              >
                Entrar
              </Button>
            </Link>
            <Link href="/signup">
              <Button
                variant="primary"
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/20"
                rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
              >
                Criar Conta Grátis
              </Button>
            </Link>
          </div>

          {/* Mobile Menu Toggle Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-xl text-slate-700 hover:bg-slate-100 border border-slate-200 cursor-pointer"
            aria-label="Abrir menu"
          >
            {mobileMenuOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </button>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-b border-slate-200 bg-white/95 backdrop-blur-xl px-4 pt-3 pb-6 space-y-3 shadow-xl">
            <a
              href="#demonstracao"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm font-semibold text-slate-700 hover:text-blue-600"
            >
              Demonstração Interativa
            </a>
            <a
              href="#como-funciona"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm font-semibold text-slate-700 hover:text-blue-600"
            >
              Como Funciona
            </a>
            <a
              href="#recursos"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm font-semibold text-slate-700 hover:text-blue-600"
            >
              Recursos
            </a>
            <a
              href="#precos"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm font-semibold text-slate-700 hover:text-blue-600"
            >
              Planos & Preços
            </a>
            <a
              href="#faq"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm font-semibold text-slate-700 hover:text-blue-600"
            >
              Perguntas Frequentes
            </a>
            <div className="pt-4 border-t border-slate-100 flex flex-col gap-2">
              <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                <Button
                  variant="outline"
                  size="md"
                  className="w-full justify-center text-slate-800"
                >
                  Entrar na Conta
                </Button>
              </Link>
              <Link href="/signup" onClick={() => setMobileMenuOpen(false)}>
                <Button
                  variant="primary"
                  size="md"
                  className="w-full justify-center bg-blue-600 hover:bg-blue-700 text-white font-bold"
                >
                  Criar Conta Grátis Agora
                </Button>
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* =========================================================================
          2. HERO SECTION (Light & Blue Theme)
      ========================================================================= */}
      <section className="relative pt-12 pb-16 sm:pt-20 sm:pb-24 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto text-center z-10">
        {/* Status Pill */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold mb-6 shadow-xs">
          <Sparkles className="w-3.5 h-3.5 text-blue-600" />
          <span>IA Comercial treinada para prestadores de serviços brasileiros</span>
        </div>

        {/* Main Value Headline */}
        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-[1.12]">
          Propostas comerciais que{" "}
          <span className="text-blue-600 underline decoration-blue-200 decoration-wavy underline-offset-8">
            fecham contratos
          </span>{" "}
          antes do café esfriar.
        </h1>

        {/* Subtitle */}
        <p className="mt-6 text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed font-normal">
          Diga adeus a horas perdidas no Word ou Canva. Crie propostas
          estruturadas, persuasivas e com cálculos automáticos em Real em menos
          de 2 minutos. Prontas para WhatsApp e PDF.
        </p>

        {/* Primary Call to Action */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3.5">
          <Link href="/signup" className="w-full sm:w-auto">
            <Button
              variant="primary"
              size="lg"
              className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white text-base px-8 py-4 shadow-lg shadow-blue-600/25 font-bold"
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Criar Proposta Grátis
            </Button>
          </Link>
          <a href="#demonstracao" className="w-full sm:w-auto">
            <Button
              variant="secondary"
              size="lg"
              className="w-full sm:w-auto bg-white text-slate-800 border-slate-300 hover:bg-slate-50 text-sm font-semibold shadow-xs"
            >
              Ver Demonstração Interativa ↓
            </Button>
          </a>
        </div>

        {/* Social Proof & Trust Strip */}
        <div className="mt-12 pt-8 border-t border-slate-200/80 flex flex-wrap items-center justify-center gap-6 sm:gap-8 text-xs text-slate-600 font-medium">
          <div className="flex items-center gap-1.5 text-amber-500">
            <div className="flex">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className="w-4 h-4 fill-amber-400 text-amber-400"
                />
              ))}
            </div>
            <span className="font-bold text-slate-900 ml-1">4.9/5</span>
            <span className="text-slate-500">(+1.200 profissionais no Brasil)</span>
          </div>
          <div className="hidden sm:inline-block w-1.5 h-1.5 rounded-full bg-slate-300" />
          <div className="flex items-center gap-1.5 text-slate-700">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Sem necessidade de cartão de crédito</span>
          </div>
          <div className="hidden sm:inline-block w-1.5 h-1.5 rounded-full bg-slate-300" />
          <div className="flex items-center gap-1.5 text-slate-700">
            <Clock className="w-4 h-4 text-blue-600" />
            <span>Pronta em menos de 120 segundos</span>
          </div>
        </div>
      </section>

      {/* =========================================================================
          3. INTERACTIVE LIVE DEMO SHOWCASE (Light Card & Document Sheet)
      ========================================================================= */}
      <section
        id="demonstracao"
        className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto z-10 scroll-mt-20"
      >
        <div className="text-center mb-8 sm:mb-12">
          <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Veja como sua proposta ganha vida em tempo real
          </h2>
          <p className="text-slate-600 text-sm mt-2 max-w-lg mx-auto">
            Selecione uma área de atuação abaixo para ver o documento adaptado
            com cálculos e termos comerciais instantâneos.
          </p>
        </div>

        {/* Preset Selector Chips */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-8">
          {DEMO_PRESETS.map((preset) => {
            const active = selectedPreset.id === preset.id;
            return (
              <button
                key={preset.id}
                onClick={() => setSelectedPreset(preset)}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                  active
                    ? "bg-blue-600 text-white shadow-md shadow-blue-600/20 ring-2 ring-blue-400/40"
                    : "bg-white text-slate-700 border border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                }`}
              >
                {preset.label}
              </button>
            );
          })}
        </div>

        {/* Interactive Workspace Stage */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
          {/* Left: Input Summary Card */}
          <div className="lg:col-span-4 bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Briefing do Projeto
              </span>
              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Pronto para envio
              </span>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                Cliente
              </label>
              <div className="text-sm font-bold text-slate-900 bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                {selectedPreset.client}
              </div>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                Serviço Selecionado
              </label>
              <div className="text-sm font-medium text-slate-800 bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                {selectedPreset.service}
              </div>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                Investimento Total
              </label>
              <div className="text-2xl font-black text-blue-600 bg-blue-50/60 p-3.5 rounded-xl border border-blue-200/80">
                R$ {selectedPreset.price}
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={handleCopyWhatsApp}
                className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-emerald-600/20 cursor-pointer"
              >
                <MessageCircle className="w-4 h-4" />
                {copiedNotification
                  ? "Texto Copiado com Sucesso! ✓"
                  : "Copiar Mensagem para WhatsApp"}
              </button>
            </div>
          </div>

          {/* Right: Clean A4 Proposal Sheet */}
          <div className="lg:col-span-8 bg-white border border-slate-200/90 rounded-2xl sm:rounded-3xl p-4 sm:p-7 shadow-lg relative overflow-hidden">
            {/* Sheet Control Bar */}
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100 text-xs text-slate-500">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-400" />
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                <span className="ml-1 font-mono text-[11px] text-slate-400">
                  proposta_comercial.pdf
                </span>
              </div>
              <span className="bg-blue-50 text-blue-700 font-bold px-2.5 py-1 rounded-md text-[10px]">
                ⚡ Gerada com Gemini IA
              </span>
            </div>

            {/* Document Body */}
            <div className="border border-slate-200 rounded-xl overflow-hidden bg-white text-left">
              {/* Proposal Header Banner */}
              <div className="bg-slate-900 p-5 sm:p-6 text-white flex flex-wrap items-center justify-between gap-4">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-widest bg-blue-600 text-white px-2.5 py-0.5 rounded-full">
                    Proposta Comercial
                  </span>
                  <h3 className="text-lg sm:text-xl font-black mt-1.5 text-white">
                    Sua Empresa & Consultoria
                  </h3>
                  <p className="text-xs text-slate-300 mt-0.5">
                    CNPJ: 12.345.678/0001-90 • contato@suaempresa.com.br
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-[11px] text-slate-400">Número</div>
                  <div className="text-sm font-bold font-mono text-blue-400">
                    PROP-2026-9842
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    Validade: 30 dias
                  </div>
                </div>
              </div>

              {/* Proposal Main Section */}
              <div className="p-5 sm:p-6 space-y-5">
                {/* Client Box */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 flex flex-wrap justify-between gap-4">
                  <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Preparado Para
                    </div>
                    <div className="text-sm font-bold text-slate-900">
                      {selectedPreset.client}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Condições Comerciais
                    </div>
                    <div className="text-xs font-semibold text-slate-800">
                      {selectedPreset.terms}
                    </div>
                  </div>
                </div>

                {/* Scope */}
                <div>
                  <h4 className="text-xs font-bold text-blue-900 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                    1. Escopo & Diagnóstico da Solução
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed bg-slate-50/70 p-3 rounded-lg border border-slate-100">
                    {selectedPreset.scope}
                  </p>
                </div>

                {/* Financial Line Items Table */}
                <div>
                  <h4 className="text-xs font-bold text-blue-900 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                    2. Entregáveis & Investimento
                  </h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left border border-slate-200 rounded-lg overflow-hidden">
                      <thead className="bg-slate-100 text-slate-700 font-bold">
                        <tr>
                          <th className="p-2.5">Descrição do Entregável</th>
                          <th className="p-2.5 text-center w-16">Qtd</th>
                          <th className="p-2.5 text-right w-28">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        <tr>
                          <td className="p-2.5 font-medium text-slate-800">
                            {selectedPreset.service}
                          </td>
                          <td className="p-2.5 text-center text-slate-600">1</td>
                          <td className="p-2.5 text-right font-bold text-slate-900">
                            R$ {selectedPreset.price}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Subtotal Total Box */}
                  <div className="mt-3 flex justify-end">
                    <div className="bg-blue-50/80 border border-blue-100 px-4 py-2.5 rounded-xl text-right min-w-[200px]">
                      <span className="text-[10px] text-blue-700 font-bold uppercase tracking-wider block">
                        Investimento Total
                      </span>
                      <span className="text-base font-black text-blue-950">
                        R$ {selectedPreset.price}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Document Footer */}
                <div className="pt-3 border-t border-slate-100 text-center text-[10px] text-slate-400">
                  Proposta gerada via ViraPropo AI! • Documento confidencial destinado exclusivamente ao cliente.
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          4. COMO FUNCIONA (3 Linear Steps)
      ========================================================================= */}
      <section
        id="como-funciona"
        className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto z-10 scroll-mt-20 border-t border-slate-200/80"
      >
        <div className="text-center mb-12 sm:mb-16">
          <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Como criar propostas vencedoras em 3 passos simples
          </h2>
          <p className="text-slate-600 text-sm mt-2 max-w-lg mx-auto">
            Sem templates quebrados ou retrabalho. Da ideia ao contrato assinado.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          {/* Step 1 */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-7 shadow-sm relative hover:border-blue-300 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 font-black text-base flex items-center justify-center mb-4">
              01
            </div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-2">
              Preencha os dados básicos
            </h3>
            <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
              Insira o nome do cliente, o serviço solicitado e adicione os itens
              com nossa calculadora financeira automática.
            </p>
          </div>

          {/* Step 2 */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-7 shadow-sm relative hover:border-blue-300 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 font-black text-base flex items-center justify-center mb-4">
              02
            </div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-2">
              A IA estrutura o documento
            </h3>
            <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
              O motor de IA sintetiza um escopo persuasivo, argumentos
              estratégicos, condições de pagamento e prazos detalhados.
            </p>
          </div>

          {/* Step 3 */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-7 shadow-sm relative hover:border-blue-300 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 font-black text-base flex items-center justify-center mb-4">
              03
            </div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-2">
              Envie e feche o contrato
            </h3>
            <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
              Compartilhe o link direto no WhatsApp do cliente ou faça download
              do PDF impecável pronto para impressão ou assinatura.
            </p>
          </div>
        </div>
      </section>

      {/* =========================================================================
          5. BENTO GRID DE RECURSOS (Light & Blue Bento)
      ========================================================================= */}
      <section
        id="recursos"
        className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto z-10 scroll-mt-20 border-t border-slate-200/80"
      >
        <div className="text-center mb-12 sm:mb-16">
          <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Construído para quem valoriza tempo e autoridade
          </h2>
          <p className="text-slate-600 text-sm mt-2 max-w-lg mx-auto">
            Cada recurso foi projetado para elevar a percepção de valor dos seus serviços.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Bento 1: Copywriting com IA (Span 2) */}
          <div className="md:col-span-2 bg-gradient-to-br from-blue-900 via-blue-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-md">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-300 flex items-center justify-center mb-4">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-white mb-2">
              Copywriting Comercial de Alta Conversão com IA
            </h3>
            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed max-w-xl">
              Nossa inteligência artificial analisa a necessidade do cliente e
              redige um diagnóstico claro, destacando a metodologia de trabalho,
              os benefícios estratégicos e as garantias da entrega.
            </p>
          </div>

          {/* Bento 2: Cálculo em Real */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center mb-4">
              <TrendingUp className="w-5 h-5" />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-2">
              Cálculo Automático & BRL
            </h3>
            <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
              Tabela financeira com soma automática de itens, quantidades e
              formatação contábil padrão brasileira em Real (R$).
            </p>
          </div>

          {/* Bento 3: WhatsApp & PDF */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
              <Smartphone className="w-5 h-5" />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-2">
              Envio WhatsApp & PDF
            </h3>
            <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
              Envie mensagens formatadas diretamente pelo WhatsApp ou faça download
              do PDF de alta fidelidade diagramado para impressão.
            </p>
          </div>

          {/* Bento 4: Gestão de Propostas (Span 2) */}
          <div className="md:col-span-2 bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4">
              <FileCheck className="w-5 h-5" />
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-2">
              Gestão de Propostas em Tempo Real
            </h3>
            <p className="text-slate-600 text-xs sm:text-sm leading-relaxed max-w-xl">
              Acompanhe todo o ciclo de vida dos seus orçamentos através de status
              claros (Rascunho, Enviada, Aprovada e Recusada) e métricas de taxa de
              conversão.
            </p>
          </div>
        </div>
      </section>

      {/* =========================================================================
          6. PLANOS & PREÇOS (Light Cards with Blue Highlight)
      ========================================================================= */}
      <section
        id="precos"
        className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto z-10 scroll-mt-20 border-t border-slate-200/80"
      >
        <div className="text-center mb-12 sm:mb-16">
          <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Planos simples e transparentes
          </h2>
          <p className="text-slate-600 text-sm mt-2 max-w-md mx-auto">
            Comece no plano gratuito e faça upgrade quando seu volume de propostas
            crescer.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 items-stretch">
          {/* Free Plan */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 flex flex-col justify-between shadow-sm">
            <div>
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-base sm:text-lg font-bold text-slate-900">
                  Plano Gratuito
                </h3>
                <span className="text-[11px] font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full">
                  Sem Cartão
                </span>
              </div>
              <p className="text-slate-500 text-xs mb-6">
                Para quem está começando e precisa de propostas pontuais.
              </p>

              <div className="text-3xl font-black text-slate-900 mb-6">
                R$ 0{" "}
                <span className="text-xs text-slate-400 font-normal">/ mês</span>
              </div>

              <ul className="space-y-2.5 text-xs text-slate-700">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>3 propostas com IA por mês</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Cálculos financeiros automáticos</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Visualização online e link público</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Exportação para PDF</span>
                </li>
              </ul>
            </div>

            <div className="pt-6 mt-6 border-t border-slate-100">
              <Link href="/signup" className="block w-full">
                <Button
                  variant="outline"
                  size="md"
                  className="w-full justify-center text-slate-900 font-bold text-xs"
                >
                  Criar Conta Gratuita
                </Button>
              </Link>
            </div>
          </div>

          {/* Pro Plan (Highlighted Blue) */}
          <div className="bg-white border-2 border-blue-600 rounded-3xl p-6 sm:p-8 flex flex-col justify-between relative shadow-xl shadow-blue-600/10">
            <div className="absolute -top-3 right-6 bg-blue-600 text-white text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full shadow-md">
              Mais Escolhido
            </div>

            <div>
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-base sm:text-lg font-bold text-slate-900">
                  Plano Pro
                </h3>
                <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200">
                  Acesso Total
                </span>
              </div>
              <p className="text-slate-500 text-xs mb-6">
                Para profissionais e agências que fecham negócios diariamente.
              </p>

              <div className="text-3xl font-black text-slate-900 mb-6">
                R$ 45,90{" "}
                <span className="text-xs text-slate-400 font-normal">/ mês</span>
              </div>

              <ul className="space-y-2.5 text-xs text-slate-800">
                <li className="flex items-center gap-2 font-bold text-blue-900">
                  <Check className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>Propostas ILIMITADAS com IA</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>Logotipo e identidade personalizada</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>Sem marca d'água nos PDFs</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>Métricas completas de conversão</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>Suporte prioritário via WhatsApp</span>
                </li>
              </ul>
            </div>

            <div className="pt-6 mt-6 border-t border-slate-100">
              <Link href="/signup" className="block w-full">
                <Button
                  variant="primary"
                  size="md"
                  className="w-full justify-center font-bold text-xs bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/25"
                >
                  Assinar Plano Pro (R$ 45,90)
                </Button>
              </Link>
              <div className="text-center text-[10px] text-slate-500 mt-2">
                Pagamento instantâneo e seguro via PIX (Asaas)
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          7. PERGUNTAS FREQUENTES (FAQ ACCORDION)
      ========================================================================= */}
      <section
        id="faq"
        className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto z-10 scroll-mt-20 border-t border-slate-200/80"
      >
        <div className="text-center mb-10 sm:mb-12">
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Perguntas Frequentes
          </h2>
          <p className="text-slate-500 text-xs sm:text-sm mt-1">
            Tire suas dúvidas antes de começar
          </p>
        </div>

        <div className="space-y-3">
          {FAQS.map((faq, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div
                key={idx}
                className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs transition-colors"
              >
                <button
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                  className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 font-bold text-xs sm:text-sm text-slate-900 hover:text-blue-600 transition-colors cursor-pointer"
                >
                  <span>{faq.question}</span>
                  {isOpen ? (
                    <ChevronUp className="w-4 h-4 text-slate-500 shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-500 shrink-0" />
                  )}
                </button>
                {isOpen && (
                  <div className="px-4 sm:px-5 pb-4 sm:pb-5 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100 pt-3">
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* =========================================================================
          8. FINAL CALL TO ACTION (Warm Card with Royal Blue Button)
      ========================================================================= */}
      <section className="py-14 sm:py-16 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto z-10 text-center">
        <div className="bg-gradient-to-br from-blue-900 via-blue-950 to-slate-900 text-white rounded-3xl p-8 sm:p-12 shadow-xl relative overflow-hidden">
          <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
            Comece a fechar mais propostas hoje mesmo
          </h2>
          <p className="text-slate-300 text-xs sm:text-sm max-w-lg mx-auto mt-3">
            Crie sua conta gratuita em menos de 1 minuto e encante seus clientes
            com propostas de alto padrão comercial.
          </p>
          <div className="mt-7 flex justify-center">
            <Link href="/signup">
              <Button
                variant="primary"
                size="lg"
                className="font-bold text-sm px-8 py-3.5 shadow-xl shadow-blue-600/30 bg-blue-600 hover:bg-blue-500 text-white"
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Criar Minha Primeira Proposta Grátis
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* =========================================================================
          9. FOOTER (Clean Light Footer with Legal Links)
      ========================================================================= */}
      <footer className="border-t border-slate-200/80 py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6 text-xs text-slate-500">
        <Logo size="sm" variant="light" showSubtitle={false} />
        <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-6">
          <span>© {new Date().getFullYear()} ViraPropo AI!. Todos os direitos reservados.</span>
          <div className="flex items-center gap-4">
            <Link href="/termos" className="hover:text-blue-600 transition-colors underline-offset-2 hover:underline">
              Termos de Uso
            </Link>
            <span className="text-slate-300">•</span>
            <Link href="/privacidade" className="hover:text-blue-600 transition-colors underline-offset-2 hover:underline">
              Privacidade (LGPD)
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
