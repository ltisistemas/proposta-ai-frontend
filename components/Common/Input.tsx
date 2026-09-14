import React, { forwardRef } from "react";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  variant?: "light" | "dark";
  labelClassName?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helperText,
      leftIcon,
      rightIcon,
      variant = "light",
      className = "",
      labelClassName = "",
      id,
      ...props
    },
    ref
  ) => {
    const inputId =
      id || (label ? label.toLowerCase().replace(/[^a-z0-9]+/g, "-") : undefined);

    const isLight = variant === "light";

    const baseStyles = isLight
      ? "bg-white dark:bg-[#21222c] border-slate-200 dark:border-[#44475a] text-slate-900 dark:text-[#f8f8f2] placeholder:text-slate-400 dark:placeholder:text-[#6272a4] hover:border-slate-300 dark:hover:border-[#6272a4] focus:border-blue-600 dark:focus:border-[#bd93f9] focus:ring-blue-600/20 dark:focus:ring-[#bd93f9]/20"
      : "bg-[#21222c] border-[#44475a] text-[#f8f8f2] placeholder:text-[#6272a4] hover:border-[#6272a4] focus:border-[#bd93f9] focus:ring-[#bd93f9]/25";

    const errorStyles = isLight
      ? "border-rose-400 dark:border-[#ff5555] text-slate-900 dark:text-[#f8f8f2] focus:border-rose-500 dark:focus:border-[#ff5555] focus:ring-rose-500/20 dark:focus:ring-[#ff5555]/20"
      : "border-[#ff5555] text-[#f8f8f2] focus:border-[#ff5555] focus:ring-[#ff5555]/30";

    const labelStyles = isLight ? "text-slate-800 dark:text-[#f8f8f2]" : "text-[#f8f8f2]";

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className={`block text-xs font-semibold uppercase tracking-wider ${labelStyles} ${labelClassName}`}
          >
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {leftIcon && (
            <div className="absolute left-3.5 text-slate-400 dark:text-[#94a3b8] pointer-events-none flex items-center z-10">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            className={`w-full border rounded-[4px] px-3.5 py-2.5 text-sm font-medium transition-all duration-150 focus:outline-none focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed ${
              leftIcon ? "pl-10" : ""
            } ${rightIcon ? "pr-10" : ""} ${
              error ? errorStyles : baseStyles
            } ${className}`}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-3.5 text-slate-400 dark:text-[#94a3b8] pointer-events-none flex items-center z-10">
              {rightIcon}
            </div>
          )}
        </div>
        {error ? (
          <p className="text-xs text-rose-500 dark:text-[#ff5555] font-medium mt-1">{error}</p>
        ) : helperText ? (
          <p
            className={`text-xs mt-1 ${
              isLight ? "text-slate-500 dark:text-[#cbd5e1]" : "text-[#cbd5e1]"
            }`}
          >
            {helperText}
          </p>
        ) : null}
      </div>
    );
  }
);
Input.displayName = "Input";

export interface TextAreaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
  variant?: "light" | "dark";
  labelClassName?: string;
}

export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(
  (
    {
      label,
      error,
      helperText,
      variant = "light",
      className = "",
      labelClassName = "",
      id,
      ...props
    },
    ref
  ) => {
    const inputId =
      id || (label ? label.toLowerCase().replace(/[^a-z0-9]+/g, "-") : undefined);

    const isLight = variant === "light";

    const baseStyles = isLight
      ? "bg-white dark:bg-[#21222c] border-slate-200 dark:border-[#44475a] text-slate-900 dark:text-[#f8f8f2] placeholder:text-slate-400 dark:placeholder:text-[#6272a4] hover:border-slate-300 dark:hover:border-[#6272a4] focus:border-blue-600 dark:focus:border-[#bd93f9] focus:ring-blue-600/20 dark:focus:ring-[#bd93f9]/20"
      : "bg-[#21222c] border-[#44475a] text-[#f8f8f2] placeholder:text-[#6272a4] hover:border-[#6272a4] focus:border-[#bd93f9] focus:ring-[#bd93f9]/25";

    const errorStyles = isLight
      ? "border-rose-400 dark:border-[#ff5555] text-slate-900 dark:text-[#f8f8f2] focus:border-rose-500 dark:focus:border-[#ff5555] focus:ring-rose-500/20 dark:focus:ring-[#ff5555]/20"
      : "border-[#ff5555] text-[#f8f8f2] focus:border-[#ff5555] focus:ring-[#ff5555]/30";

    const labelStyles = isLight ? "text-slate-800 dark:text-[#f8f8f2]" : "text-[#f8f8f2]";

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className={`block text-xs font-semibold uppercase tracking-wider ${labelStyles} ${labelClassName}`}
          >
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={inputId}
          className={`w-full border rounded-[4px] px-3.5 py-2.5 text-sm font-medium transition-all duration-150 focus:outline-none focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed ${
            error ? errorStyles : baseStyles
          } ${className}`}
          {...props}
        />
        {error ? (
          <p className="text-xs text-rose-500 dark:text-[#ff5555] font-medium mt-1">{error}</p>
        ) : helperText ? (
          <p
            className={`text-xs mt-1 ${
              isLight ? "text-slate-500 dark:text-[#cbd5e1]" : "text-[#cbd5e1]"
            }`}
          >
            {helperText}
          </p>
        ) : null}
      </div>
    );
  }
);
TextArea.displayName = "TextArea";
