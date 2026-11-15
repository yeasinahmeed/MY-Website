import { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'motion/react';

interface OdometerCounterProps {
  value: number;
  suffix?: string;
  delayMs?: number;
}

const DIGITS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

export function OdometerCounter({
  value,
  suffix = '',
  delayMs = 0,
}: OdometerCounterProps) {
  const prefersReduced = useReducedMotion();
  const ref = useRef<HTMLSpanElement | null>(null);
  const [triggered, setTriggered] = useState(false);
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    if (prefersReduced) {
      setTriggered(true);
      setDisplayValue(value);
      return;
    }

    const node = ref.current;
    if (!node) return;

    let timer = 0;
    let rafId = 0;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !triggered) {
          setTriggered(true);
          timer = window.setTimeout(() => {
            const start = performance.now();
            const duration = 1050;
            const step = (now: number) => {
              const p = Math.min((now - start) / duration, 1);
              const eased = 1 - Math.pow(1 - p, 4);
              setDisplayValue(Math.round(value * eased));
              if (p < 1) {
                rafId = requestAnimationFrame(step);
              } else {
                setDisplayValue(value);
              }
            };
            rafId = requestAnimationFrame(step);
          }, delayMs);
        }
      },
      { threshold: 0.25 },
    );

    observer.observe(node);
    return () => {
      observer.disconnect();
      if (timer) clearTimeout(timer);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [value, delayMs, prefersReduced, triggered]);

  const formatted = String(triggered ? displayValue : 0);

  if (prefersReduced) {
    return (
      <span ref={ref} className="tabular-nums inline-flex items-baseline">
        {value}
        {suffix}
      </span>
    );
  }

  return (
    <span
      ref={ref}
      aria-label={`${value}${suffix}`}
      className="tabular-nums inline-flex items-baseline overflow-hidden"
    >
      {formatted.split('').map((char, idx) => {
        const digit = Number(char);
        if (Number.isNaN(digit)) {
          return <span key={idx}>{char}</span>;
        }
        return (
          <span
            key={idx}
            className="inline-block h-[1.12em] overflow-hidden leading-[1.12em]"
            aria-hidden="true"
          >
            <span
              style={{
                transform: `translate3d(0, -${digit * 10}%, 0)`,
                transition: 'transform 650ms cubic-bezier(0.16, 1, 0.3, 1)',
              }}
              className="flex flex-col will-change-transform"
            >
              {DIGITS.map((d) => (
                <span key={d} className="block h-[1.12em] leading-[1.12em]">
                  {d}
                </span>
              ))}
            </span>
          </span>
        );
      })}
      {suffix && <span className="ml-[0.04em] text-[#C59B43]">{suffix}</span>}
    </span>
  );
}
