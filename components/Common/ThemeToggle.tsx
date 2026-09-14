"use client";

import React from "react";
import { Sun, Moon, Sparkles } from "lucide-react";
import { useTheme } from "./ThemeProvider";

interface ThemeToggleProps {
  variant?: "icon" | "button" | "menu";
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function ThemeToggle({
  variant = "icon",
  className = "",
  size = "md",
}: ThemeToggleProps) {
  const { resolvedTheme, toggleTheme, isMounted } = useTheme();

  const isDark = isMounted ? resolvedTheme === "dark" : false;

  const sizeStyles = {
    sm: "w-8 h-8",
    md: "w-9 h-9",
    lg: "w-10 h-10",
  };

  const iconSizes = {
    sm: "w-3.5 h-3.5",
    md: "w-4 h-4",
    lg: "w-5 h-5",
  };

  if (variant === "button") {
    return (
      <button
        onClick={toggleTheme}
        type="button"
        title={isDark ? "Alternar para Tema Claro" : "Alternar para Tema Dracula"}
        aria-label={isDark ? "Alternar para Tema Claro" : "Alternar para Tema Dracula"}
        className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer border ${
          isDark
            ? "bg-[#282a36] text-[#bd93f9] border-[#44475a] hover:bg-[#44475a]/70 hover:border-[#bd93f9]/50 shadow-xs"
            : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:text-slate-900 shadow-xs"
        } ${className}`}
      >
        <div className="relative flex items-center justify-center">
          {isDark ? (
            <Moon className={`${iconSizes[size]} text-[#bd93f9] transition-transform duration-300 rotate-0 scale-100`} />
          ) : (
            <Sun className={`${iconSizes[size]} text-amber-500 transition-transform duration-300 rotate-0 scale-100`} />
          )}
        </div>
        <span>{isDark ? "Tema Dracula" : "Tema Claro"}</span>
      </button>
    );
  }

  return (
    <button
      onClick={toggleTheme}
      type="button"
      title={isDark ? "Alternar para Modo Claro" : "Alternar para Modo Dracula"}
      aria-label={isDark ? "Alternar para Modo Claro" : "Alternar para Modo Dracula"}
      className={`${sizeStyles[size]} flex items-center justify-center rounded-xl transition-all duration-300 cursor-pointer relative overflow-hidden group border ${
        isDark
          ? "bg-[#282a36] text-[#bd93f9] border-[#44475a] hover:border-[#bd93f9]/60 hover:bg-[#343746] shadow-xs shadow-[#bd93f9]/10"
          : "bg-slate-100/90 text-slate-600 border-slate-200/80 hover:bg-slate-200/80 hover:text-slate-900 shadow-xs"
      } ${className}`}
    >
      <span className="sr-only">
        {isDark ? "Alternar para Modo Claro" : "Alternar para Modo Dracula"}
      </span>

      {/* Subtle indicator dot / glow */}
      {isDark && (
        <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-[#bd93f9] shadow-xs shadow-[#bd93f9]" />
      )}

      {/* Animated icon */}
      <div className="relative w-full h-full flex items-center justify-center">
        {isDark ? (
          <div className="flex items-center justify-center transition-all duration-300 transform group-hover:scale-110">
            <Moon className={`${iconSizes[size]} text-[#bd93f9]`} />
          </div>
        ) : (
          <div className="flex items-center justify-center transition-all duration-300 transform group-hover:scale-110 group-hover:rotate-45">
            <Sun className={`${iconSizes[size]} text-amber-500`} />
          </div>
        )}
      </div>
    </button>
  );
}
