import axios, { AxiosInstance } from "axios";

// Armazenamento em memória para simulações sandbox e dev mode
const devStore = new Map<string, { status: string; invoiceUrl?: string; updatedAt: Date }>();

/**
 * Obtém a chave de API do Asaas (Sandbox ou Produção)
 */
export const getAsaasApiKey = (): string => {
  const rawKey =
    process.env.ASAAS_API_KEY ||
    process.env.ASAAS_API_KEY_SANDBOX ||
    process.env.ASAAS_SECRET_KEY ||
    "";
  // Remove aspas eventuais colocadas no .env
  return rawKey.replace(/^["']|["']$/g, "").trim();
};

/**
 * Obtém a URL base da API v3 do Asaas
 */
export const getAsaasBaseUrl = (): string => {
  if (process.env.ASAAS_BASE_URL) {
    return process.env.ASAAS_BASE_URL.replace(/\/+$/, "");
  }

  const apiKey = getAsaasApiKey();
  if (apiKey.startsWith("$aact_hmlg_") || process.env.NODE_ENV !== "production") {
    return "https://api-sandbox.asaas.com/v3";
  }

  return "https://api.asaas.com/v3";
};

/**
 * Cria uma instância do cliente Axios configurada para a API v3 do Asaas
 */
export const getAsaasClient = (): AxiosInstance => {
  const apiKey = getAsaasApiKey();
  const baseURL = getAsaasBaseUrl();

  return axios.create({
    baseURL,
    headers: {
      access_token: apiKey,
      "Content-Type": "application/json",
      "User-Agent": "vira-propo-ai/1.0.0",
      accept: "application/json",
    },
    timeout: 15000,
  });
};

export interface AsaasCustomer {
  id: string;
  name: string;
  email?: string | null;
  cpfCnpj?: string | null;
  phone?: string | null;
  mobilePhone?: string | null;
  externalReference?: string | null;
  notificationDisabled?: boolean;
}

export interface CreateAsaasCustomerPayload {
  name: string;
  email?: string;
  cpfCnpj?: string;
  phone?: string;
  mobilePhone?: string;
  externalReference?: string;
  notificationDisabled?: boolean;
  existingCustomerId?: string | null;
}

export interface AsaasSubscription {
  id: string;
  customer: string;
  value: number;
  nextDueDate: string;
  cycle: string;
  description?: string;
  billingType: string;
  status: string;
  externalReference?: string;
  invoiceUrl?: string;
}

export interface CreateAsaasSubscriptionPayload {
  customer: string;
  billingType: "PIX" | "BOLETO" | "CREDIT_CARD" | "UNDEFINED";
  cycle: "MONTHLY" | "WEEKLY" | "BIWEEKLY" | "QUARTERLY" | "SEMIANNUALLY" | "YEARLY";
  value: number;
  nextDueDate: string;
  description?: string;
  externalReference?: string;
  maxPayments?: number;
}

export interface AsaasPayment {
  id: string;
  customer: string;
  subscription?: string;
  value: number;
  netValue?: number;
  status: "PENDING" | "RECEIVED" | "CONFIRMED" | "OVERDUE" | "REFUNDED" | "RECEIVED_IN_CASH" | "DELETED";
  dueDate: string;
  originalDueDate?: string;
  invoiceUrl?: string;
  invoiceNumber?: string;
  externalReference?: string;
  billingType: string;
  bankSlipUrl?: string | null;
  transactionReceiptUrl?: string | null;
}

export interface AsaasPixQrCode {
  encodedImage: string; // Base64 da imagem PNG
  payload: string; // Copia e Cola
  expirationDate?: string;
}

export interface CreateCheckoutResult {
  chargeId: string;
  subscriptionId: string;
  amount: number;
  brCode: string;
  brCodeBase64: string;
  invoiceUrl?: string;
  expiresAt?: string;
  status: string;
  devMode?: boolean;
}

/**
 * Utilitário para gerar CPF válido em sandbox quando o usuário não tiver informado
 */
export function gerarCpfValidoFallback(): string {
  const n = Array.from({ length: 9 }, () => Math.floor(Math.random() * 9));
  let d1 = n.reduce((total, num, idx) => total + num * (10 - idx), 0) % 11;
  d1 = d1 < 2 ? 0 : 11 - d1;
  let d2 = [...n, d1].reduce((total, num, idx) => total + num * (11 - idx), 0) % 11;
  d2 = d2 < 2 ? 0 : 11 - d2;
  return `${n.join("")}${d1}${d2}`;
}

/**
 * Extrai a mensagem legível de erro do Asaas
 */
function extrairErroAsaas(error: any): string {
  if (error.response?.data?.errors && Array.isArray(error.response.data.errors)) {
    return error.response.data.errors.map((e: any) => e.description || e.message).join("; ");
  }
  if (error.response?.data?.message) {
    return error.response.data.message;
  }
  return error.message || "Erro desconhecido na API do Asaas";
}

/**
 * Busca cliente existente no Asaas ou cria um novo
 */
export async function criarOuBuscarClienteAsaas(
  payload: CreateAsaasCustomerPayload
): Promise<AsaasCustomer> {
  const apiKey = getAsaasApiKey();
  const client = getAsaasClient();

  const isRealApiKey =
    apiKey && !apiKey.startsWith("mock_") && !apiKey.startsWith("test_mock");

  const rawCpfCnpj = (payload.cpfCnpj || "").replace(/\D/g, "");
  let cleanCpfCnpj = rawCpfCnpj;
  if (cleanCpfCnpj.length !== 11 && cleanCpfCnpj.length !== 14) {
    cleanCpfCnpj = gerarCpfValidoFallback();
  }

  if (isRealApiKey) {
    // 1. Se foi passado existingCustomerId, valida se ele realmente existe no Asaas
    if (payload.existingCustomerId && payload.existingCustomerId.startsWith("cus_")) {
      try {
        const getRes = await client.get(`/customers/${payload.existingCustomerId}`);
        if (getRes.data?.id) {
          return getRes.data;
        }
      } catch (err: any) {
        console.warn(
          `Customer ${payload.existingCustomerId} não encontrado no Asaas ou inválido, buscando por email/cpf...`
        );
      }
    }

    try {
      // 2. Tenta buscar por CPF/CNPJ ou Email existente
      if (cleanCpfCnpj) {
        const searchRes = await client.get("/customers", {
          params: { cpfCnpj: cleanCpfCnpj },
        });
        if (searchRes.data?.data && searchRes.data.data.length > 0) {
          return searchRes.data.data[0];
        }
      }

      if (payload.email) {
        const searchRes = await client.get("/customers", {
          params: { email: payload.email.trim() },
        });
        if (searchRes.data?.data && searchRes.data.data.length > 0) {
          return searchRes.data.data[0];
        }
      }

      // 3. Se não encontrou, cria novo cliente
      const createRes = await client.post("/customers", {
        name: payload.name || "Cliente ViraPropo AI!",
        email: payload.email || undefined,
        cpfCnpj: cleanCpfCnpj,
        phone: payload.phone || undefined,
        mobilePhone: payload.mobilePhone || undefined,
        externalReference: payload.externalReference || undefined,
        notificationDisabled: payload.notificationDisabled ?? true,
      });

      if (createRes.data) {
        return createRes.data;
      }
    } catch (error: any) {
      const errMsg = extrairErroAsaas(error);
      console.error("Erro Asaas API ao buscar/criar cliente:", errMsg);
      throw new Error(`Asaas [Cliente]: ${errMsg}`);
    }
  }

  // Fallback Mock / Offline Mode
  const mockCustomerId = `cus_${Math.random().toString(36).substring(2, 10)}`;
  return {
    id: mockCustomerId,
    name: payload.name || "Cliente ViraPropo AI!",
    email: payload.email || null,
    cpfCnpj: cleanCpfCnpj,
    externalReference: payload.externalReference || null,
    notificationDisabled: true,
  };
}

/**
 * Cria uma assinatura recorrente no Asaas (POST /v3/subscriptions)
 */
export async function criarAssinaturaAsaas(
  payload: CreateAsaasSubscriptionPayload
): Promise<AsaasSubscription> {
  const apiKey = getAsaasApiKey();
  const client = getAsaasClient();

  const isRealApiKey =
    apiKey && !apiKey.startsWith("mock_") && !apiKey.startsWith("test_mock");

  if (isRealApiKey) {
    try {
      const response = await client.post("/subscriptions", {
        customer: payload.customer,
        billingType: payload.billingType,
        cycle: payload.cycle,
        value: payload.value,
        nextDueDate: payload.nextDueDate,
        description: payload.description || "Assinatura ViraPropo AI! Pro (Mensal)",
        externalReference: payload.externalReference || undefined,
        maxPayments: payload.maxPayments || 24,
      });

      if (response.data) {
        return response.data;
      }
    } catch (error: any) {
      const errMsg = extrairErroAsaas(error);
      console.error("Erro Asaas API ao criar assinatura:", errMsg);
      throw new Error(`Asaas [Assinatura]: ${errMsg}`);
    }
  }

  // Fallback Mock
  const mockSubId = `sub_${Math.random().toString(36).substring(2, 12)}`;
  return {
    id: mockSubId,
    customer: payload.customer,
    value: payload.value,
    nextDueDate: payload.nextDueDate,
    cycle: payload.cycle,
    description: payload.description || "Assinatura ViraPropo AI! Pro (Mensal)",
    billingType: payload.billingType,
    status: "ACTIVE",
    externalReference: payload.externalReference,
  };
}

/**
 * Lista as cobranças vinculadas a uma assinatura (GET /v3/subscriptions/{id}/payments)
 */
export async function obterPagamentosAssinaturaAsaas(
  subscriptionId: string
): Promise<AsaasPayment[]> {
  const apiKey = getAsaasApiKey();
  const client = getAsaasClient();

  const isRealApiKey =
    apiKey && !apiKey.startsWith("mock_") && !apiKey.startsWith("test_mock");

  if (isRealApiKey) {
    try {
      const response = await client.get(`/subscriptions/${subscriptionId}/payments`);
      if (response.data?.data) {
        return response.data.data;
      }
    } catch (error: any) {
      const errMsg = extrairErroAsaas(error);
      console.error("Erro Asaas API ao listar pagamentos da assinatura:", errMsg);
      throw new Error(`Asaas [Pagamentos]: ${errMsg}`);
    }
  }

  return [];
}

/**
 * Obtém o QR Code PIX (Base64 e Copia e Cola) de uma cobrança (GET /v3/payments/{id}/pixQrCode)
 */
export async function obterPixQrCodeAsaas(
  paymentId: string
): Promise<AsaasPixQrCode> {
  const apiKey = getAsaasApiKey();
  const client = getAsaasClient();

  const isRealApiKey =
    apiKey && !apiKey.startsWith("mock_") && !apiKey.startsWith("test_mock");

  if (isRealApiKey) {
    try {
      const response = await client.get(`/payments/${paymentId}/pixQrCode`);
      if (response.data?.encodedImage && response.data?.payload) {
        return {
          encodedImage: response.data.encodedImage,
          payload: response.data.payload,
          expirationDate: response.data.expirationDate,
        };
      }
    } catch (error: any) {
      const errMsg = extrairErroAsaas(error);
      console.error("Erro Asaas API ao obter PIX QR Code:", errMsg);
      throw new Error(`Asaas [PIX QR Code]: ${errMsg}`);
    }
  }

  // Mock SVG de fallback para desenvolvimento / offline
  const samplePixPayload = `00020126580014BR.GOV.BCB.PIX0136d2b4e5f6-7890-abcd-ef12-${paymentId.substring(0, 12)}520400005303986540545.905802BR5915VIRAPROPO AI PRO6009SAO PAULO62070503***6304`;
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
      <rect x="85" y="85" width="30" height="30" fill="#2563eb" rx="6"/>
      <circle cx="100" cy="100" r="8" fill="#ffffff"/>
      <rect x="80" y="25" width="10" height="10" fill="#0f172a"/>
      <rect x="100" y="35" width="10" height="10" fill="#0f172a"/>
      <rect x="85" y="55" width="10" height="10" fill="#0f172a"/>
      <rect x="135" y="85" width="10" height="10" fill="#0f172a"/>
      <rect x="155" y="105" width="10" height="10" fill="#0f172a"/>
      <rect x="85" y="135" width="10" height="10" fill="#0f172a"/>
      <rect x="105" y="155" width="10" height="10" fill="#0f172a"/>
      <rect x="135" y="135" width="10" height="10" fill="#0f172a"/>
    </svg>
  `.trim();

  return {
    encodedImage: `data:image/svg+xml;base64,${Buffer.from(qrSvg).toString("base64")}`,
    payload: samplePixPayload,
    expirationDate: new Date(Date.now() + 3600 * 1000).toISOString(),
  };
}

/**
 * Consulta o status de uma cobrança no Asaas (GET /v3/payments/{id})
 */
export async function obterStatusCobrancaAsaas(paymentId: string): Promise<{
  id: string;
  status: string;
  invoiceUrl?: string;
  devMode?: boolean;
}> {
  const apiKey = getAsaasApiKey();
  const client = getAsaasClient();

  if (apiKey && !apiKey.startsWith("mock_") && !apiKey.startsWith("test_mock")) {
    try {
      const response = await client.get(`/payments/${paymentId}`);
      if (response.data) {
        return {
          id: response.data.id,
          status: response.data.status,
          invoiceUrl: response.data.invoiceUrl,
          devMode: false,
        };
      }
    } catch (error: any) {
      // Fallback para devStore se falhar
    }
  }

  const stored = devStore.get(paymentId);
  return {
    id: paymentId,
    status: stored?.status || "PENDING",
    invoiceUrl: stored?.invoiceUrl || `https://sandbox.asaas.com/i/${paymentId}`,
    devMode: true,
  };
}

/**
 * Simula pagamento no sandbox / dev mode
 */
export function simularPagamentoDevAsaas(paymentId: string): boolean {
  devStore.set(paymentId, {
    status: "CONFIRMED",
    invoiceUrl: `https://sandbox.asaas.com/i/${paymentId}`,
    updatedAt: new Date(),
  });
  return true;
}

/**
 * Validação do token de autenticação de webhook do Asaas (Header: asaas-access-token)
 */
export function validarWebhookTokenAsaas(receivedToken: string): boolean {
  if (!receivedToken) return false;

  const expectedSecret =
    process.env.ASAAS_WEBHOOK_SECRET ||
    process.env.ASAAS_ACCESS_TOKEN ||
    process.env.WEBHOOK_SECRET ||
    "";

  if (!expectedSecret) {
    // Se não há secret configurado em ambiente dev, permite
    return process.env.NODE_ENV === "development";
  }

  return receivedToken.trim() === expectedSecret.trim();
}
