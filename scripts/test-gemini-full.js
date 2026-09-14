const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config({ path: ".env.local" });

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function test() {
  console.log("Testing with API Key prefix:", process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.substring(0, 8) + "..." : "NONE");
  for (const m of ["gemini-1.5-flash", "gemini-1.5-flash-8b", "gemini-2.0-flash-exp", "gemini-1.5-pro"]) {
    try {
      const model = genAI.getGenerativeModel({ model: m });
      const res = await model.generateContent("Diga olá");
      console.log(`✓ Model ${m} SUCCESS:`, res.response.text().trim());
      break;
    } catch (e) {
      console.log(`✗ Model ${m} ERROR:`, e.status, e.message);
    }
  }
}

test().catch(console.error);
