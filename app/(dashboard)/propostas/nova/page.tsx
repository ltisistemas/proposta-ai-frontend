"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  Plus,
  Trash2,
  DollarSign,
  FileText,
  User,
  Clock,
  ArrowRight,
  Printer,
  Copy,
  Check,
  CheckCircle2,
  ExternalLink,
  Lock,
  MessageCircle,
} from "lucide-react";
import { Input, TextArea } from "@/components/Common/Input";
import { Button } from "@/components/Common/Button";
import { Card } from "@/components/Common/Card";
import { Modal } from "@/components/Common/Modal";
import { useAuthStore } from "@/lib/auth/useAuthStore";
import { useToast } from "@/components/Common/Toast";
import { UpgradeModal, UpgradeFeatureType } from "@/components/Billing/UpgradeModal";
import { WhatsAppModal } from "@/components/Proposta/WhatsAppModal";

interface ItemRow {
  descricao: string;
  quantidade: number;
  valorUnitario: number;
}

export default function NovaPropostaPage() {
  const router = useRouter();
  const { token, user } = useAuthStore();
  const { addToast } = useToast();

  const isPro = user?.plano === "pro";
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [upgradeFeature, setUpgradeFeature] = useState<"pdf" | "link" | "general">("general");
  const [whatsAppModalOpen, setWhatsAppModalOpen] = useState(false);

  // Form states
  const [clienteNome, setClienteNome] = useState("");
  const [clienteEmpresa, setClienteEmpresa] = useState("");
  const [clienteEmail, setClienteEmail] = useState("");
  const [clienteTelefone, setClienteTelefone] = useState("");
  const [descricao, setDescricao] = useState("");
  const [prazoPagamento, setPrazoPagamento] = useState("À Vista");
  const [validadeDias, setValidadeDias] = useState(30);
  const [observacoes, setObservacoes] = useState("");

  const [itens, setItens] = useState<ItemRow[]>([
    { descricao: "", quantidade: 1, valorUnitario: 0 },
  ]);

  // Generation states
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedHtml, setGeneratedHtml] = useState<string | null>(null);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [propostaCriadaId, setPropostaCriadaId] = useState<string | null>(null);
  const [propostaNumero, setPropostaNumero] = useState<string | null>(null);
  const [copiadoLink, setCopiadoLink] = useState(false);

  // Math Calculations
  const calcularTotal = () => {
    return itens.reduce(
      (acc, item) => acc + (item.quantidade || 0) * (item.valorUnitario || 0),
      0
    );
  };

  const handleAddItem = () => {
    setItens([...itens, { descricao: "", quantidade: 1, valorUnitario: 0 }]);
  };

  const handleRemoveItem = (index: number) => {
    if (itens.length === 1) {
      addToast({
        type: "warning",
        title: "Atenção",
        message: "A proposta deve conter pelo menos um item.",
      });
      return;
    }
    setItens(itens.filter((_, i) => i !== index));
  };

  const handleUpdateItem = (
    index: number,
    field: keyof ItemRow,
    value: string | number
  ) => {
    const novosItens = [...itens];
    novosItens[index] = { ...novosItens[index], [field]: value };
    setItens(novosItens);
  };

  const handleGerarProposta = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    if (!clienteNome.trim()) {
      addToast({ type: "error", title: "Preencha o nome do cliente" });
      return;
    }

    if (!descricao.trim()) {
      addToast({ type: "error", title: "Informe a descrição do projeto" });
      return;
    }

    const itensValidos = itens.filter((i) => i.descricao.trim().length > 0);
    if (itensValidos.length === 0) {
      addToast({
        type: "error",
        title: "Adicione pelo menos um item com descrição",
      });
      return;
    }

    setIsGenerating(true);

    try {
      const res = await fetch("/api/gerar-proposta", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          clienteNome,
          clienteEmpresa: clienteEmpresa || undefined,
          clienteEmail: clienteEmail || undefined,
          clienteTelefone: clienteTelefone || undefined,
          descricao,
          itens: itensValidos.map((item) => ({
            descricao: item.descricao.trim(),
            quantidade: Number(item.quantidade) || 1,
            valorUnitario: Number(item.valorUnitario) || 0,
          })),
          prazoPagamento,
          validadeDias: Number(validadeDias),
          observacoes: observacoes || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.sucesso) {
        if (data.precisaUpgrade) {
          addToast({
            type: "warning",
            title: "Limite de Propostas Atingido",
            message: "Faça upgrade para o Plano Pro para propostas ilimitadas.",
          });
          router.push("/config");
          return;
        }

        addToast({
          type: "error",
          title: "Erro ao gerar proposta",
          message: data.erro || "Tente novamente.",
        });
        setIsGenerating(false);
        return;
      }

      setGeneratedHtml(data.proposta.conteudoHtml);
      setPropostaCriadaId(data.proposta.id);
      setPropostaNumero(data.proposta.numero);
      setPreviewModalOpen(true);
      addToast({
        type: "success",
        title: "Proposta gerada com sucesso!",
        message: `Proposta ${data.proposta.numero} sintetizada pela IA.`,
      });
    } catch (err) {
      console.error("Erro na geração da proposta:", err);
      addToast({
        type: "error",
        title: "Erro de conexão",
        message: "Não foi possível contactar o servidor.",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyLink = () => {
    if (!isPro) {
      setUpgradeFeature("link");
      setUpgradeModalOpen(true);
      return;
    }
    if (!propostaCriadaId) return;
    const url = `${window.location.origin}/p/${propostaCriadaId}`;
    navigator.clipboard.writeText(url);
    setCopiadoLink(true);
    addToast({
      type: "success",
      title: "Link público copiado!",
      message: "Link da proposta pronto para enviar ao cliente.",
    });
    setTimeout(() => setCopiadoLink(false), 2500);
  };

  const handlePrint = () => {
    if (!isPro) {
      setUpgradeFeature("pdf");
      setUpgradeModalOpen(true);
      return;
    }
    const printWindow = window.open("", "_blank");
    if (printWindow && generatedHtml) {
      printWindow.document.write(generatedHtml);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 500);
    }
  };

  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(valor);
  };

  return (
    <>
      <UpgradeModal
        isOpen={upgradeModalOpen}
        onClose={() => setUpgradeModalOpen(false)}
        feature={upgradeFeature}
      />

      {propostaCriadaId && (
        <WhatsAppModal
          isOpen={whatsAppModalOpen}
          onClose={() => setWhatsAppModalOpen(false)}
          dados={{
            numero: propostaNumero || "PROP-NOVA",
            clienteNome,
            clienteEmpresa,
            empresaNome: user?.empresa_nome || user?.nome,
            empresaTelefone: clienteTelefone || user?.empresa_telefone,
            descricao,
            total: calcularTotal(),
            prazoPagamento,
            validadeDias,
            itens,
            publicUrl: `${typeof window !== "undefined" ? window.location.origin : ""}/p/${propostaCriadaId}`,
          }}
        />
      )}

      <div className="max-w-5xl mx-auto space-y-8 pb-12">
        {/* Header */}
        <div>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                <Sparkles className="w-7 h-7 text-blue-600" />
                Gerador de Proposta com IA
              </h1>
              <p className="text-slate-600 text-sm mt-1">
                Preencha os dados do cliente e escopo. O motor de IA formatará a proposta comercial ideal.
              </p>
            </div>

            {!isPro && (
              <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 px-3.5 py-1.5 rounded-2xl text-xs text-amber-900">
                <span className="font-bold">Modo Free:</span> Estilo Notepad Monocromático.
                <button
                  type="button"
                  onClick={() => {
                    setUpgradeFeature("general");
                    setUpgradeModalOpen(true);
                  }}
                  className="font-bold text-blue-700 hover:underline ml-1 cursor-pointer"
                >
                  Fazer Upgrade Pro
                </button>
              </div>
            )}
          </div>
        </div>

      <form onSubmit={handleGerarProposta} className="space-y-6">
        {/* Step 1: Dados do Cliente */}
        <Card className="bg-white border-slate-200/90 p-6 sm:p-8 rounded-3xl shadow-xs">
          <div className="flex items-center gap-2.5 pb-4 mb-4 border-b border-slate-100 text-slate-900 font-bold text-base">
            <User className="w-5 h-5 text-blue-600" />
            <span>1. Informações do Cliente</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Nome do Cliente ou Contato Principal *"
              placeholder="Ex: Carlos Eduardo"
              required
              value={clienteNome}
              onChange={(e) => setClienteNome(e.target.value)}
            />

            <Input
              label="Nome da Empresa do Cliente"
              placeholder="Ex: Nexus Logística Ltda"
              value={clienteEmpresa}
              onChange={(e) => setClienteEmpresa(e.target.value)}
            />

            <Input
              label="Email do Cliente"
              type="email"
              placeholder="carlos@nexuslog.com.br"
              value={clienteEmail}
              onChange={(e) => setClienteEmail(e.target.value)}
            />

            <Input
              label="Telefone / WhatsApp"
              placeholder="(11) 98765-4321"
              value={clienteTelefone}
              onChange={(e) => setClienteTelefone(e.target.value)}
            />
          </div>
        </Card>

        {/* Step 2: Escopo e Descrição */}
        <Card className="bg-white border-slate-200/90 p-6 sm:p-8 rounded-3xl shadow-xs">
          <div className="flex items-center gap-2.5 pb-4 mb-4 border-b border-slate-100 text-slate-900 font-bold text-base">
            <FileText className="w-5 h-5 text-sky-600" />
            <span>2. Escopo do Projeto & Necessidade do Cliente</span>
          </div>

          <TextArea
            label="Descreva o que será realizado e os objetivos principais *"
            rows={4}
            required
            placeholder="Ex: Consultoria técnica para modernização da infraestrutura em nuvem, migração de banco de dados e implementação de agentes de IA para atendimento ao cliente."
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            className="leading-relaxed"
          />
        </Card>

        {/* Step 3: Itens e Investimento */}
        <Card className="bg-white border-slate-200/90 p-6 sm:p-8 rounded-3xl shadow-xs">
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100 text-slate-900 font-bold text-base">
            <div className="flex items-center gap-2.5">
              <DollarSign className="w-5 h-5 text-emerald-600" />
              <span>3. Entregáveis & Valores (R$)</span>
            </div>
            <button
              type="button"
              onClick={handleAddItem}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 text-xs font-bold cursor-pointer transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Adicionar Item</span>
            </button>
          </div>

          <div className="space-y-3">
            {itens.map((item, idx) => (
              <div
                key={idx}
                className="grid grid-cols-12 gap-3 items-end bg-slate-50/70 p-3.5 rounded-2xl border border-slate-200/80"
              >
                <div className="col-span-12 sm:col-span-6">
                  <Input
                    label={`Item #${idx + 1} - Descrição`}
                    placeholder="Descrição do serviço/entregável"
                    required
                    value={item.descricao}
                    onChange={(e) =>
                      handleUpdateItem(idx, "descricao", e.target.value)
                    }
                  />
                </div>

                <div className="col-span-4 sm:col-span-2">
                  <Input
                    label="Qtd"
                    type="number"
                    min="1"
                    required
                    value={item.quantidade}
                    onChange={(e) =>
                      handleUpdateItem(idx, "quantidade", Number(e.target.value))
                    }
                    className="text-center"
                  />
                </div>

                <div className="col-span-6 sm:col-span-3">
                  <Input
                    label="Valor Unitário (R$)"
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={item.valorUnitario}
                    onChange={(e) =>
                      handleUpdateItem(idx, "valorUnitario", Number(e.target.value))
                    }
                    className="font-mono"
                  />
                </div>

                <div className="col-span-2 sm:col-span-1 flex justify-center pb-2">
                  <button
                    type="button"
                    onClick={() => handleRemoveItem(idx)}
                    title="Remover Item"
                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Subtotal Banner */}
          <div className="mt-6 p-4 rounded-2xl bg-blue-50/80 border border-blue-200 flex items-center justify-between">
            <span className="text-sm font-bold text-blue-900">
              Valor Total Calculado:
            </span>
            <span className="text-2xl font-black text-blue-700 font-mono">
              {formatarMoeda(calcularTotal())}
            </span>
          </div>
        </Card>

        {/* Step 4: Prazos e Condições */}
        <Card className="bg-white border-slate-200/90 p-6 sm:p-8 rounded-3xl shadow-xs">
          <div className="flex items-center gap-2.5 pb-4 mb-4 border-b border-slate-100 text-slate-900 font-bold text-base">
            <Clock className="w-5 h-5 text-amber-600" />
            <span>4. Condições Comerciais</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Forma e Prazo de Pagamento"
              placeholder="Ex: 50% entrada + 50% na aprovação final"
              value={prazoPagamento}
              onChange={(e) => setPrazoPagamento(e.target.value)}
            />

            <Input
              label="Validade da Proposta (Dias)"
              type="number"
              min="1"
              value={validadeDias}
              onChange={(e) => setValidadeDias(Number(e.target.value))}
            />
          </div>

          <div className="mt-4">
            <TextArea
              label="Observações Adicionais (Opcional)"
              rows={2}
              placeholder="Ex: Não inclui custos de hospedagem de terceiros..."
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
            />
          </div>
        </Card>

        {/* Action Button */}
        <div className="pt-2">
          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full justify-center text-base py-4 font-bold shadow-xl shadow-blue-600/25 bg-blue-600 hover:bg-blue-700 text-white"
            isLoading={isGenerating}
            rightIcon={<Sparkles className="w-5 h-5" />}
          >
            {isGenerating
              ? "A Inteligência Artificial está sintetizando sua proposta..."
              : "Gerar Proposta Comercial com Gemini IA"}
          </Button>
        </div>
      </form>

      {/* Fullscreen Document Preview Modal */}
      <Modal
        isOpen={previewModalOpen}
        onClose={() => {
          setPreviewModalOpen(false);
          if (propostaCriadaId) {
            router.push(`/propostas/${propostaCriadaId}`);
          }
        }}
        size="full"
        icon={
          <div className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center">
            <Sparkles className="w-5 h-5" />
          </div>
        }
        title="Proposta Gerada com Sucesso!"
        description={
          propostaNumero
            ? `Código: ${propostaNumero} • Documento formatado em padrão executivo.`
            : "Confira a prévia do documento gerado pela Inteligência Artificial."
        }
        headerActions={
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleCopyLink}
              leftIcon={
                copiadoLink ? (
                  <Check className="w-4 h-4 text-emerald-600" />
                ) : (
                  <Copy className="w-4 h-4" />
                )
              }
              className="text-xs"
            >
              {copiadoLink ? "Copiado!" : "Copiar Link"}
            </Button>

            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                if (!isPro) {
                  setUpgradeFeature("link");
                  setUpgradeModalOpen(true);
                  return;
                }
                setWhatsAppModalOpen(true);
              }}
              leftIcon={<MessageCircle className="w-4 h-4 text-emerald-600" />}
              className="text-xs"
            >
              WhatsApp
            </Button>

            <Button
              variant="secondary"
              size="sm"
              onClick={handlePrint}
              leftIcon={<Printer className="w-4 h-4" />}
              className="text-xs"
            >
              Imprimir / PDF
            </Button>
          </div>
        }
        bodyClassName="bg-slate-100/80 p-4 sm:p-6 md:p-8 flex justify-center items-start min-h-0"
        footer={
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 w-full">
            <div className="flex items-center gap-2 text-xs text-slate-600">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                Documento salvo automaticamente em <strong>Minhas Propostas</strong>.
              </span>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
              <Button
                variant="outline"
                size="md"
                onClick={() => {
                  setPreviewModalOpen(false);
                  if (propostaCriadaId) {
                    router.push(`/propostas/${propostaCriadaId}`);
                  }
                }}
              >
                Fechar Prévia
              </Button>

              {propostaCriadaId && (
                <Button
                  variant="primary"
                  size="md"
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                  onClick={() => router.push(`/propostas/${propostaCriadaId}`)}
                  className="shadow-lg shadow-blue-600/25 font-bold"
                >
                  Ir para Página da Proposta & Enviar
                </Button>
              )}
            </div>
          </div>
        }
      >
        <div className="w-full max-w-4xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-200/90 min-h-[68vh]">
          {generatedHtml && (
            <iframe
              srcDoc={generatedHtml}
              title="Visualização da Proposta Comercial"
              className="w-full min-h-[68vh] h-full border-0 block"
              style={{ minHeight: "68vh" }}
            />
          )}
        </div>
      </Modal>
    </div>
    </>
  );
}
