"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";

export interface BrandLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  showText?: boolean;
  variant?: "default" | "admin";
  contrast?: "auto" | "light" | "dark";
  href?: string;
  badgeClassName?: string;
  textClassName?: string;
}

export default function BrandLogo({
  className = "",
  size = "md",
  showText = true,
  variant = "default",
  contrast = "auto",
  href,
  badgeClassName = "",
  textClassName = "",
}: BrandLogoProps) {
  // Configuração de tamanhos do badge escuro arredondado
  const sizeConfig = {
    sm: {
      badge: "w-8 h-8 rounded-lg p-1",
      image: 22,
      title: "text-xs tracking-tight",
      sub: "text-[9px] tracking-widest",
      adminBadge: "text-[9px] px-1 py-0.2",
    },
    md: {
      badge: "w-10 h-10 rounded-xl p-1.5",
      image: 28,
      title: "text-sm sm:text-base tracking-tight",
      sub: "text-[10px] sm:text-[11px] tracking-widest",
      adminBadge: "text-[10px] px-1.5 py-0.5",
    },
    lg: {
      badge: "w-12 h-12 rounded-xl p-2",
      image: 34,
      title: "text-base sm:text-lg tracking-tight",
      sub: "text-xs tracking-widest",
      adminBadge: "text-xs px-2 py-0.5",
    },
    xl: {
      badge: "w-14 h-14 rounded-2xl p-2.5",
      image: 40,
      title: "text-lg sm:text-xl tracking-tight",
      sub: "text-xs tracking-widest",
      adminBadge: "text-xs px-2 py-0.5",
    },
  };

  const currentSize = sizeConfig[size] || sizeConfig.md;

  // Definição de contraste absoluto:
  // - "dark": força texto branco (ex: cabeçalhos ou rodapés pretos)
  // - "light": força texto ultra escuro slate-950
  // - "auto": slate-950 no tema claro e branco puro no tema escuro
  const titleColor =
    contrast === "dark"
      ? "text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]"
      : contrast === "light"
      ? "text-slate-950"
      : "text-slate-950 dark:text-white";

  const subColor =
    contrast === "dark"
      ? "text-[#FACC15]"
      : contrast === "light"
      ? "text-emerald-700"
      : "text-emerald-700 dark:text-[#FACC15]";

  const content = (
    <div
      className={`inline-flex items-center gap-2.5 select-none transition-transform duration-200 ${className}`}
    >
      {/* Badge escuro arredondado com emblema BS em alta nitidez */}
      <div
        className={`bg-slate-950 dark:bg-black border border-slate-800 shadow-md flex items-center justify-center shrink-0 ${currentSize.badge} ${badgeClassName}`}
      >
        <Image
          src="/images/logo-bs.png"
          alt="BS — Bolinha da Sorte"
          width={currentSize.image}
          height={currentSize.image}
          className="w-full h-full object-contain filter drop-shadow"
          priority
        />
      </div>

      {/* Tipografia Oficial de Alta Definição */}
      {showText && (
        <div className={`flex flex-col leading-none ${textClassName}`}>
          <div className="flex items-center gap-1.5">
            <span
              className={`font-black uppercase tracking-tight ${currentSize.title} ${titleColor}`}
            >
              BOLINHA
            </span>
            {variant === "admin" && (
              <span
                className={`font-mono font-bold uppercase rounded bg-emerald-500/20 text-[#10B981] border border-emerald-500/30 ${currentSize.adminBadge}`}
              >
                ADMIN
              </span>
            )}
          </div>
          <span
            className={`font-extrabold uppercase tracking-widest ${currentSize.sub} flex items-center gap-1 ${subColor}`}
          >
            <span>DA SORTE</span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] inline-block animate-pulse"></span>
          </span>
        </div>
      )}
    </div>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="group inline-flex items-center hover:opacity-95 transition-opacity"
      >
        {content}
      </Link>
    );
  }

  return content;
}
