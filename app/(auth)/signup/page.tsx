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
  const [aceitouTermos, setAceitouTermos] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 6) {
      setError("A senha deve ter no mínimo 6 caracteres.");
      return;
    }

    if (!aceitouTermos) {
      setError("Você precisa aceitar os Termos de Uso e a Política de Privacidade (LGPD) para criar sua conta.");
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
        message: "Bem-vindo ao ViraPropo AI!! Você já pode gerar suas propostas.",
      });

      router.push("/dashboard");
    } catch (err) {
      console.error("Erro no cadastro:", err);
      setError("Erro ao conectar com o servidor. Tente novamente.");
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white border border-slate-200/90 rounded-3xl p-8 shadow-xl shadow-slate-200/50">
      <ToastContainer />
      <div className="text-center mb-8">
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">
          Crie sua conta no ViraPropo AI!
        </h1>
        <p className="text-slate-500 text-sm mt-1.5">
          Comece a gerar propostas comerciais profissionais com IA hoje
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-start gap-2.5">
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
        />

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
          label="Senha"
          type="password"
          required
          placeholder="Mínimo 6 caracteres"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          leftIcon={<Lock className="w-4 h-4" />}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <Input
            label="Nome da Empresa (Opcional)"
            type="text"
            placeholder="Minha Consultoria"
            value={empresaNome}
            onChange={(e) => setEmpresaNome(e.target.value)}
            leftIcon={<Building2 className="w-4 h-4" />}
          />

          <Input
            label="CNPJ (Opcional)"
            type="text"
            placeholder="00.000.000/0001-00"
            value={empresaCnpj}
            onChange={(e) => setEmpresaCnpj(e.target.value)}
            leftIcon={<FileText className="w-4 h-4" />}
          />
        </div>

        <div className="p-3 bg-blue-50/70 rounded-xl border border-blue-100 flex items-center gap-2 text-xs text-blue-900">
          <Check className="w-4 h-4 text-blue-600 shrink-0" />
          <span>Plano Grátis incluso: 3 propostas completas com IA todo mês.</span>
        </div>

        {/* LGPD Agreement Checkbox */}
        <div className="pt-1">
          <label className="flex items-start gap-2.5 text-xs text-slate-600 cursor-pointer select-none">
            <input
              type="checkbox"
              required
              checked={aceitouTermos}
              onChange={(e) => setAceitouTermos(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 shrink-0 cursor-pointer"
            />
            <span className="leading-relaxed">
              Li e concordo com os{" "}
              <Link
                href="/termos"
                target="_blank"
                className="text-blue-600 font-bold hover:underline"
              >
                Termos de Uso
              </Link>{" "}
              e com a{" "}
              <Link
                href="/privacidade"
                target="_blank"
                className="text-blue-600 font-bold hover:underline"
              >
                Política de Privacidade (LGPD)
              </Link>
              .
            </span>
          </label>
        </div>

        <div className="pt-2">
          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full justify-center shadow-lg shadow-blue-600/20 font-bold"
            isLoading={isLoading}
            rightIcon={<ArrowRight className="w-4 h-4" />}
          >
            Criar Conta e Acessar
          </Button>
        </div>
      </form>

      <div className="mt-8 pt-6 border-t border-slate-100 text-center">
        <p className="text-sm text-slate-600">
          Já possui cadastro?{" "}
          <Link
            href="/login"
            className="text-blue-600 font-bold hover:text-blue-700 underline underline-offset-4"
          >
            Fazer login
          </Link>
        </p>
      </div>
    </div>
  );
}
