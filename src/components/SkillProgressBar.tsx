import { motion, useReducedMotion } from 'motion/react';

export function mapProficiencyToPercent(label: string): number {
  const numMatch = label.match(/(\d{1,3})\s*%/);
  if (numMatch?.[1]) return Math.min(Math.max(Number(numMatch[1]), 10), 100);
  const lower = label.toLowerCase();
  if (lower.includes('trainer') || lower.includes('expert')) return 96;
  if (lower.includes('lead') || lower.includes('senior')) return 92;
  if (lower.includes('advanced')) return 86;
  return 80;
}

export function extractRingProgress(valueStr: string): number {
  const pctMatch = valueStr.match(/(\d+(?:\.\d+)?)\s*%/);
  if (pctMatch?.[1]) {
    const n = Math.abs(Number(pctMatch[1]));
    if (n <= 100) return Math.max(n, 15);
    return Math.min(82 + (n % 15), 96);
  }
  const xMatch = valueStr.match(/(\d+(?:\.\d+)?)\s*x/i);
  if (xMatch?.[1]) {
    return Math.min(Math.round(Number(xMatch[1]) * 24), 95);
  }
  return 88;
}

export function SkillProgressBar({ label }: { label: string }) {
  const prefersReduced = useReducedMotion();
  const pct = mapProficiencyToPercent(label);

  return (
    <div className="w-full h-[3px] bg-[#ECECE7] rounded-full overflow-hidden mt-1.5">
      {prefersReduced ? (
        <div
          style={{ width: `${pct}%` }}
          className="h-full bg-[#C59B43] rounded-full"
        />
      ) : (
        <motion.div
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
          style={{ width: `${pct}%`, transformOrigin: 'left' }}
          className="h-full bg-[#C59B43] rounded-full"
        />
      )}
    </div>
  );
}

export function ResultRing({ value }: { value: string }) {
  const prefersReduced = useReducedMotion();
  const pct = extractRingProgress(value);
  const size = 44;
  const stroke = 3;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - pct / 100);

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      aria-hidden="true"
      className="shrink-0 -rotate-90"
    >
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="#E4E4DF"
        strokeWidth={stroke}
      />
      {prefersReduced ? (
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="#C59B43"
          strokeWidth={stroke}
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      ) : (
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="#C59B43"
          strokeWidth={stroke}
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          whileInView={{ strokeDashoffset: offset }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          strokeLinecap="round"
        />
      )}
    </svg>
  );
}
