import type { Metadata, Viewport } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  title: "Proposta AI | Crie Propostas Comerciais com IA em Minutos",
  description:
    "Gere propostas comerciais profissionais, personalizadas e altamente persuasivas com Inteligência Artificial e feche mais contratos.",
  keywords: [
    "proposta comercial",
    "gerador de propostas",
    "inteligência artificial",
    "fechar contratos",
    "orçamento comercial",
    "freelancer",
    "consultoria",
  ],
  authors: [{ name: "Proposta AI" }],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="pt-BR"
      className={`${inter.variable} ${plusJakarta.variable} h-full antialiased font-sans`}
    >
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900 selection:bg-indigo-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}
