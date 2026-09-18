'use client';

import { OptionCards, type OptionDef } from '@/components';
import { group, option, optionBody, optionDot, optionTitle } from '@/components/option-card.css';
import { Icon } from '@/shell/icon';

/** Card data with a Lucide path instead of a rendered icon. */
export interface ChoiceDef {
  readonly value: string;
  readonly title: string;
  readonly description: string;
  readonly icon: string;
}

const withIcon = (c: ChoiceDef): OptionDef => ({ ...c, icon: <Icon path={c.icon} size={22} /> });

/** One answer of ≤ 5: the portal's radio cards, with icons (CLAUDE.md §6). */
export function PickOne(props: {
  readonly choices: readonly ChoiceDef[];
  readonly value: string | null;
  readonly onChange: (value: string) => void;
  readonly label: string;
}) {
  return (
    <OptionCards
      options={props.choices.map(withIcon)}
      value={props.value}
      onValueChange={props.onChange}
      ariaLabel={props.label}
    />
  );
}

/**
 * Several answers ("¿cómo cobras?"): the same cards, each a toggle button.
 * `aria-pressed` carries the state; colour never carries it alone (the dot
 * fills too).
 */
export function PickMany(props: {
  readonly choices: readonly ChoiceDef[];
  readonly values: readonly string[];
  readonly onChange: (values: string[]) => void;
  readonly label: string;
}) {
  const toggle = (v: string) =>
    props.onChange(
      props.values.includes(v) ? props.values.filter((x) => x !== v) : [...props.values, v],
    );
  return (
    <div className={group} role="group" aria-label={props.label}>
      {props.choices.map((c) => {
        const on = props.values.includes(c.value);
        return (
          <button
            key={c.value}
            type="button"
            className={option}
            data-selected={on}
            aria-pressed={on}
            onClick={() => toggle(c.value)}
          >
            <span className={optionDot} aria-hidden="true" />
            <Icon path={c.icon} size={22} />
            <span>
              <span className={optionTitle}>{c.title}</span>
              <span className={optionBody}>{c.description}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
