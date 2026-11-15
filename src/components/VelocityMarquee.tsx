import { useEffect, useRef } from 'react';
import { useReducedMotion } from 'motion/react';

interface VelocityMarqueeProps {
  items: string[];
}

export function VelocityMarquee({ items }: VelocityMarqueeProps) {
  const prefersReduced = useReducedMotion();
  const trackRef = useRef<HTMLDivElement | null>(null);
  const offsetRef = useRef(0);
  const velocityRef = useRef(0);

  useEffect(() => {
    if (prefersReduced || items.length === 0) return;

    let lastScrollY = window.scrollY;
    let rafId = 0;
    let lastTime = performance.now();

    const onScroll = () => {
      const currentY = window.scrollY;
      const delta = currentY - lastScrollY;
      lastScrollY = currentY;
      velocityRef.current = Math.max(Math.min(velocityRef.current + delta * 0.25, 28), -28);
    };

    const tick = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;

      // Decay velocity smoothly
      velocityRef.current *= 0.92;
      if (Math.abs(velocityRef.current) < 0.05) velocityRef.current = 0;

      const baseSpeed = 42; // px per second
      const dirSpeed = baseSpeed + Math.abs(velocityRef.current) * 8;
      offsetRef.current -= dirSpeed * dt;

      const track = trackRef.current;
      if (track) {
        const halfWidth = track.scrollWidth / 2;
        if (halfWidth > 0 && Math.abs(offsetRef.current) >= halfWidth) {
          offsetRef.current += halfWidth;
        }
        const skew = Math.max(Math.min(-velocityRef.current * 0.25, 6), -6);
        track.style.transform = `translate3d(${offsetRef.current.toFixed(1)}px, 0, 0) skewX(${skew.toFixed(2)}deg)`;
      }

      rafId = requestAnimationFrame(tick);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    rafId = requestAnimationFrame(tick);
    return () => {
      window.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(rafId);
    };
  }, [prefersReduced, items.length]);

  if (items.length === 0) return null;

  const repeated = [...items, ...items];

  return (
    <div
      aria-label="Capabilities and services marquee"
      className="overflow-hidden border-y border-[#E4E4DF] bg-[#F3F3EF] py-4 select-none"
    >
      <div
        ref={trackRef}
        className={`flex items-center gap-8 whitespace-nowrap will-change-transform ${
          prefersReduced ? 'flex-wrap justify-center px-6' : 'w-max'
        }`}
      >
        {(prefersReduced ? items : repeated).map((label, idx) => (
          <div key={`${label}-${idx}`} className="inline-flex items-center gap-8 shrink-0">
            <span className="font-display text-sm sm:text-base font-medium tracking-tight text-[#111210]">
              {label}
            </span>
            <span aria-hidden="true" className="text-[#C59B43] text-xs font-mono">
              /
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
