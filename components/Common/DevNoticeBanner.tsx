"use client";

import React, { useState } from "react";
import { Sparkles, AlertTriangle, ChevronUp, ChevronDown, Rocket, X } from "lucide-react";

export function DevNoticeBanner() {
  const [isDismissed, setIsDismissed] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  if (isDismissed) {
    return (
      <div className="bg-amber-500 text-amber-950 text-[11px] font-bold px-3 py-1 flex items-center justify-between border-b border-amber-600/30">
        <div className="flex items-center gap-1.5">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-900 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-950"></span>
          </span>
          <span>🧪 Modo de Testes Ativo</span>
        </div>
        <button
          onClick={() => setIsDismissed(false)}
          className="underline hover:text-black cursor-pointer ml-2 text-[10px]"
        >
          Ver aviso completo
        </button>
      </div>
    );
  }

  return (
    <aside
      aria-label="Aviso de ambiente em desenvolvimento"
      className="relative z-50 bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 text-white shadow-md border-b border-amber-400/40"
    >
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2 sm:py-2.5">
        <div className="flex items-center justify-between gap-2">
          {/* Beacon & Tag */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[4px] bg-black/25 backdrop-blur-xs border border-white/20 text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-amber-100 shadow-2xs">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-300 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-200"></span>
              </span>
              <AlertTriangle className="w-3 h-3 text-amber-300" />
              Ambiente de Testes
            </span>
          </div>

          {/* Main Message Content */}
          {!isCollapsed && (
            <div className="flex-1 text-xs sm:text-sm text-amber-50 font-medium leading-tight sm:leading-normal text-center sm:text-left px-1 sm:px-2">
              <span>
                Estamos calibrando os últimos motores da nossa IA! <strong>Qualquer assinatura ou pagamento realizado nesta fase de testes será cancelado/desfeito posteriormente</strong> sem custos. Aproveite para testar e criar propostas à vontade!
              </span>
            </div>
          )}

          {/* Control Buttons */}
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              title={isCollapsed ? "Expandir aviso" : "Recolher aviso"}
              className="p-1 rounded-[4px] hover:bg-black/20 text-amber-100 hover:text-white transition-colors cursor-pointer"
              aria-label={isCollapsed ? "Expandir aviso" : "Recolher aviso"}
            >
              {isCollapsed ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronUp className="w-4 h-4" />
              )}
            </button>
            <button
              onClick={() => setIsDismissed(true)}
              title="Minimizar aviso"
              className="p-1 rounded-[4px] hover:bg-black/20 text-amber-100 hover:text-white transition-colors cursor-pointer"
              aria-label="Minimizar aviso"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
