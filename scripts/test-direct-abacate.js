const axios = require("axios");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env.local") });

const apiKey = process.env.ABACATE_SECRET_KEY || process.env.ABACATE_PAY_API_KEY || "";
console.log("Using API Key:", apiKey ? apiKey.substring(0, 10) + "..." : "NONE");

async function testDirectAbacate() {
  const client = axios.create({
    baseURL: process.env.ABACATE_BASE_URL || "https://api.abacatepay.com/v2",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
  });

  try {
    console.log("Testing POST /transparents/create...");
    const res = await client.post("/transparents/create", {
      method: "PIX",
      data: {
        amount: 4590,
        description: "Assinatura ViraPropo AI! Pro",
        expiresIn: 3600,
        customer: {
          name: "Luiz Felipe",
          email: "luizltisistemas@gmail.com",
          taxId: "000.000.000-00",
          cellphone: "(11) 99999-9999",
        },
      },
    });
    console.log("Response /transparents/create:", JSON.stringify(res.data, null, 2));
  } catch (err) {
    console.error("Error /transparents/create:", err.response?.status, err.response?.data || err.message);
  }

  try {
    console.log("\nTesting POST /billing/create...");
    const res2 = await client.post("/billing/create", {
      frequency: "ONE_TIME",
      methods: ["PIX"],
      products: [
        {
          externalId: "pro_monthly",
          name: "ViraPropo AI! Pro",
          quantity: 1,
          price: 4590,
          description: "Plano Pro Mensal",
        },
      ],
      returnUrl: "https://proposta-ai-pra-mim.vercel.app/config",
      completionUrl: "https://proposta-ai-pra-mim.vercel.app/config?status=sucesso",
      customer: {
        name: "Luiz Felipe",
        email: "luizltisistemas@gmail.com",
        cellphone: "(11) 99999-9999",
        taxId: "123.456.789-00",
      },
    });
    console.log("Response /billing/create:", JSON.stringify(res2.data, null, 2));
  } catch (err2) {
    console.error("Error /billing/create:", err2.response?.status, err2.response?.data || err2.message);
  }
}

testDirectAbacate();
