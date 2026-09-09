const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env.local") });
const { criarUser } = require("../lib/db/users");
const {
  salvarProposta,
  obterPropostasPorUsuario,
  obterPropostaPorId,
  atualizarStatusProposta,
  deletarProposta,
  obterMetricasDashboard,
} = require("../lib/db/propostas");

async function testPropostasCrud() {
  console.log("Testing Propostas CRUD...");
  try {
    const user = await criarUser({
      email: `user_prop_${Date.now()}@propostaai.com`,
      password: "password123",
      nome: "Cliente Proposta Teste",
    });
    console.log("✅ Created test user:", user.id);

    const proposta = await salvarProposta({
      usuarioId: user.id,
      numero: `PROP-TEST-${Date.now()}`,
      clienteNome: "Empresa Parceira",
      descricao: "Serviço de desenvolvimento",
      conteudoHtml: "<html><body><h1>Proposta de Teste</h1></body></html>",
      subtotal: 5000,
      total: 5000,
      itens: [
        { descricao: "Setup inicial", quantidade: 1, valorUnitario: 2000 },
        { descricao: "Desenvolvimento", quantidade: 1, valorUnitario: 3000 },
      ],
    });
    console.log("✅ Created proposal with items:", proposta.id, proposta.numero);

    const list = await obterPropostasPorUsuario(user.id);
    console.log("✅ Listed proposals count:", list.length);

    const single = await obterPropostaPorId(proposta.id, user.id);
    console.log("✅ Fetched single proposal:", single.cliente_nome, "Items count:", single.itens?.length);

    const updated = await atualizarStatusProposta(proposta.id, user.id, "aceita");
    console.log("✅ Updated status:", updated.status);

    const metricas = await obterMetricasDashboard(user.id);
    console.log("✅ Dashboard metrics:", metricas);

    const deleted = await deletarProposta(proposta.id, user.id);
    console.log("✅ Deleted proposal successfully:", deleted);

    console.log("🎉 Propostas CRUD tests passed!");
  } catch (err) {
    console.error("❌ Propostas CRUD test failed:", err);
  } finally {
    process.exit(0);
  }
}

testPropostasCrud();
