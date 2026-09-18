import { field, input, label } from '@/styles/ui.css';

/** The one input both MFA forms share. */
export function CodeField({
  caption,
  allowRecovery,
}: {
  readonly caption: string;
  readonly allowRecovery: boolean;
}) {
  return (
    <label className={field}>
      <span className={label}>{caption}</span>
      <input
        className={input}
        name="code"
        inputMode={allowRecovery ? 'text' : 'numeric'}
        autoComplete="one-time-code"
        autoCapitalize="none"
        spellCheck={false}
        pattern={allowRecovery ? undefined : '[0-9 ]{6,7}'}
        maxLength={allowRecovery ? 24 : 7}
        required
      />
    </label>
  );
}
