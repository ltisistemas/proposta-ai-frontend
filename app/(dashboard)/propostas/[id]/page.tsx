"use client";

import React, { useEffect, useState, useCallback, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Printer,
  Copy,
  CheckCircle,
  XCircle,
  Trash2,
  Send,
  Check,
  Building2,
  Calendar,
  FileCheck2,
} from "lucide-react";
import { Button } from "@/components/Common/Button";
import { Badge, BadgeVariant } from "@/components/Common/Badge";
import { useAuthStore } from "@/lib/auth/useAuthStore";
import { useToast } from "@/components/Common/Toast";

export default function VisualizarPropostaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { token } = useAuthStore();
  const { addToast } = useToast();

  const [proposta, setProposta] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [copiado, setCopiado] = useState(false);

  const carregarProposta = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);

    try {
      const res = await fetch(`/api/propostas/${resolvedParams.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.sucesso && data.proposta) {
        setProposta(data.proposta);
      } else {
        addToast({
          type: "error",
          title: "Proposta não encontrada",
        });
        router.push("/propostas");
      }
    } catch (err) {
      console.error("Erro ao carregar proposta:", err);
    } finally {
      setIsLoading(false);
    }
  }, [token, resolvedParams.id, addToast, router]);

  useEffect(() => {
    carregarProposta();
  }, [carregarProposta]);

  const handleUpdateStatus = async (novoStatus: string) => {
    if (!token) return;
    setIsUpdating(true);

    try {
      const res = await fetch(`/api/propostas/${resolvedParams.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: novoStatus }),
      });
      const data = await res.json();
      if (data.sucesso) {
        setProposta((prev: any) => ({ ...prev, status: novoStatus }));
        addToast({
          type: "success",
          title: "Status atualizado!",
          message: `Proposta marcada como ${novoStatus}.`,
        });
      }
    } catch (err) {
      console.error("Erro ao atualizar status:", err);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleMarcarEnviada = async () => {
    if (!token) return;

    try {
      const res = await fetch(`/api/propostas/${resolvedParams.id}/enviar`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ email: proposta.cliente_email }),
      });
      const data = await res.json();
      if (data.sucesso) {
        setProposta((prev: any) => ({ ...prev, status: "enviada" }));
        addToast({
          type: "success",
          title: "Proposta enviada!",
          message: "Status atualizado para Enviada.",
        });
      }
    } catch (err) {
      console.error("Erro ao enviar:", err);
    }
  };

  const handleCopyLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    setCopiado(true);
    addToast({
      type: "success",
      title: "Link copiado!",
      message: "Link da proposta pronto para enviar ao cliente.",
    });
    setTimeout(() => setCopiado(false), 2500);
  };

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    if (printWindow && proposta?.conteudo_html) {
      printWindow.document.write(proposta.conteudo_html);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 500);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Tem certeza que deseja excluir esta proposta?")) return;
    if (!token) return;

    try {
      const res = await fetch(`/api/propostas/${resolvedParams.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.sucesso) {
        addToast({
          type: "success",
          title: "Proposta excluída com sucesso!",
        });
        router.push("/propostas");
      }
    } catch (err) {
      console.error("Erro ao excluir proposta:", err);
    }
  };

  if (isLoading) {
    return (
      <div className="p-16 text-center text-slate-500">
        Carregando proposta comercial...
      </div>
    );
  }

  if (!proposta) return null;

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      {/* Breadcrumbs & Navigation */}
      <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
        <Link
          href="/propostas"
          className="hover:text-blue-600 transition-colors flex items-center gap-1.5"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Minhas Propostas</span>
        </Link>
        <span>/</span>
        <span className="text-slate-800 font-mono">{proposta.numero}</span>
      </div>

      {/* Top Executive Header Card */}
      <div className="bg-white border border-slate-200/90 p-5 sm:p-6 rounded-3xl shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                {proposta.cliente_nome}
              </h1>
              <Badge variant={proposta.status as BadgeVariant} />
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 mt-2 font-medium">
              <span className="font-mono bg-slate-100 px-2.5 py-0.5 rounded-md text-slate-700 font-bold">
                {proposta.numero}
              </span>
              {proposta.cliente_empresa && (
                <span className="flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5 text-slate-400" />
                  {proposta.cliente_empresa}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                Criada em {new Date(proposta.criado_em).toLocaleDateString("pt-BR")}
              </span>
            </div>
          </div>

          {/* Action Group */}
          <div className="flex flex-wrap items-center gap-2.5 pt-2 lg:pt-0">
            {/* Status Quick Changer */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                onClick={() => handleUpdateStatus("aceita")}
                disabled={isUpdating}
                title="Marcar como Aceita"
                className={`px-3 py-1.5 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                  proposta.status === "aceita"
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "text-slate-600 hover:text-emerald-700 hover:bg-emerald-50"
                }`}
              >
                <CheckCircle className="w-3.5 h-3.5" />
                <span>Aceita</span>
              </button>

              <button
                onClick={() => handleUpdateStatus("recusada")}
                disabled={isUpdating}
                title="Marcar como Recusada"
                className={`px-3 py-1.5 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                  proposta.status === "recusada"
                    ? "bg-rose-600 text-white shadow-xs"
                    : "text-slate-600 hover:text-rose-700 hover:bg-rose-50"
                }`}
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>Recusada</span>
              </button>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyLink}
              leftIcon={
                copiado ? (
                  <Check className="w-4 h-4 text-emerald-600" />
                ) : (
                  <Copy className="w-4 h-4" />
                )
              }
              className="text-xs font-bold"
            >
              {copiado ? "Copiado!" : "Copiar Link"}
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handlePrint}
              leftIcon={<Printer className="w-4 h-4" />}
              className="text-xs font-bold"
            >
              Imprimir / PDF
            </Button>

            {proposta.status === "rascunho" && (
              <Button
                variant="primary"
                size="sm"
                onClick={handleMarcarEnviada}
                leftIcon={<Send className="w-4 h-4" />}
                className="shadow-md shadow-blue-600/20 font-bold text-xs"
              >
                Marcar Enviada
              </Button>
            )}

            <button
              onClick={handleDelete}
              title="Excluir proposta"
              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Document Reader Container (Executive Canvas) */}
      <div className="bg-[#F1F5F9] border border-slate-200/90 rounded-3xl p-4 sm:p-8 md:p-10 shadow-sm flex flex-col items-center">
        <div className="w-full max-w-4xl bg-white rounded-2xl overflow-hidden shadow-2xl border border-slate-200/80 min-h-[90vh]">
          <iframe
            srcDoc={proposta.conteudo_html}
            title={`Proposta Comercial ${proposta.numero}`}
            className="w-full min-h-[90vh] h-full border-0 block"
            style={{ minHeight: "90vh" }}
          />
        </div>
      </div>
    </div>
  );
}
