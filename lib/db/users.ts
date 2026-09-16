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
  role?: "admin" | "cliente";
  suspenso?: boolean;
  pro_tipo_concessao?: "manual_vitalicio" | "manual_temporario" | "asaas" | string | null;
  ciclo_plano?: "mensal" | "anual" | string | null;
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
  utm_term?: string | null;
  utm_content?: string | null;
  propostas_mes_atual?: number;
  data_assinatura?: Date | null;
  data_proxima_cobranca?: Date | null;
  data_ultima_verificacao_pagamento?: Date | string | null;
  cancelamento_agendado?: boolean;
  abacate_customer_id?: string | null;
  abacate_subscription_id?: string | null;
  asaas_customer_id?: string | null;
  asaas_subscription_id?: string | null;
  criado_em: Date;
  atualizado_em: Date;
}

let isAssinaturaColInitialized = false;

export function _resetAssinaturaColInitialized(): void {
  isAssinaturaColInitialized = false;
}

export function _resetAdminColsInitialized(): void {
  isAssinaturaColInitialized = false;
}

export async function garantirColunaVerificacaoAssinatura(): Promise<void> {
  if (isAssinaturaColInitialized) return;
  try {
    await query(`
      DO $$ 
      BEGIN
        BEGIN ALTER TABLE users ADD COLUMN IF NOT EXISTS data_proxima_cobranca TIMESTAMP; EXCEPTION WHEN OTHERS THEN NULL; END;
        BEGIN ALTER TABLE users ADD COLUMN IF NOT EXISTS data_ultima_verificacao_pagamento DATE; EXCEPTION WHEN OTHERS THEN NULL; END;
        BEGIN ALTER TABLE users ADD COLUMN IF NOT EXISTS cancelamento_agendado BOOLEAN DEFAULT FALSE; EXCEPTION WHEN OTHERS THEN NULL; END;
        BEGIN ALTER TABLE users ADD COLUMN IF NOT EXISTS asaas_customer_id VARCHAR(255); EXCEPTION WHEN OTHERS THEN NULL; END;
        BEGIN ALTER TABLE users ADD COLUMN IF NOT EXISTS asaas_subscription_id VARCHAR(255); EXCEPTION WHEN OTHERS THEN NULL; END;
        BEGIN ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'cliente'; EXCEPTION WHEN OTHERS THEN NULL; END;
        BEGIN ALTER TABLE users ADD COLUMN IF NOT EXISTS suspenso BOOLEAN DEFAULT FALSE; EXCEPTION WHEN OTHERS THEN NULL; END;
        BEGIN ALTER TABLE users ADD COLUMN IF NOT EXISTS pro_tipo_concessao VARCHAR(50); EXCEPTION WHEN OTHERS THEN NULL; END;
        BEGIN ALTER TABLE users ADD COLUMN IF NOT EXISTS ciclo_plano VARCHAR(20) DEFAULT 'mensal'; EXCEPTION WHEN OTHERS THEN NULL; END;
        BEGIN ALTER TABLE users ADD COLUMN IF NOT EXISTS utm_source VARCHAR(255); EXCEPTION WHEN OTHERS THEN NULL; END;
        BEGIN ALTER TABLE users ADD COLUMN IF NOT EXISTS utm_medium VARCHAR(255); EXCEPTION WHEN OTHERS THEN NULL; END;
        BEGIN ALTER TABLE users ADD COLUMN IF NOT EXISTS utm_campaign VARCHAR(255); EXCEPTION WHEN OTHERS THEN NULL; END;
        BEGIN ALTER TABLE users ADD COLUMN IF NOT EXISTS utm_term VARCHAR(255); EXCEPTION WHEN OTHERS THEN NULL; END;
        BEGIN ALTER TABLE users ADD COLUMN IF NOT EXISTS utm_content VARCHAR(255); EXCEPTION WHEN OTHERS THEN NULL; END;
        BEGIN ALTER TABLE pagamentos ADD COLUMN IF NOT EXISTS asaas_payment_id VARCHAR(255); EXCEPTION WHEN OTHERS THEN NULL; END;
        BEGIN ALTER TABLE pagamentos ADD COLUMN IF NOT EXISTS asaas_subscription_id VARCHAR(255); EXCEPTION WHEN OTHERS THEN NULL; END;
        BEGIN ALTER TABLE pagamentos ADD COLUMN IF NOT EXISTS invoice_url TEXT; EXCEPTION WHEN OTHERS THEN NULL; END;
      END $$;
    `);
    isAssinaturaColInitialized = true;
  } catch (err) {
    console.warn("Aviso ao inicializar colunas de verificacao de assinatura e admin:", err);
  }
}

export async function garantirColunasAdmin(): Promise<void> {
  await garantirColunaVerificacaoAssinatura();
}

export interface ResultadoValidacaoAssinatura {
  user: Omit<UserRow, "password_hash"> | UserRow;
  emPeriodoGraca: boolean;
  diasRestantesGraca: number;
  diasAtraso: number;
  statusAssinatura: "free" | "ativa" | "periodo_graca" | "expirada_downgrade";
  cancelamentoAgendado?: boolean;
}

export async function validarAssinaturaUsuario(
  user: UserRow | Omit<UserRow, "password_hash">
): Promise<ResultadoValidacaoAssinatura> {
  await garantirColunaVerificacaoAssinatura();

  // Admin Role Exemption: Admins intrinsically hold permanent lifetime PRO
  if (user?.role === "admin") {
    return {
      user: {
        ...user,
        plano: "pro",
        pro_tipo_concessao: "manual_vitalicio",
        cancelamento_agendado: false,
      },
      emPeriodoGraca: false,
      diasRestantesGraca: 0,
      diasAtraso: 0,
      statusAssinatura: "ativa",
      cancelamentoAgendado: false,
    };
  }

  if (!user || user.plano !== "pro") {
    return {
      user,
      emPeriodoGraca: false,
      diasRestantesGraca: 0,
      diasAtraso: 0,
      statusAssinatura: "free",
      cancelamentoAgendado: false,
    };
  }

  // Lifetime PRO exemption: never downgrade
  if (user.pro_tipo_concessao === "manual_vitalicio") {
    return {
      user,
      emPeriodoGraca: false,
      diasRestantesGraca: 0,
      diasAtraso: 0,
      statusAssinatura: "ativa",
      cancelamentoAgendado: false,
    };
  }

  // If proxima cobranca is not set, default to active
  if (!user.data_proxima_cobranca) {
    return {
      user,
      emPeriodoGraca: false,
      diasRestantesGraca: 0,
      diasAtraso: 0,
      statusAssinatura: "ativa",
      cancelamentoAgendado: !!user.cancelamento_agendado,
    };
  }

  const hoje = new Date();
  const hojeStr = hoje.toISOString().split("T")[0];
  const isCancelamentoAgendado = !!user.cancelamento_agendado;

  // Daily rate limit: check at most once per calendar day
  if (user.data_ultima_verificacao_pagamento) {
    const ultimaStr =
      typeof user.data_ultima_verificacao_pagamento === "string"
        ? user.data_ultima_verificacao_pagamento.split("T")[0]
        : new Date(user.data_ultima_verificacao_pagamento).toISOString().split("T")[0];

    if (ultimaStr === hojeStr) {
      const vencimento = new Date(user.data_proxima_cobranca);
      const diffMs = hoje.getTime() - vencimento.getTime();
      const diasAtraso = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diasAtraso <= 0) {
        return {
          user,
          emPeriodoGraca: false,
          diasRestantesGraca: 0,
          diasAtraso: 0,
          statusAssinatura: "ativa",
          cancelamentoAgendado: isCancelamentoAgendado,
        };
      }

      // If cancellation was scheduled and cycle expired:
      if (isCancelamentoAgendado) {
        return {
          user: { ...user, plano: "free" as const, cancelamento_agendado: false },
          emPeriodoGraca: false,
          diasRestantesGraca: 0,
          diasAtraso,
          statusAssinatura: "expirada_downgrade",
          cancelamentoAgendado: false,
        };
      }

      if (diasAtraso <= 3) {
        return {
          user,
          emPeriodoGraca: true,
          diasRestantesGraca: 4 - diasAtraso,
          diasAtraso,
          statusAssinatura: "periodo_graca",
          cancelamentoAgendado: false,
        };
      }
    }
  }

  const vencimento = new Date(user.data_proxima_cobranca);
  const diffMs = hoje.getTime() - vencimento.getTime();
  const diasAtraso = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  // Case 1: Active and not overdue (prepaid cycle current)
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
      cancelamentoAgendado: isCancelamentoAgendado,
    };
  }

  // Case 2: Cancellation was scheduled and cycle expired -> Immediate downgrade to Free
  if (isCancelamentoAgendado) {
    await query(
      `UPDATE users 
       SET plano = 'free', 
           cancelamento_agendado = FALSE,
           data_ultima_verificacao_pagamento = CURRENT_DATE, 
           atualizado_em = CURRENT_TIMESTAMP 
       WHERE id = $1`,
      [user.id]
    );

    const userDowngraded = {
      ...user,
      plano: "free" as const,
      cancelamento_agendado: false,
      data_ultima_verificacao_pagamento: hojeStr,
    };

    return {
      user: userDowngraded,
      emPeriodoGraca: false,
      diasRestantesGraca: 0,
      diasAtraso,
      statusAssinatura: "expirada_downgrade",
      cancelamentoAgendado: false,
    };
  }

  // Case 3: In 3-day grace period (tolerance days 1, 2, 3)
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
      cancelamentoAgendado: false,
    };
  }

  // Case 4: Day 4+ overdue without renewal -> Grace period expired, automatic downgrade to Free
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
    cancelamentoAgendado: false,
  };
}

export async function criarUser(dados: {
  email: string;
  password: string;
  nome: string;
  empresaNome?: string;
  empresaCnpj?: string;
  role?: "admin" | "cliente";
  plano?: "free" | "pro";
  cicloPlano?: "mensal" | "anual" | string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmTerm?: string;
  utmContent?: string;
}): Promise<Omit<UserRow, "password_hash">> {
  const senhaHash = await bcrypt.hash(dados.password, 10);
  const userRole = dados.role || "cliente";
  const userPlano = userRole === "admin" ? "pro" : (dados.plano || "free");
  const proConcessao = userRole === "admin" ? "manual_vitalicio" : (userPlano === "pro" ? "manual_vitalicio" : null);
  const cicloPlano = dados.cicloPlano || "mensal";

  const result = await query(
    `INSERT INTO users (
      email, password_hash, nome, empresa_nome, empresa_cnpj, plano, role, 
      pro_tipo_concessao, ciclo_plano, utm_source, utm_medium, utm_campaign, utm_term, utm_content, 
      suspenso, propostas_mes_atual, criado_em
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, FALSE, 0, CURRENT_TIMESTAMP)
     RETURNING id, email, nome, empresa_nome, empresa_cnpj, empresa_email, empresa_telefone, empresa_logo_url, 
               tema, idioma, notificacoes_email, plano, role, suspenso, pro_tipo_concessao, ciclo_plano, 
               utm_source, utm_medium, utm_campaign, utm_term, utm_content, propostas_mes_atual, criado_em, atualizado_em`,
    [
      dados.email.toLowerCase().trim(),
      senhaHash,
      dados.nome.trim(),
      dados.empresaNome || null,
      dados.empresaCnpj || null,
      userPlano,
      userRole,
      proConcessao,
      cicloPlano,
      dados.utmSource || null,
      dados.utmMedium || null,
      dados.utmCampaign || null,
      dados.utmTerm || null,
      dados.utmContent || null,
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
  const result = await query<UserRow>(
    `SELECT * FROM users WHERE id = $1 AND deletado_em IS NULL`,
    [id]
  );
  if (!result || !result.rows || !result.rows[0]) return null;
  const { password_hash, ...userSemSenha } = result.rows[0];
  return userSemSenha;
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

export async function obterUserPorAsaasCustomerId(
  asaasCustomerId: string
): Promise<UserRow | null> {
  await garantirColunaVerificacaoAssinatura();
  const result = await query<UserRow>(
    "SELECT * FROM users WHERE asaas_customer_id = $1 AND deletado_em IS NULL",
    [asaasCustomerId]
  );
  return result.rows[0] || null;
}

export async function agendarCancelamentoAssinatura(
  userId: string,
  cancelar: boolean
): Promise<Omit<UserRow, "password_hash"> | null> {
  await garantirColunaVerificacaoAssinatura();
  const result = await query<UserRow>(
    `UPDATE users 
     SET cancelamento_agendado = $1, atualizado_em = CURRENT_TIMESTAMP 
     WHERE id = $2 AND deletado_em IS NULL
     RETURNING *`,
    [cancelar, userId]
  );
  if (!result || !result.rows || !result.rows[0]) return null;
  const { password_hash, ...userSemSenha } = result.rows[0];
  return userSemSenha;
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
         cancelamento_agendado = FALSE,
         data_assinatura = CASE WHEN $1::varchar = 'pro' THEN CURRENT_TIMESTAMP ELSE data_assinatura END,
         data_proxima_cobranca = CASE WHEN $1::varchar = 'pro' THEN CURRENT_TIMESTAMP + INTERVAL '30 days' ELSE data_proxima_cobranca END,
         atualizado_em = CURRENT_TIMESTAMP
     WHERE abacate_customer_id = $3 AND (role IS NULL OR role != 'admin' OR $1::varchar = 'pro')
     RETURNING id, email, plano, data_assinatura, data_proxima_cobranca, cancelamento_agendado`,
    [plano, subscriptionId, abacateCustomerId]
  );

  return result.rows[0];
}

export async function atualizarUserPlanoAsaas(
  asaasCustomerId: string,
  plano: "free" | "pro",
  subscriptionId: string | null
) {
  await garantirColunaVerificacaoAssinatura();
  const result = await query(
    `UPDATE users 
     SET plano = $1::varchar, 
         asaas_subscription_id = COALESCE($2, asaas_subscription_id), 
         cancelamento_agendado = FALSE,
         data_assinatura = CASE WHEN $1::varchar = 'pro' THEN CURRENT_TIMESTAMP ELSE data_assinatura END,
         data_proxima_cobranca = CASE WHEN $1::varchar = 'pro' THEN CURRENT_TIMESTAMP + INTERVAL '30 days' ELSE data_proxima_cobranca END,
         atualizado_em = CURRENT_TIMESTAMP
     WHERE asaas_customer_id = $3 AND (role IS NULL OR role != 'admin' OR $1::varchar = 'pro')
     RETURNING id, email, plano, data_assinatura, data_proxima_cobranca, cancelamento_agendado, asaas_customer_id, asaas_subscription_id`,
    [plano, subscriptionId, asaasCustomerId]
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

export async function atualizarUserAsaasCustomerId(
  userId: string,
  asaasCustomerId: string
) {
  await garantirColunaVerificacaoAssinatura();
  const result = await query(
    `UPDATE users
     SET asaas_customer_id = $1, atualizado_em = CURRENT_TIMESTAMP
     WHERE id = $2
     RETURNING id, email, asaas_customer_id`,
    [asaasCustomerId, userId]
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

export interface FiltrosListagemUsuariosAdmin {
  busca?: string;
  plano?: string;
  role?: string;
  status?: string; // 'ativo' | 'suspenso'
  pagina?: number;
  limite?: number;
}

export async function listarUsuariosAdmin(filtros: FiltrosListagemUsuariosAdmin = {}) {
  await garantirColunasAdmin();
  const pagina = Math.max(1, filtros.pagina || 1);
  const limite = Math.max(1, Math.min(100, filtros.limite || 20));
  const offset = (pagina - 1) * limite;

  const conditions: string[] = ["deletado_em IS NULL"];
  const values: any[] = [];
  let paramIndex = 1;

  if (filtros.busca && filtros.busca.trim()) {
    conditions.push(`(LOWER(nome) LIKE $${paramIndex} OR LOWER(email) LIKE $${paramIndex} OR LOWER(COALESCE(empresa_nome, '')) LIKE $${paramIndex})`);
    values.push(`%${filtros.busca.trim().toLowerCase()}%`);
    paramIndex++;
  }

  if (filtros.plano && (filtros.plano === "pro" || filtros.plano === "free")) {
    conditions.push(`plano = $${paramIndex}`);
    values.push(filtros.plano);
    paramIndex++;
  }

  if (filtros.role && (filtros.role === "admin" || filtros.role === "cliente")) {
    conditions.push(`role = $${paramIndex}`);
    values.push(filtros.role);
    paramIndex++;
  }

  if (filtros.status) {
    if (filtros.status === "suspenso") {
      conditions.push(`suspenso = TRUE`);
    } else if (filtros.status === "ativo") {
      conditions.push(`(suspenso IS FALSE OR suspenso IS NULL)`);
    }
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  // Query metrics
  const metricasRes = await query(`
    SELECT 
      COUNT(*) FILTER (WHERE deletado_em IS NULL) as total,
      COUNT(*) FILTER (WHERE deletado_em IS NULL AND plano = 'pro') as pro,
      COUNT(*) FILTER (WHERE deletado_em IS NULL AND (plano = 'free' OR plano IS NULL)) as free,
      COUNT(*) FILTER (WHERE deletado_em IS NULL AND suspenso = TRUE) as suspensos,
      COUNT(*) FILTER (WHERE deletado_em IS NULL AND role = 'admin') as admins
    FROM users
  `);

  const metricas = {
    total: parseInt(metricasRes.rows[0]?.total || "0", 10),
    pro: parseInt(metricasRes.rows[0]?.pro || "0", 10),
    free: parseInt(metricasRes.rows[0]?.free || "0", 10),
    suspensos: parseInt(metricasRes.rows[0]?.suspensos || "0", 10),
    admins: parseInt(metricasRes.rows[0]?.admins || "0", 10),
  };

  // Count filtered
  const countRes = await query(`SELECT COUNT(*) as total FROM users ${whereClause}`, values);
  const totalFiltrado = parseInt(countRes.rows[0]?.total || "0", 10);

  // Query users
  values.push(limite);
  const limitIndex = paramIndex++;
  values.push(offset);
  const offsetIndex = paramIndex++;

  const usersRes = await query<UserRow>(
    `SELECT id, email, nome, empresa_nome, empresa_cnpj, empresa_email, empresa_telefone, empresa_logo_url, tema, idioma, notificacoes_email, plano, role, suspenso, pro_tipo_concessao, ciclo_plano, utm_source, utm_medium, utm_campaign, utm_term, utm_content, propostas_mes_atual, data_assinatura, data_proxima_cobranca, data_ultima_verificacao_pagamento, cancelamento_agendado, criado_em, atualizado_em
     FROM users 
     ${whereClause}
     ORDER BY criado_em DESC
     LIMIT $${limitIndex} OFFSET $${offsetIndex}`,
    values
  );

  return {
    usuarios: usersRes.rows,
    total: totalFiltrado,
    pagina,
    limite,
    totalPaginas: Math.ceil(totalFiltrado / limite) || 1,
    metricas,
  };
}

export async function atualizarStatusUsuarioAdmin(userId: string, suspenso: boolean): Promise<Omit<UserRow, "password_hash"> | null> {
  await garantirColunasAdmin();
  const res = await query<UserRow>(
    `UPDATE users 
     SET suspenso = $1, atualizado_em = CURRENT_TIMESTAMP 
     WHERE id = $2 AND deletado_em IS NULL
     RETURNING id, email, nome, empresa_nome, empresa_cnpj, plano, role, suspenso, pro_tipo_concessao, data_proxima_cobranca, criado_em, atualizado_em`,
    [suspenso, userId]
  );
  return res.rows[0] || null;
}

export async function atualizarPlanoUsuarioAdmin(
  userId: string,
  tipo: "vitalicio" | "temporario" | "free",
  meses?: number
): Promise<Omit<UserRow, "password_hash"> | null> {
  await garantirColunasAdmin();
  if (tipo === "vitalicio") {
    const res = await query<UserRow>(
      `UPDATE users 
       SET plano = 'pro', 
           pro_tipo_concessao = 'manual_vitalicio', 
           data_proxima_cobranca = NULL,
           cancelamento_agendado = FALSE,
           data_assinatura = COALESCE(data_assinatura, CURRENT_TIMESTAMP),
           atualizado_em = CURRENT_TIMESTAMP
       WHERE id = $1 AND deletado_em IS NULL
       RETURNING id, email, nome, empresa_nome, empresa_cnpj, plano, role, suspenso, pro_tipo_concessao, data_proxima_cobranca, criado_em, atualizado_em`,
      [userId]
    );
    return res.rows[0] || null;
  } else if (tipo === "temporario") {
    const mesesInt = Math.max(1, meses || 1);
    const res = await query<UserRow>(
      `UPDATE users 
       SET plano = 'pro', 
           pro_tipo_concessao = 'manual_temporario', 
           data_proxima_cobranca = CURRENT_TIMESTAMP + ($2 || ' months')::INTERVAL,
           cancelamento_agendado = FALSE,
           data_assinatura = COALESCE(data_assinatura, CURRENT_TIMESTAMP),
           atualizado_em = CURRENT_TIMESTAMP
       WHERE id = $1 AND deletado_em IS NULL
       RETURNING id, email, nome, empresa_nome, empresa_cnpj, plano, role, suspenso, pro_tipo_concessao, data_proxima_cobranca, criado_em, atualizado_em`,
      [userId, `${mesesInt}`]
    );
    return res.rows[0] || null;
  } else {
    // Revert to free
    const res = await query<UserRow>(
      `UPDATE users 
       SET plano = 'free', 
           pro_tipo_concessao = NULL, 
           data_proxima_cobranca = NULL,
           cancelamento_agendado = FALSE,
           atualizado_em = CURRENT_TIMESTAMP
       WHERE id = $1 AND deletado_em IS NULL
       RETURNING id, email, nome, empresa_nome, empresa_cnpj, plano, role, suspenso, pro_tipo_concessao, data_proxima_cobranca, criado_em, atualizado_em`,
      [userId]
    );
    return res.rows[0] || null;
  }
}

export async function atualizarVencimentoUsuarioAdmin(
  userId: string,
  novaData: string | Date
): Promise<Omit<UserRow, "password_hash"> | null> {
  await garantirColunasAdmin();
  const res = await query<UserRow>(
    `UPDATE users 
     SET data_proxima_cobranca = $1, atualizado_em = CURRENT_TIMESTAMP 
     WHERE id = $2 AND deletado_em IS NULL
     RETURNING id, email, nome, empresa_nome, empresa_cnpj, plano, role, suspenso, pro_tipo_concessao, data_proxima_cobranca, criado_em, atualizado_em`,
    [new Date(novaData), userId]
  );
  return res.rows[0] || null;
}
