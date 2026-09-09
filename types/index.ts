export type PlanoUsuario = "free" | "pro";

export interface Usuario {
  id: string;
  email: string;
  nome: string;
  empresa_nome?: string | null;
  empresa_cnpj?: string | null;
  empresa_email?: string | null;
  empresa_telefone?: string | null;
  empresa_logo_url?: string | null;
  tema?: "light" | "dark";
  idioma?: string;
  notificacoes_email?: boolean;
  plano: PlanoUsuario;
  propostas_mes_atual: number;
  data_assinatura?: string | null;
  data_proxima_cobranca?: string | null;
  abacate_customer_id?: string | null;
  abacate_subscription_id?: string | null;
  criado_em?: string;
}

export type StatusProposta = "rascunho" | "enviada" | "aceita" | "recusada";

export interface ItemProposta {
  id?: string;
  proposta_id?: string;
  descricao: string;
  quantidade: number;
  valor_unitario?: number;
  valorUnitario?: number;
  subtotal: number;
  ordem?: number;
}

export interface AssinaturaDigital {
  assinanteNome: string;
  assinanteDocumento: string;
  assinadoEm: string;
  assinaturaIp?: string;
  assinaturaHash?: string;
}

export interface Proposta {
  id: string;
  usuario_id: string;
  numero: string;
  cliente_nome: string;
  cliente_empresa?: string | null;
  cliente_email?: string | null;
  cliente_telefone?: string | null;
  descricao: string;
  conteudo_html: string;
  template_id: string;
  subtotal: number;
  desconto_valor: number;
  total: number;
  prazo_pagamento?: string | null;
  validade_dias: number;
  observacoes?: string | null;
  status: StatusProposta;
  data_envio?: string | Date | null;
  assinante_nome?: string | null;
  assinante_documento?: string | null;
  assinado_em?: string | Date | null;
  assinatura_ip?: string | null;
  assinatura_hash?: string | null;
  criado_em: string | Date;
  atualizado_em: string | Date;
  itens?: ItemProposta[];
}
