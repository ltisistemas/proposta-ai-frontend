"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Shield,
  UserPlus,
  RefreshCw,
  ShieldAlert,
  Users,
  Lock,
  ArrowLeft,
} from "lucide-react";
import { useAuthStore } from "@/lib/auth/useAuthStore";
import { StatsSummaryCards } from "@/components/Admin/StatsSummaryCards";
import { AdminUsersTable } from "@/components/Admin/AdminUsersTable";
import { CreateUserModal } from "@/components/Admin/CreateUserModal";
import { GrantProModal } from "@/components/Admin/GrantProModal";
import { AdjustDueDateModal } from "@/components/Admin/AdjustDueDateModal";
import { ConfirmSuspendModal } from "@/components/Admin/ConfirmSuspendModal";
import { Button } from "@/components/Common/Button";
import { addToast } from "@/components/Common/Toast";
import { UserRow } from "@/lib/db/users";
import Link from "next/link";

export default function AdminPage() {
  const router = useRouter();
  const { user, token, isAuthenticated, isLoading: authLoading } = useAuthStore();

  const [usuarios, setUsuarios] = useState<UserRow[]>([]);
  const [metricas, setMetricas] = useState({
    total: 0,
    pro: 0,
    free: 0,
    suspensos: 0,
    admins: 0,
  });
  const [total, setTotal] = useState(0);
  const [pagina, setPagina] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [busca, setBusca] = useState("");
  const [planoFiltro, setPlanoFiltro] = useState("");
  const [roleFiltro, setRoleFiltro] = useState("");
  const [statusFiltro, setStatusFiltro] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Modal states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedUserForPro, setSelectedUserForPro] = useState<UserRow | null>(null);
  const [selectedUserForDueDate, setSelectedUserForDueDate] = useState<UserRow | null>(null);
  const [selectedUserForSuspend, setSelectedUserForSuspend] = useState<UserRow | null>(null);

  const carregarUsuarios = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);

    try {
      const params = new URLSearchParams();
      if (busca) params.set("busca", busca);
      if (planoFiltro) params.set("plano", planoFiltro);
      if (roleFiltro) params.set("role", roleFiltro);
      if (statusFiltro) params.set("status", statusFiltro);
      params.set("pagina", String(pagina));
      params.set("limite", "20");

      const res = await fetch(`/api/admin/users?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      if (!res.ok || !data.sucesso) {
        throw new Error(data.erro || "Falha ao carregar lista de usuários");
      }

      setUsuarios(data.usuarios || []);
      setTotal(data.total || 0);
      setTotalPaginas(data.totalPaginas || 1);
      if (data.metricas) {
        setMetricas(data.metricas);
      }
    } catch (err: any) {
      addToast({
        title: "Erro ao buscar usuários",
        message: err.message || "Não foi possível carregar os dados.",
        type: "error",
      });
    } finally {
      setIsLoading(false);
    }
  }, [token, busca, planoFiltro, roleFiltro, statusFiltro, pagina]);

  useEffect(() => {
    if (isAuthenticated && user?.role === "admin") {
      carregarUsuarios();
    }
  }, [isAuthenticated, user?.role, carregarUsuarios]);

  // Auth & Access Guard
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-slate-500 font-medium">
            Verificando permissões administrativas...
          </span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || user?.role !== "admin") {
    return (
      <div className="flex items-center justify-center min-h-[70vh] p-4">
        <div className="bg-white p-8 rounded-3xl border border-slate-200/90 shadow-lg max-w-md w-full text-center space-y-5">
          <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 border border-rose-100 flex items-center justify-center mx-auto">
            <Lock className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              Acesso Não Autorizado
            </h2>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              Esta área é restrita a administradores do sistema. Seu usuário atual não
              possui privilégios de administrador.
            </p>
          </div>
          <Link href="/dashboard" className="block">
            <Button variant="primary" size="md" className="w-full">
              <ArrowLeft className="w-4 h-4 mr-2" /> Voltar ao Meu Dashboard
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-700">
            <Shield className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Painel Administrativo
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Gestão central de usuários, concessão de planos, vencimentos e suspensão.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => carregarUsuarios()}
            disabled={isLoading}
            title="Atualizar lista"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Atualizar</span>
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsCreateOpen(true)}
          >
            <UserPlus className="w-4 h-4 mr-1.5" /> Adicionar Usuário
          </Button>
        </div>
      </div>

      {/* Metrics Cards */}
      <StatsSummaryCards metricas={metricas} isLoading={isLoading && usuarios.length === 0} />

      {/* Users Table & Filters */}
      <AdminUsersTable
        usuarios={usuarios}
        total={total}
        pagina={pagina}
        totalPaginas={totalPaginas}
        busca={busca}
        setBusca={setBusca}
        planoFiltro={planoFiltro}
        setPlanoFiltro={setPlanoFiltro}
        roleFiltro={roleFiltro}
        setRoleFiltro={setRoleFiltro}
        statusFiltro={statusFiltro}
        setStatusFiltro={setStatusFiltro}
        onPageChange={(pag) => setPagina(pag)}
        onGrantPro={(u) => setSelectedUserForPro(u)}
        onAdjustDueDate={(u) => setSelectedUserForDueDate(u)}
        onToggleSuspend={(u) => setSelectedUserForSuspend(u)}
        isLoading={isLoading}
      />

      {/* Action Modals */}
      <CreateUserModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={() => carregarUsuarios()}
      />

      <GrantProModal
        user={selectedUserForPro}
        isOpen={!!selectedUserForPro}
        onClose={() => setSelectedUserForPro(null)}
        onSuccess={() => carregarUsuarios()}
      />

      <AdjustDueDateModal
        user={selectedUserForDueDate}
        isOpen={!!selectedUserForDueDate}
        onClose={() => setSelectedUserForDueDate(null)}
        onSuccess={() => carregarUsuarios()}
      />

      <ConfirmSuspendModal
        user={selectedUserForSuspend}
        isOpen={!!selectedUserForSuspend}
        onClose={() => setSelectedUserForSuspend(null)}
        onSuccess={() => carregarUsuarios()}
      />
    </div>
  );
}
