"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface AuthUser {
  id: string;
  email: string;
  nome: string;
  empresa_nome?: string | null;
  empresa_cnpj?: string | null;
  empresa_email?: string | null;
  empresa_telefone?: string | null;
  empresa_logo_url?: string | null;
  plano: "free" | "pro";
  propostas_mes_atual?: number;
  data_proxima_cobranca?: Date | string | null;
}

interface AuthStore {
  token: string | null;
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  emPeriodoGraca: boolean;
  diasRestantesGraca: number;
  setAuth: (token: string, user: AuthUser, emPeriodoGraca?: boolean, diasRestantesGraca?: number) => void;
  updateUser: (user: Partial<AuthUser>) => void;
  logout: () => void;
  fetchMe: () => Promise<void>;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      isAuthenticated: false,
      isLoading: false,
      emPeriodoGraca: false,
      diasRestantesGraca: 0,

      setAuth: (token, user, emPeriodoGraca = false, diasRestantesGraca = 0) => {
        if (typeof window !== "undefined") {
          localStorage.setItem("proposta_ai_token", token);
          document.cookie = `proposta_ai_token=${token}; path=/; max-age=604800; SameSite=Lax`;
        }
        set({
          token,
          user,
          isAuthenticated: true,
          isLoading: false,
          emPeriodoGraca: !!emPeriodoGraca,
          diasRestantesGraca: diasRestantesGraca || 0,
        });
      },

      updateUser: (updatedFields) => {
        const currentUser = get().user;
        if (currentUser) {
          set({ user: { ...currentUser, ...updatedFields } });
        }
      },

      logout: () => {
        if (typeof window !== "undefined") {
          localStorage.removeItem("proposta_ai_token");
          document.cookie = "proposta_ai_token=; path=/; max-age=0";
        }
        set({
          token: null,
          user: null,
          isAuthenticated: false,
          isLoading: false,
          emPeriodoGraca: false,
          diasRestantesGraca: 0,
        });
      },

      fetchMe: async () => {
        const token = get().token || (typeof window !== "undefined" ? localStorage.getItem("proposta_ai_token") : null);
        if (!token) {
          set({ isAuthenticated: false, user: null });
          return;
        }

        try {
          const res = await fetch("/api/auth/me", {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          const data = await res.json();
          if (data.sucesso && data.usuario) {
            set({
              token,
              user: data.usuario,
              isAuthenticated: true,
              emPeriodoGraca: !!data.emPeriodoGraca,
              diasRestantesGraca: data.diasRestantesGraca || 0,
            });
          } else {
            get().logout();
          }
        } catch (error) {
          console.error("Erro ao verificar sessão:", error);
        }
      },
    }),
    {
      name: "proposta_ai_auth_storage",
    }
  )
);
