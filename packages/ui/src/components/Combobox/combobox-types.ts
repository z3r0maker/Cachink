/**
 * Type contract for the Combobox primitive. Kept in a leaf file so
 * both `combobox.tsx` (orchestrator) and `combobox-views.tsx`
 * (sub-components) can import types without crossing a circular
 * dependency.
 */

export interface ComboboxOption<T extends string = string> {
  /** Stable identifier compared against `value`. */
  readonly key: T;
  /**
   * Visible label shown in the panel and reflected back into the
   * trigger when this option is selected.
   */
  readonly label: string;
}

export interface ComboboxProps<T extends string = string> {
  /** Currently selected key. Empty string means no selection. */
  readonly value: T | '';
  /** Options rendered inside the panel. Order is preserved. */
  readonly options: readonly ComboboxOption<T>[];
  /** Fires when the user selects an option. */
  readonly onChange: (next: T) => void;
  /** Uppercase label rendered above the trigger. Optional. */
  readonly label?: string;
  /** Trigger placeholder shown when `value` is empty. */
  readonly placeholder?: string;
  /** Small muted help text rendered below the trigger. */
  readonly note?: string;
  /** When true, halves opacity, blocks tap, and skips onChange. */
  readonly disabled?: boolean;
  /**
   * When true, mounts a search input at the top of the panel and
   * filters options case-insensitively by `label`.
   */
  readonly searchable?: boolean;
  /** Forwarded to the trigger so E2E tests can anchor to it. */
  readonly testID?: string;
  /**
   * Screen-reader label. Defaults to `label` when both are
   * provided; matches the `combobox` ARIA role.
   */
  readonly ariaLabel?: string;
}
