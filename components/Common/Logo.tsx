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
      subtitle: "text-[9px]",
    },
    md: {
      icon: "w-9 h-9 rounded-xl",
      svg: 20,
      text: "text-lg sm:text-xl",
      badge: "text-[10px] px-2 py-0.5",
      subtitle: "text-[10px]",
    },
    lg: {
      icon: "w-11 h-11 rounded-xl",
      svg: 24,
      text: "text-2xl",
      badge: "text-xs px-2.5 py-0.5",
      subtitle: "text-xs",
    },
    xl: {
      icon: "w-14 h-14 rounded-2xl",
      svg: 30,
      text: "text-3xl sm:text-4xl",
      badge: "text-sm px-3 py-1",
      subtitle: "text-sm",
    },
  };

  const current = sizeMap[size];
  const isLight = variant === "light";

  const content = (
    <div className={`inline-flex items-center gap-2.5 select-none group ${className}`}>
      {/* Brand Icon - Vibrant Modern Geometric 'Vira' Conversion Mark */}
      <div
        className={`${current.icon} bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 border border-blue-400/30 shadow-md shadow-blue-600/25 group-hover:shadow-blue-600/40 group-hover:border-blue-300/50 transition-all duration-300 group-hover:scale-105 shrink-0 flex items-center justify-center relative overflow-hidden`}
        aria-hidden="true"
      >
        {/* Subtle glossy top highlight */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/25 via-white/5 to-transparent pointer-events-none" />

        <svg
          width={current.svg}
          height={current.svg}
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="relative z-10 transition-transform duration-300 group-hover:scale-105"
        >
          {/* Left Wing / Base Foundation (Clean crisp white with subtle opacity) */}
          <path
            d="M4.5 5.5C4.5 4.67 5.17 4 6 4H8.8C9.55 4 10.2 4.42 10.55 5.08L14.2 12.2L10.8 19L4.5 7.5V5.5Z"
            fill="#ffffff"
            fillOpacity="0.85"
          />

          {/* Right Wing / Ascending 'Virada' Turn (Pure solid white for maximum punch & clarity) */}
          <path
            d="M10.8 19L11.55 20.35C11.75 20.7 12.25 20.7 12.45 20.35L19.5 5.5C19.85 4.8 19.35 4 18.5 4H15.6C14.95 4 14.35 4.38 14.05 4.95L10.8 11.8V19Z"
            fill="#ffffff"
          />

          {/* Precision Top-Right Light Fold Facet (Ice-cyan accent for high-end depth) */}
          <path
            d="M14.05 4.95L15.6 4H18.5C19.35 4 19.85 4.8 19.5 5.5L16.8 11.2L14.05 4.95Z"
            fill="#7dd3fc"
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
            ViraPropo
          </span>
          <span
            className={`font-extrabold rounded-md ${
              isLight
                ? "bg-blue-600 text-white shadow-xs shadow-blue-600/20"
                : "bg-blue-500 text-white shadow-xs shadow-blue-500/20"
            } tracking-tight uppercase ${current.badge}`}
          >
            AI!
          </span>
        </div>
        {showSubtitle && (
          <span
            className={`font-medium tracking-wide -mt-0.5 ${current.subtitle} ${
              isLight ? "text-slate-500" : "text-slate-400"
            }`}
          >
            Sua IA geradora de propostas
          </span>
        )}
      </div>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="inline-flex focus:outline-hidden focus-visible:ring-2 focus-visible:ring-blue-500/50 rounded-lg">
        {content}
      </Link>
    );
  }

  return content;
}


