import React from "react";

export type BadgeVariant =
  | "rascunho"
  | "enviada"
  | "aceita"
  | "recusada"
  | "pro"
  | "free"
  | "default"
  | "success"
  | "warning"
  | "danger"
  | "info";

export interface BadgeProps {
  children?: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
  size?: "sm" | "md";
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = "default",
  className = "",
  size = "md",
}) => {
  const sizeStyles = {
    sm: "px-2 py-0.5 text-[11px]",
    md: "px-2.5 py-1 text-xs",
  };

  const getVariantStyles = (): { style: string; label?: string; dot?: string } => {
    switch (variant) {
      case "rascunho":
        return {
          style: "bg-slate-100 dark:bg-[#44475a]/50 text-slate-700 dark:text-[#f8f8f2] border-slate-200 dark:border-[#44475a]",
          label: "Rascunho",
          dot: "bg-slate-400 dark:bg-[#6272a4]",
        };
      case "enviada":
        return {
          style: "bg-blue-50 dark:bg-[#8be9fd]/15 text-blue-700 dark:text-[#8be9fd] border-blue-200 dark:border-[#8be9fd]/30",
          label: "Enviada",
          dot: "bg-blue-500 dark:bg-[#8be9fd]",
        };
      case "aceita":
      case "success":
        return {
          style: "bg-emerald-50 dark:bg-[#50fa7b]/15 text-emerald-700 dark:text-[#50fa7b] border-emerald-200 dark:border-[#50fa7b]/30",
          label: "Aceita",
          dot: "bg-emerald-500 dark:bg-[#50fa7b]",
        };
      case "recusada":
      case "danger":
        return {
          style: "bg-rose-50 dark:bg-[#ff5555]/15 text-rose-700 dark:text-[#ff5555] border-rose-200 dark:border-[#ff5555]/30",
          label: "Recusada",
          dot: "bg-rose-500 dark:bg-[#ff5555]",
        };
      case "pro":
        return {
          style:
            "bg-blue-100 dark:bg-[#bd93f9]/20 text-blue-800 dark:text-[#bd93f9] border-blue-200 dark:border-[#bd93f9]/40 font-bold",
          label: "PRO",
          dot: "bg-blue-600 dark:bg-[#bd93f9]",
        };
      case "free":
        return {
          style: "bg-slate-100 dark:bg-[#44475a]/50 text-slate-600 dark:text-[#f8f8f2]/80 border-slate-200 dark:border-[#44475a] font-medium",
          label: "FREE",
          dot: "bg-slate-400 dark:bg-[#6272a4]",
        };
      case "warning":
        return {
          style: "bg-amber-50 dark:bg-[#ffb86c]/15 text-amber-700 dark:text-[#ffb86c] border-amber-200 dark:border-[#ffb86c]/30",
          dot: "bg-amber-500 dark:bg-[#ffb86c]",
        };
      case "info":
        return {
          style: "bg-cyan-50 dark:bg-[#8be9fd]/15 text-cyan-700 dark:text-[#8be9fd] border-cyan-200 dark:border-[#8be9fd]/30",
          dot: "bg-cyan-500 dark:bg-[#8be9fd]",
        };
      default:
        return {
          style: "bg-slate-100 dark:bg-[#44475a]/50 text-slate-700 dark:text-[#f8f8f2] border-slate-200 dark:border-[#44475a]",
          dot: "bg-slate-400 dark:bg-[#6272a4]",
        };
    }
  };

  const { style, label, dot } = getVariantStyles();

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-[4px] border ${sizeStyles[size]} ${style} ${className}`}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />}
      <span>{children || label}</span>
    </span>
  );
};
