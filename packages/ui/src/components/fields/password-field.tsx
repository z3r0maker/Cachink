/**
 * `<PasswordField>` — masked password input with show/hide toggle.
 *
 * Closes audit blocker 1.2 (CloudOnboarding rendered passwords in
 * plaintext; the `********` placeholder was cosmetic only). Wraps the
 * brand `<Input>` in `password` mode so:
 *
 *   - On RN, `secureTextEntry` is true by default. Tapping the
 *     show/hide toggle flips to `text` mode for inspection. The toggle
 *     is implemented as a brand `<Btn>` ghost with a Lucide eye /
 *     eye-off icon (NEVER an emoji, per the audit's icon-system rule).
 *   - On web, the underlying `type="password"` switches to `type="text"`
 *     for the same toggle.
 *   - `autoComplete` defaults to `'current-password'` for sign-in
 *     forms; sign-up forms pass `autoComplete="new-password"` so OS
 *     password managers store the new value rather than overwriting an
 *     existing entry.
 *
 * The toggle is announced to screen readers as "Mostrar contraseña" /
 * "Ocultar contraseña" via `aria-label` so VoiceOver / TalkBack callers
 * understand the affordance.
 */
import type { ReactElement } from 'react';
import { useState } from 'react';
import { View } from '@tamagui/core';
import { useTranslation } from '../../i18n/index';
import { Icon } from '../Icon/index';
import { Input, type InputType } from '../Input/input';
import { colors } from '../../theme';

export interface PasswordFieldProps {
  readonly value: string;
  readonly onChange: (value: string) => void;
  readonly label?: string;
  readonly placeholder?: string;
  readonly note?: string;
  readonly testID?: string;
  readonly ariaLabel?: string;
  /**
   * Set to `'new-password'` for sign-up flows so OS password managers
   * file a new credential. Defaults to `'current-password'` (sign-in).
   */
  readonly autoComplete?: 'current-password' | 'new-password';
  readonly returnKeyType?: 'default' | 'next' | 'done' | 'go' | 'send' | 'search';
  readonly onSubmitEditing?: () => void;
  readonly blurOnSubmit?: boolean;
}

/**
 * Toggle position: anchored over the right edge of the input row,
 * vertically centered against the field's 11+11 vertical padding.
 * 14 px right gutter mirrors the input's horizontal padding so the eye
 * icon sits aligned to the field's text baseline.
 */
const TOGGLE_RIGHT = 8;
const TOGGLE_TOP_WITH_LABEL = 26;
const TOGGLE_TOP_NO_LABEL = 8;

interface ToggleProps {
  readonly revealed: boolean;
  readonly testID: string;
  readonly hasLabel: boolean;
  readonly onToggle: () => void;
}

function ShowHideToggle(props: ToggleProps): ReactElement {
  const { t } = useTranslation();
  const ariaLabel = props.revealed
    ? t('forms.password.hideAriaLabel')
    : t('forms.password.showAriaLabel');
  return (
    <View
      position="absolute"
      right={TOGGLE_RIGHT}
      top={props.hasLabel ? TOGGLE_TOP_WITH_LABEL : TOGGLE_TOP_NO_LABEL}
      onPress={props.onToggle}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      cursor="pointer"
      padding={6}
      testID={`${props.testID}-toggle`}
      // ARIA props per ADR-034 — Tamagui 2.x consumes web-standard
      // role / aria-label and translates them on RN.
      role="button"
      aria-label={ariaLabel}
    >
      <Icon
        name={props.revealed ? 'eye-off' : 'eye'}
        size={18}
        color={colors.gray600}
        ariaLabel={ariaLabel}
      />
    </View>
  );
}

export function PasswordField(props: PasswordFieldProps): ReactElement {
  const [revealed, setRevealed] = useState(false);
  const inputType: InputType = revealed ? 'text' : 'password';
  const testID = props.testID ?? 'password-field';

  return (
    <View position="relative">
      <Input
        type={inputType}
        value={props.value}
        onChange={props.onChange}
        label={props.label}
        placeholder={props.placeholder}
        note={props.note}
        testID={testID}
        ariaLabel={props.ariaLabel ?? props.label}
        autoComplete={props.autoComplete ?? 'current-password'}
        returnKeyType={props.returnKeyType}
        onSubmitEditing={props.onSubmitEditing}
        blurOnSubmit={props.blurOnSubmit}
      />
      <ShowHideToggle
        revealed={revealed}
        testID={testID}
        hasLabel={props.label !== undefined}
        onToggle={() => setRevealed((r) => !r)}
      />
    </View>
  );
}
