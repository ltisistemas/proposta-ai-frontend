import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// Mock DB and Auth dependencies
vi.mock("@/lib/db/users", () => ({
  obterUserPorEmail: vi.fn(),
  obterUserPorId: vi.fn(),
  criarUser: vi.fn(),
  listarUsuariosAdmin: vi.fn(),
  atualizarStatusUsuarioAdmin: vi.fn(),
  atualizarPlanoUsuarioAdmin: vi.fn(),
  atualizarVencimentoUsuarioAdmin: vi.fn(),
  garantirColunasAdmin: vi.fn(),
  garantirColunaVerificacaoAssinatura: vi.fn(),
  validarAssinaturaUsuario: vi.fn().mockImplementation(async (user) => {
    if (user?.pro_tipo_concessao === "manual_vitalicio") {
      return {
        user,
        emPeriodoGraca: false,
        diasRestantesGraca: 0,
        diasAtraso: 0,
        statusAssinatura: "ativa",
        cancelamentoAgendado: false,
      };
    }
    return {
      user,
      emPeriodoGraca: false,
      diasRestantesGraca: 0,
      diasAtraso: 0,
      statusAssinatura: user?.plano === "pro" ? "ativa" : "free",
      cancelamentoAgendado: !!user?.cancelamento_agendado,
    };
  }),
}));

import { GET as usersGetHandler, POST as usersPostHandler } from "@/app/api/admin/users/route";
import { PATCH as statusPatchHandler } from "@/app/api/admin/users/[id]/status/route";
import { PATCH as planoPatchHandler } from "@/app/api/admin/users/[id]/plano/route";
import { PATCH as vencimentoPatchHandler } from "@/app/api/admin/users/[id]/vencimento/route";
import {
  obterUserPorId,
  obterUserPorEmail,
  criarUser,
  listarUsuariosAdmin,
  atualizarStatusUsuarioAdmin,
  atualizarPlanoUsuarioAdmin,
  atualizarVencimentoUsuarioAdmin,
  validarAssinaturaUsuario,
} from "@/lib/db/users";
import { gerarToken } from "@/lib/auth/jwt";

describe("Admin API Endpoints & RBAC Guards", () => {
  const adminUser = {
    id: "admin-123",
    email: "admin@proposta.ai",
    nome: "Admin Master",
    role: "admin" as const,
    plano: "pro" as const,
    suspenso: false,
  };

  const clientUser = {
    id: "client-456",
    email: "cliente@empresa.com",
    nome: "Cliente Silva",
    role: "cliente" as const,
    plano: "free" as const,
    suspenso: false,
  };

  const suspendedAdmin = {
    id: "admin-999",
    email: "blocked@proposta.ai",
    nome: "Admin Bloqueado",
    role: "admin" as const,
    plano: "pro" as const,
    suspenso: true,
  };

  const adminToken = gerarToken({
    userId: adminUser.id,
    email: adminUser.email,
    nome: adminUser.nome,
    plano: adminUser.plano,
    role: adminUser.role,
  });

  const clientToken = gerarToken({
    userId: clientUser.id,
    email: clientUser.email,
    nome: clientUser.nome,
    plano: clientUser.plano,
    role: clientUser.role,
  });

  const suspendedAdminToken = gerarToken({
    userId: suspendedAdmin.id,
    email: suspendedAdmin.email,
    nome: suspendedAdmin.nome,
    plano: suspendedAdmin.plano,
    role: suspendedAdmin.role,
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Security & RBAC Authentication Guard", () => {
    it("should return 401 when request is missing Authorization header", async () => {
      const req = new NextRequest("http://localhost:3000/api/admin/users");
      const res = await usersGetHandler(req);
      expect(res.status).toBe(401);
      const data = await res.json();
      expect(data.sucesso).toBe(false);
      expect(data.erro).toContain("Autenticação necessária");
    });

    it("should return 401 for invalid JWT token", async () => {
      const req = new NextRequest("http://localhost:3000/api/admin/users", {
        headers: { Authorization: "Bearer invalid_token_xyz" },
      });
      const res = await usersGetHandler(req);
      expect(res.status).toBe(401);
    });

    it("should return 403 when authenticated user has 'cliente' role", async () => {
      vi.mocked(obterUserPorId).mockResolvedValue(clientUser as any);
      const req = new NextRequest("http://localhost:3000/api/admin/users", {
        headers: { Authorization: `Bearer ${clientToken}` },
      });
      const res = await usersGetHandler(req);
      expect(res.status).toBe(403);
      const data = await res.json();
      expect(data.erro).toContain("Acesso restrito a administradores");
    });

    it("should return 403 when user is marked as suspended", async () => {
      vi.mocked(obterUserPorId).mockResolvedValue(suspendedAdmin as any);
      const req = new NextRequest("http://localhost:3000/api/admin/users", {
        headers: { Authorization: `Bearer ${suspendedAdminToken}` },
      });
      const res = await usersGetHandler(req);
      expect(res.status).toBe(403);
      const data = await res.json();
      expect(data.suspenso).toBe(true);
    });
  });

  describe("GET /api/admin/users", () => {
    it("should return paginated users and metrics for authorized admin", async () => {
      vi.mocked(obterUserPorId).mockResolvedValue(adminUser as any);
      vi.mocked(listarUsuariosAdmin).mockResolvedValue({
        usuarios: [clientUser as any],
        total: 1,
        pagina: 1,
        limite: 20,
        totalPaginas: 1,
        metricas: { total: 10, pro: 4, free: 6, suspensos: 1, admins: 2 },
      });

      const req = new NextRequest(
        "http://localhost:3000/api/admin/users?busca=cliente&plano=free&role=cliente&status=ativo&pagina=1",
        {
          headers: { Authorization: `Bearer ${adminToken}` },
        }
      );

      const res = await usersGetHandler(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.sucesso).toBe(true);
      expect(data.usuarios).toHaveLength(1);
      expect(data.metricas.total).toBe(10);
      expect(listarUsuariosAdmin).toHaveBeenCalledWith({
        busca: "cliente",
        plano: "free",
        role: "cliente",
        status: "ativo",
        pagina: 1,
        limite: 20,
      });
    });
  });

  describe("POST /api/admin/users", () => {
    it("should allow admin to register a new user", async () => {
      vi.mocked(obterUserPorId).mockResolvedValue(adminUser as any);
      vi.mocked(obterUserPorEmail).mockResolvedValue(null);
      vi.mocked(criarUser).mockResolvedValue({
        id: "new-user-789",
        email: "novo@empresa.com",
        nome: "Novo Usuário",
        plano: "pro",
        role: "cliente",
        suspenso: false,
        criado_em: new Date(),
        atualizado_em: new Date(),
      } as any);

      const req = new NextRequest("http://localhost:3000/api/admin/users", {
        method: "POST",
        headers: { Authorization: `Bearer ${adminToken}` },
        body: JSON.stringify({
          nome: "Novo Usuário",
          email: "novo@empresa.com",
          password: "password123",
          role: "cliente",
          plano: "pro",
        }),
      });

      const res = await usersPostHandler(req);
      expect(res.status).toBe(201);
      const data = await res.json();
      expect(data.sucesso).toBe(true);
      expect(data.usuario.email).toBe("novo@empresa.com");
    });

    it("should return 409 if email is already registered", async () => {
      vi.mocked(obterUserPorId).mockResolvedValue(adminUser as any);
      vi.mocked(obterUserPorEmail).mockResolvedValue(clientUser as any);

      const req = new NextRequest("http://localhost:3000/api/admin/users", {
        method: "POST",
        headers: { Authorization: `Bearer ${adminToken}` },
        body: JSON.stringify({
          nome: "Duplicate User",
          email: clientUser.email,
          password: "password123",
        }),
      });

      const res = await usersPostHandler(req);
      expect(res.status).toBe(409);
      const data = await res.json();
      expect(data.erro).toContain("já está cadastrado");
    });

    it("should return 400 for invalid body schema", async () => {
      vi.mocked(obterUserPorId).mockResolvedValue(adminUser as any);

      const req = new NextRequest("http://localhost:3000/api/admin/users", {
        method: "POST",
        headers: { Authorization: `Bearer ${adminToken}` },
        body: JSON.stringify({
          nome: "A",
          email: "invalid-email",
          password: "123",
        }),
      });

      const res = await usersPostHandler(req);
      expect(res.status).toBe(400);
    });
  });

  describe("PATCH /api/admin/users/[id]/status", () => {
    it("should allow admin to suspend and reactivate an account", async () => {
      vi.mocked(obterUserPorId)
        .mockResolvedValueOnce(adminUser as any) // for admin guard
        .mockResolvedValueOnce(clientUser as any); // for target user check

      vi.mocked(atualizarStatusUsuarioAdmin).mockResolvedValue({
        ...clientUser,
        suspenso: true,
      } as any);

      const req = new NextRequest(
        "http://localhost:3000/api/admin/users/client-456/status",
        {
          method: "PATCH",
          headers: { Authorization: `Bearer ${adminToken}` },
          body: JSON.stringify({ suspenso: true }),
        }
      );

      const res = await statusPatchHandler(req, {
        params: Promise.resolve({ id: "client-456" }),
      });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.sucesso).toBe(true);
      expect(data.usuario.suspenso).toBe(true);
    });

    it("should prevent admin from suspending their own active account", async () => {
      vi.mocked(obterUserPorId)
        .mockResolvedValueOnce(adminUser as any)
        .mockResolvedValueOnce(adminUser as any);

      const req = new NextRequest(
        `http://localhost:3000/api/admin/users/${adminUser.id}/status`,
        {
          method: "PATCH",
          headers: { Authorization: `Bearer ${adminToken}` },
          body: JSON.stringify({ suspenso: true }),
        }
      );

      const res = await statusPatchHandler(req, {
        params: Promise.resolve({ id: adminUser.id }),
      });
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.erro).toContain("não pode suspender sua própria conta");
    });
  });

  describe("PATCH /api/admin/users/[id]/plano", () => {
    it("should grant lifetime PRO plan without payment", async () => {
      vi.mocked(obterUserPorId)
        .mockResolvedValueOnce(adminUser as any)
        .mockResolvedValueOnce(clientUser as any);

      vi.mocked(atualizarPlanoUsuarioAdmin).mockResolvedValue({
        ...clientUser,
        plano: "pro",
        pro_tipo_concessao: "manual_vitalicio",
      } as any);

      const req = new NextRequest(
        "http://localhost:3000/api/admin/users/client-456/plano",
        {
          method: "PATCH",
          headers: { Authorization: `Bearer ${adminToken}` },
          body: JSON.stringify({ tipo: "vitalicio" }),
        }
      );

      const res = await planoPatchHandler(req, {
        params: Promise.resolve({ id: "client-456" }),
      });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.sucesso).toBe(true);
      expect(data.usuario.pro_tipo_concessao).toBe("manual_vitalicio");
    });

    it("should grant temporary 3 months PRO plan", async () => {
      vi.mocked(obterUserPorId)
        .mockResolvedValueOnce(adminUser as any)
        .mockResolvedValueOnce(clientUser as any);

      vi.mocked(atualizarPlanoUsuarioAdmin).mockResolvedValue({
        ...clientUser,
        plano: "pro",
        pro_tipo_concessao: "manual_temporario",
      } as any);

      const req = new NextRequest(
        "http://localhost:3000/api/admin/users/client-456/plano",
        {
          method: "PATCH",
          headers: { Authorization: `Bearer ${adminToken}` },
          body: JSON.stringify({ tipo: "temporario", meses: 3 }),
        }
      );

      const res = await planoPatchHandler(req, {
        params: Promise.resolve({ id: "client-456" }),
      });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.sucesso).toBe(true);
      expect(atualizarPlanoUsuarioAdmin).toHaveBeenCalledWith(
        "client-456",
        "temporario",
        3
      );
    });

    it("should revert user to Free plan", async () => {
      vi.mocked(obterUserPorId)
        .mockResolvedValueOnce(adminUser as any)
        .mockResolvedValueOnce(clientUser as any);

      vi.mocked(atualizarPlanoUsuarioAdmin).mockResolvedValue({
        ...clientUser,
        plano: "free",
        pro_tipo_concessao: null,
      } as any);

      const req = new NextRequest(
        "http://localhost:3000/api/admin/users/client-456/plano",
        {
          method: "PATCH",
          headers: { Authorization: `Bearer ${adminToken}` },
          body: JSON.stringify({ tipo: "free" }),
        }
      );

      const res = await planoPatchHandler(req, {
        params: Promise.resolve({ id: "client-456" }),
      });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.sucesso).toBe(true);
      expect(data.usuario.plano).toBe("free");
    });
  });

  describe("PATCH /api/admin/users/[id]/vencimento", () => {
    it("should modify user next billing due date", async () => {
      const nextDate = new Date("2027-01-01T00:00:00Z").toISOString();
      vi.mocked(obterUserPorId)
        .mockResolvedValueOnce(adminUser as any)
        .mockResolvedValueOnce(clientUser as any);

      vi.mocked(atualizarVencimentoUsuarioAdmin).mockResolvedValue({
        ...clientUser,
        data_proxima_cobranca: new Date(nextDate),
      } as any);

      const req = new NextRequest(
        "http://localhost:3000/api/admin/users/client-456/vencimento",
        {
          method: "PATCH",
          headers: { Authorization: `Bearer ${adminToken}` },
          body: JSON.stringify({ data_proxima_cobranca: nextDate }),
        }
      );

      const res = await vencimentoPatchHandler(req, {
        params: Promise.resolve({ id: "client-456" }),
      });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.sucesso).toBe(true);
      expect(atualizarVencimentoUsuarioAdmin).toHaveBeenCalledWith(
        "client-456",
        nextDate
      );
    });

    it("should return 400 for invalid date format", async () => {
      vi.mocked(obterUserPorId).mockResolvedValueOnce(adminUser as any);

      const req = new NextRequest(
        "http://localhost:3000/api/admin/users/client-456/vencimento",
        {
          method: "PATCH",
          headers: { Authorization: `Bearer ${adminToken}` },
          body: JSON.stringify({ data_proxima_cobranca: "not-a-date" }),
        }
      );

      const res = await vencimentoPatchHandler(req, {
        params: Promise.resolve({ id: "client-456" }),
      });
      expect(res.status).toBe(400);
    });
  });
});
