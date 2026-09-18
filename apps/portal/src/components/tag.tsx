import type { ReactNode } from 'react';

import { dot, tag } from './tag.css';

export type Tone =
  | 'neutral'
  | 'success'
  | 'danger'
  | 'warning'
  | 'info'
  | 'brand'
  | 'soft'
  | 'purple'
  | 'peach';

export interface TagProps {
  readonly tone?: Tone;
  readonly children: ReactNode;
}

/** A decorative pill. Always paired with a word — never colour alone. */
export function Tag({ tone = 'neutral', children }: TagProps) {
  return <span className={tag({ tone })}>{children}</span>;
}

/** A tag that leads with a bordered status dot, e.g. "Turno abierto". */
export function StatusPill({ tone = 'neutral', children }: TagProps) {
  return (
    <span className={tag({ tone })}>
      <span className={dot({ tone })} aria-hidden="true" />
      {children}
    </span>
  );
}
