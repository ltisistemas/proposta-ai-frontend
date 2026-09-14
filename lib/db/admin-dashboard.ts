import { query } from "./client";
import { garantirColunasAdmin } from "./users";

export interface MetricasAdminDashboard {
  financeiro: {
    totalHoje: number;
    totalMes: number;
    totalHistorico: number;
    mrrEstimado: number;
    transacoesHojeCount: number;
    transacoesMesCount: number;
    ticketMedio: number;
  };
  usuarios: {
    total: number;
    ativos: number;
    suspensos: number;
    pro: number;
    proAsaas: number;
    proCortesia: number;
    free: number;
    admins: number;
    novosHoje: number;
    novosMes: number;
    taxaConversaoPro: number;
  };
  plataforma: {
    totalPropostas: number;
    propostasAceitas: number;
    volumeTotalPipeline: number;
    volumeTotalFechado: number;
    taxaConversaoGlobal: number;
  };
  ultimosPagamentos: Array<{
    id: string;
    usuarioId: string;
    usuarioNome: string;
    usuarioEmail: string;
    usuarioPlano: string;
    valor: number;
    status: string;
    tipo?: string | null;
    invoiceUrl?: string | null;
    pagoEm?: Date | string | null;
    criadoEm: Date | string;
  }>;
  ultimosUsuarios: Array<{
    id: string;
    nome: string;
    email: string;
    empresaNome?: string | null;
    plano: string;
    role: string;
    suspenso: boolean;
    proTipoConcessao?: string | null;
    dataProximaCobranca?: Date | string | null;
    criadoEm: Date | string;
  }>;
}

export async function obterMetricasAdminDashboard(): Promise<MetricasAdminDashboard> {
  await garantirColunasAdmin();

  // 1. Métricas de Usuários
  const usuariosStatsRes = await query(`
    SELECT 
      COUNT(*) FILTER (WHERE deletado_em IS NULL) as total,
      COUNT(*) FILTER (WHERE deletado_em IS NULL AND (suspenso IS FALSE OR suspenso IS NULL)) as ativos,
      COUNT(*) FILTER (WHERE deletado_em IS NULL AND suspenso = TRUE) as suspensos,
      COUNT(*) FILTER (WHERE deletado_em IS NULL AND plano = 'pro') as pro,
      COUNT(*) FILTER (WHERE deletado_em IS NULL AND plano = 'pro' AND (asaas_subscription_id IS NOT NULL OR abacate_subscription_id IS NOT NULL)) as pro_assinantes,
      COUNT(*) FILTER (WHERE deletado_em IS NULL AND plano = 'pro' AND (pro_tipo_concessao = 'manual_vitalicio' OR pro_tipo_concessao = 'manual_temporario' OR role = 'admin')) as pro_cortesia,
      COUNT(*) FILTER (WHERE deletado_em IS NULL AND (plano = 'free' OR plano IS NULL)) as free,
      COUNT(*) FILTER (WHERE deletado_em IS NULL AND role = 'admin') as admins,
      COUNT(*) FILTER (WHERE deletado_em IS NULL AND criado_em >= CURRENT_DATE) as novos_hoje,
      COUNT(*) FILTER (WHERE deletado_em IS NULL AND DATE_TRUNC('month', criado_em) = DATE_TRUNC('month', CURRENT_DATE)) as novos_mes
    FROM users
  `);

  const uStats = usuariosStatsRes.rows[0] || {};
  const totalUsuarios = parseInt(uStats.total || "0", 10);
  const usuariosPro = parseInt(uStats.pro || "0", 10);
  const taxaConversaoPro = totalUsuarios > 0 ? parseFloat(((usuariosPro / totalUsuarios) * 100).toFixed(1)) : 0;

  // 2. Métricas Financeiras (Tabela pagamentos com status = 'pago')
  const financeiroStatsRes = await query(`
    SELECT 
      COALESCE(SUM(CASE WHEN (pago_em >= CURRENT_DATE OR (pago_em IS NULL AND criado_em >= CURRENT_DATE)) THEN valor ELSE 0 END), 0) as total_hoje,
      COALESCE(SUM(CASE WHEN DATE_TRUNC('month', COALESCE(pago_em, criado_em)) = DATE_TRUNC('month', CURRENT_DATE) THEN valor ELSE 0 END), 0) as total_mes,
      COALESCE(SUM(valor), 0) as total_historico,
      COUNT(CASE WHEN (pago_em >= CURRENT_DATE OR (pago_em IS NULL AND criado_em >= CURRENT_DATE)) THEN 1 END) as transacoes_hoje,
      COUNT(CASE WHEN DATE_TRUNC('month', COALESCE(pago_em, criado_em)) = DATE_TRUNC('month', CURRENT_DATE) THEN 1 END) as transacoes_mes,
      COALESCE(AVG(valor), 0) as ticket_medio
    FROM pagamentos
    WHERE status = 'pago'
  `);

  const fStats = financeiroStatsRes.rows[0] || {};
  const valorProMensal = 45.90;
  // MRR estimado: Assinantes PRO ativos * valor mensal do plano
  const mrrEstimado = parseFloat((usuariosPro * valorProMensal).toFixed(2));

  // 3. Métricas Globais da Plataforma (Propostas geradas por todos os usuários)
  const propostasStatsRes = await query(`
    SELECT 
      COUNT(*) as total_propostas,
      COUNT(CASE WHEN status = 'aceita' THEN 1 END) as propostas_aceitas,
      COALESCE(SUM(total), 0) as volume_pipeline,
      COALESCE(SUM(CASE WHEN status = 'aceita' THEN total ELSE 0 END), 0) as volume_fechado
    FROM propostas
    WHERE deletado_em IS NULL
  `);

  const pStats = propostasStatsRes.rows[0] || {};
  const totalPropostas = parseInt(pStats.total_propostas || "0", 10);
  const propostasAceitas = parseInt(pStats.propostas_aceitas || "0", 10);
  const taxaConversaoGlobal = totalPropostas > 0 ? parseFloat(((propostasAceitas / totalPropostas) * 100).toFixed(1)) : 0;

  // 4. Últimos Pagamentos Confirmados (com dados do Usuário)
  const ultimosPagamentosRes = await query(`
    SELECT 
      p.id,
      p.usuario_id,
      COALESCE(u.nome, 'Usuário') as usuario_nome,
      COALESCE(u.email, 'email@desconhecido.com') as usuario_email,
      COALESCE(u.plano, 'free') as usuario_plano,
      p.valor,
      p.status,
      p.tipo,
      p.invoice_url,
      p.pago_em,
      p.criado_em
    FROM pagamentos p
    LEFT JOIN users u ON p.usuario_id = u.id
    ORDER BY p.criado_em DESC
    LIMIT 8
  `);

  const ultimosPagamentos = ultimosPagamentosRes.rows.map((r) => ({
    id: r.id,
    usuarioId: r.usuario_id,
    usuarioNome: r.usuario_nome,
    usuarioEmail: r.usuario_email,
    usuarioPlano: r.usuario_plano,
    valor: parseFloat(r.valor) || 0,
    status: r.status,
    tipo: r.tipo,
    invoiceUrl: r.invoice_url,
    pagoEm: r.pago_em,
    criadoEm: r.criado_em,
  }));

  // 5. Últimos Usuários Cadastrados
  const ultimosUsuariosRes = await query(`
    SELECT 
      id,
      nome,
      email,
      empresa_nome,
      plano,
      role,
      COALESCE(suspenso, FALSE) as suspenso,
      pro_tipo_concessao,
      data_proxima_cobranca,
      criado_em
    FROM users
    WHERE deletado_em IS NULL
    ORDER BY criado_em DESC
    LIMIT 8
  `);

  const ultimosUsuarios = ultimosUsuariosRes.rows.map((r) => ({
    id: r.id,
    nome: r.nome,
    email: r.email,
    empresaNome: r.empresa_nome,
    plano: r.plano || "free",
    role: r.role || "cliente",
    suspenso: !!r.suspenso,
    proTipoConcessao: r.pro_tipo_concessao,
    dataProximaCobranca: r.data_proxima_cobranca,
    criadoEm: r.criado_em,
  }));

  return {
    financeiro: {
      totalHoje: parseFloat(fStats.total_hoje) || 0,
      totalMes: parseFloat(fStats.total_mes) || 0,
      totalHistorico: parseFloat(fStats.total_historico) || 0,
      mrrEstimado,
      transacoesHojeCount: parseInt(fStats.transacoes_hoje || "0", 10),
      transacoesMesCount: parseInt(fStats.transacoes_mes || "0", 10),
      ticketMedio: parseFloat(fStats.ticket_medio) || 0,
    },
    usuarios: {
      total: totalUsuarios,
      ativos: parseInt(uStats.ativos || "0", 10),
      suspensos: parseInt(uStats.suspensos || "0", 10),
      pro: usuariosPro,
      proAsaas: parseInt(uStats.pro_assinantes || "0", 10),
      proCortesia: parseInt(uStats.pro_cortesia || "0", 10),
      free: parseInt(uStats.free || "0", 10),
      admins: parseInt(uStats.admins || "0", 10),
      novosHoje: parseInt(uStats.novos_hoje || "0", 10),
      novosMes: parseInt(uStats.novos_mes || "0", 10),
      taxaConversaoPro,
    },
    plataforma: {
      totalPropostas,
      propostasAceitas,
      volumeTotalPipeline: parseFloat(pStats.volume_pipeline) || 0,
      volumeTotalFechado: parseFloat(pStats.volume_fechado) || 0,
      taxaConversaoGlobal,
    },
    ultimosPagamentos,
    ultimosUsuarios,
  };
}
