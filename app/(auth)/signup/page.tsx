"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mail, Lock, User, Building2, FileText, ArrowRight, Check } from "lucide-react";
import { Input } from "@/components/Common/Input";
import { Button } from "@/components/Common/Button";
import { useAuthStore } from "@/lib/auth/useAuthStore";
import { ToastContainer, useToast } from "@/components/Common/Toast";

export default function SignupPage() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);
  const { addToast } = useToast();

  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [empresaNome, setEmpresaNome] = useState("");
  const [empresaCnpj, setEmpresaCnpj] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 6) {
      setError("A senha deve ter no mínimo 6 caracteres.");
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome,
          email,
          password,
          empresaNome: empresaNome || undefined,
          empresaCnpj: empresaCnpj || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.sucesso) {
        setError(data.erro || "Falha ao criar conta. Verifique os dados.");
        setIsLoading(false);
        return;
      }

      setAuth(data.token, data.usuario);
      addToast({
        type: "success",
        title: "Conta criada com sucesso!",
        message: "Você já pode começar a gerar propostas incríveis.",
      });

      router.push("/dashboard");
    } catch (err) {
      console.error("Erro no cadastro:", err);
      setError("Erro ao conectar com o servidor. Tente novamente.");
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-8 backdrop-blur-xl shadow-2xl">
      <ToastContainer />
      <div className="text-center mb-8">
        <h1 className="text-2xl font-black text-white tracking-tight">
          Crie sua conta grátis
        </h1>
        <p className="text-slate-400 text-sm mt-2">
          Comece a gerar propostas comerciais profissionais com IA hoje
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm flex items-start gap-2.5">
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Seu Nome Completo"
          type="text"
          required
          placeholder="Ex: João da Silva"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          leftIcon={<User className="w-4 h-4" />}
          className="bg-slate-950/60 border-slate-700 text-white placeholder:text-slate-500 focus:border-indigo-500"
        />

        <Input
          label="Email Profissional"
          type="email"
          required
          placeholder="seu.email@empresa.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          leftIcon={<Mail className="w-4 h-4" />}
          className="bg-slate-950/60 border-slate-700 text-white placeholder:text-slate-500 focus:border-indigo-500"
        />

        <Input
          label="Senha"
          type="password"
          required
          placeholder="Mínimo 6 caracteres"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          leftIcon={<Lock className="w-4 h-4" />}
          className="bg-slate-950/60 border-slate-700 text-white placeholder:text-slate-500 focus:border-indigo-500"
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <Input
            label="Nome da Empresa (Opcional)"
            type="text"
            placeholder="Minha Consultoria"
            value={empresaNome}
            onChange={(e) => setEmpresaNome(e.target.value)}
            leftIcon={<Building2 className="w-4 h-4" />}
            className="bg-slate-950/60 border-slate-700 text-white placeholder:text-slate-500 focus:border-indigo-500"
          />

          <Input
            label="CNPJ (Opcional)"
            type="text"
            placeholder="00.000.000/0001-00"
            value={empresaCnpj}
            onChange={(e) => setEmpresaCnpj(e.target.value)}
            leftIcon={<FileText className="w-4 h-4" />}
            className="bg-slate-950/60 border-slate-700 text-white placeholder:text-slate-500 focus:border-indigo-500"
          />
        </div>

        <div className="p-3 bg-slate-950/40 rounded-xl border border-slate-800 flex items-center gap-2 text-xs text-slate-400">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Plano Grátis incluso: 3 propostas completas com IA todo mês.</span>
        </div>

        <div className="pt-2">
          <Button
            type="submit"
            variant="gradient"
            size="lg"
            className="w-full justify-center"
            isLoading={isLoading}
            rightIcon={<ArrowRight className="w-4 h-4" />}
          >
            Criar Conta e Acessar
          </Button>
        </div>
      </form>

      <div className="mt-8 pt-6 border-t border-slate-800/80 text-center">
        <p className="text-sm text-slate-400">
          Já possui cadastro?{" "}
          <Link
            href="/login"
            className="text-indigo-400 font-semibold hover:text-indigo-300 underline underline-offset-4"
          >
            Fazer login
          </Link>
        </p>
      </div>
    </div>
  );
}
