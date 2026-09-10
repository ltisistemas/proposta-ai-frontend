"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ShieldCheck, Cookie, Settings, Check, X } from "lucide-react";
import { Button } from "./Button";

export interface CookiePreferences {
  essential: boolean;
  analytics: boolean;
  marketing: boolean;
  consentedAt: string;
}

const STORAGE_KEY = "propex_cookie_consent";

export function CookieConsentBanner() {
  const [isOpen, setIsOpen] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [analytics, setAnalytics] = useState(true);
  const [marketing, setMarketing] = useState(true);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) {
        // Delay slightly for smooth entrance
        const timer = setTimeout(() => setIsOpen(true), 800);
        return () => clearTimeout(timer);
      }
    } catch {
      // LocalStorage might be disabled
    }
  }, []);

  const saveConsent = (prefs: CookiePreferences) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
    } catch (e) {
      console.warn("Não foi possível salvar preferências de cookies:", e);
    }
    setIsOpen(false);
  };

  const handleAcceptAll = () => {
    saveConsent({
      essential: true,
      analytics: true,
      marketing: true,
      consentedAt: new Date().toISOString(),
    });
  };

  const handleRejectOptional = () => {
    saveConsent({
      essential: true,
      analytics: false,
      marketing: false,
      consentedAt: new Date().toISOString(),
    });
  };

  const handleSaveCustom = () => {
    saveConsent({
      essential: true,
      analytics,
      marketing,
      consentedAt: new Date().toISOString(),
    });
  };

  if (!isOpen) return null;

  return (
    <aside
      aria-label="Consentimento de Cookies e Privacidade LGPD"
      className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-50 animate-in fade-in slide-in-from-bottom-5 duration-300"
    >
      <div className="bg-slate-900/95 backdrop-blur-md text-white border border-slate-700/80 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-2xl bg-blue-600/30 border border-blue-400/40 text-blue-300 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-bold text-white tracking-tight">
              Privacidade & Cookies (LGPD)
            </h4>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
              O <strong>Propex AI</strong> utiliza cookies e tecnologias essenciais para garantir o funcionamento seguro do serviço, personalizar sua experiência e aprimorar nossas ferramentas, em conformidade com a LGPD (Lei nº 13.709/2018).
            </p>
          </div>
        </div>

        {showPreferences ? (
          <div className="space-y-3 pt-2 border-t border-slate-800 text-xs">
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/60 border border-slate-700">
              <div>
                <p className="font-bold text-slate-200">Cookies Essenciais</p>
                <p className="text-[11px] text-slate-400">Autenticação, sessões e segurança (Obrigatórios).</p>
              </div>
              <span className="text-[11px] font-bold text-blue-400 px-2 py-0.5 rounded bg-blue-900/50">Ativo</span>
            </div>

            <label className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/60 border border-slate-700 cursor-pointer hover:bg-slate-800 transition-colors">
              <div>
                <p className="font-bold text-slate-200">Cookies de Desempenho & Analytics</p>
                <p className="text-[11px] text-slate-400">Ajuda a medir e melhorar a geração de propostas.</p>
              </div>
              <input
                type="checkbox"
                checked={analytics}
                onChange={(e) => setAnalytics(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 bg-slate-700 border-slate-600"
              />
            </label>

            <label className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/60 border border-slate-700 cursor-pointer hover:bg-slate-800 transition-colors">
              <div>
                <p className="font-bold text-slate-200">Comunicações & Novidades</p>
                <p className="text-[11px] text-slate-400">Notificações sobre novos recursos e melhorias.</p>
              </div>
              <input
                type="checkbox"
                checked={marketing}
                onChange={(e) => setMarketing(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 bg-slate-700 border-slate-600"
              />
            </label>

            <div className="flex items-center gap-2 pt-1">
              <Button
                size="sm"
                variant="primary"
                onClick={handleSaveCustom}
                className="flex-1 text-xs font-bold justify-center"
              >
                Salvar Preferências
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowPreferences(false)}
                className="text-xs text-slate-400 hover:text-white"
              >
                Voltar
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3 pt-1">
            <div className="flex flex-wrap items-center gap-2">
              <Button
                size="sm"
                variant="primary"
                onClick={handleAcceptAll}
                className="flex-1 text-xs font-bold justify-center bg-blue-600 hover:bg-blue-500 shadow-md shadow-blue-600/20"
              >
                Aceitar Todos
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleRejectOptional}
                className="text-xs font-bold justify-center border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white"
              >
                Apenas Essenciais
              </Button>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
              <button
                type="button"
                onClick={() => setShowPreferences(true)}
                className="hover:text-blue-300 underline underline-offset-2 flex items-center gap-1"
              >
                <Settings className="w-3 h-3" /> Gerenciar Preferências
              </button>
              <Link
                href="/privacidade"
                className="hover:text-blue-300 underline underline-offset-2"
              >
                Política de Privacidade
              </Link>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
