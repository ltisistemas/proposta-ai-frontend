"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft, ShieldCheck, Lock, Eye, FileKey, Database, UserCheck, Cookie, Mail } from "lucide-react";
import { Logo } from "@/components/Common/Logo";
import { Button } from "@/components/Common/Button";

export default function PoliticaDePrivacidadePage() {
  const ultimaAtualizacao = "10 de setembro de 2026";

  return (
    <div className="min-h-screen bg-[#FBFBFA] text-slate-900 flex flex-col font-sans selection:bg-blue-500 selection:text-white">
      {/* Top Header */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/90 py-4 px-4 sm:px-8 shadow-xs">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
          <Logo href="/" size="md" variant="light" showSubtitle />
          <div className="flex items-center gap-3">
            <Link href="/">
              <Button variant="ghost" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
                Voltar ao Início
              </Button>
            </Link>
            <Link href="/signup">
              <Button variant="primary" size="sm" className="hidden sm:inline-flex font-bold">
                Criar Conta Grátis
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Document Content */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-8">
        {/* Title Header */}
        <div className="space-y-3 pb-8 border-b border-slate-200">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <ShieldCheck className="w-3.5 h-3.5" />
            Conformidade LGPD (Lei Federal nº 13.709/2018)
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Política de Privacidade & Proteção de Dados
          </h1>
          <p className="text-sm text-slate-500">
            Última atualização: <strong>{ultimaAtualizacao}</strong> • Versão 2.1
          </p>
        </div>

        {/* Executive Summary */}
        <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-xs space-y-4 text-sm text-slate-700 leading-relaxed">
          <p>
            No <strong>Propex AI - Sua IA geradora de propostas</strong> (&quot;Propex AI&quot; ou &quot;nós&quot;), a privacidade, a segurança e a transparência no tratamento de dados pessoais são pilares fundamentais. Esta Política de Privacidade explica como coletamos, utilizamos, armazenamos, protegemos e compartilhamos suas informações em estrita observância à <strong>Lei Geral de Proteção de Dados Pessoais (LGPD - Lei nº 13.709/2018)</strong> e ao <strong>Marco Civil da Internet (Lei nº 12.965/2014)</strong>.
          </p>
        </div>

        {/* Detailed Sections */}
        <div className="space-y-8 text-sm text-slate-700 leading-relaxed">
          {/* Section 1 */}
          <section className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-xs space-y-3">
            <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-emerald-600 text-white text-xs flex items-center justify-center font-bold">
                1
              </span>
              Controlador e Encarregado de Proteção de Dados (DPO)
            </h2>
            <p>
              O <strong>Propex AI</strong> atua como <em>Controlador</em> dos dados cadastrais dos usuários contratantes e como <em>Operador</em> no processamento dos dados dos clientes finais inseridos nas propostas comerciais geradas pelo emissor.
            </p>
            <p>
              Para exercer qualquer direito ou esclarecer dúvidas sobre seus dados, entre em contato diretamente com o nosso Encarregado pelo Tratamento de Dados Pessoais (DPO) através do email <strong>dpo@propex-ai.com</strong>.
            </p>
          </section>

          {/* Section 2 */}
          <section className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-xs space-y-3">
            <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-emerald-600 text-white text-xs flex items-center justify-center font-bold">
                2
              </span>
              Dados Pessoais Coletados e Formas de Coleta
            </h2>
            <ul className="list-disc pl-5 space-y-2 text-slate-600">
              <li>
                <strong>Dados Cadastrais do Usuário:</strong> Nome completo, endereço de email, senha criptografada (hash Bcrypt), dados da empresa emissora (Razão Social, CNPJ, telefone, logotipo corporativo em formato Base64).
              </li>
              <li>
                <strong>Dados de Clientes e Propostas:</strong> Nome do cliente, empresa, email, telefone, descrição de escopo e itens financeiros fornecidos voluntariamente para a elaboração de cada proposta.
              </li>
              <li>
                <strong>Dados de Assinatura Eletrônica:</strong> Nome do signatário, CPF/CNPJ informado no aceite, endereço IP de conexão, carimbo de data/hora e hash criptográfico SHA-256 do documento.
              </li>
              <li>
                <strong>Dados de Pagamento:</strong> Transações do Plano Pro são intermediadas pelo gateway <em>Abacate Pay</em>. O Propex AI não armazena dados bancários sensíveis ou chaves PIX privadas em seus servidores.
              </li>
            </ul>
          </section>

          {/* Section 3 */}
          <section className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-xs space-y-3">
            <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-emerald-600 text-white text-xs flex items-center justify-center font-bold">
                3
              </span>
              Finalidade do Tratamento e Bases Legais
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                <p className="font-bold text-slate-900 text-xs">Execução de Contrato (Art. 7º, V)</p>
                <p className="text-[11px] text-slate-600 mt-1">Gerar, armazenar, exportar propostas e autenticar o usuário na plataforma.</p>
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                <p className="font-bold text-slate-900 text-xs">Cumprimento de Obrigação Legal (Art. 7º, II)</p>
                <p className="text-[11px] text-slate-600 mt-1">Guarda de logs de acesso e manifestos de assinatura (Marco Civil da Internet).</p>
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                <p className="font-bold text-slate-900 text-xs">Consentimento Explícito (Art. 7º, I)</p>
                <p className="text-[11px] text-slate-600 mt-1">Envio de comunicações comerciais e preferências de cookies analíticos.</p>
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                <p className="font-bold text-slate-900 text-xs">Legítimo Interesse (Art. 7º, IX)</p>
                <p className="text-[11px] text-slate-600 mt-1">Melhoria contínua de performance, segurança contra fraudes e usabilidade da IA.</p>
              </div>
            </div>
          </section>

          {/* Section 4 */}
          <section className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-xs space-y-3">
            <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-emerald-600 text-white text-xs flex items-center justify-center font-bold">
                4
              </span>
              Uso de Inteligência Artificial e Sigilo Comercial
            </h2>
            <p>
              As informações inseridas no formulário de propostas são enviadas via conexão criptografada (TLS 1.3) para a API do Google Gemini estritamente para sintetizar o texto do documento comercial.
            </p>
            <p>
              <strong>Garantia de Não-Treinamento:</strong> Seus dados comerciais, preços e propostas particulares <em>não</em> são utilizados para treinar modelos públicos de IA de forma aberta e permanecem restritos à sua conta.
            </p>
          </section>

          {/* Section 5 */}
          <section className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-xs space-y-3">
            <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-emerald-600 text-white text-xs flex items-center justify-center font-bold">
                5
              </span>
              Cookies e Armazenamento Local
            </h2>
            <p>
              Utilizamos cookies e chaves de armazenamento local (<em>localStorage</em>) para:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-slate-600">
              <li><strong>Essenciais:</strong> Sessões de login JWT seguras, prevenção de CSRF e autenticação.</li>
              <li><strong>Preferências:</strong> Registro do consentimento de cookies (<code>propex_cookie_consent</code>) e estado da interface (sidebar colapsável).</li>
            </ul>
            <p>
              Você pode alterar suas preferências de cookies a qualquer momento através do banner de privacidade ou limpando os dados de navegação do seu navegador.
            </p>
          </section>

          {/* Section 6 */}
          <section className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-xs space-y-3">
            <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-emerald-600 text-white text-xs flex items-center justify-center font-bold">
                6
              </span>
              Seus Direitos como Titular de Dados (Art. 18 da LGPD)
            </h2>
            <p>
              Você possui os seguintes direitos garantidos por lei, que podem ser solicitados a qualquer momento:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-700">
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 font-medium">✓ Confirmação da existência de tratamento</div>
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 font-medium">✓ Acesso e exportação aos seus dados</div>
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 font-medium">✓ Correção de dados incompletos ou inexatos</div>
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 font-medium">✓ Anonimização, bloqueio ou eliminação</div>
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 font-medium">✓ Portabilidade dos dados comerciais</div>
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 font-medium">✓ Revogação do consentimento</div>
            </div>
          </section>
        </div>

        {/* Contact DPO Card */}
        <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-2">
          <p className="font-bold text-emerald-950 text-sm flex items-center justify-center gap-1.5">
            <Mail className="w-4 h-4 text-emerald-700" />
            Canal de Atendimento de Privacidade & LGPD
          </p>
          <p className="text-xs text-emerald-800">
            Para exercer seus direitos de privacidade ou contatar o Encarregado de Dados, envie um email para <strong>dpo@propex-ai.com</strong>. Respondemos todas as solicitações no prazo legal.
          </p>
        </div>
      </main>

      {/* Page Footer */}
      <footer className="border-t border-slate-200 py-8 text-center text-xs text-slate-400 bg-white">
        © {new Date().getFullYear()} Propex AI - Sua IA geradora de propostas • Todos os direitos reservados.
      </footer>
    </div>
  );
}
