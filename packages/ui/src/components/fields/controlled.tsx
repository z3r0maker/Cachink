/**
 * RHF-aware wrappers for the field primitives.
 *
 * Each `<RhfXField>` takes a `react-hook-form` `control` + `name` and
 * spreads the rest of the field props through. They internally render
 * a `<Controller>` so callers don't need to import or use it directly
 * — `<RhfTextField name="nombre" control={control} label="Nombre" />`
 * is the entire row.
 *
 * This collapses each form field to one line at the call site, which
 * keeps the parent form components under the CLAUDE.md §4.4 40-line
 * ceiling without losing the per-field error / value plumbing that
 * Controller provides.
 *
 * The `errorMessage` prop is the value to render in `note` when the
 * RHF resolver flags this field as invalid. Pass an i18n string from
 * the form layer; the wrapper picks it up off `formState.errors`
 * automatically — call sites don't have to reach into formState.
 */
import type { ReactElement } from 'react';
import { Controller, type Control, type FieldPath, type FieldValues } from 'react-hook-form';
import { EmailField, type EmailFieldProps } from './email-field';
import { IntegerField, type IntegerFieldProps } from './integer-field';
import { MoneyField, type MoneyFieldProps } from './money-field';
import { PasswordField, type PasswordFieldProps } from './password-field';
import { PhoneField, type PhoneFieldProps } from './phone-field';
import { TextField, type TextFieldProps } from './text-field';
import { DateField, type DateFieldProps } from './date-field';

interface RhfBase<TForm extends FieldValues> {
  readonly control: Control<TForm>;
  readonly name: FieldPath<TForm>;
  /** When set, rendered as `<X note={errorMessage}>` whenever the field is invalid. */
  readonly errorMessage?: string;
}

/** RHF-bound `<TextField>`. */
export function RhfTextField<TForm extends FieldValues>(
  props: RhfBase<TForm> & Omit<TextFieldProps, 'value' | 'onChange'>,
): ReactElement {
  const { control, name, errorMessage, ...rest } = props;
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <TextField
          {...rest}
          value={(field.value as string | undefined) ?? ''}
          onChange={field.onChange}
          note={fieldState.invalid && errorMessage ? errorMessage : rest.note}
        />
      )}
    />
  );
}

/** RHF-bound `<EmailField>`. */
export function RhfEmailField<TForm extends FieldValues>(
  props: RhfBase<TForm> & Omit<EmailFieldProps, 'value' | 'onChange'>,
): ReactElement {
  const { control, name, errorMessage, ...rest } = props;
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <EmailField
          {...rest}
          value={(field.value as string | undefined) ?? ''}
          onChange={field.onChange}
          note={fieldState.invalid && errorMessage ? errorMessage : rest.note}
        />
      )}
    />
  );
}

/** RHF-bound `<PhoneField>`. */
export function RhfPhoneField<TForm extends FieldValues>(
  props: RhfBase<TForm> & Omit<PhoneFieldProps, 'value' | 'onChange'>,
): ReactElement {
  const { control, name, errorMessage, ...rest } = props;
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <PhoneField
          {...rest}
          value={(field.value as string | undefined) ?? ''}
          onChange={field.onChange}
          note={fieldState.invalid && errorMessage ? errorMessage : rest.note}
        />
      )}
    />
  );
}

/** RHF-bound `<PasswordField>`. */
export function RhfPasswordField<TForm extends FieldValues>(
  props: RhfBase<TForm> & Omit<PasswordFieldProps, 'value' | 'onChange'>,
): ReactElement {
  const { control, name, errorMessage, ...rest } = props;
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <PasswordField
          {...rest}
          value={(field.value as string | undefined) ?? ''}
          onChange={field.onChange}
          note={fieldState.invalid && errorMessage ? errorMessage : rest.note}
        />
      )}
    />
  );
}

/** RHF-bound `<MoneyField>`. */
export function RhfMoneyField<TForm extends FieldValues>(
  props: RhfBase<TForm> & Omit<MoneyFieldProps, 'value' | 'onChange'>,
): ReactElement {
  const { control, name, errorMessage, ...rest } = props;
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <MoneyField
          {...rest}
          value={(field.value as string | undefined) ?? ''}
          onChange={field.onChange}
          note={fieldState.invalid && errorMessage ? errorMessage : rest.note}
        />
      )}
    />
  );
}

/** RHF-bound `<IntegerField>`. */
export function RhfIntegerField<TForm extends FieldValues>(
  props: RhfBase<TForm> & Omit<IntegerFieldProps, 'value' | 'onChange'>,
): ReactElement {
  const { control, name, errorMessage, ...rest } = props;
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <IntegerField
          {...rest}
          value={(field.value as string | undefined) ?? ''}
          onChange={field.onChange}
          note={fieldState.invalid && errorMessage ? errorMessage : rest.note}
        />
      )}
    />
  );
}

/** RHF-bound `<DateField>`. */
export function RhfDateField<TForm extends FieldValues>(
  props: RhfBase<TForm> & Omit<DateFieldProps, 'value' | 'onChange'>,
): ReactElement {
  const { control, name, errorMessage, ...rest } = props;
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <DateField
          {...rest}
          value={(field.value as string | undefined) ?? ''}
          onChange={field.onChange}
          note={fieldState.invalid && errorMessage ? errorMessage : rest.note}
        />
      )}
    />
  );
}
