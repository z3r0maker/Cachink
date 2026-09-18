'use client';

import { chip, countPill, countPillState, tabItem, tabList } from './tabs.css';

export interface TabDef {
  readonly value: string;
  readonly label: string;
  /** Optional count pill, e.g. Ventas (254). */
  readonly count?: number;
}

export interface SegmentedTabsProps {
  readonly tabs: readonly TabDef[];
  readonly value: string;
  readonly onValueChange: (value: string) => void;
  readonly ariaLabel: string;
}

/**
 * The segmented control.
 *
 * **Deliberately not a `tablist`.** It began as Radix Tabs, but the screens
 * render their panels further down the page — after the KPI row and the filter
 * bar — rather than immediately after the control. Radix then emitted
 * `aria-controls` pointing at a `Tabs.Content` that never existed, which axe
 * flags as a critical `aria-valid-attr-value` violation on every screen.
 *
 * A group of `aria-pressed` buttons is what this actually is: it switches the
 * view rather than revealing an adjacent panel. Honest ARIA beats borrowed
 * ARIA — and it is one fewer dependency in the hot path.
 */
export function SegmentedTabs({ tabs, value, onValueChange, ariaLabel }: SegmentedTabsProps) {
  return (
    <div className={tabList} role="group" aria-label={ariaLabel}>
      {tabs.map((tab) => {
        const active = tab.value === value;
        return (
          <button
            key={tab.value}
            type="button"
            className={tabItem}
            data-state={active ? 'active' : undefined}
            data-onyellow={active ? '1' : undefined}
            aria-pressed={active}
            onClick={() => onValueChange(tab.value)}
          >
            {tab.label}
            {tab.count === undefined ? null : (
              <span
                className={`${countPill} ${active ? countPillState.active : countPillState.inactive}`}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export interface ChipProps {
  readonly label: string;
  readonly selected: boolean;
  readonly onSelect: () => void;
}

/**
 * A filter chip. It must actually filter the rendered collection and update the
 * row counters — a chip that only highlights is a bug (design handoff).
 */
export function FilterChip({ label, selected, onSelect }: ChipProps) {
  return (
    <button
      type="button"
      className={chip}
      data-selected={selected}
      data-onyellow={selected ? '1' : undefined}
      aria-pressed={selected}
      onClick={onSelect}
    >
      {label}
    </button>
  );
}
