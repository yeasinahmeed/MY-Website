import { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'motion/react';

export function CustomCursor({ disabled = false }: { disabled?: boolean }) {
  const prefersReduced = useReducedMotion();
  const cursorRef = useRef<HTMLDivElement | null>(null);
  const [enabled, setEnabled] = useState(false);
  const [label, setLabel] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (disabled || prefersReduced) {
      setEnabled(false);
      return;
    }
    const fine = window.matchMedia('(pointer: fine)').matches;
    setEnabled(fine);
  }, [disabled, prefersReduced]);

  useEffect(() => {
    if (!enabled) return;

    let targetX = -100;
    let targetY = -100;
    let curX = -100;
    let curY = -100;
    let rafId = 0;

    const tick = () => {
      curX += (targetX - curX) * 0.22;
      curY += (targetY - curY) * 0.22;
      if (cursorRef.current) {
        cursorRef.current.style.transform = `translate3d(${curX.toFixed(1)}px, ${curY.toFixed(1)}px, 0)`;
      }
      rafId = requestAnimationFrame(tick);
    };

    const onMove = (e: MouseEvent) => {
      targetX = e.clientX;
      targetY = e.clientY;
      setVisible(true);
      const target = e.target as HTMLElement | null;
      const tagged = target?.closest('[data-cursor]') as HTMLElement | null;
      if (tagged) {
        setLabel(tagged.getAttribute('data-cursor') || 'Open');
      } else if (target?.closest('button, a')) {
        setLabel('');
      } else {
        setLabel(null);
      }
    };

    const onLeave = () => setVisible(false);

    window.addEventListener('mousemove', onMove, { passive: true });
    document.addEventListener('mouseleave', onLeave);
    rafId = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseleave', onLeave);
      cancelAnimationFrame(rafId);
    };
  }, [enabled]);

  if (!enabled || !visible) return null;

  const hasText = Boolean(label && label.length > 0);
  const isInteractive = label !== null;

  return (
    <div
      ref={cursorRef}
      aria-hidden="true"
      className="pointer-events-none fixed top-0 left-0 z-50 -translate-x-1/2 -translate-y-1/2 will-change-transform"
    >
      <div
        className={`flex items-center justify-center rounded-full transition-all duration-200 ease-out ${
          hasText
            ? 'h-12 px-4 bg-[#111210] text-[#F9F9F7] border border-[#C59B43]'
            : isInteractive
              ? 'w-9 h-9 border border-[#C59B43] bg-[#C59B43]/15'
              : 'w-3 h-3 bg-[#111210]/70'
        }`}
      >
        {hasText && (
          <span className="font-mono text-[11px] font-medium tracking-wide uppercase">
            {label}
          </span>
        )}
      </div>
    </div>
  );
}
