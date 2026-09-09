"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  FileText,
  ArrowRight,
  CheckCircle2,
  DollarSign,
  FileCheck,
  Bot,
  Zap,
  Check,
  ShieldCheck,
  BarChart3,
  Send,
} from "lucide-react";
import { Button } from "@/components/Common/Button";
import { Badge } from "@/components/Common/Badge";

export default function LandingPage() {
  const [demoClient, setDemoClient] = useState("Acme Corporation");
  const [demoService, setDemoService] = useState("Consultoria em Arquitetura & Automação");
  const [demoPrice, setDemoPrice] = useState("4.800,00");

  return (
    <div className="min-h-screen bg-slate-950 text-white selection:bg-blue-600 selection:text-white relative overflow-hidden">
      {/* Subtle Background Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1100px] h-[500px] bg-gradient-to-b from-blue-900/30 via-blue-950/10 to-transparent blur-3xl pointer-events-none -z-0" />
      <div className="absolute top-[800px] -left-64 w-[500px] h-[500px] bg-emerald-950/20 blur-[140px] pointer-events-none -z-0" />

      {/* Navbar */}
      <nav className="sticky top-0 z-40 backdrop-blur-xl bg-slate-950/80 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-600/25 group-hover:bg-blue-500 transition-colors">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-black text-white tracking-tight">
                Proposta <span className="text-blue-400 font-normal">Ai!</span>
              </span>
              <span className="text-[10px] text-slate-400 font-mono -mt-1 tracking-widest uppercase">
                Plataforma Comercial
              </span>
            </div>
          </Link>

          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
            <a href="#como-funciona" className="hover:text-white transition-colors">
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

          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm" className="text-slate-300 hover:text-white">
                Entrar
              </Button>
            </Link>
            <Link href="/signup">
              <Button
                variant="primary"
                size="sm"
                className="bg-blue-600 hover:bg-blue-500 text-white font-bold"
                rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
              >
                Criar Grátis
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-20 pb-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center z-10">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-950/80 border border-blue-800/60 text-blue-300 text-xs font-semibold mb-8 backdrop-blur-md shadow-xs">
          <Zap className="w-4 h-4 text-blue-400" />
          <span>Geração Inteligente de Propostas Comerciais</span>
          <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
          <span className="text-slate-400">Gemini 1.5 Pro</span>
        </div>

        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-white tracking-tight leading-[1.1] max-w-5xl mx-auto">
          Crie propostas comerciais de{" "}
          <span className="text-blue-400">alto fechamento</span> em menos de 2 minutos.
        </h1>

        <p className="mt-6 text-lg sm:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed font-normal">
          Chega de perder horas formatando documentos no Word ou Canva. Gere propostas comerciais completas, estruturadas e prontas para assinatura.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href="/signup" className="w-full sm:w-auto">
            <Button
              variant="primary"
              size="lg"
              className="w-full sm:w-auto bg-blue-600 hover:bg-blue-500 text-white text-base px-8 py-4 shadow-xl shadow-blue-600/30 font-bold"
              rightIcon={<ArrowRight className="w-5 h-5" />}
            >
              Criar Minha Primeira Proposta Grátis
            </Button>
          </Link>
          <a href="#demonstracao" className="w-full sm:w-auto">
            <Button
              variant="secondary"
              size="lg"
              className="w-full sm:w-auto bg-slate-900 text-slate-200 border-slate-700 hover:bg-slate-800"
            >
              Ver Demonstração Interativa
            </Button>
          </a>
        </div>

        {/* Social Proof Stats */}
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto pt-10 border-t border-slate-800/80">
          <div>
            <div className="text-3xl font-black text-white">2 min</div>
            <div className="text-xs text-slate-400 mt-1 uppercase tracking-wider font-semibold">
              Tempo Médio de Geração
            </div>
          </div>
          <div>
            <div className="text-3xl font-black text-blue-400">+68%</div>
            <div className="text-xs text-slate-400 mt-1 uppercase tracking-wider font-semibold">
              Taxa Média de Aceite
            </div>
          </div>
          <div>
            <div className="text-3xl font-black text-white">100%</div>
            <div className="text-xs text-slate-400 mt-1 uppercase tracking-wider font-semibold">
              Responsivo & PDF Pronto
            </div>
          </div>
          <div>
            <div className="text-3xl font-black text-emerald-400">R$ 0</div>
            <div className="text-xs text-slate-400 mt-1 uppercase tracking-wider font-semibold">
              Para Começar Hoje
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Live Demo */}
      <section id="demonstracao" className="py-20 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto z-10">
        <div className="text-center mb-12">
          <Badge variant="info" className="mb-3">
            Demonstração Interativa
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            Veja como sua proposta se adapta em tempo real
          </h2>
          <p className="text-slate-400 text-sm mt-2">
            Escolha um exemplo de serviço abaixo para atualizar a visualização
          </p>
        </div>

        {/* Demo Controls */}
        <div className="flex flex-wrap items-center justify-center gap-3 mb-8">
          <button
            onClick={() => {
              setDemoClient("TechCorp Brasil");
              setDemoService("Desenvolvimento de App Mobile & Web");
              setDemoPrice("8.500,00");
            }}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-900 border border-slate-700 hover:border-blue-500 text-slate-200 transition-all cursor-pointer"
          >
            Exemplo: App Mobile
          </button>
          <button
            onClick={() => {
              setDemoClient("Agência Vanguarda");
              setDemoService("Consultoria de SEO e Tráfego Pago");
              setDemoPrice("3.200,00");
            }}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-900 border border-slate-700 hover:border-blue-500 text-slate-200 transition-all cursor-pointer"
          >
            Exemplo: Marketing Digital
          </button>
          <button
            onClick={() => {
              setDemoClient("Studio Arquitetura");
              setDemoService("Identidade Visual & Branding Completo");
              setDemoPrice("5.900,00");
            }}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-900 border border-slate-700 hover:border-blue-500 text-slate-200 transition-all cursor-pointer"
          >
            Exemplo: Design & Branding
          </button>
        </div>

        {/* Live Proposal Mockup Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-8 shadow-2xl relative overflow-hidden backdrop-blur-2xl">
          <div className="max-w-3xl mx-auto bg-white text-slate-900 rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
            {/* Header Banner */}
            <div className="bg-slate-900 p-6 sm:p-8 text-white flex flex-wrap items-center justify-between gap-4 border-b border-slate-800">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest bg-blue-600 text-white px-2.5 py-1 rounded-full">
                  Proposta Comercial
                </span>
                <h3 className="text-xl sm:text-2xl font-black mt-2 text-white">Sua Empresa Consultoria</h3>
                <p className="text-xs text-slate-400 mt-0.5">CNPJ: 12.345.678/0001-90 • contato@suaempresa.com.br</p>
              </div>
              <div className="text-right">
                <div className="text-xs text-slate-400">Número da Proposta</div>
                <div className="text-base font-bold font-mono text-white">PROP-2026-9842</div>
                <div className="text-[11px] text-slate-400 mt-1">Validade: 30 dias</div>
              </div>
            </div>

            {/* Proposal Body */}
            <div className="p-6 sm:p-8 space-y-6">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 flex flex-wrap justify-between gap-4">
                <div>
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Cliente</div>
                  <div className="text-base font-bold text-slate-900">{demoClient}</div>
                  <div className="text-xs text-slate-500">Diretoria de Operações</div>
                </div>
                <div>
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Condições</div>
                  <div className="text-sm font-semibold text-slate-800">50% entrada + 50% na entrega</div>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-blue-700 uppercase tracking-wider mb-2">
                  1. Escopo da Solução
                </h4>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed bg-slate-50/50 p-3.5 rounded-lg border border-slate-100">
                  Execução de {demoService}, com alinhamento estratégico, planejamento de arquitetura, testes de validação e entrega final homologada.
                </p>
              </div>

              <div>
                <h4 className="text-xs font-bold text-blue-700 uppercase tracking-wider mb-2">
                  2. Investimento
                </h4>
                <table className="w-full text-xs text-left border border-slate-200 rounded-lg overflow-hidden">
                  <thead className="bg-slate-100 text-slate-700 font-bold">
                    <tr>
                      <th className="p-2.5">Descrição</th>
                      <th className="p-2.5 text-center">Qtd</th>
                      <th className="p-2.5 text-right">Valor Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    <tr>
                      <td className="p-2.5 font-medium text-slate-800">{demoService}</td>
                      <td className="p-2.5 text-center text-slate-600">1</td>
                      <td className="p-2.5 text-right font-bold text-slate-900">R$ {demoPrice}</td>
                    </tr>
                  </tbody>
                </table>

                <div className="mt-4 flex justify-end">
                  <div className="bg-blue-50 border border-blue-200 p-3 rounded-xl text-right min-w-[200px]">
                    <span className="text-xs text-blue-700 font-semibold block">Total Geral</span>
                    <span className="text-lg font-black text-blue-950">R$ {demoPrice}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="recursos" className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto z-10">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <Badge variant="info" className="mb-3">
            Poder de Ponta a Ponta
          </Badge>
          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
            Tudo o que você precisa para acelerar seu faturamento
          </h2>
          <p className="text-slate-400 text-base mt-4">
            Projetado para prestadores de serviços, freelancers e consultores que valorizam tempo e imagem profissional.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-8 hover:border-blue-500/50 transition-all hover:bg-slate-900/80 group">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-6 group-hover:scale-110 transition-transform">
              <Bot className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Copywriting com IA Gemini</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              O motor de IA sintetiza escopos claros, termos persuasivos e diagnósticos técnicos que encantam qualquer tomador de decisão.
            </p>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-8 hover:border-emerald-500/50 transition-all hover:bg-slate-900/80 group">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-6 group-hover:scale-110 transition-transform">
              <DollarSign className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Cálculo e Tabela em Tempo Real</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Adicione itens, quantidades e valores com soma automática, descontos e formatação oficial brasileira em Real (R$).
            </p>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-8 hover:border-purple-500/50 transition-all hover:bg-slate-900/80 group">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mb-6 group-hover:scale-110 transition-transform">
              <FileCheck className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Exportação & Link Direto</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Envie o link direto por WhatsApp, imprima ou baixe o PDF estilizado pronto para assinatura física ou digital.
            </p>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="precos" className="py-24 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto z-10">
        <div className="text-center mb-16">
          <Badge variant="pro" className="mb-3">
            Planos Transparentes
          </Badge>
          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
            Comece grátis, faça upgrade quando crescer
          </h2>
          <p className="text-slate-400 text-base mt-4">
            Sem pegadinhas. Cancele ou mude de plano a qualquer momento pelo Abacate Pay.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
          {/* Free Tier */}
          <div className="bg-slate-900/70 border border-slate-800 rounded-3xl p-8 sm:p-10 flex flex-col justify-between backdrop-blur-xl">
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-white">Plano Gratuito</h3>
                <Badge variant="free" size="sm">
                  Grátis para sempre
                </Badge>
              </div>
              <p className="text-slate-400 text-sm mb-6">
                Ideal para testar o poder da IA em suas primeiras propostas comerciais.
              </p>

              <div className="text-4xl font-black text-white mb-8">
                R$ 0 <span className="text-base text-slate-500 font-normal">/ mês</span>
              </div>

              <ul className="space-y-3 text-sm text-slate-300">
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>3 propostas com IA por mês</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Cálculo automático de itens</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Visualização e link compartilhado</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Exportação para impressão e PDF</span>
                </li>
              </ul>
            </div>

            <div className="pt-8 mt-8 border-t border-slate-800">
              <Link href="/signup" className="block w-full">
                <Button variant="outline" size="lg" className="w-full justify-center text-slate-900 font-bold">
                  Começar Gratuitamente
                </Button>
              </Link>
            </div>
          </div>

          {/* Pro Tier */}
          <div className="bg-slate-900 border-2 border-blue-500 rounded-3xl p-8 sm:p-10 flex flex-col justify-between relative shadow-2xl shadow-blue-600/10 backdrop-blur-xl">
            <div className="absolute -top-3.5 right-8 bg-blue-600 text-white text-[11px] font-black uppercase tracking-wider px-3 py-1 rounded-full shadow-md">
              Mais Popular
            </div>

            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-white">Plano Pro</h3>
                <Badge variant="pro" size="sm">
                  Acesso Total
                </Badge>
              </div>
              <p className="text-slate-300 text-sm mb-6">
                Para profissionais e empresas que fecham negócios diariamente.
              </p>

              <div className="text-4xl font-black text-white mb-8">
                R$ 45,90 <span className="text-base text-slate-400 font-normal">/ mês</span>
              </div>

              <ul className="space-y-3 text-sm text-slate-200">
                <li className="flex items-center gap-2.5 font-medium">
                  <Check className="w-4 h-4 text-blue-400 shrink-0" />
                  <span className="text-white font-bold">Propostas ILIMITADAS com IA</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-blue-400 shrink-0" />
                  <span>Logotipo e identidade personalizada</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-blue-400 shrink-0" />
                  <span>Templates comerciais exclusivos</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-blue-400 shrink-0" />
                  <span>Sem marca d'água nos PDFs</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-blue-400 shrink-0" />
                  <span>Histórico completo & métricas de conversão</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-blue-400 shrink-0" />
                  <span>Suporte prioritário via WhatsApp</span>
                </li>
              </ul>
            </div>

            <div className="pt-8 mt-8 border-t border-slate-800">
              <Link href="/signup" className="block w-full">
                <Button
                  variant="primary"
                  size="lg"
                  className="w-full justify-center font-bold bg-blue-600 hover:bg-blue-500 text-white"
                >
                  Assinar Plano Pro
                </Button>
              </Link>
              <div className="text-center text-[11px] text-slate-400 mt-2.5">
                Pagamento seguro via Abacate Pay (Cartão & PIX)
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto z-10 text-center">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-10 sm:p-16 backdrop-blur-2xl shadow-2xl">
          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
            Pronto para fechar mais contratos esta semana?
          </h2>
          <p className="text-slate-300 text-base max-w-xl mx-auto mt-4">
            Junte-se aos prestadores de serviços que criam propostas profissionais em segundos.
          </p>
          <div className="mt-8 flex justify-center">
            <Link href="/signup">
              <Button
                variant="primary"
                size="lg"
                className="font-bold text-base px-10 py-4 shadow-xl shadow-blue-600/25 bg-blue-600 hover:bg-blue-500 text-white"
              >
                Criar Minha Conta Grátis Agora
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-6 text-xs text-slate-500">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-blue-400" />
          <span className="text-slate-400 font-semibold">Proposta Ai!</span> • Feito para o mercado brasileiro
        </div>
        <div>
          © {new Date().getFullYear()} Proposta Ai!. Todos os direitos reservados.
        </div>
      </footer>
    </div>
  );
}
