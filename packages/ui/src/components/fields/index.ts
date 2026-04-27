/**
 * `@cachink/ui/components/fields` — typed field primitives that wrap
 * `<Input>` with the right keyboard / autofill / formatting hints for
 * each domain (money, email, phone, password, integer, date, plain
 * text).
 *
 * These primitives ship as part of the audit's PR 2 ("Input Primitive
 * Rewrite") and are designed to be drop-in replacements for the
 * existing `<Input type="…">` calls. They preserve the same `value /
 * onChange` shape, so a form can migrate one row at a time without
 * forklifting state.
 *
 * RHF + Zod wiring (the second half of PR 2) lives at the form layer —
 * these primitives stay deliberately RHF-agnostic so they remain
 * usable from controlled `useState` forms too. A typed wrapper that
 * connects each primitive to `useController` ships in a sibling file
 * once form migrations begin.
 */
export { TextField, type TextFieldProps } from './text-field';
export { MoneyField, type MoneyFieldProps } from './money-field';
export { EmailField, type EmailFieldProps } from './email-field';
export { PhoneField, type PhoneFieldProps } from './phone-field';
export { PasswordField, type PasswordFieldProps } from './password-field';
export { IntegerField, type IntegerFieldProps } from './integer-field';
export { DateField, type DateFieldProps } from './date-field';
export {
  RhfTextField,
  RhfEmailField,
  RhfPhoneField,
  RhfPasswordField,
  RhfMoneyField,
  RhfIntegerField,
  RhfDateField,
} from './controlled';
