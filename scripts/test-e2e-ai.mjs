import { gerarPropostacComIA } from "./lib/gemini/client";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const dados = {
  empresaNome: "Agência Alpha Digital",
  empresaCNPJ: "98.765.432/0001-10",
  empresaEmail: "contato@alphadigital.com.br",
  empresaTelefone: "(11) 98888-1234",
  clienteNome: "Mariana Santos",
  clienteEmpresa: "Santos Cosméticos",
  clienteEmail: "mariana@santoscosmeticos.com",
  descricao: "Reformulação completa da identidade visual, criação de catálogo digital de produtos e automação de atendimento via WhatsApp.",
  itens: [
    { descricao: "Branding & Identidade Visual", quantidade: 1, valorUnitario: 3200 },
    { descricao: "Catálogo Digital Interativo", quantidade: 1, valorUnitario: 1800 },
    { descricao: "Automação WhatsApp Business", quantidade: 1, valorUnitario: 1500 }
  ],
  prazoPagamento: "Entrada de 40% + 60% na entrega final",
  validade: 20,
  observacoes: "Treinamento da equipe de atendimento incluso (2h online).",
  plano: "pro" as const
};

console.log("Chamando gerarPropostacComIA...");
const start = Date.now();
const html = await gerarPropostacComIA(dados);
const duration = Date.now() - start;

console.log(`\n================ RESULTADO DA GERAÇÃO COM IA (${duration}ms) ================`);
console.log(`Tamanho do HTML gerado: ${html.length} caracteres`);
console.log(`Contém <!DOCTYPE html>: ${html.includes("<!DOCTYPE html>")}`);
console.log(`Contém 'Diagnóstico do Cenário': ${html.includes("Diagnóstico")}`);
console.log(`Contém 'Metodologia': ${html.includes("Metodologia")}`);
console.log(`Contém 'Investimento & Entregáveis': ${html.includes("Investimento")}`);
console.log(`Contém 'Mariana Santos': ${html.includes("Mariana Santos")}`);
console.log(`Contém 'R$ 6.500,00' ou similar: ${html.includes("6.500") || html.includes("6500")}`);
console.log("========================================================================\n");
