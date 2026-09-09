import { NextRequest, NextResponse } from "next/server";
import { obterPropostaPorId, assinarProposta } from "@/lib/db/propostas";
import { obterUserPorId } from "@/lib/db/users";
import crypto from "crypto";
import { z } from "zod";

const assinarSchema = z.object({
  nome: z.string().min(3, "Nome completo do signatário é obrigatório (mínimo 3 caracteres)"),
  documento: z.string().min(11, "CPF ou CNPJ válido é obrigatório"),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const validation = assinarSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          sucesso: false,
          erro: validation.error.issues[0]?.message || "Dados de assinatura inválidos",
        },
        { status: 400 }
      );
    }

    const { nome, documento } = validation.data;

    // 1. Fetch proposal
    const proposta = await obterPropostaPorId(id);
    if (!proposta) {
      return NextResponse.json(
        { sucesso: false, erro: "Proposta não encontrada" },
        { status: 404 }
      );
    }

    if (proposta.status === "aceita" && proposta.assinante_nome) {
      return NextResponse.json(
        {
          sucesso: false,
          erro: "Esta proposta já foi assinada e aceita anteriormente.",
        },
        { status: 400 }
      );
    }

    // 2. Verify creator user subscription tier
    const criador = await obterUserPorId(proposta.usuario_id);
    if (!criador || criador.plano !== "pro") {
      return NextResponse.json(
        {
          sucesso: false,
          erro: "A assinatura eletrônica é uma funcionalidade exclusiva do Plano Pro.",
          precisaUpgrade: true,
        },
        { status: 403 }
      );
    }

    // 3. Extract IP and generate audit hash linked to document integrity
    const forwarded = request.headers.get("x-forwarded-for");
    const ip = forwarded ? forwarded.split(",")[0].trim() : request.headers.get("x-real-ip") || "127.0.0.1";
    const timestamp = new Date().toISOString();
    
    const hashData = `${proposta.id}:${nome}:${documento}:${ip}:${timestamp}:${proposta.documento_hash || ""}`;
    const assinaturaHash = crypto.createHash("sha256").update(hashData).digest("hex");

    // 4. Save signature in database
    const propostaAssinada = await assinarProposta({
      propostaId: id,
      assinanteNome: nome,
      assinanteDocumento: documento,
      assinaturaIp: ip,
      assinaturaHash,
    });

    return NextResponse.json({
      sucesso: true,
      mensagem: "Proposta assinada eletronicamente e aceita com sucesso!",
      proposta: propostaAssinada,
      certificado: {
        assinanteNome: nome,
        assinanteDocumento: documento,
        assinadoEm: timestamp,
        assinaturaIp: ip,
        assinaturaHash,
        documentoHash: proposta.documento_hash,
        emissorNome: proposta.emissor_nome,
        emissorEmail: proposta.emissor_email,
        emissorAssinadoEm: proposta.emissor_assinado_em,
        emissorAssinaturaIp: proposta.emissor_assinatura_ip,
        emissorAssinaturaHash: proposta.emissor_assinatura_hash,
      },
    });
  } catch (error: any) {
    console.error("Erro ao assinar proposta:", error);
    return NextResponse.json(
      {
        sucesso: false,
        erro: "Ocorreu um erro ao processar a assinatura eletrônica.",
      },
      { status: 500 }
    );
  }
}
