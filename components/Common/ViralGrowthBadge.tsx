"use client";

import React from "react";
import Link from "next/link";
import { Sparkles, ArrowRight } from "lucide-react";

interface ViralGrowthBadgeProps {
  className?: string;
  variant?: "floating" | "inline";
}

export function ViralGrowthBadge({
  className = "",
  variant = "inline",
}: ViralGrowthBadgeProps) {
  if (variant === "floating") {
    return (
      <div
        className={`fixed bottom-4 right-4 z-40 max-w-sm hidden sm:block animate-fade-in ${className}`}
      >
        <Link
          href="/signup?utm_source=proposal_viral_floating&utm_medium=public_proposal"
          target="_blank"
          className="group flex items-center gap-3 p-3.5 rounded-2xl bg-white/95 dark:bg-[#21222c]/95 backdrop-blur-xl border border-blue-200/80 dark:border-[#bd93f9]/40 shadow-xl shadow-blue-500/10 dark:shadow-purple-950/40 hover:border-blue-500 dark:hover:border-[#bd93f9] transition-all duration-300 hover:scale-[1.02]"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 dark:from-[#bd93f9] dark:to-[#ff79c6] text-white flex items-center justify-center shrink-0 shadow-sm group-hover:rotate-6 transition-transform">
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="text-left pr-1">
            <p className="text-[11px] font-bold text-slate-900 dark:text-[#f8f8f2] leading-snug">
              Gostou do formato desta proposta?
            </p>
            <p className="text-[10px] text-blue-600 dark:text-[#8be9fd] font-medium flex items-center gap-1 mt-0.5">
              Crie a sua com IA gratuitamente <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
            </p>
          </div>
        </Link>
      </div>
    );
  }

  return (
    <div className={`w-full text-center ${className}`}>
      <Link
        href="/signup?utm_source=proposal_viral_footer&utm_medium=public_proposal"
        target="_blank"
        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-100/90 dark:bg-[#343746]/90 border border-slate-200 dark:border-[#44475a] text-slate-700 dark:text-[#f8f8f2] text-xs hover:border-blue-400 dark:hover:border-[#bd93f9] hover:bg-white dark:hover:bg-[#282a36] transition-all shadow-xs group"
      >
        <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-[#bd93f9] group-hover:rotate-12 transition-transform" />
        <span className="font-medium">
          Criado com <strong>ViraPropo AI!</strong>
        </span>
        <span className="text-slate-400 dark:text-[#6272a4]">•</span>
        <span className="text-blue-600 dark:text-[#8be9fd] font-bold inline-flex items-center gap-1 group-hover:underline">
          Crie a sua proposta grátis <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
        </span>
      </Link>
    </div>
  );
}
