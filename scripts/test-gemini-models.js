const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config({ path: ".env.local" });

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const models = [
  "gemini-3.7-flash",
  "gemini-3.6-flash",
  "gemini-3.5-flash",
  "gemini-3.1-flash-lite",
  "gemini-flash-latest",
  "gemini-pro-latest"
];

async function main() {
  for (const modelName of models) {
    try {
      console.log(`Testando ${modelName}...`);
      const model = genAI.getGenerativeModel({ model: modelName });
      const res = await model.generateContent("Diga 'IA Operacional com Sucesso'");
      console.log(`>>> SUCESSO com ${modelName}:`, res.response.text().trim());
      return modelName;
    } catch (err) {
      console.log(`Falha com ${modelName}:`, err.message.substring(0, 120));
    }
  }
}

main().catch(console.error);
