"use client";

import { useRef, useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, MoveHorizontal } from "lucide-react";

interface DraggableTableProps {
  children: React.ReactNode;
  className?: string;
  showScrollHint?: boolean;
}

export default function DraggableTable({
  children,
  className = "",
  showScrollHint = true,
}: DraggableTableProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [hasOverflow, setHasOverflow] = useState(false);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // Verifica se o conteúdo ultrapassa a largura disponível
  const updateScrollState = () => {
    const el = containerRef.current;
    if (!el) return;
    const overflow = el.scrollWidth > el.clientWidth + 8;
    setHasOverflow(overflow);
    setCanScrollLeft(el.scrollLeft > 10);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 10);
  };

  useEffect(() => {
    updateScrollState();
    window.addEventListener("resize", updateScrollState);
    return () => window.removeEventListener("resize", updateScrollState);
  }, [children]);

  // Arrastar com o mouse (Mouse Drag-to-Scroll)
  const handleMouseDown = (e: React.MouseEvent) => {
    const el = containerRef.current;
    if (!el) return;
    // Ignorar cliques em botões, links, selects ou inputs para não atrapalhar a interação
    const target = e.target as HTMLElement;
    if (
      target.closest("button") ||
      target.closest("a") ||
      target.closest("input") ||
      target.closest("select")
    ) {
      return;
    }
    setIsDragging(true);
    setStartX(e.pageX - el.offsetLeft);
    setScrollLeft(el.scrollLeft);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    const el = containerRef.current;
    if (!el) return;
    const x = e.pageX - el.offsetLeft;
    const walk = (x - startX) * 1.5; // Fator de aceleração
    el.scrollLeft = scrollLeft - walk;
    updateScrollState();
  };

  const handleMouseUpOrLeave = () => {
    setIsDragging(false);
    updateScrollState();
  };

  const scrollBy = (offset: number) => {
    const el = containerRef.current;
    if (!el) return;
    el.scrollBy({ left: offset, behavior: "smooth" });
    setTimeout(updateScrollState, 300);
  };

  return (
    <div className="relative group/drag w-full">
      {/* Barra de controle e dica visual de arrastar para o lado */}
      {showScrollHint && hasOverflow && (
        <div className="flex items-center justify-between gap-2 px-3 py-1.5 mb-2.5 bg-slate-100/90 dark:bg-slate-800/80 border border-slate-200/90 dark:border-slate-700/80 rounded-xl text-[11px] text-slate-600 dark:text-slate-300 font-medium select-none">
          <div className="flex items-center gap-2">
            <span className="flex items-center justify-center w-5 h-5 rounded-md bg-[#10B981]/20 text-[#10B981] font-bold">
              <MoveHorizontal className="w-3.5 h-3.5 animate-pulse" />
            </span>
            <span>
              <strong className="text-slate-900 dark:text-white font-bold">Dica:</strong> Clique e arraste para os lados para visualizar todas as colunas
            </span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => scrollBy(-250)}
              disabled={!canScrollLeft}
              className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                canScrollLeft
                  ? "bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-600 border-slate-300 dark:border-slate-600 shadow-2xs"
                  : "bg-slate-200/50 dark:bg-slate-800 text-slate-400 dark:text-slate-600 border-slate-200 dark:border-slate-700 cursor-not-allowed opacity-50"
              }`}
              title="Rolar para a esquerda"
              aria-label="Rolar para a esquerda"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => scrollBy(250)}
              disabled={!canScrollRight}
              className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                canScrollRight
                  ? "bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-600 border-slate-300 dark:border-slate-600 shadow-2xs"
                  : "bg-slate-200/50 dark:bg-slate-800 text-slate-400 dark:text-slate-600 border-slate-200 dark:border-slate-700 cursor-not-allowed opacity-50"
              }`}
              title="Rolar para a direita"
              aria-label="Rolar para a direita"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Contêiner arrastável */}
      <div
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUpOrLeave}
        onMouseLeave={handleMouseUpOrLeave}
        onScroll={updateScrollState}
        className={`overflow-x-auto scroll-smooth ${
          isDragging ? "cursor-grabbing select-none" : "cursor-grab"
        } ${className}`}
        style={{ scrollbarWidth: "thin" }}
      >
        {children}
      </div>
    </div>
  );
}
