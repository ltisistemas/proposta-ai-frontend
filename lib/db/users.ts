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
  abacate_customer_id?: string | null;
  abacate_subscription_id?: string | null;
  criado_em: Date;
  atualizado_em: Date;
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
    `SELECT id, email, nome, empresa_nome, empresa_cnpj, empresa_email, empresa_telefone, empresa_logo_url, tema, idioma, notificacoes_email, plano, propostas_mes_atual, abacate_customer_id, abacate_subscription_id, criado_em, atualizado_em 
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
     SET plano = $1::varchar, abacate_subscription_id = $2, data_assinatura = CASE WHEN $1::varchar = 'pro' THEN CURRENT_TIMESTAMP ELSE data_assinatura END, atualizado_em = CURRENT_TIMESTAMP
     WHERE abacate_customer_id = $3
     RETURNING id, email, plano`,
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
