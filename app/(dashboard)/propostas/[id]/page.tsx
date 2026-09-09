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
      {/* Top Action Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white border border-slate-200/90 p-5 rounded-3xl shadow-xs">
        <div className="flex items-center gap-4">
          <Link
            href="/propostas"
            className="p-2 rounded-xl bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-slate-900">
                {proposta.cliente_nome}
              </h1>
              <Badge variant={proposta.status as BadgeVariant} />
            </div>
            <div className="text-xs text-slate-500 mt-0.5 font-mono">
              {proposta.numero} • Criada em{" "}
              {new Date(proposta.criado_em).toLocaleDateString("pt-BR")}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Status Quick Changer */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => handleUpdateStatus("aceita")}
              disabled={isUpdating}
              title="Marcar como Aceita"
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg flex items-center gap-1 transition-all cursor-pointer ${
                proposta.status === "aceita"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "text-slate-600 hover:text-emerald-700"
              }`}
            >
              <CheckCircle className="w-3.5 h-3.5" />
              <span>Aceita</span>
            </button>

            <button
              onClick={() => handleUpdateStatus("recusada")}
              disabled={isUpdating}
              title="Marcar como Recusada"
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg flex items-center gap-1 transition-all cursor-pointer ${
                proposta.status === "recusada"
                  ? "bg-rose-600 text-white shadow-xs"
                  : "text-slate-600 hover:text-rose-700"
              }`}
            >
              <XCircle className="w-3.5 h-3.5" />
              <span>Recusada</span>
            </button>
          </div>

          <Button
            variant="secondary"
            size="sm"
            onClick={handleCopyLink}
            leftIcon={
              copiado ? (
                <Check className="w-4 h-4 text-emerald-600" />
              ) : (
                <Copy className="w-4 h-4" />
              )
            }
          >
            {copiado ? "Copiado!" : "Copiar Link"}
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={handlePrint}
            leftIcon={<Printer className="w-4 h-4" />}
          >
            Imprimir / PDF
          </Button>

          {proposta.status === "rascunho" && (
            <Button
              variant="primary"
              size="sm"
              onClick={handleMarcarEnviada}
              leftIcon={<Send className="w-4 h-4" />}
              className="shadow-md shadow-blue-600/20 font-bold"
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

      {/* Proposal Document Preview Container */}
      <div className="bg-slate-100/70 border border-slate-200/90 rounded-3xl p-4 sm:p-8 shadow-sm">
        <div
          dangerouslySetInnerHTML={{ __html: proposta.conteudo_html }}
          className="bg-white rounded-2xl overflow-hidden shadow-md"
        />
      </div>
    </div>
  );
}
