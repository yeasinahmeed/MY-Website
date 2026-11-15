import { useEffect, useRef, useState } from 'react';
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from 'react';
import { ArrowUpRight } from 'lucide-react';

type BaseProps = {
  children: ReactNode;
  className?: string;
  strength?: number;
  variant?: 'primary' | 'secondary' | 'dark';
  showArrow?: boolean;
  cursorLabel?: string;
};

type ButtonProps = BaseProps &
  ButtonHTMLAttributes<HTMLButtonElement> & {
    href?: undefined;
  };

type AnchorProps = BaseProps &
  AnchorHTMLAttributes<HTMLAnchorElement> & {
    href: string;
  };

export function MagneticButton(props: ButtonProps | AnchorProps) {
  const {
    children,
    className = '',
    strength = 0.24,
    variant = 'primary',
    showArrow = false,
    cursorLabel = 'Open',
    ...rest
  } = props;
  const ref = useRef<HTMLElement | null>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [hovered, setHovered] = useState(false);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const finePointer = window.matchMedia('(pointer: fine)').matches;
    setEnabled(!prefersReduced && finePointer);
  }, []);

  const handleMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    if (!enabled || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const relX = e.clientX - (rect.left + rect.width / 2);
    const relY = e.clientY - (rect.top + rect.height / 2);
    setOffset({ x: relX * strength, y: relY * strength });
  };

  const handleMouseEnter = () => setHovered(true);
  const handleMouseLeave = () => {
    setHovered(false);
    setOffset({ x: 0, y: 0 });
  };

  const style = enabled
    ? {
        transform: `translate3d(${offset.x.toFixed(1)}px, ${offset.y.toFixed(1)}px, 0)`,
        transition:
          offset.x === 0 && offset.y === 0
            ? 'transform 220ms cubic-bezier(0.16, 1, 0.3, 1)'
            : 'transform 80ms linear',
      }
    : undefined;

  const baseSurface =
    variant === 'secondary'
      ? 'bg-white text-[#111210] border border-[#D8D8D0] hover:border-[#C59B43]'
      : variant === 'dark'
        ? 'bg-[#111210] text-[#F9F9F7] border border-[#111210]'
        : 'bg-[#111210] text-[#F9F9F7] border border-[#111210]';

  const goldTextColor = 'text-[#111210]';

  const innerContent = (
    <>
      {/* Clip-path sweeping champagne-gold fill */}
      <span
        aria-hidden="true"
        style={{
          clipPath: hovered ? 'inset(0 0% 0 0)' : 'inset(0 100% 0 0)',
          transition: 'clip-path 320ms cubic-bezier(0.16, 1, 0.3, 1)',
        }}
        className="absolute inset-0 bg-[#DFC07C] pointer-events-none"
      />

      {/* Rolling text label + sliding arrow */}
      <span className="relative z-10 inline-flex items-center gap-2 overflow-hidden">
        <span className="relative inline-block overflow-hidden leading-tight">
          <span
            className={`block transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
              hovered ? '-translate-y-full' : 'translate-y-0'
            }`}
          >
            {children}
          </span>
          <span
            aria-hidden="true"
            className={`block absolute inset-x-0 top-full transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${goldTextColor} ${
              hovered ? '-translate-y-full' : 'translate-y-0'
            }`}
          >
            {children}
          </span>
        </span>

        {showArrow && (
          <span className="relative inline-flex w-4 h-4 overflow-hidden shrink-0">
            <ArrowUpRight
              className={`w-4 h-4 transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                hovered ? 'translate-x-full -translate-y-full' : 'translate-x-0 translate-y-0'
              }`}
            />
            <ArrowUpRight
              aria-hidden="true"
              className={`w-4 h-4 absolute inset-0 ${goldTextColor} transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                hovered ? 'translate-x-0 translate-y-0' : '-translate-x-full translate-y-full'
              }`}
            />
          </span>
        )}
      </span>
    </>
  );

  const commonClasses = `relative overflow-hidden inline-flex items-center justify-center whitespace-nowrap shrink-0 will-change-transform active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#C59B43] transition-transform ${baseSurface} ${className}`;

  if ('href' in props && props.href !== undefined) {
    const anchorRest = rest as AnchorHTMLAttributes<HTMLAnchorElement>;
    return (
      <a
        ref={ref as React.RefObject<HTMLAnchorElement>}
        href={props.href}
        data-cursor={cursorLabel}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={style}
        className={commonClasses}
        {...anchorRest}
      >
        {innerContent}
      </a>
    );
  }

  const buttonRest = rest as ButtonHTMLAttributes<HTMLButtonElement>;
  return (
    <button
      ref={ref as React.RefObject<HTMLButtonElement>}
      data-cursor={cursorLabel}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={style}
      className={commonClasses}
      {...buttonRest}
    >
      {innerContent}
    </button>
  );
}
