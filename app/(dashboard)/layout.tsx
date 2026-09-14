"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  PlusCircle,
  FileText,
  Settings,
  LogOut,
  Zap,
  Menu,
  X,
  User,
  PanelLeftClose,
  PanelLeftOpen,
  Shield,
} from "lucide-react";
import { useAuthStore } from "@/lib/auth/useAuthStore";
import { Badge } from "@/components/Common/Badge";
import { ToastContainer } from "@/components/Common/Toast";
import { Logo } from "@/components/Common/Logo";
import { ThemeToggle } from "@/components/Common/ThemeToggle";

export const dynamic = "force-dynamic";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, logout, fetchMe, emPeriodoGraca, diasRestantesGraca } = useAuthStore();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    fetchMe();
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("proposta_ai_sidebar_collapsed");
      if (saved === "true") {
        setCollapsed(true);
      }
    }
  }, [fetchMe]);

  const toggleSidebar = () => {
    setCollapsed((prev) => {
      const next = !prev;
      if (typeof window !== "undefined") {
        localStorage.setItem("proposta_ai_sidebar_collapsed", String(next));
      }
      return next;
    });
  };

  useEffect(() => {
    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("proposta_ai_token")
        : null;
    if (!token && !isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, router]);

  const navItems = [
    {
      href: "/dashboard",
      label: "Visão Geral",
      icon: <LayoutDashboard className="w-4 h-4" />,
    },
    {
      href: "/propostas/nova",
      label: "Nova Proposta IA",
      icon: <PlusCircle className="w-4 h-4" />,
      highlight: true,
    },
    {
      href: "/propostas",
      label: "Minhas Propostas",
      icon: <FileText className="w-4 h-4" />,
    },
    {
      href: "/config",
      label: "Configurações & Plano",
      icon: <Settings className="w-4 h-4" />,
    },
    ...(user?.role === "admin"
      ? [
          {
            href: "/admin",
            label: "Painel Admin",
            icon: <Shield className="w-4 h-4 text-indigo-600 dark:text-[#8be9fd]" />,
          },
        ]
      : []),
  ];

  return (
    <div className="min-h-screen bg-[#FBFBFA] dark:bg-[#282a36] text-slate-900 dark:text-[#f8f8f2] flex flex-col md:flex-row font-sans antialiased transition-colors duration-200">
      <ToastContainer />

      {/* Mobile Top Bar */}
      <div className="md:hidden flex items-center justify-between p-4 bg-white dark:bg-[#21222c] border-b border-slate-200 dark:border-[#44475a] sticky top-0 z-30 transition-colors">
        <Logo href="/dashboard" size="sm" variant="light" />
        <div className="flex items-center gap-2">
          <ThemeToggle size="sm" />
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="p-2 text-slate-600 dark:text-[#f8f8f2] hover:text-slate-900 dark:hover:text-white rounded-lg bg-slate-100 dark:bg-[#343746] hover:bg-slate-200 dark:hover:bg-[#44475a] cursor-pointer transition-colors"
            title={mobileOpen ? "Fechar menu" : "Abrir menu"}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-slate-950/40 dark:bg-black/60 backdrop-blur-xs z-35 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <aside
        className={`fixed md:sticky top-0 left-0 z-40 h-screen bg-white dark:bg-[#21222c] border-r border-slate-200/90 dark:border-[#44475a] flex flex-col justify-between overflow-y-auto shrink-0 transition-all duration-300 ease-in-out ${
          collapsed ? "md:w-20 p-3" : "md:w-64 p-4 sm:p-5"
        } w-64 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <div className="space-y-6">
          {/* Logo & Toggle Header */}
          <div className={`flex items-center ${collapsed ? "flex-col gap-3 justify-center" : "justify-between"} px-1 pt-1`}>
            {collapsed ? (
              <div title="ViraPropo AI!">
                <Logo href="/dashboard" size="md" variant="light" iconOnly />
              </div>
            ) : (
              <Logo href="/dashboard" size="md" variant="light" />
            )}

            {/* Desktop Sidebar Collapse Toggle */}
            <button
              onClick={toggleSidebar}
              title={collapsed ? "Expandir menu lateral" : "Recolher menu lateral"}
              aria-label={collapsed ? "Expandir menu lateral" : "Recolher menu lateral"}
              className="hidden md:flex p-1.5 rounded-lg text-slate-400 dark:text-[#6272a4] hover:text-slate-700 dark:hover:text-[#f8f8f2] hover:bg-slate-100 dark:hover:bg-[#343746] transition-colors cursor-pointer shrink-0"
            >
              {collapsed ? (
                <PanelLeftOpen className="w-4 h-4" />
              ) : (
                <PanelLeftClose className="w-4 h-4" />
              )}
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1.5">
            {navItems.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  title={collapsed ? item.label : undefined}
                  className={`flex items-center rounded-xl text-sm transition-all ${
                    collapsed
                      ? "justify-center w-11 h-11 mx-auto"
                      : "gap-3 px-3.5 py-2.5"
                  } ${
                    item.highlight && !active
                      ? "bg-blue-600 dark:bg-[#bd93f9] text-white dark:text-[#282a36] hover:bg-blue-700 dark:hover:bg-[#a77bf3] font-bold shadow-md shadow-blue-600/20 dark:shadow-[#bd93f9]/20"
                      : active
                      ? "bg-blue-50 dark:bg-[#bd93f9]/15 text-blue-700 dark:text-[#bd93f9] font-bold border border-blue-200/70 dark:border-[#bd93f9]/30 shadow-xs"
                      : "text-slate-600 dark:text-[#f8f8f2]/80 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/80 dark:hover:bg-[#343746]/60 font-medium"
                  }`}
                >
                  <span
                    className={
                      item.highlight && !active
                        ? "text-white dark:text-[#282a36]"
                        : active
                        ? "text-blue-600 dark:text-[#bd93f9]"
                        : "text-slate-500 dark:text-[#6272a4]"
                    }
                  >
                    {item.icon}
                  </span>
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User Card & Upgrade Prompt */}
        <div className="space-y-3 pt-4 border-t border-slate-200/80 dark:border-[#44475a] mt-6 shrink-0">
          {user?.plano === "free" && !collapsed && (
            <div className="p-3 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50/50 dark:from-[#343746] dark:to-[#282a36] border border-blue-100 dark:border-[#44475a] text-xs">
              <div className="flex items-center justify-between font-bold text-slate-900 dark:text-[#f8f8f2] mb-1">
                <span>Plano Free</span>
                <Zap className="w-3.5 h-3.5 text-blue-600 dark:text-[#bd93f9]" />
              </div>
              <p className="text-slate-600 dark:text-[#6272a4] text-[11px] leading-relaxed mb-2.5">
                {user.propostas_mes_atual || 0}/3 propostas usadas este mês.
              </p>
              <Link href="/config">
                <button className="w-full py-1.5 px-2.5 rounded-lg bg-blue-600 dark:bg-[#bd93f9] hover:bg-blue-700 dark:hover:bg-[#a77bf3] text-white dark:text-[#282a36] font-bold text-[11px] transition-colors shadow-xs shadow-blue-600/20 dark:shadow-[#bd93f9]/20 cursor-pointer">
                  Fazer Upgrade Pro (R$ 45,90)
                </button>
              </Link>
            </div>
          )}

          {user?.plano === "free" && collapsed && (
            <div className="flex justify-center">
              <Link href="/config" title="Fazer Upgrade Pro (R$ 45,90)">
                <button className="w-10 h-10 rounded-xl bg-blue-600 dark:bg-[#bd93f9] hover:bg-blue-700 dark:hover:bg-[#a77bf3] text-white dark:text-[#282a36] flex items-center justify-center transition-colors shadow-xs shadow-blue-600/20 dark:shadow-[#bd93f9]/20 cursor-pointer">
                  <Zap className="w-4 h-4" />
                </button>
              </Link>
            </div>
          )}

          {/* User Profile & Theme Action */}
          {collapsed ? (
            <div className="flex flex-col items-center gap-2 p-1.5 rounded-xl bg-slate-50 dark:bg-[#343746]/60 border border-slate-200/80 dark:border-[#44475a]">
              <div
                title={`${user?.nome || "Usuário"} (${user?.plano?.toUpperCase() || "FREE"})`}
                className="w-9 h-9 rounded-lg bg-blue-100 dark:bg-[#bd93f9]/20 border border-blue-200 dark:border-[#bd93f9]/30 text-blue-700 dark:text-[#bd93f9] flex items-center justify-center font-bold text-xs shrink-0 cursor-default"
              >
                {user?.nome ? user.nome.charAt(0).toUpperCase() : <User className="w-4 h-4" />}
              </div>
              <div className="py-0.5">
                <ThemeToggle size="sm" />
              </div>
              <button
                onClick={() => {
                  logout();
                  router.push("/login");
                }}
                title="Sair da conta"
                aria-label="Sair da conta"
                className="p-1.5 text-slate-500 dark:text-[#6272a4] hover:text-rose-800 dark:hover:text-[#ff5555] hover:bg-rose-100/70 dark:hover:bg-[#ff5555]/15 rounded-lg transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-[#343746]/60 border border-slate-200/80 dark:border-[#44475a]">
              <div className="flex items-center gap-2.5 min-w-0 pr-1">
                <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-[#bd93f9]/20 border border-blue-200 dark:border-[#bd93f9]/30 text-blue-700 dark:text-[#bd93f9] flex items-center justify-center shrink-0 font-bold text-xs">
                  {user?.nome ? user.nome.charAt(0).toUpperCase() : <User className="w-4 h-4" />}
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-slate-900 dark:text-[#f8f8f2] truncate">
                    {user?.nome || "Usuário"}
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-[#6272a4] truncate">
                    <Badge variant={user?.plano === "pro" ? "pro" : "free"} size="sm">
                      {user?.plano?.toUpperCase() || "FREE"}
                    </Badge>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <ThemeToggle size="sm" />
                <button
                  onClick={() => {
                    logout();
                    router.push("/login");
                  }}
                  title="Sair da conta"
                  aria-label="Sair da conta"
                  className="p-1.5 text-slate-500 dark:text-[#6272a4] hover:text-rose-800 dark:hover:text-[#ff5555] hover:bg-rose-100/70 dark:hover:bg-[#ff5555]/15 rounded-lg transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Main App Content Area */}
      <main className="flex-1 bg-[#FBFBFA] dark:bg-[#282a36] min-h-screen p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full overflow-y-auto space-y-4 transition-colors duration-200">
        {emPeriodoGraca && user?.plano === "pro" && (
          <div className="bg-amber-500/10 dark:bg-[#ffb86c]/15 border border-amber-500/30 dark:border-[#ffb86c]/30 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-amber-950 dark:text-[#ffb86c]">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500/20 dark:bg-[#ffb86c]/25 text-amber-800 dark:text-[#ffb86c] flex items-center justify-center shrink-0">
                <Zap className="w-5 h-5 text-amber-600 dark:text-[#ffb86c]" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-amber-900 dark:text-[#ffb86c]">
                  Período de Tolerância Ativo ({diasRestantesGraca} {diasRestantesGraca === 1 ? "dia restante" : "dias restantes"})
                </h4>
                <p className="text-[11px] text-amber-800/90 dark:text-[#f8f8f2]/80 mt-0.5">
                  Sua mensalidade Pro venceu. Mantenha seu plano regularizado para não perder acesso aos recursos exclusivos.
                </p>
              </div>
            </div>
            <Link href="/config">
              <button className="px-3 py-1.5 rounded-lg bg-amber-600 dark:bg-[#ffb86c] hover:bg-amber-700 dark:hover:bg-[#ffa747] text-white dark:text-[#282a36] font-bold text-xs shadow-xs transition-colors shrink-0 cursor-pointer">
                Regularizar Plano
              </button>
            </Link>
          </div>
        )}

        {children}
      </main>
    </div>
  );
}
