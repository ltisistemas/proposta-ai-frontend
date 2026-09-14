import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { gerarPropostacComIA, injetarOuAtualizarLogoHtml } from "../lib/gemini/client";
import { salvarProposta, ItemPropostaInput } from "../lib/db/propostas";
import { obterUserPorId } from "../lib/db/users";

async function main() {
  const userId = "adf4cf5a-eca4-44b7-92f4-d69a376af7b8";
  console.log(`\n================ CRIANDO PROPOSTA MODELO COM IA ================`);
  console.log(`Buscando dados do usuário: ${userId}...`);

  const user = await obterUserPorId(userId);
  if (!user) {
    throw new Error(`Usuário ${userId} não foi encontrado no banco de dados.`);
  }

  console.log(`✓ Usuário encontrado: ${user.nome} (${user.email}) | Plano: ${user.plano}`);

  const empresaNome = user.empresa_nome || user.nome || "LTI Soluções em Tecnologia & IA";
  const empresaCNPJ = user.empresa_cnpj || "42.123.456/0001-89";
  const empresaEmail = user.empresa_email || user.email || "contato@ltisistemas.com.br";
  const empresaTelefone = user.empresa_telefone || "(11) 98765-4321";
  const empresaLogoUrl = user.empresa_logo_url || undefined;

  const itens: ItemPropostaInput[] = [
    {
      descricao: "Plataforma Web SaaS & Portal Corporativo com Design System Responsivo",
      quantidade: 1,
      valorUnitario: 8500.0,
    },
    {
      descricao: "Módulo de IA Generativa & Agente Autônomo para Atendimento e Triagem Inteligente",
      quantidade: 1,
      valorUnitario: 6200.0,
    },
    {
      descricao: "Automação de Workflows & Integração de APIs (CRM, ERP e Meios de Pagamento)",
      quantidade: 1,
      valorUnitario: 4800.0,
    },
    {
      descricao: "Dashboard Executivo de BI, Relatórios em Tempo Real e Métricas de Performance",
      quantidade: 1,
      valorUnitario: 3500.0,
    },
    {
      descricao: "Treinamento da Equipe, Documentação Técnica e Suporte Assistido (30 dias)",
      quantidade: 1,
      valorUnitario: 2000.0,
    },
  ];

  const subtotal = itens.reduce((acc, item) => acc + item.quantidade * item.valorUnitario, 0);
  const total = subtotal;

  const dadosProposta = {
    empresaNome,
    empresaCNPJ,
    empresaEmail,
    empresaTelefone,
    empresaLogoUrl: user.plano === "pro" ? empresaLogoUrl : undefined,
    clienteNome: "Camila Vasconcelos",
    clienteEmpresa: "Nexus Soluções Corporativas S.A.",
    clienteEmail: "camila.vasconcelos@gruponexus.com.br",
    clienteTelefone: "(11) 99123-4567",
    descricao:
      "Desenvolvimento e implementação de Plataforma Web Corporativa com Inteligência Artificial Integrada, Automação de Workflows Operacionais e Dashboard Executivo de Analytics em Tempo Real para centralização das operações e escalabilidade do atendimento.",
    itens,
    prazoPagamento: "40% de entrada no aceite + 30% na entrega homologada + 30% no go-live final (Boleto/PIX)",
    validade: 15,
    observacoes:
      "Garantia contratual de conformidade de 90 dias com SLA de suporte prioritário em até 4 horas úteis. Código-fonte com transferência de titularidade e documentação técnica completa.",
    template: "template-1",
    plano: (user.plano as "free" | "pro") || "pro",
  };

  console.log(`\nGerando copywriting persuasivo e estrutura consultiva via Gemini AI...`);
  const startTime = Date.now();
  let htmlGerado = await gerarPropostacComIA(dadosProposta);
  const duration = Date.now() - startTime;
  console.log(`✓ Copywriting gerado pela IA em ${duration}ms!`);

  if (user.plano === "pro" && empresaLogoUrl) {
    htmlGerado = injetarOuAtualizarLogoHtml(htmlGerado, empresaLogoUrl, empresaNome);
  }

  const anoAtual = new Date().getFullYear();
  const codigoRandom = Math.floor(1000 + Math.random() * 9000);
  const numeroProposta = `PROP-${anoAtual}-${Date.now().toString().slice(-4)}${codigoRandom}`;

  console.log(`Salvando proposta no banco de dados para o usuário ${user.id}...`);

  const propostaSalva = await salvarProposta({
    usuarioId: user.id,
    numero: numeroProposta,
    clienteNome: dadosProposta.clienteNome,
    clienteEmpresa: dadosProposta.clienteEmpresa,
    clienteEmail: dadosProposta.clienteEmail,
    clienteTelefone: dadosProposta.clienteTelefone,
    descricao: dadosProposta.descricao,
    conteudoHtml: htmlGerado,
    templateId: "template-1",
    subtotal,
    total,
    prazoPagamento: dadosProposta.prazoPagamento,
    validadeDias: dadosProposta.validade,
    observacoes: dadosProposta.observacoes,
    status: "enviada",
    emissorNome: user.nome || empresaNome,
    emissorEmail: user.email || empresaEmail,
    emissorDocumento: empresaCNPJ,
    emissorIp: "127.0.0.1",
    itens,
  });

  console.log(`\n================ PROPOSTA MODELO CRIADA COM SUCESSO! ================`);
  console.log(`ID da Proposta: ${propostaSalva.id}`);
  console.log(`Número: ${propostaSalva.numero}`);
  console.log(`Cliente: ${propostaSalva.cliente_nome} (${propostaSalva.cliente_empresa})`);
  console.log(`Valor Total: R$ ${propostaSalva.total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`);
  console.log(`Status: ${propostaSalva.status}`);
  console.log(`Link do Dashboard: /propostas/${propostaSalva.id}`);
  console.log(`Link Público de Aceite: /p/${propostaSalva.id}`);
  console.log(`Hash de Integridade do Documento: ${propostaSalva.documento_hash}`);
  console.log(`Hash de Assinatura do Emissor: ${propostaSalva.emissor_assinatura_hash}`);
  console.log(`======================================================================\n`);

  process.exit(0);
}

main().catch((err) => {
  console.error("Erro fatal ao criar proposta modelo:", err);
  process.exit(1);
});
