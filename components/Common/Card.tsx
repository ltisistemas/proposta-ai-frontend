import React from "react";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  glass?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = "",
  glass = false,
  ...props
}) => {
  return (
    <div
      className={`rounded-[4px] border transition-all ${
        glass
          ? "bg-white/80 dark:bg-[#282a36]/85 backdrop-blur-xl border-slate-200/80 dark:border-[#44475a] shadow-sm text-slate-900 dark:text-[#f8f8f2]"
          : "bg-white dark:bg-[#343746] border-slate-200/80 dark:border-[#44475a] shadow-xs hover:border-slate-300 dark:hover:border-[#6272a4] text-slate-900 dark:text-[#f8f8f2]"
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children,
  className = "",
  ...props
}) => (
  <div className={`p-6 pb-3 ${className}`} {...props}>
    {children}
  </div>
);

export const CardTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({
  children,
  className = "",
  ...props
}) => (
  <h3
    className={`text-lg font-bold text-slate-900 dark:text-[#f8f8f2] tracking-tight ${className}`}
    {...props}
  >
    {children}
  </h3>
);

export const CardDescription: React.FC<
  React.HTMLAttributes<HTMLParagraphElement>
> = ({ children, className = "", ...props }) => (
  <p className={`text-sm text-slate-500 dark:text-[#6272a4] mt-1 ${className}`} {...props}>
    {children}
  </p>
);

export const CardContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children,
  className = "",
  ...props
}) => (
  <div className={`p-6 pt-3 ${className}`} {...props}>
    {children}
  </div>
);

export const CardFooter: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children,
  className = "",
  ...props
}) => (
  <div
    className={`p-6 pt-0 flex items-center border-t border-slate-100 dark:border-[#44475a]/70 mt-4 ${className}`}
    {...props}
  >
    {children}
  </div>
);
