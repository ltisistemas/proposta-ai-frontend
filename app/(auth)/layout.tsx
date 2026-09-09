import { Logo } from "@/components/Common/Logo";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#07090e] text-slate-50 flex flex-col justify-between selection:bg-indigo-500 selection:text-white relative overflow-hidden font-sans">
      {/* Background Decorative Gradients */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[400px] bg-gradient-to-b from-indigo-600/15 via-cyan-500/5 to-transparent blur-3xl pointer-events-none -z-0" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none -z-0" />

      {/* Header */}
      <header className="p-6 sm:p-8 max-w-7xl mx-auto w-full flex items-center justify-between z-10">
        <Logo href="/" size="md" />
      </header>

      {/* Content */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 z-10">
        <div className="w-full max-w-md">{children}</div>
      </main>

      {/* Footer */}
      <footer className="p-6 text-center text-xs text-slate-500 z-10">
        © {new Date().getFullYear()} Proposta Ai!. Todos os direitos reservados.
      </footer>
    </div>
  );
}
