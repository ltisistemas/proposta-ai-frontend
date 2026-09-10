"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mail, Lock, ArrowRight } from "lucide-react";
import { Input } from "@/components/Common/Input";
import { Button } from "@/components/Common/Button";
import { useAuthStore } from "@/lib/auth/useAuthStore";
import { ToastContainer, useToast } from "@/components/Common/Toast";

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);
  const { addToast } = useToast();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok || !data.sucesso) {
        setError(data.erro || "Credenciais inválidas. Verifique seu email e senha.");
        setIsLoading(false);
        return;
      }

      setAuth(
        data.token,
        data.usuario,
        data.emPeriodoGraca,
        data.diasRestantesGraca,
        data.cancelamentoAgendado
      );
      addToast({
        type: "success",
        title: "Login realizado com sucesso!",
        message: `Bem-vindo de volta, ${data.usuario.nome}!`,
      });

      router.push("/dashboard");
    } catch (err) {
      console.error("Erro no login:", err);
      setError("Erro ao conectar com o servidor. Tente novamente.");
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white border border-slate-200/90 rounded-3xl p-8 shadow-xl shadow-slate-200/50">
      <ToastContainer />
      <div className="text-center mb-8">
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">
          Acesse sua conta
        </h1>
        <p className="text-slate-500 text-sm mt-1.5">
          Entre para gerenciar suas propostas e fechar negócios
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-start gap-2.5">
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Email Profissional"
          type="email"
          required
          placeholder="seu.email@empresa.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          leftIcon={<Mail className="w-4 h-4" />}
        />

        <Input
          label="Senha de Acesso"
          type="password"
          required
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          leftIcon={<Lock className="w-4 h-4" />}
        />

        <div className="pt-2">
          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full justify-center shadow-lg shadow-blue-600/20 font-bold"
            isLoading={isLoading}
            rightIcon={<ArrowRight className="w-4 h-4" />}
          >
            Entrar na Plataforma
          </Button>
        </div>
      </form>

      <div className="mt-8 pt-6 border-t border-slate-100 text-center">
        <p className="text-sm text-slate-600">
          Ainda não tem uma conta?{" "}
          <Link
            href="/signup"
            className="text-blue-600 font-bold hover:text-blue-700 underline underline-offset-4"
          >
            Cadastre-se grátis
          </Link>
        </p>
      </div>
    </div>
  );
}
