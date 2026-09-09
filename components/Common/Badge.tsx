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
          style: "bg-slate-100 text-slate-700 border-slate-200",
          label: "Rascunho",
          dot: "bg-slate-400",
        };
      case "enviada":
        return {
          style: "bg-blue-50 text-blue-700 border-blue-200",
          label: "Enviada",
          dot: "bg-blue-500",
        };
      case "aceita":
      case "success":
        return {
          style: "bg-emerald-50 text-emerald-700 border-emerald-200",
          label: "Aceita",
          dot: "bg-emerald-500",
        };
      case "recusada":
      case "danger":
        return {
          style: "bg-rose-50 text-rose-700 border-rose-200",
          label: "Recusada",
          dot: "bg-rose-500",
        };
      case "pro":
        return {
          style:
            "bg-gradient-to-r from-indigo-500/10 to-cyan-500/10 text-indigo-700 border-indigo-200 font-bold",
          label: "PRO",
          dot: "bg-indigo-500",
        };
      case "free":
        return {
          style: "bg-slate-100 text-slate-600 border-slate-200 font-medium",
          label: "FREE",
          dot: "bg-slate-400",
        };
      case "warning":
        return {
          style: "bg-amber-50 text-amber-700 border-amber-200",
          dot: "bg-amber-500",
        };
      case "info":
        return {
          style: "bg-cyan-50 text-cyan-700 border-cyan-200",
          dot: "bg-cyan-500",
        };
      default:
        return {
          style: "bg-slate-100 text-slate-700 border-slate-200",
          dot: "bg-slate-400",
        };
    }
  };

  const { style, label, dot } = getVariantStyles();

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-full border ${sizeStyles[size]} ${style} ${className}`}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />}
      <span>{children || label}</span>
    </span>
  );
};
