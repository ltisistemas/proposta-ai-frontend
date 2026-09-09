const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env.local") });
const { gerarPropostacComIA } = require("../lib/gemini/client");

async function testGemini() {
  console.log("Testing Gemini AI proposal generation...");
  const dados = {
    empresaNome: "Consultoria Inovação Digital",
    empresaCNPJ: "12.345.678/0001-90",
    empresaEmail: "contato@consultoria.com.br",
    empresaTelefone: "(11) 98765-4321",
    clienteNome: "Carlos Mendes",
    clienteEmpresa: "Acme Tech Brasil",
    clienteEmail: "carlos@acmetech.com.br",
    descricao: "Implementação de infraestrutura em nuvem e automação com inteligência artificial.",
    itens: [
      { descricao: "Diagnóstico e arquitetura de nuvem", quantidade: 1, valorUnitario: 3500 },
      { descricao: "Desenvolvimento de agentes de IA", quantidade: 2, valorUnitario: 4200 },
    ],
    prazoPagamento: "50% entrada + 50% na entrega",
    validade: "15",
  };

  try {
    const html = await gerarPropostacComIA(dados);
    console.log("✅ Proposta gerada com sucesso! Tamanho HTML:", html.length, "bytes");
    console.log("Snippet inicial:");
    console.log(html.substring(0, 300));
  } catch (err) {
    console.error("❌ Erro no teste Gemini:", err);
  } finally {
    process.exit(0);
  }
}

testGemini();
