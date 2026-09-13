import type { Metadata, Viewport } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { CookieConsentBanner } from "@/components/Common/CookieConsentBanner";
import { PixelTracker } from "@/components/Analytics/PixelTracker";
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
    process.env.NEXT_PUBLIC_APP_URL || "https://virapropoai.com"
  ),
  title: {
    default: "ViraPropo AI! - Gerador Inteligente de Propostas Comerciais",
    template: "%s | ViraPropo AI!",
  },
  description:
    "Gere propostas comerciais profissionais, personalizadas e altamente persuasivas com Inteligência Artificial em segundos. Aumente sua conversão e feche mais contratos.",
  keywords: [
    "ViraPropo AI!",
    "ViraPropo",
    "proposta comercial",
    "gerador de propostas",
    "proposta comercial com inteligência artificial",
    "fechar contratos",
    "orçamento comercial",
    "modelo de proposta comercial",
    "assinatura eletrônica de proposta",
    "software de vendas",
    "freelancer",
    "consultoria",
    "agência",
  ],
  authors: [{ name: "ViraPropo AI!" }],
  creator: "ViraPropo AI!",
  publisher: "ViraPropo AI!",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: {
    canonical: "./",
  },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: process.env.NEXT_PUBLIC_APP_URL || "https://virapropoai.com",
    siteName: "ViraPropo AI!",
    title: "ViraPropo AI! - Feche Mais Contratos com Propostas Profissionais com IA",
    description:
      "Crie orçamentos executivos e propostas comerciais irresistíveis com IA, assinatura digital e compartilhamento direto no WhatsApp.",
  },
  twitter: {
    card: "summary_large_image",
    title: "ViraPropo AI! - Propostas Comerciais com IA",
    description:
      "Gere propostas comerciais profissionais e persuasivas em menos de 1 minuto.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
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
        <PixelTracker />
        {children}
        <CookieConsentBanner />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
