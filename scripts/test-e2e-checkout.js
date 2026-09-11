const jwt = require("jsonwebtoken");
const axios = require("axios");
const dotenv = require("dotenv");
dotenv.config({ path: ".env.local" });

const { Pool } = require("pg");
const rawConnectionString =
  process.env.DATABASE_URL_NON_POOLING || process.env.DATABASE_URL;
const cleanConnectionString = rawConnectionString.split("?")[0];
const pool = new Pool({
  connectionString: cleanConnectionString,
  ssl: { rejectUnauthorized: false },
});

async function main() {
  const userRes = await pool.query(
    "SELECT * FROM users WHERE email = 'luizltisistemas@gmail.com'"
  );
  const user = userRes.rows[0];
  console.log("Testing user:", user.email, "ID:", user.id);

  const token = jwt.sign(
    { userId: user.id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: "1h" }
  );

  console.log("Testing full checkout flow via Asaas...");

  const asaasApiKey = (process.env.ASAAS_API_KEY || "").replace(/^["']|["']$/g, "").trim();
  const asaasClient = axios.create({
    baseURL: "https://api-sandbox.asaas.com/v3",
    headers: {
      access_token: asaasApiKey,
      "Content-Type": "application/json",
      accept: "application/json",
      "User-Agent": "vira-propo-ai/1.0.0",
    },
  });

  // 1. Customer
  let customerRes = await asaasClient.get("/customers", {
    params: { email: user.email },
  });
  let customerId = customerRes.data?.data?.[0]?.id;
  if (!customerId) {
    const createCustomer = await asaasClient.post("/customers", {
      name: user.nome,
      email: user.email,
      cpfCnpj: user.empresa_cnpj,
      phone: user.empresa_telefone,
      notificationDisabled: true,
    });
    customerId = createCustomer.data.id;
  }
  console.log("Asaas Customer ID:", customerId);

  // Update in DB
  await pool.query("UPDATE users SET asaas_customer_id = $1 WHERE id = $2", [
    customerId,
    user.id,
  ]);

  // 2. Subscription
  const hojeStr = new Date().toISOString().split("T")[0];
  const subRes = await asaasClient.post("/subscriptions", {
    customer: customerId,
    billingType: "PIX",
    cycle: "MONTHLY",
    value: 45.9,
    nextDueDate: hojeStr,
    description: "Assinatura ViraPropo AI! Pro (Mensal)",
    externalReference: user.id,
    maxPayments: 24,
  });
  const subId = subRes.data.id;
  console.log("Created Subscription ID:", subId);

  // 3. Payment
  const payRes = await asaasClient.get(`/subscriptions/${subId}/payments`);
  const payment = payRes.data?.data?.[0];
  console.log("Payment ID:", payment?.id, "Invoice URL:", payment?.invoiceUrl);

  // 4. PIX QR Code
  const pixRes = await asaasClient.get(`/payments/${payment.id}/pixQrCode`);
  console.log("PIX Copia e Cola:", pixRes.data.payload?.substring(0, 60) + "...");
  console.log("PIX Encoded Image length:", pixRes.data.encodedImage?.length);
  console.log("PIX Expiration Date:", pixRes.data.expirationDate);

  console.log("\nVerifying that invoice URL is publicly reachable on Asaas sandbox...");
  const invoiceCheck = await axios.get(payment.invoiceUrl);
  console.log("Invoice URL HTTP Status:", invoiceCheck.status);

  await pool.end();
  console.log("\nALL ASAAS CHECKOUT STEPS COMPLETED SUCCESSFULLY!");
}

main().catch(console.error);
