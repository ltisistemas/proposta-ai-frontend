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

    // 1. Obtém ou cria cliente no Asaas
    let asaasCustomerId = usuario.asaas_customer_id;
    if (!asaasCustomerId) {
      const clienteAsaas = await criarOuBuscarClienteAsaas({
        name: usuario.nome || "Assinante ViraPropo AI!",
        email: usuario.email,
        cpfCnpj: usuario.empresa_cnpj || undefined,
        phone: usuario.empresa_telefone || undefined,
        externalReference: usuario.id,
        notificationDisabled: true,
      });

      asaasCustomerId = clienteAsaas.id;
      try {
        await atualizarUserAsaasCustomerId(usuario.id, asaasCustomerId);
      } catch (err) {
        console.warn("Aviso ao salvar asaas_customer_id:", err);
      }
    }

    // 2. Cria Assinatura Mensal no Asaas (R$ 45,90)
    const hojeStr = new Date().toISOString().split("T")[0];
    const subscription = await criarAssinaturaAsaas({
      customer: asaasCustomerId,
      billingType: "PIX",
      cycle: "MONTHLY",
      value: 45.9,
      nextDueDate: hojeStr,
      description: "Assinatura ViraPropo AI! Pro (Mensal)",
      externalReference: usuario.id,
      maxPayments: 24,
    });

    // 3. Recupera a cobrança gerada para a assinatura
    let paymentId = "";
    let invoiceUrl = "";
    const payments = await obterPagamentosAssinaturaAsaas(subscription.id);
    if (payments && payments.length > 0) {
      paymentId = payments[0].id;
      invoiceUrl = payments[0].invoiceUrl || "";
    } else {
      paymentId = `pay_${subscription.id.replace(/^sub_/, "")}`;
      invoiceUrl = `https://sandbox.asaas.com/i/${paymentId}`;
    }

    // 4. Obtém o QR Code PIX (Base64 + Copia e Cola)
    const pixQr = await obterPixQrCodeAsaas(paymentId);

    // 5. Salva ou atualiza registro de pagamento pendente
    try {
      await query(
        `INSERT INTO pagamentos (usuario_id, asaas_payment_id, asaas_subscription_id, invoice_url, abacate_transaction_id, valor, status, tipo)
         VALUES ($1, $2, $3, $4, $5, 45.90, 'pendente', 'assinatura_pro')
         ON CONFLICT (id) DO NOTHING`,
        [userId, paymentId, subscription.id, invoiceUrl, paymentId]
      );
    } catch (dbErr) {
      console.warn("Aviso ao salvar pagamento no banco:", dbErr);
    }

    const brCodeBase64Formatted = pixQr.encodedImage.startsWith("data:")
      ? pixQr.encodedImage
      : `data:image/png;base64,${pixQr.encodedImage}`;

    return NextResponse.json({
      sucesso: true,
      chargeId: paymentId,
      subscriptionId: subscription.id,
      amount: 45.9,
      amountCents: 4590,
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
      { erro: "Erro ao gerar cobrança de assinatura via Asaas" },
      { status: 500 }
    );
  }
}
