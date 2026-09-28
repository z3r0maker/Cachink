/**
 * Toast — the quick notice after an action (the caja's `operador/ui/toast.tsx`,
 * board OpEstados «Aviso rápido», MvEstados): a white card with the thin black
 * edge and the card shadow; a tinted head with the icon, the title and a 44 px
 * close; the detail below. It pops in (reduced to a fade under Reduce Motion)
 * and stays until closed, like the web's.
 *
 * `floating` pins it above the phone's tab bar, 12 px from the sides, as the
 * boards place it; otherwise it renders in the flow.
 */
import type { ReactElement } from 'react';
import { Animated, Pressable } from 'react-native';
import { View } from '@tamagui/core';
import { borderWidths, colors, radii, shadows, shapeRadii } from '../../theme';
import { useTranslation } from '../../i18n/index';
import { useEnterMotion } from '../motion/use-enter-motion';
import { MText } from '../Mostrador/mtext';
import { GLYPHS } from '../PathIcon/glyphs';
import { PathIcon } from '../PathIcon/path-icon';

export type ToastTone = 'ok' | 'warn' | 'plain';

const TONES: Record<ToastTone, { head: string; icon: string }> = {
  ok: { head: colors.greenSoft, icon: colors.greenText },
  warn: { head: colors.warningSoft, icon: colors.warningText },
  plain: { head: colors.white, icon: colors.black },
};

/** Over the 64 px tab bar with 12 px of air (MvEstados). */
const FLOATING = { position: 'absolute', left: 12, right: 12, bottom: 76 } as const;

const CARD = {
  backgroundColor: colors.white,
  borderWidth: borderWidths.thin,
  borderColor: colors.black,
  borderRadius: radii[4],
  boxShadow: shadows.card,
  overflow: 'hidden',
} as const;

const CLOSE = { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' } as const;

export interface ToastProps {
  readonly title: string;
  readonly body?: string;
  readonly tone?: ToastTone;
  /** A path in a 24 × 24 box; the check by default, `GLYPHS.sinRed` offline. */
  readonly icon?: string;
  readonly onClose: () => void;
  readonly floating?: boolean;
  readonly testID?: string;
}

function Glyph({ d, color }: { d: string; color: string }): ReactElement {
  return (
    <View
      width={28}
      height={28}
      alignItems="center"
      justifyContent="center"
      borderRadius={shapeRadii.pill}
      borderWidth={borderWidths.thin}
      borderColor={colors.black}
      backgroundColor={colors.white}
    >
      <PathIcon d={d} size={16} strokeWidth={2.6} color={color} />
    </View>
  );
}

function Head(p: ToastProps & { readonly closeLabel: string }): ReactElement {
  const tone = TONES[p.tone ?? 'ok'];
  return (
    <View
      flexDirection="row"
      alignItems="center"
      gap={10}
      minHeight={48}
      paddingLeft={12}
      paddingRight={2}
      backgroundColor={tone.head}
      borderBottomWidth={p.body ? borderWidths.thin : 0}
      borderBottomColor={colors.black}
    >
      <Glyph d={p.icon ?? GLYPHS.check} color={tone.icon} />
      <MText flex={1} weight="extraBold">
        {p.title}
      </MText>
      <Pressable
        testID={`${p.testID ?? 'toast'}-close`}
        role="button"
        aria-label={p.closeLabel}
        onPress={p.onClose}
        style={CLOSE}
      >
        <PathIcon d={GLYPHS.close} size={18} strokeWidth={2.4} />
      </Pressable>
    </View>
  );
}

export function Toast(props: ToastProps): ReactElement {
  const { t } = useTranslation();
  const motion = useEnterMotion('pop');
  return (
    <Animated.View
      testID={props.testID ?? 'toast'}
      role="status"
      aria-live="polite"
      style={[CARD, props.floating ? FLOATING : null, motion]}
    >
      <Head {...props} closeLabel={t('shell.cerrarAviso', { title: props.title })} />
      {props.body ? (
        <MText
          padding={12}
          paddingTop={10}
          size="sm"
          weight="semibold"
          lineHeight={19}
          color={colors.ink}
        >
          {props.body}
        </MText>
      ) : null}
    </Animated.View>
  );
}
