'use client';

import * as RadioGroup from '@radix-ui/react-radio-group';
import type { ReactNode } from 'react';

import { group, option, optionBody, optionDot, optionTitle } from './option-card.css';

export interface OptionDef {
  readonly value: string;
  readonly title: string;
  readonly description: string;
  readonly icon?: ReactNode;
}

export interface OptionCardsProps {
  readonly options: readonly OptionDef[];
  readonly value: string | null;
  readonly onValueChange: (value: string) => void;
  readonly ariaLabel: string;
}

/**
 * Radix RadioGroup supplies arrow-key navigation and `aria-checked`; the
 * prototypes faked both with `role="radio"` on divs.
 */
export function OptionCards({ options, value, onValueChange, ariaLabel }: OptionCardsProps) {
  return (
    <RadioGroup.Root
      className={group}
      // Always controlled: `undefined` would hand Radix the selection, and a
      // group React reuses (one wizard question after another) would keep the
      // last one's choice on screen while the answer it shows was never set.
      // `''` matches no option, so «no answer» shows nothing selected.
      value={value ?? ''}
      onValueChange={onValueChange}
      aria-label={ariaLabel}
    >
      {options.map((o) => (
        <RadioGroup.Item
          key={o.value}
          value={o.value}
          className={option}
          data-selected={value === o.value}
        >
          <span className={optionDot} aria-hidden="true" />
          {o.icon}
          <span>
            <span className={optionTitle}>{o.title}</span>
            <span className={optionBody}>{o.description}</span>
          </span>
        </RadioGroup.Item>
      ))}
    </RadioGroup.Root>
  );
}
