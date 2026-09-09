import { describe, it, expect, vi, beforeEach } from "vitest";

const mockQuery = vi.fn();
const mockRelease = vi.fn();
const mockClient = {
  query: vi.fn(),
  release: mockRelease,
};
const mockConnect = vi.fn().mockResolvedValue(mockClient);

vi.mock("pg", () => {
  return {
    Pool: class {
      query = mockQuery;
      connect = mockConnect;
      on = vi.fn();
    },
  };
});

import { query, transaction, getClient } from "@/lib/db/client";
import {
  criarUser,
  obterUserPorEmail,
  obterUserPorId,
  obterUserPorAbacateId,
  atualizarUserPlano,
  atualizarUserCustomerId,
  atualizarUserProfile,
  verificarLimiteProposta,
  incrementarContadorPropostas,
} from "@/lib/db/users";
import {
  salvarProposta,
  obterPropostaPorId,
  obterPropostasPorUsuario,
  atualizarStatusProposta,
  deletarProposta,
  obterMetricasDashboard,
  assinarProposta,
} from "@/lib/db/propostas";
import {
  garantirTabelaWebhookEventos,
  verificarEventoProcessado,
  registrarEventoProcessado,
} from "@/lib/db/webhooks";

describe("lib/db/client", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should execute query via pool", async () => {
    mockQuery.mockResolvedValueOnce({ rows: [{ id: 1, name: "Test" }], rowCount: 1 });

    const result = await query("SELECT * FROM test WHERE id = $1", [1]);
    expect(mockQuery).toHaveBeenCalledWith("SELECT * FROM test WHERE id = $1", [1]);
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0].name).toBe("Test");
  });

  it("should handle transactions correctly with commit on success", async () => {
    mockClient.query.mockResolvedValueOnce({ rows: [] }); // BEGIN
    mockClient.query.mockResolvedValueOnce({ rows: [{ id: 10 }] }); // query
    mockClient.query.mockResolvedValueOnce({ rows: [] }); // COMMIT

    const result = await transaction(async (client) => {
      const res = await client.query("INSERT INTO test VALUES (10) RETURNING id");
      return res.rows[0];
    });

    expect(mockClient.query).toHaveBeenCalledWith("BEGIN");
    expect(mockClient.query).toHaveBeenCalledWith("COMMIT");
    expect(mockRelease).toHaveBeenCalled();
    expect(result.id).toBe(10);
  });

  it("should rollback transaction on error and rethrow", async () => {
    mockClient.query.mockResolvedValueOnce({ rows: [] }); // BEGIN
    mockClient.query.mockRejectedValueOnce(new Error("DB Fatal Error")); // Query error
    mockClient.query.mockResolvedValueOnce({ rows: [] }); // ROLLBACK

    await expect(
      transaction(async (client) => {
        await client.query("INVALID QUERY");
      })
    ).rejects.toThrow("DB Fatal Error");

    expect(mockClient.query).toHaveBeenCalledWith("ROLLBACK");
    expect(mockRelease).toHaveBeenCalled();
  });

  it("should acquire client with getClient", async () => {
    const client = await getClient();
    expect(client).toBe(mockClient);
    expect(mockConnect).toHaveBeenCalled();
  });
});

describe("lib/db/users", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should create user with hashed password", async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [
        {
          id: "u_new",
          email: "novo@test.com",
          nome: "Novo Usuario",
          plano: "free",
        },
      ],
      rowCount: 1,
    });

    const user = await criarUser({
      email: "novo@test.com",
      password: "SecretPassword123",
      nome: "Novo Usuario",
    });

    expect(user.id).toBe("u_new");
    expect(user.email).toBe("novo@test.com");
  });

  it("should find user by email", async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [{ id: "u_1", email: "user@test.com", nome: "Found" }],
      rowCount: 1,
    });

    const user = await obterUserPorEmail("user@test.com");
    expect(user?.nome).toBe("Found");
  });

  it("should find user by id", async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [{ id: "u_1", email: "user@test.com", plano: "pro" }],
      rowCount: 1,
    });

    const user = await obterUserPorId("u_1");
    expect(user?.plano).toBe("pro");
  });

  it("should find user by abacate customer id", async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [{ id: "u_1", abacate_customer_id: "cust_123" }],
      rowCount: 1,
    });

    const user = await obterUserPorAbacateId("cust_123");
    expect(user?.id).toBe("u_1");
  });

  it("should update user plan", async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [{ id: "u_1", plano: "pro" }],
      rowCount: 1,
    });

    const user = await atualizarUserPlano("cust_123", "pro", "sub_123");
    expect(user?.plano).toBe("pro");
  });

  it("should update user customer ID", async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [{ id: "u_1", abacate_customer_id: "cust_999" }],
      rowCount: 1,
    });

    const user = await atualizarUserCustomerId("u_1", "cust_999");
    expect(user?.abacate_customer_id).toBe("cust_999");
  });

  it("should update user profile", async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [{ id: "u_1", nome: "Novo Nome" }],
      rowCount: 1,
    });

    const user = await atualizarUserProfile("u_1", { nome: "Novo Nome" });
    expect(user?.nome).toBe("Novo Nome");
  });

  it("should check proposal limits for free vs pro users", async () => {
    // Free user under limit
    mockQuery.mockResolvedValueOnce({
      rows: [{ id: "u_free", plano: "free", propostas_mes_atual: 1 }],
      rowCount: 1,
    });
    const canCreate = await verificarLimiteProposta("u_free");
    expect(canCreate).toBe(true);

    // Free user at limit
    mockQuery.mockResolvedValueOnce({
      rows: [{ id: "u_free_max", plano: "free", propostas_mes_atual: 3 }],
      rowCount: 1,
    });
    const cannotCreate = await verificarLimiteProposta("u_free_max");
    expect(cannotCreate).toBe(false);

    // Pro user
    mockQuery.mockResolvedValueOnce({
      rows: [{ id: "u_pro", plano: "pro", propostas_mes_atual: 100 }],
      rowCount: 1,
    });
    const proCanCreate = await verificarLimiteProposta("u_pro");
    expect(proCanCreate).toBe(true);
  });

  it("should increment proposal counter", async () => {
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 1 });
    await incrementarContadorPropostas("u_1");
    expect(mockQuery).toHaveBeenCalled();
  });
});

describe("lib/db/propostas", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should save a proposal with its line items inside transaction", async () => {
    mockClient.query.mockResolvedValueOnce({ rows: [] }); // BEGIN
    mockClient.query.mockResolvedValueOnce({
      rows: [{ id: "prop_1", numero: "PROP-001", total: 1000 }],
    }); // insert proposta
    mockClient.query.mockResolvedValueOnce({ rows: [] }); // insert item
    mockClient.query.mockResolvedValueOnce({ rows: [] }); // COMMIT

    const saved = await salvarProposta({
      usuarioId: "u_1",
      numero: "PROP-001",
      clienteNome: "Cliente X",
      descricao: "Desenvolvimento",
      conteudoHtml: "<p>Proposta</p>",
      subtotal: 1000,
      total: 1000,
      itens: [{ descricao: "Item 1", quantidade: 1, valorUnitario: 1000 }],
    });

    expect(saved.id).toBe("prop_1");
  });

  it("should fetch proposal by ID", async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [{ id: "prop_1", numero: "PROP-001", total: 500 }],
      rowCount: 1,
    });

    const prop = await obterPropostaPorId("prop_1");
    expect(prop?.id).toBe("prop_1");
  });

  it("should list user proposals with optional filters", async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [
        { id: "prop_1", numero: "PROP-001", total: 500 },
        { id: "prop_2", numero: "PROP-002", total: 1500 },
      ],
      rowCount: 2,
    });

    const list = await obterPropostasPorUsuario("u_1", {
      status: "aceita",
      busca: "PROP",
    });
    expect(list).toHaveLength(2);
  });

  it("should update proposal status", async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [{ id: "prop_1", status: "aceita" }],
      rowCount: 1,
    });

    const updated = await atualizarStatusProposta("prop_1", "u_1", "aceita");
    expect(updated?.status).toBe("aceita");
  });

  it("should delete proposal softly", async () => {
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 1 });
    const success = await deletarProposta("prop_1", "u_1");
    expect(success).toBe(true);
  });

  it("should calculate dashboard metrics", async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [
        {
          total_propostas: "10",
          propostas_aceitas: "5",
          propostas_enviadas: "3",
          propostas_rascunho: "1",
          propostas_recusadas: "1",
          valor_total_pipeline: "50000",
          valor_total_fechado: "30000",
        },
      ],
      rowCount: 1,
    });

    const metrics = await obterMetricasDashboard("u_1");
    expect(metrics.totalPropostas).toBe(10);
    expect(metrics.propostasAceitas).toBe(5);
    expect(metrics.taxaConversao).toBe("50.0%");
  });

  it("should register electronic signature", async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [
        {
          id: "prop_1",
          status: "aceita",
          assinante_nome: "Signer Name",
          assinante_documento: "123.456.789-00",
          assinatura_hash: "sha256_hash",
        },
      ],
      rowCount: 1,
    });

    const signed = await assinarProposta({
      propostaId: "prop_1",
      assinanteNome: "Signer Name",
      assinanteDocumento: "123.456.789-00",
      assinaturaIp: "127.0.0.1",
      assinaturaHash: "sha256_hash",
    });

    expect(signed?.status).toBe("aceita");
    expect(signed?.assinante_nome).toBe("Signer Name");
  });
});

describe("lib/db/webhooks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should verify and register idempotency event", async () => {
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 }); // create table
    mockQuery.mockResolvedValueOnce({ rows: [{ id: "evt_1" }], rowCount: 1 }); // select id

    const alreadyProcessed = await verificarEventoProcessado("evt_1");
    expect(alreadyProcessed).toBe(true);

    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 1 }); // insert
    await registrarEventoProcessado("evt_2", "transparent.completed", { amount: 4590 });
    expect(mockQuery).toHaveBeenCalled();
  });
});
