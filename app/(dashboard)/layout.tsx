"use client";

import React, { useEffect } from "react";
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
} from "lucide-react";
import { useAuthStore } from "@/lib/auth/useAuthStore";
import { Badge } from "@/components/Common/Badge";
import { ToastContainer } from "@/components/Common/Toast";
import { Logo } from "@/components/Common/Logo";

export const dynamic = "force-dynamic";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, logout, fetchMe } = useAuthStore();
  const [mobileOpen, setMobileOpen] = React.useState(false);

  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

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
  ];

  return (
    <div className="min-h-screen bg-[#FBFBFA] text-slate-900 flex flex-col md:flex-row font-sans">
      <ToastContainer />

      {/* Mobile Top Bar */}
      <div className="md:hidden flex items-center justify-between p-4 bg-white border-b border-slate-200 sticky top-0 z-30">
        <Logo href="/dashboard" size="sm" variant="light" />
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 text-slate-600 hover:text-slate-900 rounded-lg bg-slate-100 hover:bg-slate-200 cursor-pointer transition-colors"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Sidebar Navigation */}
      <aside
        className={`fixed md:sticky top-0 left-0 z-40 h-screen w-64 bg-white border-r border-slate-200/90 flex flex-col justify-between p-5 transition-transform md:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div>
          {/* Logo */}
          <div className="px-1 py-3 mb-6">
            <Logo href="/dashboard" size="md" variant="light" />
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
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm transition-all ${
                    item.highlight && !active
                      ? "bg-blue-600 text-white hover:bg-blue-700 font-bold shadow-md shadow-blue-600/20"
                      : active
                      ? "bg-blue-50 text-blue-700 font-bold border border-blue-200/70 shadow-xs"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 font-medium"
                  }`}
                >
                  <span
                    className={
                      item.highlight && !active
                        ? "text-white"
                        : active
                        ? "text-blue-600"
                        : "text-slate-500"
                    }
                  >
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User Card & Upgrade Prompt */}
        <div className="space-y-4 pt-4 border-t border-slate-200/80">
          {user?.plano === "free" && (
            <div className="p-3.5 rounded-2xl bg-gradient-to-br from-blue-50/80 to-indigo-50/40 border border-blue-100 text-xs">
              <div className="flex items-center justify-between font-bold text-slate-900 mb-1">
                <span>Plano Free</span>
                <Zap className="w-3.5 h-3.5 text-blue-600" />
              </div>
              <p className="text-slate-600 text-[11px] leading-relaxed mb-3">
                {user.propostas_mes_atual || 0}/3 propostas usadas este mês.
              </p>
              <Link href="/config">
                <button className="w-full py-1.5 px-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] transition-colors shadow-xs shadow-blue-600/20 cursor-pointer">
                  Fazer Upgrade Pro (R$ 45,90)
                </button>
              </Link>
            </div>
          )}

          {/* User Profile */}
          <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-200/80">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-blue-100 border border-blue-200 text-blue-700 flex items-center justify-center shrink-0 font-bold text-xs">
                {user?.nome ? user.nome.charAt(0).toUpperCase() : <User className="w-4 h-4" />}
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-slate-900 truncate">
                  {user?.nome || "Usuário"}
                </div>
                <div className="text-[10px] text-slate-500 truncate">
                  <Badge variant={user?.plano === "pro" ? "pro" : "free"} size="sm">
                    {user?.plano?.toUpperCase() || "FREE"}
                  </Badge>
                </div>
              </div>
            </div>
            <button
              onClick={() => {
                logout();
                router.push("/login");
              }}
              title="Sair"
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main App Content Area */}
      <main className="flex-1 bg-[#FBFBFA] min-h-screen p-4 sm:p-6 lg:p-10 max-w-7xl mx-auto w-full overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
