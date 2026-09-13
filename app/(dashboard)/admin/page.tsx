"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Shield,
  UserPlus,
  RefreshCw,
  Users,
  Activity,
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
import { WebhookLogsTable } from "@/components/Admin/WebhookLogsTable";
import { WebhookAuditModal } from "@/components/Admin/WebhookAuditModal";
import { Button } from "@/components/Common/Button";
import { addToast } from "@/components/Common/Toast";
import { UserRow } from "@/lib/db/users";
import { WebhookEventoRow } from "@/lib/db/webhooks";
import Link from "next/link";

export default function AdminPage() {
  const router = useRouter();
  const { user, token, isAuthenticated, isLoading: authLoading } = useAuthStore();

  // Tab State
  const [activeTab, setActiveTab] = useState<"usuarios" | "webhooks">("usuarios");

  // Users State
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

  // Webhooks State
  const [webhookEventos, setWebhookEventos] = useState<WebhookEventoRow[]>([]);
  const [webhookMetricas, setWebhookMetricas] = useState({
    total: 0,
    sucesso: 0,
    downgrades: 0,
    ativacoes: 0,
    erros: 0,
  });
  const [webhookTotal, setWebhookTotal] = useState(0);
  const [webhookPagina, setWebhookPagina] = useState(1);
  const [webhookTotalPaginas, setWebhookTotalPaginas] = useState(1);
  const [webhookGatewayFiltro, setWebhookGatewayFiltro] = useState("");
  const [webhookStatusFiltro, setWebhookStatusFiltro] = useState("");
  const [webhookEventoBusca, setWebhookEventoBusca] = useState("");
  const [webhookIsLoading, setWebhookIsLoading] = useState(false);
  const [selectedWebhookEvento, setSelectedWebhookEvento] = useState<WebhookEventoRow | null>(null);

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

  const carregarWebhooks = useCallback(async () => {
    if (!token) return;
    setWebhookIsLoading(true);

    try {
      const params = new URLSearchParams();
      if (webhookGatewayFiltro) params.set("gateway", webhookGatewayFiltro);
      if (webhookStatusFiltro) params.set("status", webhookStatusFiltro);
      if (webhookEventoBusca) params.set("evento", webhookEventoBusca);
      params.set("pagina", String(webhookPagina));
      params.set("limite", "20");

      const res = await fetch(`/api/admin/webhooks?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      if (!res.ok || !data.sucesso) {
        throw new Error(data.erro || "Falha ao carregar logs de webhook");
      }

      setWebhookEventos(data.eventos || []);
      setWebhookTotal(data.total || 0);
      setWebhookTotalPaginas(data.totalPaginas || 1);
      if (data.metricas) {
        setWebhookMetricas(data.metricas);
      }
    } catch (err: any) {
      addToast({
        title: "Erro ao buscar webhooks",
        message: err.message || "Não foi possível carregar o histórico de webhooks.",
        type: "error",
      });
    } finally {
      setWebhookIsLoading(false);
    }
  }, [token, webhookGatewayFiltro, webhookStatusFiltro, webhookEventoBusca, webhookPagina]);

  useEffect(() => {
    if (isAuthenticated && user?.role === "admin") {
      if (activeTab === "usuarios") {
        carregarUsuarios();
      } else {
        carregarWebhooks();
      }
    }
  }, [isAuthenticated, user?.role, activeTab, carregarUsuarios, carregarWebhooks]);

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
              Gestão de usuários, auditoria e observabilidade de webhooks em tempo real.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => (activeTab === "usuarios" ? carregarUsuarios() : carregarWebhooks())}
            disabled={isLoading || webhookIsLoading}
            title="Atualizar lista"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading || webhookIsLoading ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Atualizar</span>
          </Button>

          {activeTab === "usuarios" && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsCreateOpen(true)}
            >
              <UserPlus className="w-4 h-4 mr-1.5" /> Adicionar Usuário
            </Button>
          )}
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab("usuarios")}
          className={`flex items-center gap-2 py-3 px-4 font-bold text-xs border-b-2 transition-colors cursor-pointer ${
            activeTab === "usuarios"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300"
          }`}
        >
          <Users className="w-4 h-4" />
          Gestão de Usuários
        </button>

        <button
          onClick={() => setActiveTab("webhooks")}
          className={`flex items-center gap-2 py-3 px-4 font-bold text-xs border-b-2 transition-colors cursor-pointer ${
            activeTab === "webhooks"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300"
          }`}
        >
          <Activity className="w-4 h-4" />
          Auditoria de Webhooks
        </button>
      </div>

      {/* Tab 1: Gestão de Usuários */}
      {activeTab === "usuarios" && (
        <div className="space-y-6">
          <StatsSummaryCards metricas={metricas} isLoading={isLoading && usuarios.length === 0} />

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
        </div>
      )}

      {/* Tab 2: Auditoria de Webhooks */}
      {activeTab === "webhooks" && (
        <div className="space-y-6">
          <WebhookLogsTable
            eventos={webhookEventos}
            total={webhookTotal}
            pagina={webhookPagina}
            totalPaginas={webhookTotalPaginas}
            metricas={webhookMetricas}
            gatewayFiltro={webhookGatewayFiltro}
            setGatewayFiltro={setWebhookGatewayFiltro}
            statusFiltro={webhookStatusFiltro}
            setStatusFiltro={setWebhookStatusFiltro}
            eventoBusca={webhookEventoBusca}
            setEventoBusca={setWebhookEventoBusca}
            onPageChange={(pag) => setWebhookPagina(pag)}
            onSelectEvento={(ev) => setSelectedWebhookEvento(ev)}
            onRefresh={() => carregarWebhooks()}
            isLoading={webhookIsLoading}
          />
        </div>
      )}

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

      {/* Webhook Audit Detail Modal */}
      <WebhookAuditModal
        evento={selectedWebhookEvento}
        isOpen={!!selectedWebhookEvento}
        onClose={() => setSelectedWebhookEvento(null)}
      />
    </div>
  );
}
