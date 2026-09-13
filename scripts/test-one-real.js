const axios = require("axios");
const dotenv = require("dotenv");
dotenv.config({ path: ".env.production" });
dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

const apiKey = (process.env.ASAAS_API_KEY_PRODUCAO || process.env.ASAAS_API_KEY || "").replace(/^["']|["']$/g, "").trim();
const client = axios.create({
  baseURL: "https://api.asaas.com/v3",
  headers: {
    access_token: apiKey,
    "Content-Type": "application/json",
    accept: "application/json",
  },
});

async function testSingleAndSub() {
  console.log("Testing Asaas Production API with R$ 1,00...");

  // 1. Try single payment of 1.00
  try {
    console.log("\n--- Testing Single Payment (POST /v3/payments) for R$ 1.00 ---");
    const payRes = await client.post("/payments", {
      customer: "cus_000200093453",
      billingType: "PIX",
      value: 1.0,
      dueDate: new Date().toISOString().split("T")[0],
      description: "Teste Cobrança Avulsa R$ 1,00",
    });
    console.log("✅ SUCCESS Single Payment:", {
      id: payRes.data.id,
      invoiceUrl: payRes.data.invoiceUrl,
      value: payRes.data.value,
      status: payRes.data.status,
    });

    // Get PIX QR Code for this payment
    const qrRes = await client.get(`/payments/${payRes.data.id}/pixQrCode`);
    console.log("✅ PIX QR Code SUCCESS!", {
      payload: qrRes.data.payload?.substring(0, 50) + "...",
      encodedImageLen: qrRes.data.encodedImage?.length,
      expirationDate: qrRes.data.expirationDate,
    });
  } catch (err) {
    console.log("❌ Single Payment Error:", JSON.stringify(err.response?.data || err.message));
  }

  // 2. Try subscription of 1.00
  try {
    console.log("\n--- Testing Subscription (POST /v3/subscriptions) for R$ 1.00 ---");
    const subRes = await client.post("/subscriptions", {
      customer: "cus_000200093453",
      billingType: "PIX",
      cycle: "MONTHLY",
      value: 1.0,
      nextDueDate: new Date().toISOString().split("T")[0],
      description: "Teste Assinatura R$ 1,00",
    });
    console.log("✅ SUCCESS Subscription:", subRes.data.id);
  } catch (err) {
    console.log("❌ Subscription Error:", JSON.stringify(err.response?.data || err.message));
  }
}

testSingleAndSub();
