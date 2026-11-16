"use client";

import { useTheme } from "./ThemeProvider";
import { Sun, Moon } from "lucide-react";

export default function ThemeToggle({ className = "" }: { className?: string }) {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`p-2 rounded-xl border transition-all duration-200 cursor-pointer flex items-center justify-center gap-1.5 ${
        theme === "dark"
          ? "bg-slate-800 text-amber-300 border-slate-700 hover:bg-slate-700 hover:text-amber-200 shadow-2xs"
          : "bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200 hover:text-slate-900 shadow-2xs"
      } ${className}`}
      title={theme === "dark" ? "Mudar para Modo Claro" : "Mudar para Modo Escuro"}
      aria-label="Alternar tema claro/escuro"
    >
      {theme === "dark" ? (
        <Sun className="w-4 h-4 text-amber-300 transition-transform hover:rotate-45" />
      ) : (
        <Moon className="w-4 h-4 text-slate-700 transition-transform hover:-rotate-12" />
      )}
      <span className="text-[11px] font-bold hidden sm:inline">
        {theme === "dark" ? "Claro" : "Escuro"}
      </span>
    </button>
  );
}
