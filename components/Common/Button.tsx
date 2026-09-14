import React from "react";
import { Loader2 } from "lucide-react";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:
    | "primary"
    | "secondary"
    | "outline"
    | "ghost"
    | "danger"
    | "gradient";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  className = "",
  variant = "primary",
  size = "md",
  isLoading = false,
  disabled,
  leftIcon,
  rightIcon,
  ...props
}) => {
  const baseStyles =
    "inline-flex items-center justify-center font-medium rounded-[4px] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-[#282a36] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer active:scale-[0.98]";

  const sizeStyles = {
    sm: "px-3 py-1.5 text-xs gap-1.5",
    md: "px-4 py-2.5 text-sm gap-2",
    lg: "px-6 py-3.5 text-base gap-2.5 font-semibold",
  };

  const variantStyles = {
    primary:
      "bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-md shadow-blue-600/20 focus:ring-blue-500 border border-transparent",
    gradient:
      "bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 text-white font-semibold hover:opacity-95 shadow-md shadow-blue-600/20 focus:ring-blue-500 border border-transparent",
    secondary:
      "bg-slate-100 dark:bg-[#44475a] text-slate-800 dark:text-[#f8f8f2] hover:bg-slate-200 dark:hover:bg-[#44475a]/80 focus:ring-slate-400 dark:focus:ring-[#6272a4] border border-slate-200/80 dark:border-[#44475a]",
    outline:
      "bg-white dark:bg-[#282a36] text-slate-700 dark:text-[#f8f8f2] hover:bg-slate-50 dark:hover:bg-[#343746] border border-slate-200 dark:border-[#44475a] hover:border-slate-300 dark:hover:border-[#6272a4] focus:ring-blue-500 shadow-xs",
    ghost:
      "bg-transparent text-slate-700 dark:text-[#f8f8f2] hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#44475a]/50 focus:ring-slate-400 dark:focus:ring-[#6272a4]",
    danger:
      "bg-rose-600 dark:bg-[#ff5555] text-white hover:bg-rose-700 dark:hover:bg-[#ff4444] focus:ring-rose-500 dark:focus:ring-[#ff5555] shadow-sm",
  };

  return (
    <button
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin shrink-0" />
      ) : (
        leftIcon && <span className="shrink-0">{leftIcon}</span>
      )}
      <span>{children}</span>
      {!isLoading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
    </button>
  );
};
