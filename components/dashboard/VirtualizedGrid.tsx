"use client";

import { useMemo, useRef, useState, useLayoutEffect, type ReactNode } from "react";

type VirtualizedGridProps<T> = {
  items: T[];
  columns: number;
  rowHeight: number;
  overscan?: number;
  renderRow: (rowItems: T[], rowIndex: number) => ReactNode;
};

export function VirtualizedGrid<T>({
  items,
  columns,
  rowHeight,
  overscan = 4,
  renderRow,
}: VirtualizedGridProps<T>) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [height, setHeight] = useState(600);
  const [width, setWidth] = useState(1024);
  const [scrollTop, setScrollTop] = useState(0);

  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const resize = () => {
      setHeight(el.clientHeight || 600);
      setWidth(el.clientWidth || 1024);
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const actualColumns = width < 768 ? 1 : columns;

  const rows = useMemo(() => {
    const result: T[][] = [];
    for (let i = 0; i < items.length; i += actualColumns) {
      result.push(items.slice(i, i + actualColumns));
    }
    return result;
  }, [items, actualColumns]);

  const totalHeight = rows.length * rowHeight;
  const startIndex = Math.max(0, Math.floor(scrollTop / rowHeight) - overscan);
  const endIndex = Math.min(rows.length, Math.ceil((scrollTop + height) / rowHeight) + overscan);
  const visibleRows = rows.slice(startIndex, endIndex);

  return (
    <div
      ref={containerRef}
      className="relative h-[680px] overflow-y-auto rounded-2xl border border-white/10 bg-white/5"
      onScroll={(e) => setScrollTop(e.currentTarget.scrollTop)}
    >
      <div style={{ height: totalHeight }}>
        <div style={{ transform: `translateY(${startIndex * rowHeight}px)` }} className="space-y-4 p-4">
          {visibleRows.map((row, index) => renderRow(row, startIndex + index))}
        </div>
      </div>
    </div>
  );
}
