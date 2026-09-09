const { criarUser, obterUserPorEmail } = require("../lib/db/users");
const { gerarToken, verificarToken } = require("../lib/auth/jwt");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env.local") });

async function testAuth() {
  console.log("Testing auth logic...");
  const testEmail = `test_${Date.now()}@propostaai.com`;
  
  try {
    const user = await criarUser({
      email: testEmail,
      password: "password123",
      nome: "Usuário Teste",
      empresaNome: "Empresa Teste",
    });
    console.log("✅ Created user:", user.email, user.id);

    const fetched = await obterUserPorEmail(testEmail);
    console.log("✅ Fetched user:", fetched ? fetched.nome : "not found");

    const token = gerarToken({
      userId: user.id,
      email: user.email,
      nome: user.nome,
      plano: "free",
    });
    console.log("✅ Generated token successfully");

    const decoded = verificarToken(token);
    console.log("✅ Decoded token:", decoded ? decoded.email : "invalid");

    console.log("🎉 Auth test passed!");
  } catch (err) {
    console.error("❌ Auth test failed:", err);
  } finally {
    process.exit(0);
  }
}

testAuth();
