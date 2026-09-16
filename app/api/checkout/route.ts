import { NextRequest, NextResponse } from "next/server";
import { obterTokenDoHeader, obterUserIdDoToken } from "@/lib/auth/jwt";
import {
  obterUserPorId,
  atualizarUserAsaasCustomerId,
  garantirColunaVerificacaoAssinatura,
} from "@/lib/db/users";
import {
  criarOuBuscarClienteAsaas,
  criarAssinaturaAsaas,
  obterPagamentosAssinaturaAsaas,
  obterPixQrCodeAsaas,
  getAsaasBaseUrl,
} from "@/lib/asaas/client";
import { query } from "@/lib/db/client";

export async function POST(request: NextRequest) {
  try {
    const token = obterTokenDoHeader(request.headers.get("Authorization"));
    if (!token) {
      return NextResponse.json({ erro: "Não autenticado" }, { status: 401 });
    }

    const userId = obterUserIdDoToken(token);
    if (!userId) {
      return NextResponse.json({ erro: "Token inválido" }, { status: 401 });
    }

    const usuario = await obterUserPorId(userId);
    if (!usuario) {
      return NextResponse.json(
        { erro: "Usuário não encontrado" },
        { status: 404 }
      );
    }

    await garantirColunaVerificacaoAssinatura();

    // 1. Obtém, valida ou cria cliente no Asaas
    const clienteAsaas = await criarOuBuscarClienteAsaas({
      name: usuario.nome || "Assinante ViraPropo AI!",
      email: usuario.email,
      cpfCnpj: usuario.empresa_cnpj || undefined,
      phone: usuario.empresa_telefone || undefined,
      externalReference: usuario.id,
      notificationDisabled: true,
      existingCustomerId: usuario.asaas_customer_id,
    });

    const asaasCustomerId = clienteAsaas.id;
    if (usuario.asaas_customer_id !== asaasCustomerId) {
      try {
        await atualizarUserAsaasCustomerId(usuario.id, asaasCustomerId);
      } catch (err) {
        console.warn("Aviso ao salvar asaas_customer_id:", err);
      }
    }

    // 2. Lê parâmetro de ciclo (mensal vs anual)
    let ciclo: "mensal" | "anual" = "mensal";
    try {
      const body = await request.json();
      if (body?.ciclo === "anual" || body?.ciclo === "YEARLY") {
        ciclo = "anual";
      }
    } catch {
      // Body vazio ou não JSON, assume mensal
    }

    const isAnual = ciclo === "anual";
    const valorPlano = isAnual ? 397.0 : 45.9;
    const cicloAsaas = isAnual ? "YEARLY" : "MONTHLY";
    const descricaoPlano = isAnual
      ? "Assinatura ViraPropo AI! Pro (Anual - 28% OFF)"
      : "Assinatura ViraPropo AI! Pro (Mensal)";

    // Atualiza preferência de ciclo no usuário
    try {
      await query("UPDATE users SET ciclo_plano = $1 WHERE id = $2", [ciclo, userId]);
    } catch (err) {
      console.warn("Aviso ao atualizar ciclo_plano:", err);
    }

    // 3. Cria Assinatura no Asaas
    const hojeStr = new Date().toISOString().split("T")[0];
    const subscription = await criarAssinaturaAsaas({
      customer: asaasCustomerId,
      billingType: "PIX",
      cycle: cicloAsaas as any,
      value: valorPlano,
      nextDueDate: hojeStr,
      description: descricaoPlano,
      externalReference: usuario.id,
      maxPayments: isAnual ? 5 : 24,
    });

    // 4. Recupera a cobrança gerada para a assinatura no Asaas (com retry com backoff)
    let paymentId = "";
    let invoiceUrl = "";
    let payments = await obterPagamentosAssinaturaAsaas(subscription.id);
    
    if ((!payments || payments.length === 0) && subscription.id.startsWith("sub_")) {
      const delays = [500, 1000, 1500, 2000, 2500];
      for (const delay of delays) {
        await new Promise((res) => setTimeout(res, delay));
        payments = await obterPagamentosAssinaturaAsaas(subscription.id);
        if (payments && payments.length > 0) break;
      }
    }

    if (payments && payments.length > 0) {
      paymentId = payments[0].id;
      invoiceUrl = payments[0].invoiceUrl || payments[0].bankSlipUrl || "";
    } else {
      paymentId = subscription.id;
    }

    // 5. Obtém o QR Code PIX (Base64 + Copia e Cola)
    const pixQr = await obterPixQrCodeAsaas(paymentId);

    // 6. Salva ou atualiza registro de pagamento pendente
    try {
      await query(
        `INSERT INTO pagamentos (usuario_id, asaas_payment_id, asaas_subscription_id, invoice_url, abacate_transaction_id, valor, status, tipo)
         VALUES ($1, $2, $3, $4, $5, $6, 'pendente', $7)
         ON CONFLICT (id) DO NOTHING`,
        [
          userId,
          paymentId,
          subscription.id,
          invoiceUrl,
          paymentId,
          valorPlano,
          isAnual ? "assinatura_pro_anual" : "assinatura_pro",
        ]
      );
    } catch (dbErr) {
      console.warn("Aviso ao salvar pagamento no banco:", dbErr);
    }

    const brCodeBase64Formatted = pixQr.encodedImage
      ? pixQr.encodedImage.startsWith("data:")
        ? pixQr.encodedImage
        : `data:image/png;base64,${pixQr.encodedImage}`
      : "";

    return NextResponse.json({
      sucesso: true,
      chargeId: paymentId,
      subscriptionId: subscription.id,
      ciclo,
      amount: valorPlano,
      amountCents: Math.round(valorPlano * 100),
      brCode: pixQr.payload,
      brCodeBase64: brCodeBase64Formatted,
      invoiceUrl: invoiceUrl || undefined,
      expiresAt: pixQr.expirationDate,
      status: "PENDING",
      devMode: false,
    });
  } catch (error: any) {
    console.error("Erro em /api/checkout:", error);
    return NextResponse.json(
      { erro: error.message || "Erro ao gerar cobrança de assinatura via Asaas" },
      { status: 500 }
    );
  }
}
