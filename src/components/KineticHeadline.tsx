import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';

interface KineticHeadlineProps {
  text: string;
  className?: string;
}

export function KineticHeadline({ text, className = '' }: KineticHeadlineProps) {
  const prefersReduced = useReducedMotion();
  const containerRef = useRef<HTMLHeadingElement | null>(null);
  const charRefs = useRef<Array<HTMLSpanElement | null>>([]);
  const [finePointer, setFinePointer] = useState(false);

  useEffect(() => {
    setFinePointer(window.matchMedia('(pointer: fine)').matches);
  }, []);

  // Split text into lines (~24 chars per balanced editorial line)
  const lines = useMemo(() => {
    const words = text.trim().split(/\s+/);
    const out: string[] = [];
    let current = '';
    for (const w of words) {
      if ((current + ' ' + w).trim().length > 22 && current.length > 0) {
        out.push(current);
        current = w;
      } else {
        current = current ? `${current} ${w}` : w;
      }
    }
    if (current) out.push(current);
    return out;
  }, [text]);

  useEffect(() => {
    if (prefersReduced || !finePointer) return;
    const el = containerRef.current;
    if (!el) return;

    let rafId = 0;
    let mouseX = -9999;
    let mouseY = -9999;

    const updateChars = () => {
      rafId = 0;
      const radius = 125;
      for (const span of charRefs.current) {
        if (!span) continue;
        const rect = span.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const dx = mouseX - cx;
        const dy = mouseY - cy;
        const dist = Math.hypot(dx, dy);

        if (dist < radius) {
          const factor = 1 - dist / radius;
          const lift = -factor * 5.5;
          const weight = Math.round(600 + factor * 190);
          span.style.transform = `translate3d(0, ${lift.toFixed(1)}px, 0)`;
          span.style.fontVariationSettings = `"wght" ${weight}`;
        } else if (span.style.transform) {
          span.style.transform = '';
          span.style.fontVariationSettings = '';
        }
      }
    };

    const onMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      if (!rafId) rafId = requestAnimationFrame(updateChars);
    };

    const onLeave = () => {
      mouseX = -9999;
      mouseY = -9999;
      if (!rafId) rafId = requestAnimationFrame(updateChars);
    };

    el.addEventListener('mousemove', onMove);
    el.addEventListener('mouseleave', onLeave);
    return () => {
      el.removeEventListener('mousemove', onMove);
      el.removeEventListener('mouseleave', onLeave);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [prefersReduced, finePointer]);

  if (prefersReduced) {
    return (
      <h1 className={className} style={{ textWrap: 'balance' }}>
        {text}
      </h1>
    );
  }

  let globalCharIdx = 0;

  return (
    <h1
      ref={containerRef}
      aria-label={text}
      className={`${className} select-none`}
      style={{ textWrap: 'balance' }}
    >
      {lines.map((line, lineIdx) => (
        <span key={lineIdx} className="block overflow-hidden pb-[0.06em]">
          {line.split('').map((char, cIdx) => {
            const index = globalCharIdx++;
            const isSpace = char === ' ';
            return (
              <motion.span
                key={`${lineIdx}-${cIdx}`}
                initial={{ y: '115%', opacity: 0 }}
                animate={{ y: '0%', opacity: 1 }}
                transition={{
                  duration: 0.6,
                  delay: Math.min(index * 0.014, 0.52),
                  ease: [0.16, 1, 0.3, 1],
                }}
                className="inline-block"
              >
                <span
                  ref={(node) => {
                    charRefs.current[index] = node;
                  }}
                  className="inline-block transition-transform duration-150 ease-out will-change-transform"
                >
                  {isSpace ? '\u00A0' : char}
                </span>
              </motion.span>
            );
          })}
        </span>
      ))}
    </h1>
  );
}
