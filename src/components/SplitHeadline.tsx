import { motion, useReducedMotion } from 'motion/react';

interface SplitHeadlineProps {
  text: string;
  className?: string;
  as?: 'h1' | 'h2' | 'h3';
}

export function SplitHeadline({ text, className = '', as = 'h1' }: SplitHeadlineProps) {
  const prefersReduced = useReducedMotion();
  const words = text.split(' ');
  const Tag = as;

  if (prefersReduced) {
    return (
      <Tag className={className} style={{ textWrap: 'balance' }}>
        {text}
      </Tag>
    );
  }

  return (
    <Tag className={className} style={{ textWrap: 'balance' }} aria-label={text}>
      {words.map((word, idx) => (
        <span key={`${word}-${idx}`} className="inline-block overflow-hidden align-top mr-[0.26em]">
          <motion.span
            className="inline-block"
            initial={{ y: '100%', opacity: 0 }}
            whileInView={{ y: '0%', opacity: 1 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{
              duration: 0.55,
              delay: Math.min(idx * 0.045, 0.36),
              ease: [0.16, 1, 0.3, 1],
            }}
          >
            {word}
          </motion.span>
        </span>
      ))}
    </Tag>
  );
}
