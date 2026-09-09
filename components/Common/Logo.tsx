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
      icon: "w-7 h-7",
      svg: 20,
      text: "text-base",
      badge: "text-[9px] px-1.5 py-0.5",
    },
    md: {
      icon: "w-9 h-9",
      svg: 24,
      text: "text-lg sm:text-xl",
      badge: "text-[10px] px-2 py-0.5",
    },
    lg: {
      icon: "w-11 h-11",
      svg: 28,
      text: "text-2xl",
      badge: "text-xs px-2.5 py-0.5",
    },
    xl: {
      icon: "w-14 h-14",
      svg: 36,
      text: "text-3xl sm:text-4xl",
      badge: "text-sm px-3 py-1",
    },
  };

  const current = sizeMap[size];
  const isLight = variant === "light";

  const content = (
    <div className={`inline-flex items-center gap-2.5 select-none group ${className}`}>
      {/* Brand Icon */}
      <div
        className={`${current.icon} rounded-xl bg-gradient-to-br from-blue-600 via-blue-500 to-sky-400 p-[1.5px] shadow-md shadow-blue-600/15 group-hover:shadow-blue-600/30 transition-all duration-300 group-hover:scale-105 shrink-0 flex items-center justify-center`}
      >
        <div
          className={`w-full h-full ${
            isLight ? "bg-white" : "bg-slate-950"
          } rounded-[10px] flex items-center justify-center relative overflow-hidden`}
        >
          {/* Subtle internal shine */}
          <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/15 via-transparent to-sky-400/15 pointer-events-none" />

          <svg
            width={current.svg}
            height={current.svg}
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="transform group-hover:rotate-3 transition-transform duration-300 relative z-10"
          >
            {/* Origami Document + AI Bolt Symbol */}
            <path
              d="M4 6.5C4 5.11929 5.11929 4 6.5 4H14.5L19.5 9V17.5C19.5 18.8807 18.3807 20 17 20H6.5C5.11929 20 4 18.8807 4 17.5V6.5Z"
              stroke="url(#logo-grad-primary)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M14 4V9H19"
              stroke="url(#logo-grad-primary)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Electric Spark / Fast AI Pen */}
            <path
              d="M11.5 11L8.5 15H12.5L9.5 19"
              stroke="url(#logo-grad-accent)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <defs>
              <linearGradient
                id="logo-grad-primary"
                x1="4"
                y1="4"
                x2="19.5"
                y2="20"
                gradientUnits="userSpaceOnUse"
              >
                <stop stopColor="#2563eb" />
                <stop offset="1" stopColor="#0284c7" />
              </linearGradient>
              <linearGradient
                id="logo-grad-accent"
                x1="8.5"
                y1="11"
                x2="12.5"
                y2="19"
                gradientUnits="userSpaceOnUse"
              >
                <stop stopColor="#0284c7" />
                <stop offset="1" stopColor="#059669" />
              </linearGradient>
            </defs>
          </svg>
        </div>
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
                : "bg-sky-400 text-slate-950 shadow-xs"
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
