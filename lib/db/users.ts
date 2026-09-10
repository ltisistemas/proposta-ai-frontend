import { query } from "./client";
import bcrypt from "bcryptjs";

export interface UserRow {
  id: string;
  email: string;
  password_hash: string;
  nome: string;
  empresa_nome?: string | null;
  empresa_cnpj?: string | null;
  empresa_email?: string | null;
  empresa_telefone?: string | null;
  empresa_logo_url?: string | null;
  tema?: string;
  idioma?: string;
  notificacoes_email?: boolean;
  plano: "free" | "pro";
  propostas_mes_atual?: number;
  data_assinatura?: Date | null;
  data_proxima_cobranca?: Date | null;
  data_ultima_verificacao_pagamento?: Date | string | null;
  abacate_customer_id?: string | null;
  abacate_subscription_id?: string | null;
  criado_em: Date;
  atualizado_em: Date;
}

let isAssinaturaColInitialized = false;

export function _resetAssinaturaColInitialized(): void {
  isAssinaturaColInitialized = false;
}

export async function garantirColunaVerificacaoAssinatura(): Promise<void> {
  if (isAssinaturaColInitialized) return;
  try {
    await query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS data_proxima_cobranca TIMESTAMP;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS data_ultima_verificacao_pagamento DATE;
    `);
    isAssinaturaColInitialized = true;
  } catch (err) {
    console.warn("Aviso ao inicializar colunas de verificacao de assinatura:", err);
  }
}

export interface ResultadoValidacaoAssinatura {
  user: Omit<UserRow, "password_hash"> | UserRow;
  emPeriodoGraca: boolean;
  diasRestantesGraca: number;
  diasAtraso: number;
  statusAssinatura: "free" | "ativa" | "periodo_graca" | "expirada_downgrade";
}

export async function validarAssinaturaUsuario(
  user: UserRow | Omit<UserRow, "password_hash">
): Promise<ResultadoValidacaoAssinatura> {
  if (!user || user.plano !== "pro") {
    return {
      user,
      emPeriodoGraca: false,
      diasRestantesGraca: 0,
      diasAtraso: 0,
      statusAssinatura: "free",
    };
  }

  await garantirColunaVerificacaoAssinatura();

  // If proxima cobranca is not set, default to active
  if (!user.data_proxima_cobranca) {
    return {
      user,
      emPeriodoGraca: false,
      diasRestantesGraca: 0,
      diasAtraso: 0,
      statusAssinatura: "ativa",
    };
  }

  const hoje = new Date();
  const hojeStr = hoje.toISOString().split("T")[0];

  // Daily rate limit: check at most once per calendar day
  if (user.data_ultima_verificacao_pagamento) {
    const ultimaStr =
      typeof user.data_ultima_verificacao_pagamento === "string"
        ? user.data_ultima_verificacao_pagamento.split("T")[0]
        : new Date(user.data_ultima_verificacao_pagamento).toISOString().split("T")[0];

    if (ultimaStr === hojeStr) {
      // Already checked today - compute grace status in-memory without extra DB queries
      const vencimento = new Date(user.data_proxima_cobranca);
      const diffMs = hoje.getTime() - vencimento.getTime();
      const diasAtraso = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diasAtraso <= 0) {
        return { user, emPeriodoGraca: false, diasRestantesGraca: 0, diasAtraso: 0, statusAssinatura: "ativa" };
      }
      if (diasAtraso <= 3) {
        return {
          user,
          emPeriodoGraca: true,
          diasRestantesGraca: 4 - diasAtraso,
          diasAtraso,
          statusAssinatura: "periodo_graca",
        };
      }
    }
  }

  const vencimento = new Date(user.data_proxima_cobranca);
  const diffMs = hoje.getTime() - vencimento.getTime();
  const diasAtraso = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  // Case 1: Active and not overdue
  if (diasAtraso <= 0) {
    await query(
      "UPDATE users SET data_ultima_verificacao_pagamento = CURRENT_DATE WHERE id = $1",
      [user.id]
    );
    return {
      user: { ...user, data_ultima_verificacao_pagamento: hojeStr },
      emPeriodoGraca: false,
      diasRestantesGraca: 0,
      diasAtraso: 0,
      statusAssinatura: "ativa",
    };
  }

  // Case 2: In 3-day grace period (tolerance days 1, 2, 3)
  if (diasAtraso <= 3) {
    await query(
      "UPDATE users SET data_ultima_verificacao_pagamento = CURRENT_DATE WHERE id = $1",
      [user.id]
    );
    return {
      user: { ...user, data_ultima_verificacao_pagamento: hojeStr },
      emPeriodoGraca: true,
      diasRestantesGraca: 4 - diasAtraso,
      diasAtraso,
      statusAssinatura: "periodo_graca",
    };
  }

  // Case 3: Day 4+ overdue -> Grace period expired, automatic downgrade to Free
  await query(
    `UPDATE users 
     SET plano = 'free', 
         data_ultima_verificacao_pagamento = CURRENT_DATE, 
         atualizado_em = CURRENT_TIMESTAMP 
     WHERE id = $1`,
    [user.id]
  );

  const userDowngraded = {
    ...user,
    plano: "free" as const,
    data_ultima_verificacao_pagamento: hojeStr,
  };

  return {
    user: userDowngraded,
    emPeriodoGraca: false,
    diasRestantesGraca: 0,
    diasAtraso,
    statusAssinatura: "expirada_downgrade",
  };
}

export async function criarUser(dados: {
  email: string;
  password: string;
  nome: string;
  empresaNome?: string;
  empresaCnpj?: string;
}): Promise<Omit<UserRow, "password_hash">> {
  const senhaHash = await bcrypt.hash(dados.password, 10);

  const result = await query(
    `INSERT INTO users (email, password_hash, nome, empresa_nome, empresa_cnpj, plano, propostas_mes_atual, criado_em)
     VALUES ($1, $2, $3, $4, $5, 'free', 0, CURRENT_TIMESTAMP)
     RETURNING id, email, nome, empresa_nome, empresa_cnpj, empresa_email, empresa_telefone, empresa_logo_url, tema, idioma, notificacoes_email, plano, propostas_mes_atual, criado_em, atualizado_em`,
    [
      dados.email.toLowerCase().trim(),
      senhaHash,
      dados.nome.trim(),
      dados.empresaNome || null,
      dados.empresaCnpj || null,
    ]
  );

  return result.rows[0];
}

export async function obterUserPorEmail(email: string): Promise<UserRow | null> {
  const result = await query<UserRow>(
    "SELECT * FROM users WHERE LOWER(email) = LOWER($1) AND deletado_em IS NULL",
    [email.trim()]
  );
  return result.rows[0] || null;
}

export async function obterUserPorId(
  id: string
): Promise<Omit<UserRow, "password_hash"> | null> {
  const result = await query(
    `SELECT id, email, nome, empresa_nome, empresa_cnpj, empresa_email, empresa_telefone, empresa_logo_url, tema, idioma, notificacoes_email, plano, propostas_mes_atual, data_assinatura, data_proxima_cobranca, data_ultima_verificacao_pagamento, abacate_customer_id, abacate_subscription_id, criado_em, atualizado_em 
     FROM users WHERE id = $1 AND deletado_em IS NULL`,
    [id]
  );
  return result.rows[0] || null;
}

export async function obterUserPorAbacateId(
  abacateCustomerId: string
): Promise<UserRow | null> {
  const result = await query<UserRow>(
    "SELECT * FROM users WHERE abacate_customer_id = $1 AND deletado_em IS NULL",
    [abacateCustomerId]
  );
  return result.rows[0] || null;
}

export async function atualizarUserPlano(
  abacateCustomerId: string,
  plano: "free" | "pro",
  subscriptionId: string | null
) {
  const result = await query(
    `UPDATE users 
     SET plano = $1::varchar, 
         abacate_subscription_id = $2, 
         data_assinatura = CASE WHEN $1::varchar = 'pro' THEN CURRENT_TIMESTAMP ELSE data_assinatura END,
         data_proxima_cobranca = CASE WHEN $1::varchar = 'pro' THEN CURRENT_TIMESTAMP + INTERVAL '30 days' ELSE data_proxima_cobranca END,
         atualizado_em = CURRENT_TIMESTAMP
     WHERE abacate_customer_id = $3
     RETURNING id, email, plano, data_assinatura, data_proxima_cobranca`,
    [plano, subscriptionId, abacateCustomerId]
  );

  return result.rows[0];
}

export async function atualizarUserCustomerId(
  userId: string,
  abacateCustomerId: string
) {
  const result = await query(
    `UPDATE users
     SET abacate_customer_id = $1, atualizado_em = CURRENT_TIMESTAMP
     WHERE id = $2
     RETURNING id, email, abacate_customer_id`,
    [abacateCustomerId, userId]
  );
  return result.rows[0];
}

export async function atualizarUserProfile(
  id: string,
  dados: Partial<{
    nome: string;
    empresa_nome: string;
    empresa_cnpj: string;
    empresa_email: string;
    empresa_telefone: string;
    empresa_logo_url: string;
  }>
) {
  const fields: string[] = [];
  const values: any[] = [];
  let index = 1;

  Object.entries(dados).forEach(([key, value]) => {
    if (value !== undefined) {
      fields.push(`${key} = $${index}`);
      values.push(value);
      index++;
    }
  });

  if (fields.length === 0) return null;

  values.push(id);
  const result = await query(
    `UPDATE users 
     SET ${fields.join(", ")}, atualizado_em = CURRENT_TIMESTAMP
     WHERE id = $${index}
     RETURNING id, email, nome, empresa_nome, empresa_cnpj, empresa_email, empresa_telefone, empresa_logo_url, plano`,
    values
  );

  return result.rows[0];
}

export async function verificarLimiteProposta(usuarioId: string): Promise<boolean> {
  const user = await obterUserPorId(usuarioId);
  if (!user) return false;

  // Pro users have unlimited proposals
  if (user.plano === "pro") return true;

  // Free users: max 3 proposals per month (or count current month)
  const currentCount = user.propostas_mes_atual || 0;
  return currentCount < 3;
}

export async function incrementarContadorPropostas(usuarioId: string) {
  await query(
    `UPDATE users 
     SET propostas_mes_atual = COALESCE(propostas_mes_atual, 0) + 1, atualizado_em = CURRENT_TIMESTAMP
     WHERE id = $1`,
    [usuarioId]
  );
}
