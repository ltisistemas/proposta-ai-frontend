"use client";

import React from "react";

export interface SignatureManifestoProps {
  proposta: {
    id: string;
    numero: string;
    cliente_nome: string;
    criado_em: string | Date;
    documento_hash?: string | null;
    emissor_nome?: string | null;
    emissor_email?: string | null;
    emissor_documento?: string | null;
    emissor_assinado_em?: string | Date | null;
    emissor_assinatura_ip?: string | null;
    emissor_assinatura_hash?: string | null;
    status: string;
    assinante_nome?: string | null;
    assinante_documento?: string | null;
    assinado_em?: string | Date | null;
    assinatura_ip?: string | null;
    assinatura_hash?: string | null;
  };
  emissor?: {
    nome?: string;
    empresaNome?: string;
    empresaEmail?: string;
  } | null;
  baseUrl?: string;
}

export function formatarDataHoraBR(dataInput?: string | Date | null): string {
  if (!dataInput) return "-";
  try {
    const d = new Date(dataInput);
    if (isNaN(d.getTime())) return "-";
    return d.toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  } catch {
    return "-";
  }
}

export function gerarManifestoHTML(
  proposta: SignatureManifestoProps["proposta"],
  emissor?: SignatureManifestoProps["emissor"],
  baseUrl: string = ""
): string {
  const domain = baseUrl || (typeof window !== "undefined" ? window.location.origin : "https://proposta-ai.com");
  const validationUrl = `${domain}/p/${proposta.id}`;
  const dataCriacao = formatarDataHoraBR(proposta.emissor_assinado_em || proposta.criado_em);
  const dataEmissor = formatarDataHoraBR(proposta.emissor_assinado_em || proposta.criado_em);
  const dataCliente = formatarDataHoraBR(proposta.assinado_em);

  const remetenteNome = proposta.emissor_nome || emissor?.nome || emissor?.empresaNome || "Emissor Autorizado";
  const remetenteEmail = proposta.emissor_email || emissor?.empresaEmail || "";
  const remetenteDoc = proposta.emissor_documento || "Não informado";
  const remetenteIp = proposta.emissor_assinatura_ip || "127.0.0.1";
  const docHash = proposta.documento_hash || "dfe3830500f97ad3d8970e2801dc42f2a541cdb8e429838432189b621ea72ae1";

  const isClienteAssinado = proposta.status === "aceita" && !!proposta.assinante_nome;

  return `
  <div class="signature-manifesto-container" style="page-break-before: always; break-before: page; margin-top: 40px; padding: 40px 30px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #000; background: #fff; line-height: 1.5; border-top: 2px dashed #ccc;">
    <div style="text-align: center; margin-bottom: 24px;">
      <h2 style="font-size: 20px; font-weight: 800; margin: 0 0 12px 0; text-transform: uppercase; letter-spacing: 0.5px;">MANIFESTO DE ASSINATURAS</h2>
      <p style="font-size: 13px; margin: 0 0 14px 0; color: #333;">O documento acima foi proposto para assinatura eletrônica na plataforma <strong>Propex AI</strong>.</p>
      
      <p style="font-size: 13px; margin: 0 0 10px 0;">Para verificar as assinaturas clique no link: <a href="${validationUrl}" style="color: #0066cc; text-decoration: underline;" target="_blank">${validationUrl}</a></p>
      
      <div style="font-size: 14px; font-weight: 700; margin: 8px 0 4px 0;">ID: ${proposta.id.slice(0, 8)}</div>
      <div style="font-size: 13px; font-weight: 700; margin: 6px 0 2px 0;">Hash do Documento</div>
      <div style="font-family: 'Courier New', Courier, monospace; font-size: 12px; font-weight: 700; word-break: break-all; margin: 0 auto; max-width: 90%; color: #111;">
        ${docHash}
      </div>
    </div>

    <div style="margin-top: 28px;">
      <h3 style="font-size: 14px; font-weight: 800; margin: 0 0 10px 0; color: #000;">Dados do Documento:</h3>
      <div style="font-size: 13px; line-height: 1.8; color: #222;">
        <div><strong>ID:</strong> ${proposta.id.slice(0, 8)}</div>
        <div><strong>Nome Final:</strong> Proposta Comercial ${proposta.numero} - ${proposta.cliente_nome}.pdf</div>
        <div><strong>Nome Interno:</strong> ${proposta.id}.pdf</div>
        <div><strong>Data de Criação Hash:</strong> ${dataCriacao}</div>
        <div><strong>Nome do Remetente:</strong> ${remetenteNome}</div>
        <div><strong>Email do Remetente:</strong> ${remetenteEmail || "Não informado"}</div>
      </div>
    </div>

    <div style="margin-top: 28px;">
      <h3 style="font-size: 14px; font-weight: 800; margin: 0 0 10px 0; color: #000;">Assinantes:</h3>
      <div style="font-size: 12.5px; line-height: 1.9; color: #111;">
        <div style="margin-bottom: 8px;">
          ${dataEmissor} - ${remetenteNome}; CPF/CNPJ: ${remetenteDoc}; IP: ${remetenteIp} (Emissor / Criador)
        </div>
        ${
          isClienteAssinado
            ? `<div style="margin-bottom: 8px;">
                ${dataCliente} - ${proposta.assinante_nome}; CPF/CNPJ: ${proposta.assinante_documento || "Não informado"}; IP: ${proposta.assinatura_ip || "Não informado"} (Aceite Eletrônico do Cliente)
               </div>`
            : `<div style="margin-bottom: 8px; color: #666;">
                [Pendente] - ${proposta.cliente_nome}; CPF/CNPJ: Aguardando assinatura do cliente; IP: - (Aceite Eletrônico do Cliente)
               </div>`
        }
      </div>
    </div>

    <div style="margin-top: 40px; padding-top: 15px; border-top: 1px solid #e0e0e0; font-size: 11px; color: #777; text-align: center;">
      Assinaturas eletrônicas com validade jurídica conforme Medida Provisória nº 2.200-2/2001 e Lei Federal nº 14.063/2020.
    </div>
  </div>
  `;
}

export function SignatureManifesto({
  proposta,
  emissor,
  baseUrl,
}: SignatureManifestoProps) {
  const domain = baseUrl || (typeof window !== "undefined" ? window.location.origin : "https://proposta-ai.com");
  const validationUrl = `${domain}/p/${proposta.id}`;
  const dataCriacao = formatarDataHoraBR(proposta.emissor_assinado_em || proposta.criado_em);
  const dataEmissor = formatarDataHoraBR(proposta.emissor_assinado_em || proposta.criado_em);
  const dataCliente = formatarDataHoraBR(proposta.assinado_em);

  const remetenteNome = proposta.emissor_nome || emissor?.nome || emissor?.empresaNome || "Emissor Autorizado";
  const remetenteEmail = proposta.emissor_email || emissor?.empresaEmail || "";
  const remetenteDoc = proposta.emissor_documento || "Não informado";
  const remetenteIp = proposta.emissor_assinatura_ip || "127.0.0.1";
  const docHash = proposta.documento_hash || "dfe3830500f97ad3d8970e2801dc42f2a541cdb8e429838432189b621ea72ae1";

  const isClienteAssinado = proposta.status === "aceita" && !!proposta.assinante_nome;

  return (
    <section
      aria-label="Manifesto de Assinaturas"
      className="signature-manifesto hidden print:block bg-white text-black p-8 sm:p-12 border-t-2 border-dashed border-slate-300 font-sans"
      style={{
        pageBreakBefore: "always",
        breakBefore: "page",
      }}
    >
      {/* Centered header & hash */}
      <div className="text-center space-y-3 mb-8">
        <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-black">
          MANIFESTO DE ASSINATURAS
        </h2>
        <p className="text-xs sm:text-sm text-slate-800">
          O documento acima foi proposto para assinatura eletrônica na plataforma <strong>Propex AI</strong>.
        </p>

        <p className="text-xs sm:text-sm text-slate-800">
          Para verificar as assinaturas clique no link:{" "}
          <a
            href={validationUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-700 underline font-medium"
          >
            {validationUrl}
          </a>
        </p>

        <div className="pt-2">
          <div className="text-sm font-bold text-black">ID: {proposta.id.slice(0, 8)}</div>
          <div className="text-xs sm:text-sm font-bold text-black mt-1">Hash do Documento</div>
          <div className="font-mono text-xs font-bold text-black max-w-xl mx-auto break-all mt-0.5">
            {docHash}
          </div>
        </div>
      </div>

      {/* Document details section */}
      <div className="mb-8">
        <h3 className="text-sm font-extrabold uppercase tracking-wide text-black mb-2">
          Dados do Documento:
        </h3>
        <div className="text-xs sm:text-sm text-slate-900 space-y-1 leading-relaxed">
          <div><strong className="font-bold">ID:</strong> {proposta.id.slice(0, 8)}</div>
          <div><strong className="font-bold">Nome Final:</strong> Proposta Comercial {proposta.numero} - {proposta.cliente_nome}.pdf</div>
          <div><strong className="font-bold">Nome Interno:</strong> {proposta.id}.pdf</div>
          <div><strong className="font-bold">Data de Criação Hash:</strong> {dataCriacao}</div>
          <div><strong className="font-bold">Nome do Remetente:</strong> {remetenteNome}</div>
          <div><strong className="font-bold">Email do Remetente:</strong> {remetenteEmail || "Não informado"}</div>
        </div>
      </div>

      {/* Signers list section */}
      <div className="mb-8">
        <h3 className="text-sm font-extrabold uppercase tracking-wide text-black mb-2">
          Assinantes:
        </h3>
        <div className="text-xs sm:text-sm text-slate-900 space-y-2 leading-relaxed">
          <div>
            {dataEmissor} - {remetenteNome}; CPF/CNPJ: {remetenteDoc}; IP: {remetenteIp} (Emissor / Criador)
          </div>
          {isClienteAssinado ? (
            <div>
              {dataCliente} - {proposta.assinante_nome}; CPF/CNPJ: {proposta.assinante_documento || "Não informado"}; IP: {proposta.assinatura_ip || "Não informado"} (Aceite Eletrônico do Cliente)
            </div>
          ) : (
            <div className="text-slate-500">
              [Pendente] - {proposta.cliente_nome}; CPF/CNPJ: Aguardando assinatura do cliente; IP: - (Aceite Eletrônico do Cliente)
            </div>
          )}
        </div>
      </div>

      {/* Legal Footer */}
      <div className="pt-6 border-t border-slate-200 text-center text-[11px] text-slate-500">
        Assinaturas eletrônicas com validade jurídica conforme Medida Provisória nº 2.200-2/2001 e Lei Federal nº 14.063/2020.
      </div>
    </section>
  );
}
