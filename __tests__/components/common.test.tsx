import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { Button } from "@/components/Common/Button";
import { Input, TextArea } from "@/components/Common/Input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/Common/Card";
import { Badge } from "@/components/Common/Badge";
import { Modal } from "@/components/Common/Modal";
import { ConfirmModal } from "@/components/Common/ConfirmModal";
import { LoadingSpinner } from "@/components/Common/LoadingSpinner";
import { ToastContainer, useToast } from "@/components/Common/Toast";
import { Logo } from "@/components/Common/Logo";

describe("components/Common/Button", () => {
  it("should render button text and handle click", () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Clique Aqui</Button>);

    const btn = screen.getByRole("button", { name: /clique aqui/i });
    expect(btn).toBeInTheDocument();

    fireEvent.click(btn);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("should display loading spinner and disable button when isLoading is true", () => {
    render(<Button isLoading>Processando</Button>);
    const btn = screen.getByRole("button");
    expect(btn).toBeDisabled();
    expect(btn.querySelector("svg")).toBeInTheDocument();
  });

  it("should render with different variants and sizes", () => {
    const { rerender } = render(<Button variant="danger" size="lg">Excluir</Button>);
    expect(screen.getByRole("button")).toHaveClass("bg-rose-600");

    rerender(<Button variant="outline" size="sm">Cancelar</Button>);
    expect(screen.getByRole("button")).toHaveClass("bg-white");

    rerender(<Button variant="ghost" size="md">Voltar</Button>);
    expect(screen.getByRole("button")).toHaveClass("bg-transparent");

    rerender(<Button variant="gradient" size="md">Assinar</Button>);
    expect(screen.getByRole("button")).toHaveClass("bg-gradient-to-r");
  });
});

describe("components/Common/Input", () => {
  it("should render input with label, helperText, and handle changes", () => {
    const handleChange = vi.fn();
    render(
      <Input
        label="Nome Completo"
        placeholder="Digite seu nome"
        helperText="Nome como no documento"
        onChange={handleChange}
      />
    );

    expect(screen.getByText("Nome Completo")).toBeInTheDocument();
    expect(screen.getByText("Nome como no documento")).toBeInTheDocument();

    const input = screen.getByPlaceholderText("Digite seu nome");
    fireEvent.change(input, { target: { value: "Carlos Silva" } });
    expect(handleChange).toHaveBeenCalled();
  });

  it("should render dark variant with left and right icons", () => {
    const { rerender } = render(
      <Input
        variant="dark"
        leftIcon={<span data-testid="left-icon">Left</span>}
        rightIcon={<span data-testid="right-icon">Right</span>}
        helperText="Texto auxiliar escuro"
      />
    );
    expect(screen.getByTestId("left-icon")).toBeInTheDocument();
    expect(screen.getByTestId("right-icon")).toBeInTheDocument();
    expect(screen.getByText("Texto auxiliar escuro")).toBeInTheDocument();

    rerender(<Input variant="dark" error="Erro escuro" />);
    expect(screen.getByText("Erro escuro")).toBeInTheDocument();
  });

  it("should render TextArea with label and error state", () => {
    const { rerender } = render(<TextArea label="Observações" error="Campo obrigatório" rows={4} />);
    expect(screen.getByText("Observações")).toBeInTheDocument();
    expect(screen.getByText("Campo obrigatório")).toBeInTheDocument();

    rerender(<TextArea variant="dark" helperText="Ajuda escura" />);
    expect(screen.getByText("Ajuda escura")).toBeInTheDocument();

    rerender(<TextArea variant="dark" error="Erro área escura" />);
    expect(screen.getByText("Erro área escura")).toBeInTheDocument();
  });
});

describe("components/Common/Card", () => {
  it("should render card structure with header, description, footer, and content", () => {
    const { rerender } = render(
      <Card glass className="custom-card">
        <CardHeader>
          <CardTitle>Título do Card</CardTitle>
          <CardDescription>Subtítulo do Card</CardDescription>
        </CardHeader>
        <CardContent>Conteúdo Interno</CardContent>
        <CardFooter>Rodapé do Card</CardFooter>
      </Card>
    );

    expect(screen.getByText("Título do Card")).toBeInTheDocument();
    expect(screen.getByText("Subtítulo do Card")).toBeInTheDocument();
    expect(screen.getByText("Conteúdo Interno")).toBeInTheDocument();
    expect(screen.getByText("Rodapé do Card")).toBeInTheDocument();

    rerender(<Card glass={false}>Normal</Card>);
    expect(screen.getByText("Normal")).toBeInTheDocument();
  });
});

describe("components/Common/Badge", () => {
  it("should render all badge variants and sizes", () => {
    const { rerender } = render(<Badge variant="rascunho" />);
    expect(screen.getByText("Rascunho")).toBeInTheDocument();

    rerender(<Badge variant="enviada" />);
    expect(screen.getByText("Enviada")).toBeInTheDocument();

    rerender(<Badge variant="aceita" />);
    expect(screen.getByText("Aceita")).toBeInTheDocument();

    rerender(<Badge variant="recusada" />);
    expect(screen.getByText("Recusada")).toBeInTheDocument();

    rerender(<Badge variant="pro" />);
    expect(screen.getByText("PRO")).toBeInTheDocument();

    rerender(<Badge variant="free" />);
    expect(screen.getByText("FREE")).toBeInTheDocument();

    rerender(<Badge variant="warning">Atenção</Badge>);
    expect(screen.getByText("Atenção")).toBeInTheDocument();

    rerender(<Badge variant="info">Novidade</Badge>);
    expect(screen.getByText("Novidade")).toBeInTheDocument();

    rerender(<Badge variant="default">Padrão</Badge>);
    expect(screen.getByText("Padrão")).toBeInTheDocument();
  });
});

describe("components/Common/Modal", () => {
  it("should not render when isOpen is false", () => {
    render(
      <Modal isOpen={false} onClose={vi.fn()}>
        <div>Conteúdo Modal</div>
      </Modal>
    );
    expect(screen.queryByText("Conteúdo Modal")).not.toBeInTheDocument();
  });

  it("should render title, children, and call onClose on close button click", () => {
    const handleClose = vi.fn();
    render(
      <Modal isOpen={true} onClose={handleClose} title="Minha Modal">
        <div>Conteúdo Visível</div>
      </Modal>
    );

    expect(screen.getByText("Minha Modal")).toBeInTheDocument();
    expect(screen.getByText("Conteúdo Visível")).toBeInTheDocument();

    const closeBtn = screen.getByRole("button");
    fireEvent.click(closeBtn);
    expect(handleClose).toHaveBeenCalled();
  });
});

describe("components/Common/ConfirmModal", () => {
  it("should render ConfirmModal with title, description, and handle confirm and cancel", async () => {
    const handleConfirm = vi.fn();
    const handleClose = vi.fn();

    const { rerender } = render(
      <ConfirmModal
        isOpen={true}
        onClose={handleClose}
        onConfirm={handleConfirm}
        title="Excluir item?"
        description="Esta ação é permanente."
        confirmLabel="Sim, excluir"
        cancelLabel="Voltar"
        variant="danger"
      />
    );

    expect(screen.getByText("Excluir item?")).toBeInTheDocument();
    expect(screen.getByText("Esta ação é permanente.")).toBeInTheDocument();

    const cancelBtn = screen.getByRole("button", { name: /voltar/i });
    fireEvent.click(cancelBtn);
    expect(handleClose).toHaveBeenCalled();

    const confirmBtn = screen.getByRole("button", { name: /sim, excluir/i });
    fireEvent.click(confirmBtn);
    expect(handleConfirm).toHaveBeenCalled();

    // Rerender with warning and primary variants
    rerender(
      <ConfirmModal
        isOpen={true}
        onClose={handleClose}
        onConfirm={handleConfirm}
        variant="warning"
      />
    );

    rerender(
      <ConfirmModal
        isOpen={true}
        onClose={handleClose}
        onConfirm={handleConfirm}
        variant="primary"
      />
    );
  });
});

describe("components/Common/Logo", () => {
  it("should render logo with variants, sizes, and links", () => {
    const { rerender } = render(<Logo size="md" variant="light" showSubtitle={true} />);
    expect(screen.getByText("ViraPropo")).toBeInTheDocument();
    expect(screen.getByText("AI!")).toBeInTheDocument();
    expect(screen.getByText(/Sua IA geradora de propostas/i)).toBeInTheDocument();

    rerender(<Logo size="sm" variant="dark" href="/dashboard" />);
    expect(screen.getByRole("link")).toBeInTheDocument();

    rerender(<Logo size="lg" />);
    expect(screen.getByText("AI!")).toBeInTheDocument();

    rerender(<Logo size="xl" />);
    expect(screen.getByText("AI!")).toBeInTheDocument();
  });
});

describe("components/Common/LoadingSpinner & ToastContainer", () => {
  it("should render LoadingSpinner with text", () => {
    render(<LoadingSpinner size="md" text="Carregando dados..." />);
    expect(document.querySelector("svg")).toBeInTheDocument();
    expect(screen.getByText("Carregando dados...")).toBeInTheDocument();
  });

  it("should render Toast notification and trigger close", () => {
    act(() => {
      useToast.getState().addToast({
        type: "success",
        title: "Sucesso",
        message: "Salvo com sucesso!",
      });
    });

    render(<ToastContainer />);

    expect(screen.getByText("Sucesso")).toBeInTheDocument();
    expect(screen.getByText("Salvo com sucesso!")).toBeInTheDocument();

    const btn = screen.getByRole("button");
    fireEvent.click(btn);
  });
});
