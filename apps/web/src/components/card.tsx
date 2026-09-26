import type { HTMLAttributes, ReactNode } from 'react';

import { card } from './card.css';

type Tone = 'plain' | 'hero' | 'soft' | 'success' | 'danger' | 'warning' | 'info' | 'muted';
type Emphasis = 'standard' | 'hero' | 'inset' | 'quiet';

export interface CardProps extends Omit<HTMLAttributes<HTMLDivElement>, 'className'> {
  readonly tone?: Tone;
  readonly emphasis?: Emphasis;
  readonly interactive?: boolean;
  readonly children?: ReactNode;
}

export function Card({
  tone = 'plain',
  emphasis = 'standard',
  interactive,
  children,
  ...rest
}: CardProps) {
  return (
    <div className={card({ tone, emphasis, interactive })} {...rest}>
      {children}
    </div>
  );
}
