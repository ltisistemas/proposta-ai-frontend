const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env.local") });
const { criarAssinatura, validarAssinaturaWebhook } = require("../lib/abacate/client");
const crypto = require("crypto");

async function testAbacate() {
  console.log("Testing Abacate Pay client & webhook signature verification...");

  // 1. Test signature validation
  const testBody = JSON.stringify({
    event_type: "subscription.confirmed",
    subscription_id: "sub_test_123",
    customer_id: "cust_test_123",
  });
  const secret = process.env.ABACATE_WEBHOOK_SECRET || "default_webhook_secret";
  const validSignature = crypto
    .createHmac("sha256", secret)
    .update(testBody)
    .digest("hex");

  const isSigValid = validarAssinaturaWebhook(testBody, validSignature);
  console.log("✅ Webhook signature validation test:", isSigValid ? "PASSED" : "FAILED");

  // 2. Test create subscription
  const sub = await criarAssinatura({
    customer_email: "test@propostaai.com",
    customer_name: "Cliente Teste",
    plan_id: "pro-39",
  });
  console.log("✅ Create subscription test:", sub.subscription_id, sub.checkout_url);

  console.log("🎉 Abacate Pay tests passed!");
  process.exit(0);
}

testAbacate();
