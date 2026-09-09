"use client";

import React, { useEffect } from "react";
import { X } from "lucide-react";

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  description?: React.ReactNode;
  icon?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl" | "full" | "screen";
  headerActions?: React.ReactNode;
  bodyClassName?: string;
  hideDefaultCloseButton?: boolean;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  icon,
  children,
  footer,
  size = "md",
  headerActions,
  bodyClassName = "",
  hideDefaultCloseButton = false,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: "w-full max-w-md max-h-[90vh]",
    md: "w-full max-w-xl max-h-[90vh]",
    lg: "w-full max-w-3xl max-h-[90vh]",
    xl: "w-full max-w-5xl max-h-[90vh]",
    full: "w-[96vw] max-w-7xl h-[92vh] max-h-[92vh]",
    screen: "w-screen h-screen rounded-none max-w-none m-0 max-h-screen",
  };

  const hasHeader = Boolean(title || description || icon);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div
        className={`relative ${sizeClasses[size]} bg-white rounded-[4px] shadow-2xl border border-slate-200/90 overflow-hidden z-10 transition-all transform animate-in zoom-in-95 duration-200 flex flex-col my-auto`}
      >
        {/* Floating Close Button for Headerless Modals */}
        {!hasHeader && !hideDefaultCloseButton && (
          <button
            onClick={onClose}
            title="Fechar modal"
            className="absolute top-3.5 right-3.5 z-30 p-1.5 rounded-[4px] text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* Modal Header */}
        {hasHeader && (
          <div className="flex items-center justify-between px-6 py-4.5 border-b border-slate-200/80 bg-white shrink-0 z-20">
            <div className="flex items-center gap-3.5 min-w-0">
              {icon && <div className="shrink-0">{icon}</div>}
              <div className="min-w-0">
                {title && (
                  <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight truncate">
                    {title}
                  </h2>
                )}
                {description && (
                  <p className="text-xs text-slate-500 mt-0.5 truncate hidden sm:block">
                    {description}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {headerActions}
              {!hideDefaultCloseButton && (
                <button
                  onClick={onClose}
                  title="Fechar modal"
                  className="p-1.5 rounded-[4px] text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Modal Body with clean scroll and padding */}
        <div
          className={`flex-1 overflow-y-auto ${
            bodyClassName || (hasHeader ? "p-6" : "p-6 sm:p-7")
          }`}
        >
          {children}
        </div>

        {/* Modal Footer */}
        {footer && (
          <div className="px-6 py-4 border-t border-slate-200/80 bg-white shrink-0 z-20">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
