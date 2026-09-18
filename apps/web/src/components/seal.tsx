import { sealPath } from './seal-path';

export type SealLevel = 'bronce' | 'plata' | 'oro';

const FILL: Record<SealLevel, string> = {
  bronce: 'var(--peach-soft)',
  plata: 'var(--gray-100)',
  oro: 'var(--yellow)',
};

export interface SealProps {
  readonly level?: SealLevel;
  readonly size?: number;
  readonly label: string;
}

/** The stamp awarded for a goal. Geometry lives in `seal-path.ts`. */
export function Seal({ level = 'oro', size = 120, label }: SealProps) {
  const r = size / 2 - 6;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={label}>
      <title>{label}</title>
      <path
        d={sealPath(size / 2, size / 2, r, 12)}
        fill={FILL[level]}
        stroke="var(--black)"
        strokeWidth={2.5}
      />
      <path
        d={sealPath(size / 2, size / 2, r - 10, 12)}
        fill="none"
        stroke="var(--black)"
        strokeWidth={2}
      />
    </svg>
  );
}
