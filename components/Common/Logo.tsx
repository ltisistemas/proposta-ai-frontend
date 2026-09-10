import React from "react";
import Link from "next/link";

interface LogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  variant?: "light" | "dark";
  showSubtitle?: boolean;
  href?: string;
  className?: string;
}

export function Logo({
  size = "md",
  variant = "light",
  showSubtitle = false,
  href,
  className = "",
}: LogoProps) {
  const sizeMap = {
    sm: {
      icon: "w-7 h-7 rounded-lg",
      svg: 16,
      text: "text-base",
      badge: "text-[9px] px-1.5 py-0.5",
    },
    md: {
      icon: "w-9 h-9 rounded-xl",
      svg: 20,
      text: "text-lg sm:text-xl",
      badge: "text-[10px] px-2 py-0.5",
    },
    lg: {
      icon: "w-11 h-11 rounded-xl",
      svg: 24,
      text: "text-2xl",
      badge: "text-xs px-2.5 py-0.5",
    },
    xl: {
      icon: "w-14 h-14 rounded-2xl",
      svg: 30,
      text: "text-3xl sm:text-4xl",
      badge: "text-sm px-3 py-1",
    },
  };

  const current = sizeMap[size];
  const isLight = variant === "light";

  const content = (
    <div className={`inline-flex items-center gap-2.5 select-none group ${className}`}>
      {/* Brand Icon - Solid high-contrast gradient badge with crisp white & cyan vector glyph */}
      <div
        className={`${current.icon} bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 border border-blue-400/30 shadow-md shadow-blue-600/25 group-hover:shadow-blue-600/40 transition-all duration-300 group-hover:scale-105 shrink-0 flex items-center justify-center relative overflow-hidden`}
      >
        {/* Subtle glossy top reflection */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/20 via-transparent to-black/10 pointer-events-none" />

        <svg
          width={current.svg}
          height={current.svg}
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="transform group-hover:scale-105 transition-transform duration-200 relative z-10"
        >
          {/* Proposal Document Sheet */}
          <path
            d="M5 4.5C5 3.67157 5.67157 3 6.5 3H14.5L19 7.5V19.5C19 20.3284 18.3284 21 17.5 21H6.5C5.67157 21 5 20.3284 5 19.5V4.5Z"
            stroke="#ffffff"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Document Fold Corner */}
          <path
            d="M14 3V8H19"
            stroke="#ffffff"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeOpacity="0.9"
          />
          {/* AI Energy Spark / Pen */}
          <path
            d="M11.5 10.5L8.5 14.5H12.5L9.5 18.5"
            stroke="#38bdf8"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      {/* Brand Text */}
      <div className="flex flex-col">
        <div className="flex items-center gap-1.5">
          <span
            className={`font-black tracking-tight ${
              isLight ? "text-slate-900" : "text-white"
            } ${current.text}`}
          >
            Proposta
          </span>
          <span
            className={`font-black rounded-lg ${
              isLight
                ? "bg-blue-600 text-white shadow-xs"
                : "bg-sky-500 text-white shadow-xs"
            } tracking-tight uppercase ${current.badge}`}
          >
            Ai!
          </span>
        </div>
        {showSubtitle && (
          <span
            className={`text-[10px] font-medium tracking-wider uppercase -mt-0.5 ${
              isLight ? "text-slate-500" : "text-slate-400"
            }`}
          >
            Propostas Comerciais Inteligentes
          </span>
        )}
      </div>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="inline-flex">
        {content}
      </Link>
    );
  }

  return content;
}
