"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Check,
  Zap,
  ShieldCheck,
  Share2,
  FileDown,
  Layers,
  Clock,
  ChevronDown,
  ChevronUp,
  Copy,
  Star,
  Smartphone,
  TrendingUp,
  MessageCircle,
} from "lucide-react";
import { Button } from "@/components/Common/Button";
import { Badge } from "@/components/Common/Badge";
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
    label: "💻 Desenvolvimento Web",
    client: "TechFlow Brasil Ltda",
    service: "Desenvolvimento de Web App & Integrações",
    scope:
      "Construção de aplicação web moderna com Next.js, arquitetura serverless, integração com gateway de pagamentos e painel administrativo responsivo.",
    price: "7.800,00",
    terms: "50% de entrada + 50% na homologação final",
  },
  {
    id: "marketing",
    label: "📈 Marketing & Tráfego",
    client: "Studio Bella Estética",
    service: "Gestão Estratégica de Tráfego & SEO",
    scope:
      "Planejamento e execução de campanhas de alta performance no Meta Ads e Google Ads, otimização de conversão na landing page e relatórios semanais.",
    price: "3.200,00",
    terms: "Mensalidade com renovação a cada 30 dias",
  },
  {
    id: "branding",
    label: "🎨 Design & Identidade",
    client: "Café Origem Artesanal",
    service: "Identidade Visual & Branding Completo",
    scope:
      "Criação de logotipo vetorial, manual de marca, paleta de cores, tipografia corporativa, papelaria institucional e templates prontos para redes sociais.",
    price: "4.500,00",
    terms: "Entrada de 40% + 2x de 30%",
  },
  {
    id: "consultoria",
    label: "⚡ Consultoria de Negócios",
    client: "Vanguarda Logística",
    service: "Diagnóstico & Automação de Processos",
    scope:
      "Mapeamento de gargalos operacionais, implementação de esteira de automação com IA e treinamento da equipe para redução de 35% nos custos operacionais.",
    price: "9.600,00",
    terms: "Pagamento único via PIX à vista com 5% de desconto",
  },
];

const FAQS = [
  {
    question: "Preciso cadastrar cartão de crédito para começar?",
    answer:
      "Não! O plano gratuito do Proposta Ai! não exige cartão de crédito. Você pode se cadastrar em 30 segundos e gerar até 3 propostas comerciais completas por mês gratuitamente.",
  },
  {
    question: "Como o meu cliente final visualiza a proposta?",
    answer:
      "Você pode enviar um link interativo direto pelo WhatsApp (onde ele visualiza a proposta formatada no celular ou computador) ou exportar um PDF impecável de alta resolução pronto para impressão ou assinatura digital.",
  },
  {
    question: "Como funciona a assinatura do Plano Pro?",
    answer:
      "O Plano Pro custa R$ 45,90/mês e libera propostas ilimitadas com IA, personalização completa com a sua logomarca, templates comerciais exclusivos e suporte prioritário. O pagamento é processado de forma 100% segura via PIX ou Cartão pelo Abacate Pay.",
  },
  {
    question: "Posso cancelar minha assinatura quando quiser?",
    answer:
      "Sim! Você pode cancelar com 1 clique diretamente no painel de configurações da sua conta, sem multas ou burocracias. Seu acesso Pro continuará ativo até o fim do período já pago.",
  },
];

export default function LandingPage() {
  const [selectedPreset, setSelectedPreset] = useState<DemoPreset>(
    DEMO_PRESETS[0]
  );
  const [copiedNotification, setCopiedNotification] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const handleCopyWhatsApp = () => {
    const text = `Olá, ${selectedPreset.client}! Segue a nossa proposta comercial para ${selectedPreset.service} no valor de R$ ${selectedPreset.price}. Condições: ${selectedPreset.terms}. Acesse a proposta completa: https://proposta-ai-pra-mim.vercel.app/propostas/demo`;
    navigator.clipboard.writeText(text);
    setCopiedNotification(true);
    setTimeout(() => setCopiedNotification(false), 2500);
  };

  return (
    <div className="min-h-screen bg-[#07090e] text-white selection:bg-indigo-600 selection:text-white relative overflow-hidden font-sans">
      {/* Background Architectural Grid & Radial Glows */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b15_1px,transparent_1px),linear-gradient(to_bottom,#1e293b15_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none -z-0" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[400px] bg-gradient-to-b from-indigo-600/15 via-cyan-500/5 to-transparent blur-3xl pointer-events-none -z-0" />

      {/* =========================================================================
          1. HEADER / NAVBAR
      ========================================================================= */}
      <nav className="sticky top-0 z-50 backdrop-blur-xl bg-[#07090e]/85 border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <Logo href="/" size="md" />

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center gap-8 text-xs font-semibold text-slate-300">
            <a
              href="#demonstracao"
              className="hover:text-white transition-colors"
            >
              Demonstração
            </a>
            <a
              href="#como-funciona"
              className="hover:text-white transition-colors"
            >
              Como Funciona
            </a>
            <a href="#recursos" className="hover:text-white transition-colors">
              Recursos
            </a>
            <a href="#precos" className="hover:text-white transition-colors">
              Planos & Preços
            </a>
            <a href="#faq" className="hover:text-white transition-colors">
              Dúvidas
            </a>
          </div>

          {/* User Action CTAs */}
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button
                variant="ghost"
                size="sm"
                className="text-slate-300 hover:text-white hover:bg-slate-800/60 font-semibold text-xs"
              >
                Entrar
              </Button>
            </Link>
            <Link href="/signup">
              <Button
                variant="primary"
                size="sm"
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/20"
                rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
              >
                Criar Conta Grátis
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* =========================================================================
          2. HERO SECTION
      ========================================================================= */}
      <section className="relative pt-16 pb-20 sm:pt-24 sm:pb-28 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto text-center z-10">
        {/* Status Pill */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-950/80 border border-indigo-500/30 text-indigo-300 text-xs font-semibold mb-8 backdrop-blur-md shadow-xs">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>IA Comercial treinada para o mercado brasileiro</span>
        </div>

        {/* Main Value Headline */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-white tracking-tight leading-[1.08]">
          Propostas comerciais que{" "}
          <span className="text-sky-400">
            fecham contratos
          </span>{" "}
          antes do café esfriar.
        </h1>

        {/* Subtitle */}
        <p className="mt-6 text-base sm:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed font-normal">
          Diga adeus a horas perdidas no Word ou Canva. Transforme briefings
          simples em propostas altamente persuasivas com IA, cálculos automáticos
          em Real e PDF profissional em menos de 2 minutos.
        </p>

        {/* Primary Call to Action */}
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href="/signup" className="w-full sm:w-auto">
            <Button
              variant="primary"
              size="lg"
              className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-500 text-white text-base px-8 py-4 shadow-xl shadow-indigo-600/30 font-bold"
              rightIcon={<ArrowRight className="w-5 h-5" />}
            >
              Criar Minha Primeira Proposta Grátis
            </Button>
          </Link>
          <a href="#demonstracao" className="w-full sm:w-auto">
            <Button
              variant="secondary"
              size="lg"
              className="w-full sm:w-auto bg-slate-900/90 text-slate-200 border-slate-700/80 hover:bg-slate-800 text-sm font-semibold"
            >
              Ver Demonstração Interativa ↓
            </Button>
          </a>
        </div>

        {/* Social Proof & Trust Strip */}
        <div className="mt-12 pt-8 border-t border-slate-800/60 flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-xs text-slate-400">
          <div className="flex items-center gap-1.5 text-amber-400">
            <div className="flex">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
              ))}
            </div>
            <span className="font-bold text-white ml-1">4.9/5</span>
            <span className="text-slate-400">(+1.200 freelancers e agências)</span>
          </div>
          <div className="hidden sm:inline-block w-1 h-1 rounded-full bg-slate-700" />
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Sem necessidade de cartão de crédito</span>
          </div>
          <div className="hidden sm:inline-block w-1 h-1 rounded-full bg-slate-700" />
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-sky-400" />
            <span>Proposta pronta em 120 segundos</span>
          </div>
        </div>
      </section>

      {/* =========================================================================
          3. INTERACTIVE LIVE DEMO SHOWCASE
      ========================================================================= */}
      <section
        id="demonstracao"
        className="py-20 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto z-10 scroll-mt-24"
      >
        <div className="text-center mb-10">
          <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
            Veja a mágica acontecer em tempo real
          </h2>
          <p className="text-slate-400 text-sm mt-2 max-w-lg mx-auto">
            Clique em um dos cenários abaixo e veja como a proposta comercial é
            estruturada e calculada instantaneamente.
          </p>
        </div>

        {/* Preset Selector Chips */}
        <div className="flex flex-wrap items-center justify-center gap-2.5 mb-8">
          {DEMO_PRESETS.map((preset) => {
            const active = selectedPreset.id === preset.id;
            return (
              <button
                key={preset.id}
                onClick={() => setSelectedPreset(preset)}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                  active
                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/25 ring-2 ring-indigo-400/40"
                    : "bg-slate-900/90 text-slate-300 border border-slate-800 hover:border-slate-700 hover:text-white"
                }`}
              >
                {preset.label}
              </button>
            );
          })}
        </div>

        {/* Interactive Workspace Stage */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left: Input Summary Panel */}
          <div className="lg:col-span-4 bg-slate-900/80 border border-slate-800 rounded-2xl p-6 backdrop-blur-xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Briefing de Entrada
              </span>
              <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                Pronto para gerar
              </span>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                Cliente
              </label>
              <div className="text-sm font-bold text-white bg-slate-950 p-3 rounded-xl border border-slate-800">
                {selectedPreset.client}
              </div>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                Serviço / Projeto
              </label>
              <div className="text-sm font-medium text-slate-200 bg-slate-950 p-3 rounded-xl border border-slate-800">
                {selectedPreset.service}
              </div>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                Valor Total Calculado
              </label>
              <div className="text-xl font-black text-indigo-400 bg-indigo-950/40 p-3 rounded-xl border border-indigo-500/20">
                R$ {selectedPreset.price}
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={handleCopyWhatsApp}
                className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-emerald-600/20 cursor-pointer"
              >
                <MessageCircle className="w-4 h-4" />
                {copiedNotification
                  ? "Mensagem Copiada! ✓"
                  : "Copiar Texto para WhatsApp"}
              </button>
            </div>
          </div>

          {/* Right: Live A4 Document Sheet Mockup */}
          <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-7 shadow-2xl backdrop-blur-2xl relative overflow-hidden">
            {/* Ambient Sheet Header Controls */}
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800 text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-rose-500/80" />
                <span className="w-3 h-3 rounded-full bg-amber-500/80" />
                <span className="w-3 h-3 rounded-full bg-emerald-500/80" />
                <span className="ml-2 font-mono text-[11px] text-slate-500">
                  documento_proposta.pdf
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="bg-indigo-500/10 text-indigo-400 font-bold px-2.5 py-1 rounded-md text-[10px]">
                  Visualização da Proposta
                </span>
              </div>
            </div>

            {/* Clean White Sheet Mockup */}
            <div className="bg-white text-slate-900 rounded-2xl shadow-xl border border-slate-200 overflow-hidden text-left">
              {/* Proposal Header */}
              <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 sm:p-7 text-white flex flex-wrap items-center justify-between gap-4">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-widest bg-indigo-600 text-white px-2.5 py-0.5 rounded-full">
                    Proposta Comercial
                  </span>
                  <h3 className="text-xl font-black mt-2 text-white">
                    Sua Empresa & Consultoria
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    CNPJ: 12.345.678/0001-90 • contato@suaempresa.com.br
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-[11px] text-slate-400">Número da Proposta</div>
                  <div className="text-sm font-bold font-mono text-indigo-300">
                    PROP-2026-9842
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    Validade: 30 dias
                  </div>
                </div>
              </div>

              {/* Proposal Content Body */}
              <div className="p-6 sm:p-7 space-y-5">
                {/* Client Box */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 flex flex-wrap justify-between gap-4">
                  <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Preparado para
                    </div>
                    <div className="text-sm font-bold text-slate-900">
                      {selectedPreset.client}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Condições de Pagamento
                    </div>
                    <div className="text-xs font-semibold text-slate-800">
                      {selectedPreset.terms}
                    </div>
                  </div>
                </div>

                {/* Scope */}
                <div>
                  <h4 className="text-xs font-bold text-indigo-900 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-600" />
                    1. Escopo e Metodologia
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed bg-slate-50/70 p-3 rounded-lg border border-slate-100">
                    {selectedPreset.scope}
                  </p>
                </div>

                {/* Financial Table */}
                <div>
                  <h4 className="text-xs font-bold text-indigo-900 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-600" />
                    2. Itens & Investimento
                  </h4>
                  <table className="w-full text-xs text-left border border-slate-200 rounded-lg overflow-hidden">
                    <thead className="bg-slate-100 text-slate-700 font-bold">
                      <tr>
                        <th className="p-2.5">Descrição</th>
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

                  {/* Subtotal */}
                  <div className="mt-3 flex justify-end">
                    <div className="bg-indigo-50/80 border border-indigo-100 px-4 py-2.5 rounded-xl text-right min-w-[200px]">
                      <span className="text-[10px] text-indigo-700 font-bold uppercase tracking-wider block">
                        Investimento Total
                      </span>
                      <span className="text-base font-black text-indigo-950">
                        R$ {selectedPreset.price}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Document Footer Note */}
                <div className="pt-3 border-t border-slate-100 text-center text-[10px] text-slate-400">
                  Proposta gerada via Proposta Ai! • Documento confidencial destinado ao cliente.
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          4. COMO FUNCIONA (3 STEPS)
      ========================================================================= */}
      <section
        id="como-funciona"
        className="py-20 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto z-10 scroll-mt-24 border-t border-slate-800/80"
      >
        <div className="text-center mb-16">
          <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
            Como você cria propostas em 3 passos simples
          </h2>
          <p className="text-slate-400 text-sm mt-2 max-w-lg mx-auto">
            Sem templates quebrados ou retrabalho. Do briefing ao contrato assinado.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          {/* Step 1 */}
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-7 relative">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-black text-lg flex items-center justify-center mb-5">
              01
            </div>
            <h3 className="text-lg font-bold text-white mb-2">
              Preencha os dados básicos
            </h3>
            <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
              Insira o nome do cliente, o serviço solicitado e adicione os itens e
              valores em nossa calculadora automática.
            </p>
          </div>

          {/* Step 2 */}
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-7 relative">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 font-black text-lg flex items-center justify-center mb-5">
              02
            </div>
            <h3 className="text-lg font-bold text-white mb-2">
              A IA estrutura o documento
            </h3>
            <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
              O Google Gemini sintetiza a descrição em um escopo comercial
              persuasivo, com diagnóstico claro e termos formais.
            </p>
          </div>

          {/* Step 3 */}
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-7 relative">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-black text-lg flex items-center justify-center mb-5">
              03
            </div>
            <h3 className="text-lg font-bold text-white mb-2">
              Envie e feche o contrato
            </h3>
            <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
              Envie o link direto no WhatsApp do cliente ou exporte um PDF
              impecável pronto para impressão ou assinatura.
            </p>
          </div>
        </div>
      </section>

      {/* =========================================================================
          5. BENTO GRID DE RECURSOS
      ========================================================================= */}
      <section
        id="recursos"
        className="py-20 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto z-10 scroll-mt-24 border-t border-slate-800/80"
      >
        <div className="text-center mb-16">
          <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
            Construído para profissionais que fecham negócios
          </h2>
          <p className="text-slate-400 text-sm mt-2 max-w-lg mx-auto">
            Cada detalhe foi pensado para transmitir autoridade e agilidade ao seu
            cliente final.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Copywriting com IA (Span 2) */}
          <div className="md:col-span-2 bg-gradient-to-br from-slate-900 to-indigo-950/40 border border-slate-800 rounded-3xl p-8">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/15 text-indigo-400 flex items-center justify-center mb-4">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">
              Copywriting Comercial com Inteligência Artificial
            </h3>
            <p className="text-slate-300 text-sm leading-relaxed max-w-xl">
              Nossa IA analisa o objetivo do seu cliente e redige uma
              apresentação de alto valor, destacando os entregáveis, benefícios
              estratégicos e segurança da contratação.
            </p>
          </div>

          {/* Card 2: Cálculo em Real */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center mb-4">
              <TrendingUp className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">
              Cálculo Automático & BRL
            </h3>
            <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
              Tabela financeira integrada que calcula subtotais, quantidades e
              formata valores conforme os padrões contábeis brasileiros.
            </p>
          </div>

          {/* Card 3: WhatsApp & PDF */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/15 text-cyan-400 flex items-center justify-center mb-4">
              <Smartphone className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">
              WhatsApp & PDF Responsivo
            </h3>
            <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
              Compartilhe a proposta diretamente pelo WhatsApp com mensagem
              pronta ou faça download do PDF diagramado para impressão.
            </p>
          </div>

          {/* Card 4: Gestão e Status (Span 2) */}
          <div className="md:col-span-2 bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 rounded-3xl p-8">
            <div className="w-10 h-10 rounded-xl bg-purple-500/15 text-purple-400 flex items-center justify-center mb-4">
              <Layers className="w-5 h-5" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">
              Gestão de Propostas em Tempo Real
            </h3>
            <p className="text-slate-300 text-sm leading-relaxed max-w-xl">
              Acompanhe seu histórico comercial com indicadores de status
              (Rascunho, Enviada, Aprovada e Recusada) e métricas de taxa de
              conversão.
            </p>
          </div>
        </div>
      </section>

      {/* =========================================================================
          6. PLANOS & PREÇOS
      ========================================================================= */}
      <section
        id="precos"
        className="py-20 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto z-10 scroll-mt-24 border-t border-slate-800/80"
      >
        <div className="text-center mb-14">
          <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
            Planos simples e transparentes
          </h2>
          <p className="text-slate-400 text-sm mt-2 max-w-md mx-auto">
            Comece no plano gratuito e faça upgrade quando o seu volume de propostas
            aumentar.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
          {/* Free Plan */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-8 flex flex-col justify-between backdrop-blur-xl">
            <div>
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-lg font-bold text-white">Plano Grátis</h3>
                <span className="text-[11px] font-bold text-slate-400 bg-slate-800 px-2.5 py-1 rounded-full">
                  Sem Cartão
                </span>
              </div>
              <p className="text-slate-400 text-xs mb-6">
                Para quem está começando e precisa de propostas pontuais.
              </p>

              <div className="text-3xl font-black text-white mb-6">
                R$ 0 <span className="text-xs text-slate-500 font-normal">/ mês</span>
              </div>

              <ul className="space-y-2.5 text-xs text-slate-300">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>3 propostas com IA por mês</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Cálculos financeiros automáticos</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Visualização online e link público</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Exportação para PDF</span>
                </li>
              </ul>
            </div>

            <div className="pt-6 mt-6 border-t border-slate-800">
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

          {/* Pro Plan */}
          <div className="bg-slate-900 border-2 border-indigo-500 rounded-3xl p-8 flex flex-col justify-between relative shadow-2xl shadow-indigo-600/15 backdrop-blur-xl">
            <div className="absolute -top-3 right-6 bg-sky-400 text-sky-950 text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full shadow-md">
              Mais Escolhido
            </div>

            <div>
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-lg font-bold text-white">Plano Pro</h3>
                <span className="text-[11px] font-bold text-indigo-300 bg-indigo-950 px-2.5 py-1 rounded-full border border-indigo-500/30">
                  Ilimitado
                </span>
              </div>
              <p className="text-slate-300 text-xs mb-6">
                Para profissionais e agências que enviam orçamentos diariamente.
              </p>

              <div className="text-3xl font-black text-white mb-6">
                R$ 45,90{" "}
                <span className="text-xs text-slate-400 font-normal">/ mês</span>
              </div>

              <ul className="space-y-2.5 text-xs text-slate-200">
                <li className="flex items-center gap-2 font-bold text-white">
                  <Check className="w-4 h-4 text-indigo-400 shrink-0" />
                  <span>Propostas ILIMITADAS com IA</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-indigo-400 shrink-0" />
                  <span>Logotipo e identidade personalizada</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-indigo-400 shrink-0" />
                  <span>Sem marca d'água nos PDFs</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-indigo-400 shrink-0" />
                  <span>Métricas completas de conversão</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-indigo-400 shrink-0" />
                  <span>Suporte prioritário via WhatsApp</span>
                </li>
              </ul>
            </div>

            <div className="pt-6 mt-6 border-t border-slate-800">
              <Link href="/signup" className="block w-full">
                <Button
                  variant="primary"
                  size="md"
                  className="w-full justify-center font-bold text-xs bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/25"
                >
                  Assinar Plano Pro (R$ 45,90)
                </Button>
              </Link>
              <div className="text-center text-[10px] text-slate-400 mt-2">
                Pagamento seguro via PIX ou Cartão (Abacate Pay)
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
        className="py-20 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto z-10 scroll-mt-24 border-t border-slate-800/80"
      >
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Perguntas Frequentes
          </h2>
          <p className="text-slate-400 text-xs sm:text-sm mt-1">
            Tire suas dúvidas antes de começar
          </p>
        </div>

        <div className="space-y-3">
          {FAQS.map((faq, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div
                key={idx}
                className="bg-slate-900/70 border border-slate-800 rounded-2xl overflow-hidden transition-colors"
              >
                <button
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                  className="w-full p-5 text-left flex items-center justify-between gap-4 font-bold text-sm text-white hover:text-indigo-300 transition-colors cursor-pointer"
                >
                  <span>{faq.question}</span>
                  {isOpen ? (
                    <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                  )}
                </button>
                {isOpen && (
                  <div className="px-5 pb-5 text-xs sm:text-sm text-slate-300 leading-relaxed border-t border-slate-800/60 pt-3">
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* =========================================================================
          8. FINAL CALL TO ACTION
      ========================================================================= */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto z-10 text-center">
        <div className="bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 border border-indigo-500/30 rounded-3xl p-8 sm:p-12 shadow-2xl relative overflow-hidden">
          <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
            Comece a fechar propostas hoje mesmo
          </h2>
          <p className="text-slate-300 text-xs sm:text-sm max-w-lg mx-auto mt-3">
            Crie sua conta gratuita em menos de 1 minuto e encante seus clientes
            com propostas de alto padrão comercial.
          </p>
          <div className="mt-8 flex justify-center">
            <Link href="/signup">
              <Button
                variant="primary"
                size="lg"
                className="font-bold text-sm px-8 py-3.5 shadow-xl shadow-indigo-600/30 bg-indigo-600 hover:bg-indigo-500 text-white"
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Criar Minha Primeira Proposta Grátis
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* =========================================================================
          9. FOOTER
      ========================================================================= */}
      <footer className="border-t border-slate-800/80 py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6 text-xs text-slate-500">
        <Logo size="sm" showSubtitle={false} />
        <div>
          © {new Date().getFullYear()} Proposta Ai!. Feito para o mercado brasileiro.
        </div>
      </footer>
    </div>
  );
}
