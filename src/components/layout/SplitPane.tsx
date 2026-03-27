import { useCallback, useRef, useEffect } from 'react';
import { useAppStore } from '../../stores/useAppStore';

interface SplitPaneProps {
  left: React.ReactNode;
  right: React.ReactNode;
}

export function SplitPane({ left, right }: SplitPaneProps) {
  const leftPanelWidth = useAppStore((s) => s.leftPanelWidth);
  const setLeftPanelWidth = useAppStore((s) => s.setLeftPanelWidth);
  const dragging = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    dragging.current = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, []);

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!dragging.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const pct = ((e.clientX - rect.left) / rect.width) * 100;
      const minPx = 300;
      const minPct = (minPx / rect.width) * 100;
      const maxPct = 100 - minPct;
      setLeftPanelWidth(Math.min(maxPct, Math.max(minPct, pct)));
    };

    const onMouseUp = () => {
      if (dragging.current) {
        dragging.current = false;
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      }
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [setLeftPanelWidth]);

  return (
    <div ref={containerRef} className="flex flex-1 min-h-0 overflow-hidden" role="main">
      <div
        className="flex flex-col min-w-[300px] overflow-hidden"
        style={{ width: `${leftPanelWidth}%` }}
      >
        {left}
      </div>

      <div
        onMouseDown={onMouseDown}
        className="w-1 cursor-col-resize bg-stone-200 dark:bg-stone-700 hover:bg-primary-500 dark:hover:bg-primary-500 transition-colors flex-shrink-0"
        role="separator"
        aria-orientation="vertical"
        aria-label="Resize panels"
        tabIndex={0}
      />

      <div className="flex flex-col flex-1 min-w-[300px] overflow-hidden">
        {right}
      </div>
    </div>
  );
}
