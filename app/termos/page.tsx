"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft, Shield, FileText, CheckCircle2, Scale, Lock, Sparkles, Building2 } from "lucide-react";
import { Logo } from "@/components/Common/Logo";
import { Button } from "@/components/Common/Button";

export default function TermosDeUsoPage() {
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
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
            <Scale className="w-3.5 h-3.5" />
            Documento Legal & Termos de Serviço
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Termos de Uso do ViraPropo AI!
          </h1>
          <p className="text-sm text-slate-500">
            Última atualização: <strong>{ultimaAtualizacao}</strong> • Versão 2.1
          </p>
        </div>

        {/* Intro Card */}
        <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-xs space-y-4 text-sm text-slate-700 leading-relaxed">
          <p>
            Bem-vindo ao <strong>ViraPropo AI! - Sua IA geradora de propostas</strong> (&quot;ViraPropo AI!&quot;, &quot;nós&quot; ou &quot;Plataforma&quot;). Estes Termos de Uso regulam o acesso e a utilização dos nossos serviços de software como serviço (SaaS), incluindo a síntese de documentos comerciais com inteligência artificial, gestão de propostas e coleta de assinaturas eletrônicas.
          </p>
          <p>
            Ao criar uma conta ou utilizar a Plataforma, você declara ter lido, compreendido e concordado integralmente com estes Termos e com a nossa{" "}
            <Link href="/privacidade" className="text-blue-600 font-bold hover:underline">
              Política de Privacidade
            </Link>
            . Caso discorde de qualquer disposição, interrompa o uso do serviço imediatamente.
          </p>
        </div>

        {/* Sections */}
        <div className="space-y-8 text-sm text-slate-700 leading-relaxed">
          {/* Section 1 */}
          <section className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-xs space-y-3">
            <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-blue-600 text-white text-xs flex items-center justify-center font-bold">
                1
              </span>
              Objeto e Descrição dos Serviços
            </h2>
            <p>
              O <strong>ViraPropo AI!</strong> é uma plataforma digital que disponibiliza ferramentas assistidas por inteligência artificial generativa (Google Gemini) para elaboração, formatação, customização e compartilhamento de propostas comerciais e orçamentos em formato web e PDF.
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-600">
              <li><strong>Plano Free:</strong> Permite a geração mensal de até 3 propostas comerciais em layout monocromático padrão.</li>
              <li><strong>Plano Pro:</strong> Disponibiliza geração ilimitada de propostas, personalização com logotipo corporativo em Base64, templates executivos coloridos com design responsivo, links públicos seguros e coleta de aceite eletrônico com manifesto probatório.</li>
            </ul>
          </section>

          {/* Section 2 */}
          <section className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-xs space-y-3">
            <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-blue-600 text-white text-xs flex items-center justify-center font-bold">
                2
              </span>
              Cadastro, Acesso e Segurança da Conta
            </h2>
            <p>
              Para utilizar os recursos da Plataforma, o usuário deve fornecer dados verídicos e completos (nome, email comercial válido, CNPJ/Razão Social quando aplicável) e criar uma senha segura.
            </p>
            <p>
              O usuário é o único responsável pela guarda de suas credenciais de acesso. O compartilhamento de contas entre terceiros não é permitido. Qualquer atividade realizada através da sua conta será presumida como de sua autoria.
            </p>
          </section>

          {/* Section 3 */}
          <section className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-xs space-y-3">
            <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-blue-600 text-white text-xs flex items-center justify-center font-bold">
                3
              </span>
              Assinaturas, Cobrança e Cancelamento (Plano Pro)
            </h2>
            <p>
              A assinatura do Plano Pro é cobrada no valor de <strong>R$ 45,90/mês</strong> por meio de transações instantâneas e seguras processadas via PIX pelo gateway parceiro <em>Abacate Pay</em>.
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-600">
              <li><strong>Renovação e Período Pago:</strong> Ao assinar o plano, o usuário tem acesso irrestrito aos recursos Pro até a data limite da competência contratada.</li>
              <li><strong>Cancelamento e Downgrade Agendado:</strong> O usuário pode solicitar o cancelamento a qualquer momento nas configurações. O cancelamento é agendado para o fim do ciclo pago, garantindo a manutenção dos recursos Pro até a data da próxima cobrança.</li>
              <li><strong>Período de Tolerância (Grace Period):</strong> Em caso de expiração sem renovação, concedemos até 3 dias de tolerância para regularização antes do downgrade efetivo para o Plano Free.</li>
            </ul>
          </section>

          {/* Section 4 */}
          <section className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-xs space-y-3">
            <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-blue-600 text-white text-xs flex items-center justify-center font-bold">
                4
              </span>
              Uso de Inteligência Artificial e Responsabilidade sobre o Conteúdo
            </h2>
            <p>
              A síntese de textos persuasivos e diagnósticos é realizada através de modelos de Inteligência Artificial. O usuário reconhece e concorda que:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-600">
              <li>É dever exclusivo do usuário revisar todos os valores, quantitativos, prazos, obrigações contratuais e escopo antes de enviar o documento ao cliente final.</li>
              <li>O ViraPropo AI! não se responsabiliza por eventuais imprecisões nas descrições técnicas sugeridas pela IA ou por disputas comerciais entre o prestador e seu cliente contratante.</li>
              <li>O ViraPropo AI! não garante o fechamento de vendas ou resultados financeiros decorrentes do envio das propostas.</li>
            </ul>
          </section>

          {/* Section 5 */}
          <section className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-xs space-y-3">
            <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-blue-600 text-white text-xs flex items-center justify-center font-bold">
                5
              </span>
              Assinatura Eletrônica e Validade Jurídica
            </h2>
            <p>
              O sistema de aceite e assinatura digital bilateral do ViraPropo AI! opera em estrita conformidade com a <strong>Medida Provisória nº 2.200-2/2001</strong> e a <strong>Lei Federal nº 14.063/2020</strong> (Assinatura Eletrônica Simples e Avançada).
            </p>
            <p>
              Para cada proposta assinada, é gerado um <em>Manifesto de Assinaturas</em> com carimbo de data/hora, endereço IP, nome, CPF/CNPJ e hash criptográfico SHA-256 do documento para fins de integridade e não repúdio.
            </p>
          </section>

          {/* Section 6 */}
          <section className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-xs space-y-3">
            <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-blue-600 text-white text-xs flex items-center justify-center font-bold">
                6
              </span>
              Propriedade Intelectual e Foro
            </h2>
            <p>
              Todos os direitos de propriedade intelectual relativos ao software, marcas, logotipos, layouts e código-fonte pertencem exclusivamente ao <strong>ViraPropo AI!</strong>. O conteúdo e dados das propostas comerciais criadas pertencem ao usuário emissor.
            </p>
            <p>
              Estes Termos são regidos pelas leis da República Federativa do Brasil. Fica eleito o Foro da Comarca de São Paulo/SP como competente para dirimir eventuais controvérsias.
            </p>
          </section>
        </div>

        {/* Footer Contact Callout */}
        <div className="p-6 rounded-2xl bg-slate-100 border border-slate-200 text-center space-y-2">
          <p className="font-bold text-slate-800 text-sm">
            Dúvidas sobre estes Termos de Uso?
          </p>
          <p className="text-xs text-slate-500">
            Entre em contato com nossa equipe através do email <strong>contato@virapropo.ai</strong> ou acesse a nossa{" "}
            <Link href="/privacidade" className="text-blue-600 font-bold hover:underline">
              Política de Privacidade
            </Link>
            .
          </p>
        </div>
      </main>

      {/* Page Footer */}
      <footer className="border-t border-slate-200 py-8 text-center text-xs text-slate-400 bg-white">
        © {new Date().getFullYear()} ViraPropo AI! - Sua IA geradora de propostas • Todos os direitos reservados.
      </footer>
    </div>
  );
}
