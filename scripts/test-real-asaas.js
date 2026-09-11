const axios = require("axios");
const dotenv = require("dotenv");
dotenv.config({ path: ".env.local" });

const apiKey = (process.env.ASAAS_API_KEY || "").replace(/^["']|["']$/g, "").trim();

console.log("Using API Key prefix:", apiKey.substring(0, 15), "Total len:", apiKey.length);

const client = axios.create({
  baseURL: "https://api-sandbox.asaas.com/v3",
  headers: {
    access_token: apiKey,
    "Content-Type": "application/json",
    accept: "application/json",
    "User-Agent": "vira-propo-ai/1.0.0",
  },
});

async function run() {
  try {
    console.log("Searching customer for email: luizltisistemas@gmail.com...");
    const searchRes = await client.get("/customers", {
      params: { email: "luizltisistemas@gmail.com" },
    });
    console.log("Customer search result count:", searchRes.data?.data?.length);

    let customerId;
    if (searchRes.data?.data && searchRes.data.data.length > 0) {
      customerId = searchRes.data.data[0].id;
      console.log("Found existing real customer in Asaas:", customerId);
    } else {
      console.log("Creating customer...");
      const createRes = await client.post("/customers", {
        name: "Luiz Felipe Marinho Dantas",
        email: "luizltisistemas@gmail.com",
        cpfCnpj: "06629649427",
        phone: "81973123278",
        notificationDisabled: true,
      });
      customerId = createRes.data.id;
      console.log("Created customer in Asaas:", customerId);
    }

    console.log("Creating subscription for customer:", customerId);
    const hojeStr = new Date().toISOString().split("T")[0];
    const subRes = await client.post("/subscriptions", {
      customer: customerId,
      billingType: "PIX",
      cycle: "MONTHLY",
      value: 45.9,
      nextDueDate: hojeStr,
      description: "Assinatura ViraPropo AI! Pro (Mensal)",
      maxPayments: 24,
    });
    console.log("Subscription created:", subRes.data.id, subRes.data.status);

    const subId = subRes.data.id;
    console.log("Fetching payments for subscription:", subId);
    const payRes = await client.get(`/subscriptions/${subId}/payments`);
    console.log("Payments count:", payRes.data?.data?.length);

    if (payRes.data?.data?.length > 0) {
      const payment = payRes.data.data[0];
      console.log("Payment ID:", payment.id, "Invoice URL:", payment.invoiceUrl);
      const pixRes = await client.get(`/payments/${payment.id}/pixQrCode`);
      console.log("PIX Copia e Cola:", pixRes.data.payload?.substring(0, 50) + "...");
      console.log("PIX encodedImage (base64) len:", pixRes.data.encodedImage?.length);
      console.log("PIX expirationDate:", pixRes.data.expirationDate);
    }
  } catch (err) {
    console.error("Error from Asaas:", err.response?.data || err.message);
  }
}

run();
