"use client";

import React, { useState } from "react";
import { X, UserPlus, Shield, Sparkles, Building, Mail, Lock, User } from "lucide-react";
import { Button } from "@/components/Common/Button";
import { useAuthStore } from "@/lib/auth/useAuthStore";
import { addToast } from "@/components/Common/Toast";

interface CreateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateUserModal({
  isOpen,
  onClose,
  onSuccess,
}: CreateUserModalProps) {
  const { token } = useAuthStore();
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [empresaNome, setEmpresaNome] = useState("");
  const [empresaCnpj, setEmpresaCnpj] = useState("");
  const [role, setRole] = useState<"cliente" | "admin">("cliente");
  const [plano, setPlano] = useState<"free" | "pro">("free");
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim() || !email.trim() || !password) {
      addToast({
        title: "Campos obrigatórios",
        message: "Preencha nome, email e senha.",
        type: "error",
      });
      return;
    }

    if (password.length < 6) {
      addToast({
        title: "Senha curta",
        message: "A senha deve conter no mínimo 6 caracteres.",
        type: "error",
      });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          nome: nome.trim(),
          email: email.trim(),
          password,
          empresaNome: empresaNome.trim() || undefined,
          empresaCnpj: empresaCnpj.trim() || undefined,
          role,
          plano,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.sucesso) {
        throw new Error(data.erro || "Falha ao criar usuário");
      }

      addToast({
        title: "Usuário criado!",
        message: `O usuário ${nome} foi criado com sucesso.`,
        type: "success",
      });

      // Reset
      setNome("");
      setEmail("");
      setPassword("");
      setEmpresaNome("");
      setEmpresaCnpj("");
      setRole("cliente");
      setPlano("free");

      onSuccess();
      onClose();
    } catch (err: any) {
      addToast({
        title: "Erro ao criar",
        message: err.message || "Não foi possível criar o usuário.",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-[#282a36] rounded-2xl shadow-xl max-w-lg w-full p-6 relative animate-in fade-in zoom-in-95 duration-150 my-8 border border-slate-200 dark:border-[#44475a]">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-700 dark:text-[#6272a4] dark:hover:text-[#f8f8f2] hover:bg-slate-100 dark:hover:bg-[#343746] rounded-lg transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/50">
            <UserPlus className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-[#f8f8f2]">Adicionar Novo Usuário</h3>
            <p className="text-xs text-slate-500 dark:text-[#cbd5e1]">
              Cadastre um novo usuário manualmente com perfil e plano definidos.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-[#f8f8f2] mb-1">
              Nome Completo *
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 dark:text-[#6272a4] absolute left-3 top-3" />
              <input
                type="text"
                required
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Ex: João da Silva"
                className="w-full pl-9 pr-3 py-2 text-sm rounded-xl bg-white dark:bg-[#343746] border border-slate-200 dark:border-[#44475a] text-slate-900 dark:text-[#f8f8f2] placeholder:text-slate-400 dark:placeholder:text-[#6272a4] focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:focus:border-[#bd93f9]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-[#f8f8f2] mb-1">
              E-mail *
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 dark:text-[#6272a4] absolute left-3 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="usuario@empresa.com"
                className="w-full pl-9 pr-3 py-2 text-sm rounded-xl bg-white dark:bg-[#343746] border border-slate-200 dark:border-[#44475a] text-slate-900 dark:text-[#f8f8f2] placeholder:text-slate-400 dark:placeholder:text-[#6272a4] focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:focus:border-[#bd93f9]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-[#f8f8f2] mb-1">
              Senha Provisória *
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 dark:text-[#6272a4] absolute left-3 top-3" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                className="w-full pl-9 pr-3 py-2 text-sm rounded-xl bg-white dark:bg-[#343746] border border-slate-200 dark:border-[#44475a] text-slate-900 dark:text-[#f8f8f2] placeholder:text-slate-400 dark:placeholder:text-[#6272a4] focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:focus:border-[#bd93f9]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-[#f8f8f2] mb-1">
                Nome da Empresa (Opcional)
              </label>
              <div className="relative">
                <Building className="w-4 h-4 text-slate-400 dark:text-[#6272a4] absolute left-3 top-3" />
                <input
                  type="text"
                  value={empresaNome}
                  onChange={(e) => setEmpresaNome(e.target.value)}
                  placeholder="Minha Empresa Ltda"
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-xl bg-white dark:bg-[#343746] border border-slate-200 dark:border-[#44475a] text-slate-900 dark:text-[#f8f8f2] placeholder:text-slate-400 dark:placeholder:text-[#6272a4] focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:focus:border-[#bd93f9]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-[#f8f8f2] mb-1">
                CNPJ (Opcional)
              </label>
              <input
                type="text"
                value={empresaCnpj}
                onChange={(e) => setEmpresaCnpj(e.target.value)}
                placeholder="00.000.000/0001-00"
                className="w-full px-3 py-2 text-sm rounded-xl bg-white dark:bg-[#343746] border border-slate-200 dark:border-[#44475a] text-slate-900 dark:text-[#f8f8f2] placeholder:text-slate-400 dark:placeholder:text-[#6272a4] focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:focus:border-[#bd93f9]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-[#f8f8f2] mb-1">
                Perfil de Acesso (Role)
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setRole("cliente")}
                  className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                    role === "cliente"
                      ? "bg-blue-50 dark:bg-blue-950/40 border-blue-500 dark:border-blue-400 text-blue-700 dark:text-blue-300 font-bold shadow-xs"
                      : "border-slate-200 dark:border-[#44475a] text-slate-600 dark:text-[#cbd5e1] hover:bg-slate-50 dark:hover:bg-[#343746]"
                  }`}
                >
                  <User className="w-3.5 h-3.5" />
                  Cliente
                </button>
                <button
                  type="button"
                  onClick={() => setRole("admin")}
                  className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                    role === "admin"
                      ? "bg-indigo-50 dark:bg-indigo-950/40 border-indigo-500 dark:border-indigo-400 text-indigo-700 dark:text-indigo-300 font-bold shadow-xs"
                      : "border-slate-200 dark:border-[#44475a] text-slate-600 dark:text-[#cbd5e1] hover:bg-slate-50 dark:hover:bg-[#343746]"
                  }`}
                >
                  <Shield className="w-3.5 h-3.5" />
                  Admin
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-[#f8f8f2] mb-1">
                Plano Inicial
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPlano("free")}
                  className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                    plano === "free"
                      ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 dark:border-emerald-400 text-emerald-700 dark:text-emerald-300 font-bold shadow-xs"
                      : "border-slate-200 dark:border-[#44475a] text-slate-600 dark:text-[#cbd5e1] hover:bg-slate-50 dark:hover:bg-[#343746]"
                  }`}
                >
                  Free (3/mês)
                </button>
                <button
                  type="button"
                  onClick={() => setPlano("pro")}
                  className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                    plano === "pro"
                      ? "bg-amber-50 dark:bg-amber-950/40 border-amber-500 dark:border-amber-400 text-amber-700 dark:text-amber-300 font-bold shadow-xs"
                      : "border-slate-200 dark:border-[#44475a] text-slate-600 dark:text-[#cbd5e1] hover:bg-slate-50 dark:hover:bg-[#343746]"
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                  Pro
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-[#44475a]">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={loading}
            >
              Criar Usuário
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
