const axios = require("axios");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env.local") });

const apiKey = process.env.ABACATE_SECRET_KEY || process.env.ABACATE_PAY_API_KEY || "";

// Gera um CPF válido para testes (apenas dígitos)
function gerarCPFValido() {
  const rnd = (n) => Math.round(Math.random() * n);
  const mod = (dividendo, divisor) => Math.round(dividendo - (Math.floor(dividendo / divisor) * divisor));
  const n1 = rnd(9), n2 = rnd(9), n3 = rnd(9), n4 = rnd(9), n5 = rnd(9), n6 = rnd(9), n7 = rnd(9), n8 = rnd(9), n9 = rnd(9);
  let d1 = n9 * 2 + n8 * 3 + n7 * 4 + n6 * 5 + n5 * 6 + n4 * 7 + n3 * 8 + n2 * 9 + n1 * 10;
  d1 = 11 - mod(d1, 11);
  if (d1 >= 10) d1 = 0;
  let d2 = d1 * 2 + n9 * 3 + n8 * 4 + n7 * 5 + n6 * 6 + n5 * 7 + n4 * 8 + n3 * 9 + n2 * 10 + n1 * 11;
  d2 = 11 - mod(d2, 11);
  if (d2 >= 10) d2 = 0;
  return `${n1}${n2}${n3}${n4}${n5}${n6}${n7}${n8}${n9}${d1}${d2}`;
}

async function testWithValidTaxId() {
  const client = axios.create({
    baseURL: process.env.ABACATE_BASE_URL || "https://api.abacatepay.com/v2",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
  });

  const testCpf = gerarCPFValido();
  console.log("Testing with valid CPF:", testCpf);

  try {
    const res = await client.post("/transparents/create", {
      method: "PIX",
      data: {
        amount: 4590,
        description: "Assinatura ViraPropo AI! Pro",
        expiresIn: 3600,
        customer: {
          name: "Luiz Felipe",
          email: "luizltisistemas@gmail.com",
          taxId: testCpf,
          cellphone: "11999999999",
        },
      },
    });
    console.log("Success /transparents/create:", JSON.stringify(res.data, null, 2));
  } catch (err) {
    console.error("Error /transparents/create:", err.response?.status, err.response?.data || err.message);
  }
}

testWithValidTaxId();
