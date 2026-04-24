/**
 * Input — the Cachink form-field primitive.
 *
 * Matches the prop contract from the `cachink-v3.jsx` mock verbatim
 * (`label, value, onChange, type, placeholder, options, note`) so a
 * mock-to-production migration is mechanical. Renders one of two branches:
 *
 *   • text / number / date → Tamagui's cross-platform `<Input>` primitive
 *     from `@tamagui/input`. One implementation, both targets.
 *   • select (or any time `options` is provided) → native HTML `<select>`
 *     styled with the same neobrutalist tokens. Phase 1A's pragmatic choice;
 *     a Modal-backed bottom-sheet picker replaces it on RN once
 *     `P1A-M2-T04 <Modal>` lands (see ROADMAP).
 *
 * All visual values come from `../../theme` — no inline hex codes, no
 * invented radii, no soft shadows.
 */
import type { ChangeEvent, CSSProperties, ReactElement } from 'react';
import { Text, View } from '@tamagui/core';
import { Input as TamaguiInput } from '@tamagui/input';
import { colors, radii, typography } from '../../theme';

export type InputType = 'text' | 'number' | 'date' | 'select';

export interface InputProps {
  /** Controlled string value. Empty string for no selection / empty input. */
  readonly value: string;
  /** Called with the new string on every keystroke / select change. */
  readonly onChange: (value: string) => void;
  /** Uppercase label rendered above the field. Optional. */
  readonly label?: string;
  /**
   * Which underlying control to render. `text` / `number` / `date` pass
   * through to Tamagui's cross-platform `<Input>` primitive; `select` (or
   * passing `options`) renders the native HTML `<select>` today.
   */
  readonly type?: InputType;
  readonly placeholder?: string;
  /** When present, renders a `<select>` with one `<option>` per entry. */
  readonly options?: readonly string[];
  /** Small muted help text rendered below the field. Optional. */
  readonly note?: string;
  /** Forwarded to the root View so E2E tests can anchor to it. */
  readonly testID?: string;
}

const FIELD_RADIUS = radii[2]; // 12 — per CLAUDE.md §8.3 scale.
const ROW_MARGIN_BOTTOM = 14; // form-row rhythm from the mock.
const LABEL_MARGIN_BOTTOM = 5;
const NOTE_MARGIN_TOP = 3;

/** Shared styling for both the text-ish branch and the `<select>` branch. */
const FIELD_STYLE: CSSProperties = {
  borderColor: colors.black,
  borderWidth: 2,
  borderStyle: 'solid',
  borderRadius: FIELD_RADIUS,
  paddingLeft: 14,
  paddingRight: 14,
  paddingTop: 11,
  paddingBottom: 11,
  fontSize: 15,
  fontWeight: typography.weights.medium,
  color: colors.ink,
  backgroundColor: colors.white,
  fontFamily: typography.fontFamily,
  outline: 'none',
  width: '100%',
  boxSizing: 'border-box',
};

function InputLabel({ text }: { text: string }): ReactElement {
  return (
    <Text
      color={colors.gray600}
      fontFamily={typography.fontFamily}
      fontWeight={typography.weights.bold}
      fontSize={12}
      letterSpacing={typography.letterSpacing.wide}
      marginBottom={LABEL_MARGIN_BOTTOM}
      style={{ textTransform: 'uppercase' }}
    >
      {text}
    </Text>
  );
}

function InputNote({ text }: { text: string }): ReactElement {
  return (
    <Text
      color={colors.gray400}
      fontFamily={typography.fontFamily}
      fontWeight={typography.weights.medium}
      fontSize={11}
      marginTop={NOTE_MARGIN_TOP}
    >
      {text}
    </Text>
  );
}

interface FieldProps {
  readonly value: string;
  readonly onChange: (value: string) => void;
  readonly placeholder?: string;
  readonly options?: readonly string[];
  readonly type: InputType;
}

/** Native HTML `<select>` styled with the same neobrutalist tokens. */
function SelectField({ value, onChange, options }: FieldProps): ReactElement {
  return (
    <select
      value={value}
      onChange={(e: ChangeEvent<HTMLSelectElement>) => onChange(e.target.value)}
      style={FIELD_STYLE}
    >
      <option value="">Seleccionar...</option>
      {(options ?? []).map((opt) => (
        <option key={opt} value={opt}>
          {opt}
        </option>
      ))}
    </select>
  );
}

/** Tamagui cross-platform `<Input>` for text / number / date. */
function TextField({ value, onChange, placeholder, type }: FieldProps): ReactElement {
  return (
    <TamaguiInput
      value={value}
      onChangeText={onChange}
      placeholder={placeholder}
      // The HTML `type` attribute drives keyboard / picker on web/Tauri;
      // RN's TextInput maps it via Tamagui's keyboard inference.
      type={type}
      // Tamagui requires this to be a registered ColorToken (`$<name>`),
      // not a raw hex literal. `$gray400` resolves through `tamagui.config.ts`
      // back to the same `colors.gray400` value defined in `theme.ts`.
      placeholderTextColor="$gray400"
      borderColor={colors.black}
      borderWidth={2}
      focusStyle={{ borderWidth: 2.5, borderColor: colors.black }}
      borderRadius={FIELD_RADIUS}
      paddingHorizontal={14}
      paddingVertical={11}
      fontSize={15}
      fontWeight={typography.weights.medium}
      color={colors.ink}
      backgroundColor={colors.white}
      fontFamily={typography.fontFamily}
      style={{ outlineWidth: 0, boxShadow: 'none', borderStyle: 'solid' }}
    />
  );
}

/** Branches between the Tamagui `<Input>` and the native `<select>`. */
function InputField(props: FieldProps): ReactElement {
  const useSelect = props.type === 'select' || Array.isArray(props.options);
  return useSelect ? <SelectField {...props} /> : <TextField {...props} />;
}

/**
 * Renders a labelled form field. See `input.stories.tsx` for the full
 * type matrix (text / number / date / select) and the canonical
 * label-with-note surface designers review.
 */
export function Input(props: InputProps): ReactElement {
  const type: InputType = props.type ?? 'text';

  return (
    <View testID={props.testID ?? 'input'} marginBottom={ROW_MARGIN_BOTTOM}>
      {props.label !== undefined && <InputLabel text={props.label} />}
      <InputField
        type={type}
        value={props.value}
        onChange={props.onChange}
        placeholder={props.placeholder}
        options={props.options}
      />
      {props.note !== undefined && <InputNote text={props.note} />}
    </View>
  );
}
