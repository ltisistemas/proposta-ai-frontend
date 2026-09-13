import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { StatsSummaryCards } from "@/components/Admin/StatsSummaryCards";
import { AdminUsersTable } from "@/components/Admin/AdminUsersTable";
import { CreateUserModal } from "@/components/Admin/CreateUserModal";
import { GrantProModal } from "@/components/Admin/GrantProModal";
import { AdjustDueDateModal } from "@/components/Admin/AdjustDueDateModal";
import { ConfirmSuspendModal } from "@/components/Admin/ConfirmSuspendModal";
import { UserRow } from "@/lib/db/users";

vi.mock("@/lib/auth/useAuthStore", () => ({
  useAuthStore: () => ({
    user: { id: "admin-1", nome: "Admin", role: "admin", email: "admin@test.com" },
    token: "valid-admin-token",
    isAuthenticated: true,
    isLoading: false,
  }),
}));

describe("Admin UI Components", () => {
  const dummyUser: UserRow = {
    id: "usr-1",
    email: "joao@empresa.com",
    nome: "João Silva",
    empresa_nome: "Tech Soluções",
    plano: "pro",
    role: "cliente",
    suspenso: false,
    pro_tipo_concessao: "manual_vitalicio",
    propostas_mes_atual: 10,
    data_assinatura: new Date("2026-01-01"),
    data_proxima_cobranca: null,
    criado_em: new Date("2026-01-01"),
    atualizado_em: new Date("2026-01-01"),
    password_hash: "hash",
  };

  const dummySuspendedUser: UserRow = {
    id: "usr-2",
    email: "maria@empresa.com",
    nome: "Maria Santos",
    empresa_nome: "Maria ME",
    plano: "free",
    role: "cliente",
    suspenso: true,
    propostas_mes_atual: 1,
    criado_em: new Date("2026-02-01"),
    atualizado_em: new Date("2026-02-01"),
    password_hash: "hash",
  };

  describe("StatsSummaryCards", () => {
    it("should render metric cards correctly", () => {
      render(
        <StatsSummaryCards
          metricas={{
            total: 150,
            pro: 45,
            free: 105,
            suspensos: 3,
            admins: 2,
          }}
        />
      );

      expect(screen.getByText("Total de Usuários")).toBeDefined();
      expect(screen.getByText("150")).toBeDefined();
      expect(screen.getByText("Assinantes PRO")).toBeDefined();
      expect(screen.getByText("45")).toBeDefined();
      expect(screen.getByText("Contas Suspensas")).toBeDefined();
      expect(screen.getByText("3")).toBeDefined();
    });
  });

  describe("AdminUsersTable", () => {
    it("should render users, badges, and fire action callbacks", () => {
      const onGrantPro = vi.fn();
      const onAdjustDueDate = vi.fn();
      const onToggleSuspend = vi.fn();

      render(
        <AdminUsersTable
          usuarios={[dummyUser, dummySuspendedUser]}
          total={2}
          pagina={1}
          totalPaginas={1}
          busca=""
          setBusca={vi.fn()}
          planoFiltro=""
          setPlanoFiltro={vi.fn()}
          roleFiltro=""
          setRoleFiltro={vi.fn()}
          statusFiltro=""
          setStatusFiltro={vi.fn()}
          onPageChange={vi.fn()}
          onGrantPro={onGrantPro}
          onAdjustDueDate={onAdjustDueDate}
          onToggleSuspend={onToggleSuspend}
        />
      );

      expect(screen.getByText("João Silva")).toBeDefined();
      expect(screen.getByText("joao@empresa.com")).toBeDefined();
      expect(screen.getByText("Tech Soluções")).toBeDefined();
      expect(screen.getAllByText("Vitalício").length).toBeGreaterThan(0);
      expect(screen.getByText("Suspenso")).toBeDefined();

      const grantButtons = screen.getAllByTitle("Conceder ou alterar plano PRO");
      fireEvent.click(grantButtons[0]);
      expect(onGrantPro).toHaveBeenCalledWith(dummyUser);

      const dueButtons = screen.getAllByTitle("Modificar data de vencimento/cobrança");
      fireEvent.click(dueButtons[0]);
      expect(onAdjustDueDate).toHaveBeenCalledWith(dummyUser);
    });
  });

  describe("Modals", () => {
    it("should render CreateUserModal with fields", () => {
      render(
        <CreateUserModal
          isOpen={true}
          onClose={vi.fn()}
          onSuccess={vi.fn()}
        />
      );
      expect(screen.getByText("Adicionar Novo Usuário")).toBeDefined();
      expect(screen.getByPlaceholderText("Ex: João da Silva")).toBeDefined();
    });

    it("should render GrantProModal with lifetime and duration choices", () => {
      render(
        <GrantProModal
          user={dummyUser}
          isOpen={true}
          onClose={vi.fn()}
          onSuccess={vi.fn()}
        />
      );
      expect(screen.getByText("Conceder Plano PRO")).toBeDefined();
      expect(screen.getByText("PRO Vitalício")).toBeDefined();
      expect(screen.getByText("PRO 3 Meses")).toBeDefined();
    });

    it("should render AdjustDueDateModal with shortcut buttons", () => {
      render(
        <AdjustDueDateModal
          user={dummyUser}
          isOpen={true}
          onClose={vi.fn()}
          onSuccess={vi.fn()}
        />
      );
      expect(screen.getByText("Modificar Vencimento")).toBeDefined();
      expect(screen.getByText("+30 Dias")).toBeDefined();
      expect(screen.getByText("+60 Dias")).toBeDefined();
    });

    it("should render ConfirmSuspendModal with user details", () => {
      render(
        <ConfirmSuspendModal
          user={dummyUser}
          isOpen={true}
          onClose={vi.fn()}
          onSuccess={vi.fn()}
        />
      );
      expect(screen.getByText("Suspender Conta de Usuário")).toBeDefined();
      expect(screen.getByText("Confirmar Suspensão")).toBeDefined();
    });
  });
});
