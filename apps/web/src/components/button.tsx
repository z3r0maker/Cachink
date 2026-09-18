import type { ButtonHTMLAttributes, ReactNode } from 'react';

import { button } from './button.css';

type Variant = 'primary' | 'secondary' | 'dark' | 'danger' | 'soft' | 'ghost';
type Size = 'sm' | 'md' | 'lg';

export interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className'> {
  readonly variant?: Variant;
  readonly size?: Size;
  readonly full?: boolean;
  /** Leading glyph. Lucide-shaped inline SVG; never an emoji. */
  readonly icon?: ReactNode;
  readonly children?: ReactNode;
}

/**
 * A real `<button>`. The prototypes used `role="button"` on `div`s because the
 * design tool could not do otherwise; the handoff's "Before you ship" list says
 * to replace them, so this never renders a `div`.
 *
 * An icon-only button must still carry `aria-label` — `design-lint`'s
 * `a11y/icon-only-unlabeled` rule enforces it.
 */
export function Button({
  variant = 'primary',
  size = 'md',
  full,
  icon,
  children,
  type = 'button',
  ...rest
}: ButtonProps) {
  const onYellow = variant === 'primary' || variant === 'soft';
  return (
    <button
      type={type}
      className={button({ variant, size, full })}
      data-onyellow={onYellow ? '1' : undefined}
      {...rest}
    >
      {icon}
      {children}
    </button>
  );
}
