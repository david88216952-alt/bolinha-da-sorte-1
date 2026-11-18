"use client";

import React from "react";
import BrandLogo, { BrandLogoProps } from "./BrandLogo";

export interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  showText?: boolean;
  variant?: "auto" | "light" | "dark" | "pill" | "admin" | "default";
  href?: string;
}

export default function Logo({
  className = "",
  size = "md",
  showText = true,
  variant = "auto",
  href,
}: LogoProps) {
  const contrast =
    variant === "dark" || variant === "pill"
      ? "dark"
      : variant === "light"
      ? "light"
      : "auto";

  return (
    <BrandLogo
      size={size}
      showText={showText}
      contrast={contrast}
      href={href}
      className={className}
      variant={variant === "admin" ? "admin" : "default"}
    />
  );
}

export { BrandLogo };
