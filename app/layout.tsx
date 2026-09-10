import type { Metadata, Viewport } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { CookieConsentBanner } from "@/components/Common/CookieConsentBanner";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

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
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || "https://proposta-ai-pra-mim.vercel.app"
  ),
  title: "ViraPropo AI! - Sua IA geradora de propostas",
  description:
    "ViraPropo AI!: gere propostas comerciais profissionais, personalizadas e altamente persuasivas com Inteligência Artificial e feche mais contratos.",
  keywords: [
    "ViraPropo AI!",
    "ViraPropo",
    "proposta comercial",
    "gerador de propostas",
    "inteligência artificial",
    "fechar contratos",
    "orçamento comercial",
    "freelancer",
    "consultoria",
  ],
  authors: [{ name: "ViraPropo AI!" }],
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
      <body className="min-h-full flex flex-col bg-[#FBFBFA] text-slate-900 selection:bg-blue-500 selection:text-white">
        {children}
        <CookieConsentBanner />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
