-- Proposta AI: Database Schema Initialization

-- Enable pgcrypto / uuid-ossp for gen_random_uuid if not already enabled
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Users Table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  nome VARCHAR(255) NOT NULL,
  empresa_nome VARCHAR(255),
  empresa_cnpj VARCHAR(18),
  empresa_email VARCHAR(255),
  empresa_telefone VARCHAR(20),
  empresa_logo_url TEXT,
  tema VARCHAR(10) DEFAULT 'light',
  idioma VARCHAR(5) DEFAULT 'pt-BR',
  notificacoes_email BOOLEAN DEFAULT TRUE,
  plano VARCHAR(50) DEFAULT 'free',
  propostas_mes_atual INT DEFAULT 0,
  data_assinatura TIMESTAMP,
  data_proxima_cobranca TIMESTAMP,
  abacate_customer_id VARCHAR(255),
  abacate_subscription_id VARCHAR(255),
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deletado_em TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_plano ON users(plano);

-- Propostas Table
CREATE TABLE IF NOT EXISTS propostas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  numero VARCHAR(50) UNIQUE NOT NULL,
  cliente_nome VARCHAR(255) NOT NULL,
  cliente_empresa VARCHAR(255),
  cliente_email VARCHAR(255),
  cliente_telefone VARCHAR(20),
  descricao TEXT NOT NULL,
  conteudo_html TEXT NOT NULL,
  template_id VARCHAR(50) DEFAULT 'template-1',
  subtotal DECIMAL(12, 2) NOT NULL,
  desconto_valor DECIMAL(12, 2) DEFAULT 0,
  total DECIMAL(12, 2) NOT NULL,
  prazo_pagamento VARCHAR(50),
  validade_dias INT DEFAULT 30,
  observacoes TEXT,
  status VARCHAR(50) DEFAULT 'rascunho',
  data_envio TIMESTAMP,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deletado_em TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_propostas_usuario ON propostas(usuario_id);
CREATE INDEX IF NOT EXISTS idx_propostas_status ON propostas(status);

-- Itens Proposta Table
CREATE TABLE IF NOT EXISTS itens_proposta (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposta_id UUID NOT NULL REFERENCES propostas(id) ON DELETE CASCADE,
  descricao VARCHAR(255) NOT NULL,
  quantidade INT NOT NULL DEFAULT 1,
  valor_unitario DECIMAL(12, 2) NOT NULL,
  subtotal DECIMAL(12, 2) NOT NULL,
  ordem INT DEFAULT 0,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_itens_proposta ON itens_proposta(proposta_id);

-- Emails Log Table
CREATE TABLE IF NOT EXISTS emails_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID REFERENCES users(id),
  proposta_id UUID REFERENCES propostas(id),
  email_para VARCHAR(255) NOT NULL,
  assunto VARCHAR(255),
  tipo VARCHAR(50),
  status VARCHAR(50) DEFAULT 'pendente',
  erro_mensagem TEXT,
  enviado_em TIMESTAMP,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Pagamentos Table
CREATE TABLE IF NOT EXISTS pagamentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  abacate_transaction_id VARCHAR(255),
  valor DECIMAL(12, 2) NOT NULL,
  status VARCHAR(50) DEFAULT 'pendente',
  tipo VARCHAR(50),
  data_vencimento TIMESTAMP,
  pago_em TIMESTAMP,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_pagamentos_usuario ON pagamentos(usuario_id);
