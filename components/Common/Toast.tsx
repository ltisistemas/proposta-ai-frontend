"use client";

import React from "react";
import { create } from "zustand";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";

export type ToastType = "success" | "error" | "info" | "warning";

export interface ToastItem {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
}

interface ToastStore {
  toasts: ToastItem[];
  addToast: (toast: Omit<ToastItem, "id">) => void;
  removeToast: (id: string) => void;
}

export const useToast = create<ToastStore>((set) => ({
  toasts: [],
  addToast: (toast) => {
    const id = Math.random().toString(36).substring(2, 9);
    set((state) => ({ toasts: [...state.toasts, { ...toast, id }] }));
    setTimeout(() => {
      set((state) => ({
        toasts: state.toasts.filter((t) => t.id !== id),
      }));
    }, 4500);
  },
  removeToast: (id) =>
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
}));

export const addToast = (toast: Omit<ToastItem, "id">) =>
  useToast.getState().addToast(toast);

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => {
        const icons = {
          success: <CheckCircle2 className="w-5 h-5 text-emerald-500 dark:text-[#50fa7b] shrink-0" />,
          error: <AlertCircle className="w-5 h-5 text-rose-500 dark:text-[#ff5555] shrink-0" />,
          warning: <AlertCircle className="w-5 h-5 text-amber-500 dark:text-[#ffb86c] shrink-0" />,
          info: <Info className="w-5 h-5 text-indigo-500 dark:text-[#8be9fd] shrink-0" />,
        };

        const bgStyles = {
          success: "border-emerald-200 dark:border-[#50fa7b]/40 bg-white/95 dark:bg-[#282a36]/95 text-slate-800 dark:text-[#f8f8f2] shadow-lg shadow-emerald-500/5 dark:shadow-[#50fa7b]/10",
          error: "border-rose-200 dark:border-[#ff5555]/40 bg-white/95 dark:bg-[#282a36]/95 text-slate-800 dark:text-[#f8f8f2] shadow-lg shadow-rose-500/5 dark:shadow-[#ff5555]/10",
          warning: "border-amber-200 dark:border-[#ffb86c]/40 bg-white/95 dark:bg-[#282a36]/95 text-slate-800 dark:text-[#f8f8f2] shadow-lg shadow-amber-500/5 dark:shadow-[#ffb86c]/10",
          info: "border-indigo-200 dark:border-[#8be9fd]/40 bg-white/95 dark:bg-[#282a36]/95 text-slate-800 dark:text-[#f8f8f2] shadow-lg shadow-indigo-500/5 dark:shadow-[#8be9fd]/10",
        };

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl border backdrop-blur-md transition-all animate-in slide-in-from-bottom-3 duration-200 ${bgStyles[toast.type]}`}
          >
            {icons[toast.type]}
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-semibold text-slate-900 dark:text-[#f8f8f2]">{toast.title}</h4>
              {toast.message && (
                <p className="text-xs text-slate-600 dark:text-[#cbd5e1] mt-0.5 leading-relaxed">{toast.message}</p>
              )}
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="p-1 text-slate-400 dark:text-[#94a3b8] hover:text-slate-600 dark:hover:text-[#f8f8f2] rounded-lg transition-colors -mr-1 -mt-1 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
