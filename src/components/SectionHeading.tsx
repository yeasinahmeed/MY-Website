import { useMemo } from 'react';
import { motion, useReducedMotion } from 'motion/react';

interface SectionHeadingProps {
  kicker?: string;
  text: string;
  className?: string;
  as?: 'h2' | 'h3';
  dark?: boolean;
}

export function SectionHeading({
  kicker,
  text,
  className = '',
  as = 'h2',
  dark = false,
}: SectionHeadingProps) {
  const prefersReduced = useReducedMotion();
  const Tag = as;

  const lines = useMemo(() => {
    const words = text.trim().split(/\s+/);
    const out: string[] = [];
    let current = '';
    for (const w of words) {
      if ((current + ' ' + w).trim().length > 30 && current.length > 0) {
        out.push(current);
        current = w;
      } else {
        current = current ? `${current} ${w}` : w;
      }
    }
    if (current) out.push(current);
    return out;
  }, [text]);

  return (
    <div className="space-y-3">
      {kicker && (
        <p className={`font-mono text-xs tracking-wider ${dark ? 'text-[#9E9E95]' : 'text-[#6E6E67]'}`}>
          {kicker}
        </p>
      )}
      <div className="inline-block">
        <Tag
          className={`vf-shift ${className}`}
          style={{ textWrap: 'balance' }}
          aria-label={text}
        >
          {prefersReduced
            ? text
            : lines.map((line, idx) => (
                <span key={idx} className="block overflow-hidden pb-[0.04em]">
                  <motion.span
                    className="block"
                    initial={{ y: '105%', opacity: 0 }}
                    whileInView={{ y: '0%', opacity: 1 }}
                    viewport={{ once: true, amount: 0.3 }}
                    transition={{
                      duration: 0.55,
                      delay: idx * 0.08,
                      ease: [0.16, 1, 0.3, 1],
                    }}
                  >
                    {line}
                  </motion.span>
                </span>
              ))}
        </Tag>

        {/* Thin champagne-gold underline that draws in */}
        {prefersReduced ? (
          <div className="h-[1.5px] w-20 bg-[#C59B43] mt-3" />
        ) : (
          <motion.div
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.7, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
            style={{ transformOrigin: 'left' }}
            className="h-[1.5px] w-24 bg-[#C59B43] mt-3"
          />
        )}
      </div>
    </div>
  );
}
