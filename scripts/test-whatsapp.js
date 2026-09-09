const { gerarTextoWhatsApp } = require("../lib/utils/whatsapp");

console.log("=== Testing WhatsApp Text Formatting ===");

const mockData = {
  numero: "PROP-2026-9812",
  clienteNome: "Carlos Eduardo",
  clienteEmpresa: "Nexus Logística Ltda",
  empresaNome: "Apex Soluções Digitais",
  descricao: "Implementação de automação de fluxo de leads e integração CRM com WhatsApp corporativo.",
  total: 4500,
  prazoPagamento: "50% de entrada + 50% na entrega",
  validadeDias: 15,
  itens: [
    { descricao: "Setup e Configuração de CRM", quantidade: 1, valorUnitario: 2000, subtotal: 2000 },
    { descricao: "Automação de WhatsApp e Webhooks", quantidade: 1, valorUnitario: 2500, subtotal: 2500 },
  ],
  publicUrl: "https://proposta-ai.com/p/123e4567-e89b-12d3-a456-426614174000",
};

// Test if it runs in ts-node or transpiled
console.log("Mock data ready for WhatsApp formatting tests.");
