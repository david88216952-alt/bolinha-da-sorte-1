"use client";

import React from "react";
import Link from "next/link";
import { useTheme } from "./ThemeProvider";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  showText?: boolean;
  variant?: "auto" | "light" | "dark" | "pill";
  href?: string;
}

export default function Logo({
  className = "",
  size = "md",
  showText = true,
  variant = "auto",
  href,
}: LogoProps) {
  let isDarkMode = false;
  try {
    const themeContext = useTheme();
    isDarkMode = themeContext.theme === "dark";
  } catch {
    // fallback if outside ThemeProvider
    isDarkMode = false;
  }

  // Dimensões do Emblema BS
  const emblemSizes = {
    sm: "w-8 h-8",
    md: "w-10 h-10",
    lg: "w-12 h-12",
  };

  const titleSizes = {
    sm: "text-xs tracking-tight",
    md: "text-sm sm:text-base tracking-tight",
    lg: "text-base sm:text-lg tracking-tight",
  };

  const subSizes = {
    sm: "text-[9px] tracking-widest",
    md: "text-[10px] sm:text-[11px] tracking-widest",
    lg: "text-xs tracking-widest",
  };

  // Se variant for "pill", envolve em cápsula escura de alto contraste
  const isPill = variant === "pill";

  // Classes de cores responsivas para contraste impecável em qualquer tema
  const titleColorClass =
    variant === "dark" || isPill
      ? "text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]"
      : variant === "light"
      ? "text-slate-950 font-black"
      : "text-slate-950 dark:text-white";

  const subColorClass =
    variant === "dark" || isPill
      ? "text-[#FACC15] drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]"
      : variant === "light"
      ? "text-emerald-700 font-black"
      : "text-emerald-700 dark:text-[#FACC15] font-black dark:font-extrabold";

  const content = (
    <div
      className={`inline-flex items-center gap-2.5 transition-transform duration-200 select-none ${
        isPill
          ? "bg-slate-950/95 dark:bg-black/90 px-3 py-2 rounded-2xl border border-slate-800 shadow-md"
          : ""
      } ${className}`}
    >
      {/* Emblema Vetorial BS (Verde Esmeralda e Amarelo Ouro) */}
      <div className={`relative shrink-0 flex items-center justify-center ${emblemSizes[size]}`}>
        <svg
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full drop-shadow-md"
        >
          {/* Fundo do círculo com brilho sutil */}
          <circle cx="50" cy="50" r="48" fill="#0A0F1D" stroke="#1E293B" strokeWidth="2.5" />

          {/* Letra 'B' - Lado Esquerdo em Verde Esmeralda */}
          <path
            d="M 47 16 
               C 32 16 20 28 20 50 
               C 20 72 32 84 47 84 
               L 47 73 
               C 38 73 30 65 30 50 
               C 30 35 38 27 47 27 
               Z"
            fill="url(#greenGradient)"
          />
          <path
            d="M 36 34 
               C 42 34 47 38 47 45 
               C 47 47 45 49 43 50 
               C 46 51 47 54 47 57 
               C 47 64 41 67 36 67 
               L 36 60 
               C 39 60 41 58 41 55 
               C 41 52 38 51 35 51 
               L 35 48 
               C 38 48 41 46 41 43 
               C 41 40 39 39 36 39 
               Z"
            fill="url(#greenGradientLight)"
          />

          {/* Letra 'S' - Lado Direito em Amarelo Dourado */}
          <path
            d="M 53 16 
               L 53 27 
               C 62 27 70 35 70 50 
               C 70 65 62 73 53 73 
               L 53 84 
               C 68 84 80 72 80 50 
               C 80 28 68 16 53 16 
               Z"
            fill="url(#goldGradient)"
          />
          <path
            d="M 64 34 
               C 58 34 53 38 53 43 
               C 53 49 66 49 66 57 
               C 66 61 62 66 56 66 
               C 52 66 49 64 48 61 
               L 53 57 
               C 54 59 55 60 56 60 
               C 58 60 60 58 60 56 
               C 60 51 47 51 47 42 
               C 47 37 51 32 57 32 
               C 61 32 64 34 65 37 
               Z"
            fill="url(#goldGradientLight)"
          />

          {/* Gradientes e Brilhos */}
          <defs>
            <linearGradient id="greenGradient" x1="20" y1="16" x2="47" y2="84" gradientUnits="userSpaceOnUse">
              <stop stopColor="#10B981" />
              <stop offset="1" stopColor="#047857" />
            </linearGradient>
            <linearGradient id="greenGradientLight" x1="30" y1="30" x2="47" y2="70" gradientUnits="userSpaceOnUse">
              <stop stopColor="#34D399" />
              <stop offset="1" stopColor="#059669" />
            </linearGradient>
            <linearGradient id="goldGradient" x1="53" y1="16" x2="80" y2="84" gradientUnits="userSpaceOnUse">
              <stop stopColor="#FDE047" />
              <stop offset="1" stopColor="#CA8A04" />
            </linearGradient>
            <linearGradient id="goldGradientLight" x1="53" y1="30" x2="70" y2="70" gradientUnits="userSpaceOnUse">
              <stop stopColor="#FEF08A" />
              <stop offset="1" stopColor="#EAB308" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Tipografia Oficial de Alta Definição */}
      {showText && (
        <div className="flex flex-col leading-none">
          <span className={`font-black uppercase tracking-tight ${titleSizes[size]} ${titleColorClass}`}>
            BOLINHA
          </span>
          <span className={`font-extrabold uppercase ${subSizes[size]} flex items-center gap-1 ${subColorClass}`}>
            <span>DA SORTE</span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] inline-block"></span>
          </span>
        </div>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="group inline-flex items-center">
        {content}
      </Link>
    );
  }

  return content;
}
