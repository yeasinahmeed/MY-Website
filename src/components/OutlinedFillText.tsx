import { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'motion/react';

interface OutlinedFillTextProps {
  text: string;
  className?: string;
}

export function OutlinedFillText({ text, className = '' }: OutlinedFillTextProps) {
  const prefersReduced = useReducedMotion();
  const ref = useRef<HTMLDivElement | null>(null);
  const [fillPct, setFillPct] = useState(prefersReduced ? 100 : 0);

  useEffect(() => {
    if (prefersReduced) {
      setFillPct(100);
      return;
    }

    let rafId = 0;
    const update = () => {
      rafId = 0;
      const el = ref.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight || 800;
      const raw = (vh * 0.85 - rect.top) / Math.max(vh * 0.48, 1);
      setFillPct(Math.round(Math.min(Math.max(raw, 0), 1) * 100));
    };

    const onScroll = () => {
      if (!rafId) rafId = requestAnimationFrame(update);
    };

    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [prefersReduced]);

  return (
    <div ref={ref} className={`relative select-none ${className}`}>
      {/* Outlined base layer */}
      <p className="text-outlined-ink font-display font-bold tracking-tight leading-[1.02]">
        {text}
      </p>
      {/* Solid champagne-gold / ink clipped fill layer */}
      <p
        aria-hidden="true"
        style={{
          clipPath: `inset(0 ${100 - fillPct}% 0 0)`,
        }}
        className="absolute inset-0 font-display font-bold tracking-tight leading-[1.02] text-[#111210] transition-[clip-path] duration-75"
      >
        {text}
      </p>
    </div>
  );
}
