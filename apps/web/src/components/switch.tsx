'use client';

import * as RadixSwitch from '@radix-ui/react-switch';

import { root, thumb, track } from './switch.css';

export interface SwitchProps {
  readonly checked: boolean;
  readonly onCheckedChange: (checked: boolean) => void;
  /** Read by screen readers; the visible label sits beside the switch. */
  readonly label: string;
  readonly disabled?: boolean;
}

/** An on/off switch on Radix (`role="switch"`, Space/Enter toggle it). */
export function Switch({ checked, onCheckedChange, label, disabled }: SwitchProps) {
  return (
    <RadixSwitch.Root
      className={root}
      checked={checked}
      onCheckedChange={onCheckedChange}
      aria-label={label}
      disabled={disabled}
    >
      <span className={track} aria-hidden="true" />
      <RadixSwitch.Thumb className={thumb} />
    </RadixSwitch.Root>
  );
}
