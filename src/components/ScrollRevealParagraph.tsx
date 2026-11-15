import { useEffect, useMemo, useRef, useState } from 'react';
import { useReducedMotion } from 'motion/react';

interface ScrollRevealParagraphProps {
  text: string;
  className?: string;
}

export function ScrollRevealParagraph({ text, className = '' }: ScrollRevealParagraphProps) {
  const prefersReduced = useReducedMotion();
  const ref = useRef<HTMLParagraphElement | null>(null);
  const [progress, setProgress] = useState(prefersReduced ? 1 : 0.15);

  const words = useMemo(() => text.trim().split(/\s+/), [text]);

  useEffect(() => {
    if (prefersReduced) {
      setProgress(1);
      return;
    }

    let rafId = 0;
    const update = () => {
      rafId = 0;
      const el = ref.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight || 800;
      // Map element center from 88% viewport height (start) to 38% viewport height (complete)
      const start = vh * 0.88;
      const end = vh * 0.38;
      const raw = (start - rect.top) / Math.max(start - end, 1);
      setProgress(Math.min(Math.max(raw, 0), 1));
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

  if (prefersReduced) {
    return <p className={className}>{text}</p>;
  }

  return (
    <p ref={ref} className={className}>
      {words.map((word, idx) => {
        const threshold = idx / Math.max(words.length - 1, 1);
        const lit = Math.min(Math.max((progress - threshold * 0.82) / 0.18, 0), 1);
        const opacity = 0.22 + lit * 0.78;
        return (
          <span
            key={`${word}-${idx}`}
            style={{ opacity }}
            className="inline-block mr-[0.28em] transition-opacity duration-75"
          >
            {word}
          </span>
        );
      })}
    </p>
  );
}
