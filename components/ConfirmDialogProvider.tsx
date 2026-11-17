"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import {
  AlertTriangle,
  Trash2,
  CheckCircle2,
  Info,
  X,
  ShieldAlert,
} from "lucide-react";

export type DialogVariant = "danger" | "warning" | "success" | "info";

export interface ConfirmOptions {
  title: string;
  message: string | React.ReactNode;
  variant?: DialogVariant;
  confirmText?: string;
  confirmLabel?: string;
  cancelText?: string;
  cancelLabel?: string;
}

export interface AlertOptions {
  title?: string;
  message: string | React.ReactNode;
  variant?: DialogVariant;
  okText?: string;
  okLabel?: string;
}

interface ConfirmDialogContextType {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
  alert: (options: AlertOptions | string) => Promise<void>;
}

const ConfirmDialogContext = createContext<ConfirmDialogContextType | undefined>(
  undefined
);

export function ConfirmDialogProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isAlertMode, setIsAlertMode] = useState(false);
  const [dialogConfig, setDialogConfig] = useState<ConfirmOptions>({
    title: "",
    message: "",
    variant: "info",
    confirmText: "Confirmar",
    cancelText: "Cancelar",
  });
  const [resolver, setResolver] = useState<((val: boolean) => void) | null>(null);

  const confirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setDialogConfig({
        title: options.title || "Confirmar Ação",
        message: options.message,
        variant: options.variant || "warning",
        confirmText: options.confirmText || options.confirmLabel || "Confirmar",
        cancelText: options.cancelText || options.cancelLabel || "Cancelar",
      });
      setIsAlertMode(false);
      setIsOpen(true);
      setResolver(() => resolve);
    });
  }, []);

  const alert = useCallback((options: AlertOptions | string): Promise<void> => {
    return new Promise((resolve) => {
      if (typeof options === "string") {
        setDialogConfig({
          title: "Aviso",
          message: options,
          variant: "info",
          confirmText: "Entendido",
          cancelText: "",
        });
      } else {
        setDialogConfig({
          title: options.title || "Aviso do Sistema",
          message: options.message,
          variant: options.variant || "info",
          confirmText: options.okText || options.okLabel || "OK",
          cancelText: "",
        });
      }
      setIsAlertMode(true);
      setIsOpen(true);
      setResolver(() => () => resolve());
    });
  }, []);

  const handleConfirm = () => {
    setIsOpen(false);
    if (resolver) resolver(true);
  };

  const handleCancel = () => {
    setIsOpen(false);
    if (resolver) resolver(false);
  };

  const getVariantStyles = () => {
    switch (dialogConfig.variant) {
      case "danger":
        return {
          icon: <Trash2 className="w-6 h-6 text-rose-600 dark:text-rose-400" />,
          iconBg: "bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900/60",
          confirmBtn:
            "bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/20",
        };
      case "warning":
        return {
          icon: <AlertTriangle className="w-6 h-6 text-amber-600 dark:text-amber-400" />,
          iconBg: "bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900/60",
          confirmBtn:
            "bg-amber-600 hover:bg-amber-700 text-white shadow-amber-600/20",
        };
      case "success":
        return {
          icon: <CheckCircle2 className="w-6 h-6 text-[#10B981]" />,
          iconBg: "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900/60",
          confirmBtn:
            "bg-[#10B981] hover:bg-[#0EA271] text-white shadow-emerald-600/20",
        };
      case "info":
      default:
        return {
          icon: <Info className="w-6 h-6 text-blue-600 dark:text-blue-400" />,
          iconBg: "bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-900/60",
          confirmBtn:
            "bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-white text-white dark:text-slate-900 shadow-slate-900/20",
        };
    }
  };

  const currentStyles = getVariantStyles();

  return (
    <ConfirmDialogContext.Provider value={{ confirm, alert }}>
      {children}

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop com blur */}
          <div
            className="fixed inset-0 bg-black/75 backdrop-blur-2xs transition-opacity animate-fade-in"
            onClick={handleCancel}
          ></div>

          {/* Modal Container */}
          <div className="relative bg-white dark:bg-[#111827] text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-7 shadow-2xl max-w-md w-full z-10 transition-all space-y-5 animate-scale-in">
            {/* Header com Ícone e Fechar */}
            <div className="flex items-start justify-between gap-3">
              <div
                className={`w-12 h-12 rounded-2xl border flex items-center justify-center shrink-0 shadow-2xs ${currentStyles.iconBg}`}
              >
                {currentStyles.icon}
              </div>

              <button
                type="button"
                onClick={handleCancel}
                className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                aria-label="Fechar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Conteúdo: Título e Mensagem */}
            <div className="space-y-2">
              <h3 className="text-lg font-black tracking-tight text-slate-900 dark:text-white">
                {dialogConfig.title}
              </h3>
              <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-normal whitespace-pre-line">
                {dialogConfig.message}
              </div>
            </div>

            {/* Rodapé com Botões */}
            <div className="pt-2 flex items-center justify-end gap-2.5">
              {!isAlertMode && (
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer border border-slate-200 dark:border-slate-700"
                >
                  {dialogConfig.cancelText}
                </button>
              )}

              <button
                type="button"
                onClick={handleConfirm}
                className={`px-5 py-2.5 rounded-xl text-xs font-extrabold transition-all shadow-md active:scale-95 cursor-pointer ${
                  currentStyles.confirmBtn
                } ${isAlertMode ? "w-full" : ""}`}
              >
                {dialogConfig.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmDialogContext.Provider>
  );
}

export function useConfirm() {
  const context = useContext(ConfirmDialogContext);
  if (!context) {
    throw new Error("useConfirm deve ser utilizado dentro de um ConfirmDialogProvider");
  }
  return context;
}
