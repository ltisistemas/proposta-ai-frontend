import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { Button } from "@/components/Common/Button";
import { Input, TextArea } from "@/components/Common/Input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/Common/Card";
import { Badge } from "@/components/Common/Badge";
import { Modal } from "@/components/Common/Modal";
import { LoadingSpinner } from "@/components/Common/LoadingSpinner";
import { ToastContainer, useToast } from "@/components/Common/Toast";

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

  it("should display error message when error prop is provided", () => {
    render(<Input label="Email" error="Email inválido" />);
    expect(screen.getByText("Email inválido")).toBeInTheDocument();
  });

  it("should render TextArea with label and error state", () => {
    render(<TextArea label="Observações" error="Campo obrigatório" rows={4} />);
    expect(screen.getByText("Observações")).toBeInTheDocument();
    expect(screen.getByText("Campo obrigatório")).toBeInTheDocument();
  });
});

describe("components/Common/Card", () => {
  it("should render card structure with header and content", () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Título do Card</CardTitle>
        </CardHeader>
        <CardContent>Conteúdo Interno</CardContent>
      </Card>
    );

    expect(screen.getByText("Título do Card")).toBeInTheDocument();
    expect(screen.getByText("Conteúdo Interno")).toBeInTheDocument();
  });
});

describe("components/Common/Badge", () => {
  it("should render different badge variants and sizes", () => {
    const { rerender } = render(<Badge variant="success">Aceita</Badge>);
    expect(screen.getByText("Aceita")).toBeInTheDocument();

    rerender(<Badge variant="pro">PRO</Badge>);
    expect(screen.getByText("PRO")).toBeInTheDocument();

    rerender(<Badge variant="danger">Recusada</Badge>);
    expect(screen.getByText("Recusada")).toBeInTheDocument();
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

describe("components/Common/LoadingSpinner & ToastContainer", () => {
  it("should render LoadingSpinner with text", () => {
    render(<LoadingSpinner size="md" />);
    expect(document.querySelector("svg")).toBeInTheDocument();
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
