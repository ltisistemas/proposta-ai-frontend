import Link from "next/link";
import { Logo } from "@/components/Common/Logo";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#FBFBFA] text-slate-900 flex flex-col justify-between selection:bg-blue-500 selection:text-white relative overflow-hidden font-sans">
      {/* Background Decorative Gradients matching Landing Page */}
      <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none -z-0 opacity-60" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[400px] bg-gradient-to-b from-blue-100/50 via-sky-50/30 to-transparent blur-3xl pointer-events-none -z-0" />

      {/* Header */}
      <header className="p-6 sm:p-8 max-w-7xl mx-auto w-full flex items-center justify-between z-10">
        <Logo href="/" size="md" variant="light" showSubtitle />
      </header>

      {/* Content */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 z-10">
        <div className="w-full max-w-md">{children}</div>
      </main>

      {/* Footer */}
      <footer className="p-6 text-center text-xs text-slate-500 z-10 border-t border-slate-200/80 flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4">
        <span>© {new Date().getFullYear()} Propex AI. Todos os direitos reservados.</span>
        <span className="hidden sm:inline text-slate-300">•</span>
        <div className="flex items-center gap-3">
          <Link href="/termos" className="hover:text-blue-600 transition-colors underline-offset-2 hover:underline">
            Termos de Uso
          </Link>
          <span className="text-slate-300">•</span>
          <Link href="/privacidade" className="hover:text-blue-600 transition-colors underline-offset-2 hover:underline">
            Privacidade (LGPD)
          </Link>
        </div>
      </footer>
    </div>
  );
}
