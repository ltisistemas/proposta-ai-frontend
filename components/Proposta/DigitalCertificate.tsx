"use client";

import React from "react";
import { ShieldCheck, CheckCircle2, FileCheck, Hash, Calendar, User, FileText } from "lucide-react";

interface DigitalCertificateProps {
  assinanteNome: string;
  assinanteDocumento: string;
  assinadoEm: string | Date;
  assinaturaIp?: string | null;
  assinaturaHash?: string | null;
}

export function DigitalCertificate({
  assinanteNome,
  assinanteDocumento,
  assinadoEm,
  assinaturaIp,
  assinaturaHash,
}: DigitalCertificateProps) {
  const dataFormatada = new Date(assinadoEm).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  return (
    <div className="my-8 rounded-[4px] border-2 border-emerald-500/30 bg-gradient-to-br from-emerald-50/70 via-white to-blue-50/50 p-6 text-slate-900 shadow-sm relative overflow-hidden">
      {/* Decorative seal background */}
      <div className="absolute right-4 -bottom-6 opacity-5 pointer-events-none">
        <ShieldCheck className="w-48 h-48 text-emerald-900" />
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-emerald-200/60 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-[4px] bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/20 shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 uppercase tracking-wider bg-emerald-100/80 px-2 py-0.5 rounded-[4px] border border-emerald-200">
              <FileCheck className="w-3 h-3" /> Certificado de Aceite Digital
            </span>
            <h4 className="text-base font-black text-slate-900 mt-0.5">
              Documento Assinado Eletronicamente
            </h4>
          </div>
        </div>

        <div className="text-left sm:text-right">
          <span className="text-[11px] font-semibold text-slate-500 block">Status da Assinatura</span>
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-[4px] border border-emerald-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Aceita & Válida
          </span>
        </div>
      </div>

      {/* Grid of details */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
        <div className="space-y-1 bg-white/80 p-3 rounded-[4px] border border-slate-200/80">
          <div className="flex items-center gap-1.5 text-slate-500 font-semibold">
            <User className="w-3.5 h-3.5 text-emerald-600" /> Signatário / Responsável
          </div>
          <div className="font-bold text-slate-900 text-sm">{assinanteNome}</div>
        </div>

        <div className="space-y-1 bg-white/80 p-3 rounded-[4px] border border-slate-200/80">
          <div className="flex items-center gap-1.5 text-slate-500 font-semibold">
            <FileText className="w-3.5 h-3.5 text-emerald-600" /> CPF / CNPJ Registrado
          </div>
          <div className="font-bold text-slate-900 text-sm">{assinanteDocumento}</div>
        </div>

        <div className="space-y-1 bg-white/80 p-3 rounded-[4px] border border-slate-200/80">
          <div className="flex items-center gap-1.5 text-slate-500 font-semibold">
            <Calendar className="w-3.5 h-3.5 text-emerald-600" /> Data & Hora do Aceite
          </div>
          <div className="font-bold text-slate-900 text-sm">{dataFormatada}</div>
        </div>
      </div>

      {/* Audit Hash & IP */}
      <div className="mt-4 pt-3 border-t border-slate-200/70 flex flex-col md:flex-row md:items-center justify-between gap-2 text-[11px] text-slate-500">
        {assinaturaHash && (
          <div className="flex items-center gap-1.5 font-mono truncate max-w-xl">
            <Hash className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="text-slate-400">Hash SHA-256:</span>
            <span className="text-slate-700 truncate">{assinaturaHash}</span>
          </div>
        )}
        {assinaturaIp && (
          <div className="text-slate-500 shrink-0">
            IP de Origem: <span className="font-mono font-semibold text-slate-700">{assinaturaIp}</span>
          </div>
        )}
      </div>
    </div>
  );
}
