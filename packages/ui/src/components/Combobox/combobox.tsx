/**
 * Combobox — anchored picker with an optional searchable filter.
 *
 * Replaces the previous `<Input type="select">` rendering on both
 * platforms (CLAUDE.md §5 — single component, identical contract).
 * Uses `@tamagui/popover` so the panel anchors to the trigger and
 * dismisses on outside-click + Escape — no more bottom-sheet pinned
 * to the viewport.
 *
 * Pure composition over Tamagui primitives — no `.native.tsx` /
 * `.web.tsx` split (CLAUDE.md §5.3 justified-split test fails: no
 * platform-specific capability is required). The same file renders
 * the same DOM/View tree on Vite + Metro.
 *
 * Search/typeahead is opt-in (`searchable`). When enabled a small
 * filter input mounts at the top of the panel and the option list
 * is filtered case-insensitively against `option.label`. Empty
 * matches surface a "Sin resultados" row so the panel never
 * collapses to zero height.
 *
 * Architectural notes:
 * - Sub-components (TriggerView / OptionRow / SearchInput / EmptyRow)
 *   live in `./combobox-views.tsx` to keep this file under §4.4 size
 *   budgets.
 * - We intentionally use `Popover.Anchor` (not `Popover.Trigger`).
 *   Tamagui's Trigger relies on internal proxying that doesn't merge
 *   cleanly onto a styled `<View>` child — `onOpenChange` would
 *   otherwise never fire. Anchor positions the panel without claiming
 *   click handling, leaving open-state in our reducer.
 */
import { useCallback, useEffect, useMemo, useRef, useState, type ReactElement } from 'react';
import { Popover } from '@tamagui/popover';
import { colors, radii, shadows } from '../../theme';
import type { ComboboxOption, ComboboxProps } from './combobox-types';
import { EmptyRow, OptionRow, SearchInput, TriggerView, readSearchEvent } from './combobox-views';

export type { ComboboxOption, ComboboxProps };

/** Panel radius — 14 from the §8.3 scale. */
const PANEL_RADIUS = radii[4];
/** 4 px below the trigger so the hard shadow stays distinct. */
const PANEL_OFFSET = 4;
/** Cap so a long list scrolls instead of overflowing the viewport. */
const PANEL_MAX_HEIGHT = 280;

interface PickerState<T extends string> {
  readonly open: boolean;
  readonly query: string;
  readonly visibleOptions: readonly ComboboxOption<T>[];
  setOpen(next: boolean): void;
  setQuery(next: string): void;
}

/** Open/query state machine + filter memo + auto-clear-query effect. */
function usePickerState<T extends string>(
  options: readonly ComboboxOption<T>[],
  searchable: boolean,
): PickerState<T> {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const wasOpen = useRef(false);

  useEffect(() => {
    if (!open && wasOpen.current) setQuery('');
    wasOpen.current = open;
  }, [open]);

  const visibleOptions = useMemo(() => {
    if (!searchable || query === '') return options;
    const needle = query.trim().toLowerCase();
    return options.filter((o) => o.label.toLowerCase().includes(needle));
  }, [options, searchable, query]);

  return { open, query, visibleOptions, setOpen, setQuery };
}

/** Resolves the label rendered inside the trigger from `value`. */
function deriveTriggerLabel<T extends string>(
  options: readonly ComboboxOption<T>[],
  value: T | '',
  placeholder: string,
): { triggerLabel: string; isPlaceholder: boolean } {
  const selected = options.find((o) => o.key === value);
  if (selected !== undefined) return { triggerLabel: selected.label, isPlaceholder: false };
  if (value !== '' && value !== undefined)
    return { triggerLabel: String(value), isPlaceholder: false };
  return { triggerLabel: placeholder, isPlaceholder: true };
}

interface ComboboxBindings<T extends string> extends PickerState<T> {
  readonly disabled: boolean;
  readonly searchable: boolean;
  readonly triggerLabel: string;
  readonly isPlaceholder: boolean;
  readonly handleOpenChange: (next: boolean) => void;
  readonly handleSelect: (key: T) => void;
  readonly handleTriggerPress: () => void;
}

/** Composes derived state + dispatch helpers for the orchestrator. */
function useComboboxBindings<T extends string>(props: ComboboxProps<T>): ComboboxBindings<T> {
  const disabled = props.disabled === true;
  const searchable = props.searchable === true;
  const state = usePickerState<T>(props.options, searchable);
  const placeholder = props.placeholder ?? 'Seleccionar...';
  const { triggerLabel, isPlaceholder } = useMemo(
    () => deriveTriggerLabel(props.options, props.value, placeholder),
    [props.options, props.value, placeholder],
  );

  const { setOpen } = state;
  const onChange = props.onChange;
  const handleOpenChange = useCallback(
    (next: boolean) => {
      if (!disabled) setOpen(next);
    },
    [disabled, setOpen],
  );
  const handleTriggerPress = useCallback(() => setOpen(true), [setOpen]);
  const handleSelect = useCallback(
    (key: T) => {
      onChange(key);
      setOpen(false);
    },
    [onChange, setOpen],
  );

  return {
    ...state,
    disabled,
    searchable,
    triggerLabel,
    isPlaceholder,
    handleOpenChange,
    handleSelect,
    handleTriggerPress,
  };
}

interface PanelProps<T extends string> {
  readonly searchable: boolean;
  readonly query: string;
  readonly onQueryChange: (next: string) => void;
  readonly visibleOptions: readonly ComboboxOption<T>[];
  readonly value: T | '';
  readonly onSelect: (key: T) => void;
  readonly autoFocusSearch: boolean;
}

function ComboboxPanel<T extends string>(props: PanelProps<T>): ReactElement {
  return (
    <Popover.Content
      testID="combobox-panel"
      backgroundColor={colors.white}
      borderColor={colors.black}
      borderWidth={2}
      borderRadius={PANEL_RADIUS}
      padding={6}
      // Suppress Tamagui's auto-elevation soft shadow; our hard shadow
      // applies via inline style below to honour §8.3.
      elevation={0}
      style={{
        boxShadow: shadows.card,
        minWidth: 220,
        maxHeight: PANEL_MAX_HEIGHT,
        overflowY: 'auto',
      }}
    >
      {props.searchable && (
        <SearchInput
          value={props.query}
          onChange={(next) => props.onQueryChange(readSearchEvent(next))}
          autoFocus={props.autoFocusSearch}
        />
      )}
      {props.visibleOptions.length === 0 ? (
        <EmptyRow />
      ) : (
        props.visibleOptions.map((opt) => (
          <OptionRow<T>
            key={opt.key}
            option={opt}
            selected={opt.key === props.value}
            onSelect={() => props.onSelect(opt.key)}
          />
        ))
      )}
    </Popover.Content>
  );
}

/**
 * Renders a brand-styled picker. See `combobox.stories.tsx` for the
 * full variant catalog (default / many / searchable / disabled / empty).
 */
export function Combobox<T extends string = string>(props: ComboboxProps<T>): ReactElement {
  const b = useComboboxBindings(props);
  return (
    <Popover
      open={b.open}
      onOpenChange={b.handleOpenChange}
      placement="bottom-start"
      allowFlip
      stayInFrame
      offset={PANEL_OFFSET}
    >
      <Popover.Anchor>
        <TriggerView
          testID={props.testID ?? 'combobox-trigger'}
          ariaLabel={props.ariaLabel ?? props.label}
          open={b.open}
          disabled={b.disabled}
          displayText={b.triggerLabel}
          isPlaceholder={b.isPlaceholder}
          onPress={b.handleTriggerPress}
        />
      </Popover.Anchor>
      <ComboboxPanel<T>
        searchable={b.searchable}
        query={b.query}
        onQueryChange={b.setQuery}
        visibleOptions={b.visibleOptions}
        value={props.value}
        onSelect={b.handleSelect}
        autoFocusSearch={b.open}
      />
    </Popover>
  );
}
