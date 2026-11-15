import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { useReducedMotion } from 'motion/react';

interface TiltProjectCardProps {
  children: ReactNode;
  className?: string;
}

export function TiltProjectCard({ children, className = '' }: TiltProjectCardProps) {
  const prefersReduced = useReducedMotion();
  const cardRef = useRef<HTMLElement | null>(null);
  const glareRef = useRef<HTMLDivElement | null>(null);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const fine = window.matchMedia('(pointer: fine)').matches;
    setEnabled(fine && !prefersReduced);
  }, [prefersReduced]);

  const handleMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    if (!enabled || !cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const px = (e.clientX - rect.left) / Math.max(rect.width, 1);
    const py = (e.clientY - rect.top) / Math.max(rect.height, 1);
    const rotY = (px - 0.5) * 9;
    const rotX = (0.5 - py) * 7;

    cardRef.current.style.transform = `perspective(1000px) rotateX(${rotX.toFixed(2)}deg) rotateY(${rotY.toFixed(2)}deg) translate3d(0, -3px, 0)`;

    if (glareRef.current) {
      glareRef.current.style.opacity = '1';
      glareRef.current.style.background = `radial-gradient(circle at ${(px * 100).toFixed(1)}% ${(py * 100).toFixed(1)}%, rgba(223, 192, 124, 0.22), transparent 58%)`;
    }
  };

  const handleMouseLeave = () => {
    if (!cardRef.current) return;
    cardRef.current.style.transform =
      'perspective(1000px) rotateX(0deg) rotateY(0deg) translate3d(0, 0, 0)';
    if (glareRef.current) {
      glareRef.current.style.opacity = '0';
    }
  };

  return (
    <article
      ref={cardRef}
      data-cursor="View"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        transition: 'transform 260ms cubic-bezier(0.16, 1, 0.3, 1), border-color 200ms ease',
      }}
      className={`relative will-change-transform ${className}`}
    >
      {children}
      <div
        ref={glareRef}
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 rounded-2xl"
      />
    </article>
  );
}
