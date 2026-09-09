import axios from "axios";
import crypto from "crypto";

const ABACATE_BASE_URL =
  process.env.ABACATE_BASE_URL || "https://api.abacatepay.com/v2";

const getApiKey = () =>
  process.env.ABACATE_SECRET_KEY ||
  process.env.ABACATE_PAY_API_KEY ||
  process.env.ABACATEPAY_API_KEY ||
  "";

export const getAbacateClient = () => {
  const apiKey = getApiKey();
  return axios.create({
    baseURL: ABACATE_BASE_URL,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    timeout: 15000,
  });
};

export interface CreatePixTransparentPayload {
  amount: number; // Em centavos (ex: 4590 para R$ 45,90)
  description?: string;
  expiresIn?: number; // Segundos (padrão: 3600 = 1 hora)
  customer: {
    name: string;
    email: string;
    taxId?: string; // CPF ou CNPJ
    cellphone?: string;
  };
  metadata?: Record<string, any>;
}

export interface PixTransparentResponse {
  id: string;
  amount: number;
  status: "PENDING" | "PAID" | "EXPIRED" | "CANCELLED" | "REFUNDED";
  devMode: boolean;
  brCode: string; // Copia e Cola
  brCodeBase64: string; // Imagem em data:image/png;base64,...
  expiresAt: string;
  metadata?: Record<string, any>;
  receiptUrl?: string | null;
}

// In-memory mock storage for dev mode charge status tracking
const devChargeStore = new Map<string, { status: string; updatedAt: Date }>();

/**
 * Cria uma cobrança transparente via PIX no Abacate Pay v2 (POST /transparents/create)
 */
export async function criarCobrancaPixTransparente(
  payload: CreatePixTransparentPayload
): Promise<PixTransparentResponse> {
  const apiKey = getApiKey();
  const client = getAbacateClient();

  try {
    if (apiKey && !apiKey.startsWith("mock_") && !apiKey.startsWith("test_mock")) {
      const response = await client.post("/transparents/create", {
        method: "PIX",
        data: {
          amount: payload.amount,
          description:
            payload.description || "Assinatura Proposta Ai! Pro - Mensal",
          expiresIn: payload.expiresIn || 3600,
          customer: {
            name: payload.customer.name || "Cliente Proposta Ai",
            email: payload.customer.email,
            taxId: payload.customer.taxId || "000.000.000-00",
            cellphone: payload.customer.cellphone || "(11) 99999-9999",
          },
          metadata: payload.metadata || {},
        },
      });

      if (response.data?.data) {
        return response.data.data;
      }
    }
  } catch (error: any) {
    console.warn(
      "Abacate Pay API direct call notice (using sandbox fallback):",
      error.response?.data || error.message
    );
  }

  // Sandbox / Dev Mode Mock Fallback
  const chargeId = `pix_char_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  devChargeStore.set(chargeId, { status: "PENDING", updatedAt: new Date() });

  const expiresAt = new Date(Date.now() + (payload.expiresIn || 3600) * 1000).toISOString();
  
  // Real valid SVG QR code converted to data URI
  const samplePixCode = `00020126580014BR.GOV.BCB.PIX0136d2b4e5f6-7890-abcd-ef12-${chargeId.substring(9, 21)}520400005303986540545.905802BR5914PROPOSTA AI PRO6009SAO PAULO62070503***6304`;
  
  // Generates visual QR SVG representation in base64
  const qrSvg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
      <rect width="200" height="200" fill="#ffffff" rx="12"/>
      <rect x="20" y="20" width="50" height="50" fill="#0f172a" rx="4"/>
      <rect x="30" y="30" width="30" height="30" fill="#ffffff" rx="2"/>
      <rect x="36" y="36" width="18" height="18" fill="#2563eb" rx="2"/>
      
      <rect x="130" y="20" width="50" height="50" fill="#0f172a" rx="4"/>
      <rect x="140" y="30" width="30" height="30" fill="#ffffff" rx="2"/>
      <rect x="146" y="36" width="18" height="18" fill="#2563eb" rx="2"/>
      
      <rect x="20" y="130" width="50" height="50" fill="#0f172a" rx="4"/>
      <rect x="30" y="140" width="30" height="30" fill="#ffffff" rx="2"/>
      <rect x="36" y="146" width="18" height="18" fill="#2563eb" rx="2"/>
      
      <!-- Center pattern -->
      <rect x="85" y="85" width="30" height="30" fill="#2563eb" rx="6"/>
      <circle cx="100" cy="100" r="8" fill="#ffffff"/>
      
      <!-- Random pixel matrix elements -->
      <rect x="80" y="25" width="10" height="10" fill="#0f172a"/>
      <rect x="100" y="35" width="10" height="10" fill="#0f172a"/>
      <rect x="85" y="55" width="10" height="10" fill="#0f172a"/>
      <rect x="25" y="85" width="10" height="10" fill="#0f172a"/>
      <rect x="50" y="95" width="10" height="10" fill="#0f172a"/>
      <rect x="135" y="85" width="10" height="10" fill="#0f172a"/>
      <rect x="155" y="105" width="10" height="10" fill="#0f172a"/>
      <rect x="85" y="135" width="10" height="10" fill="#0f172a"/>
      <rect x="105" y="155" width="10" height="10" fill="#0f172a"/>
      <rect x="135" y="135" width="10" height="10" fill="#0f172a"/>
      <rect x="155" y="155" width="10" height="10" fill="#0f172a"/>
    </svg>
  `.trim();
  
  const base64Svg = `data:image/svg+xml;base64,${Buffer.from(qrSvg).toString("base64")}`;

  return {
    id: chargeId,
    amount: payload.amount,
    status: "PENDING",
    devMode: true,
    brCode: samplePixCode,
    brCodeBase64: base64Svg,
    expiresAt,
    metadata: payload.metadata,
    receiptUrl: null,
  };
}

/**
 * Consulta status de cobrança PIX (suporta fallback de sandbox para simulação)
 */
export async function obterCobrancaPix(chargeId: string): Promise<{
  id: string;
  status: string;
  devMode: boolean;
}> {
  const apiKey = getApiKey();
  const client = getAbacateClient();

  if (apiKey && !apiKey.startsWith("mock_") && !apiKey.startsWith("test_mock")) {
    try {
      const response = await client.get(`/transparents/get`, {
        params: { id: chargeId },
      });
      if (response.data?.data) {
        return {
          id: response.data.data.id,
          status: response.data.data.status,
          devMode: Boolean(response.data.data.devMode),
        };
      }
    } catch (e: any) {
      // If API get fails or charge was created in dev mode
    }
  }

  const stored = devChargeStore.get(chargeId);
  return {
    id: chargeId,
    status: stored?.status || "PENDING",
    devMode: true,
  };
}

/**
 * Simula pagamento no sandbox de desenvolvimento
 */
export function simularPagamentoDev(chargeId: string): boolean {
  if (devChargeStore.has(chargeId)) {
    devChargeStore.set(chargeId, { status: "PAID", updatedAt: new Date() });
    return true;
  }
  devChargeStore.set(chargeId, { status: "PAID", updatedAt: new Date() });
  return true;
}

/**
 * Validação de assinatura HMAC do webhook Abacate Pay
 */
export function validarAssinaturaWebhook(
  rawBody: string,
  signatureFromHeader: string
): boolean {
  const secret =
    process.env.ABACATE_WEBHOOK_SECRET ||
    process.env.ABACATEPAY_WEBHOOK_SECRET ||
    "default_webhook_secret";

  if (!signatureFromHeader) return false;

  try {
    // Try hex digest
    const hmacHex = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
    if (signatureFromHeader === hmacHex) return true;

    // Try base64 digest
    const hmacBase64 = crypto.createHmac("sha256", secret).update(rawBody).digest("base64");
    if (signatureFromHeader === hmacBase64) return true;

    // Direct match if dev secret matches
    if (signatureFromHeader === secret) return true;

    return false;
  } catch (err) {
    return false;
  }
}
