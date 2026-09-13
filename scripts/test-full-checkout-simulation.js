const jwt = require("jsonwebtoken");
const axios = require("axios");
const dotenv = require("dotenv");
const { Pool } = require("pg");

dotenv.config({ path: ".env.production" });
dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

let dbUrl = process.env.DATABASE_URL_NON_POOLING || process.env.DATABASE_URL || "";
if (dbUrl.includes("sslmode=")) {
  dbUrl = dbUrl.replace(/[?&]sslmode=[^&]+/, "");
}

const pool = new Pool({
  connectionString: dbUrl,
  ssl: { rejectUnauthorized: false },
});

const JWT_SECRET = process.env.JWT_SECRET || "cuCCKSRiB1PtzW63K2FIIrRB5oaraLHzBBncWcNZhg5sTiVZrhAs3DclrsWn1ysoy+0yKlIXEiJPeu+O+UojAg==";

async function testFullRouteSimulation() {
  try {
    const userRes = await pool.query("SELECT * FROM users WHERE email = 'luizltisistemas@gmail.com'");
    const user = userRes.rows[0];
    console.log("Found user:", user.email, "ID:", user.id);

    // Generate JWT Token
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        nome: user.nome,
        plano: user.plano,
      },
      JWT_SECRET,
      { expiresIn: "7d" }
    );
    console.log("Generated JWT Token for test.");

    // Now test Asaas API key and Base URL
    const apiKey = (process.env.ASAAS_API_KEY_PRODUCAO || process.env.ASAAS_API_KEY || "").replace(/^["']|["']$/g, "").trim();
    const baseURL = apiKey.startsWith("$aact_prod_") ? "https://api.asaas.com/v3" : "https://api-sandbox.asaas.com/v3";
    console.log("Asaas Base URL:", baseURL);
    console.log("Asaas API Key length:", apiKey.length, "Prefix:", apiKey.substring(0, 15));

    const asaasClient = axios.create({
      baseURL,
      headers: {
        access_token: apiKey,
        "Content-Type": "application/json",
        accept: "application/json",
      },
      timeout: 15000,
    });

    // 1. Customer
    console.log("\n1. Customer Check...");
    const custRes = await asaasClient.get(`/customers/${user.asaas_customer_id}`);
    console.log("Customer found on Asaas:", custRes.data.id, custRes.data.name, "CPF:", custRes.data.cpfCnpj);

    // 2. Subscription
    console.log("\n2. Creating Subscription R$ 5,00...");
    const hojeStr = new Date().toISOString().split("T")[0];
    const subRes = await asaasClient.post("/subscriptions", {
      customer: custRes.data.id,
      billingType: "PIX",
      cycle: "MONTHLY",
      value: 5.0,
      nextDueDate: hojeStr,
      description: "Assinatura ViraPropo AI! Pro (Mensal) - Teste",
      externalReference: user.id,
      maxPayments: 24,
    });
    console.log("Subscription created:", subRes.data.id);

    // 3. Payments
    console.log("\n3. Waiting for payment to be created by Asaas...");
    let payments = [];
    for (let i = 0; i < 5; i++) {
      await new Promise((r) => setTimeout(r, 1000));
      const pRes = await asaasClient.get(`/subscriptions/${subRes.data.id}/payments`);
      if (pRes.data?.data?.length > 0) {
        payments = pRes.data.data;
        break;
      }
    }

    if (payments.length === 0) {
      throw new Error("No payments created for subscription");
    }

    const payment = payments[0];
    console.log("Payment created:", payment.id, "Invoice URL:", payment.invoiceUrl);

    // 4. PIX QR Code
    console.log("\n4. Getting PIX QR Code...");
    const pixRes = await asaasClient.get(`/payments/${payment.id}/pixQrCode`);
    console.log("PIX Copia e Cola:", pixRes.data.payload?.substring(0, 60) + "...");
    console.log("PIX Encoded Image Base64 length:", pixRes.data.encodedImage?.length);
    console.log("PIX Expiration Date:", pixRes.data.expirationDate);

    console.log("\n✅ ALL STEPS PASSED SUCCESSFULLY!");
  } catch (err) {
    console.error("Error:", err.response?.data || err.message);
  } finally {
    await pool.end();
  }
}

testFullRouteSimulation();
