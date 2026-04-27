/**
 * Callout — a high-prominence inline message primitive.
 *
 * Three tones map to brand semantic tokens (CLAUDE.md §8.1):
 *   - `success` (green / greenSoft) — "tus datos se conservan"
 *   - `warning` (warning / warningSoft) — "necesitas internet" / "cambios pendientes"
 *   - `info` (blue / blueSoft) — neutral disclosure
 *
 * Composition: the callout reuses Card's hard 2px border + 4px hard
 * drop shadow for the brand stamp; a 4px-wide solid bar on the left
 * carries the tone's accent colour. An optional `icon` slot accepts
 * an emoji or SectionTitle-sized glyph; an optional `action` slot
 * renders a single `<Btn>` aligned to the right.
 *
 * No platform split — pure Tamagui composition.
 */

import type { ReactElement, ReactNode } from 'react';
import { Text, View } from '@tamagui/core';
import { colors, radii, shadows, typography } from '../../theme';

export type CalloutTone = 'success' | 'warning' | 'info';

export interface CalloutProps {
  readonly tone?: CalloutTone;
  readonly title?: string;
  readonly body: string;
  /** Optional emoji or short glyph rendered in a circle on the left. */
  readonly icon?: string;
  /** Optional action node (typically a `<Btn>`) aligned to the right. */
  readonly action?: ReactNode;
  readonly testID?: string;
}

interface ToneStyle {
  readonly background: string;
  readonly accent: string;
}

const TONES: Record<CalloutTone, ToneStyle> = {
  success: { background: colors.greenSoft, accent: colors.green },
  warning: { background: colors.warningSoft, accent: colors.warning },
  info: { background: colors.blueSoft, accent: colors.blue },
};

function CalloutText({ title, body }: { title?: string; body: string }): ReactElement {
  return (
    <View flex={1} flexDirection="column" gap={4}>
      {title !== undefined && (
        <Text
          fontFamily={typography.fontFamily}
          fontWeight={typography.weights.bold}
          fontSize={14}
          letterSpacing={typography.letterSpacing.tight}
          color={colors.black}
        >
          {title}
        </Text>
      )}
      <Text
        fontFamily={typography.fontFamily}
        fontWeight={typography.weights.medium}
        fontSize={13}
        color={colors.ink}
      >
        {body}
      </Text>
    </View>
  );
}

function CalloutIcon({ icon, accent }: { icon: string; accent: string }): ReactElement {
  return (
    <View
      width={32}
      height={32}
      borderRadius={radii[7]}
      backgroundColor={accent}
      borderColor={colors.black}
      borderWidth={2}
      alignItems="center"
      justifyContent="center"
    >
      <Text fontSize={18}>{icon}</Text>
    </View>
  );
}

export function Callout(props: CalloutProps): ReactElement {
  const tone = TONES[props.tone ?? 'info'];
  return (
    <View
      testID={props.testID ?? 'callout'}
      flexDirection="row"
      alignItems="flex-start"
      gap={12}
      paddingVertical={12}
      paddingLeft={12}
      paddingRight={14}
      backgroundColor={tone.background}
      borderColor={colors.black}
      borderWidth={2}
      borderRadius={radii[3]}
      width="100%"
      style={{ boxShadow: shadows.card }}
    >
      <View width={4} alignSelf="stretch" backgroundColor={tone.accent} borderRadius={radii[0]} />
      {props.icon !== undefined && <CalloutIcon icon={props.icon} accent={tone.accent} />}
      <CalloutText title={props.title} body={props.body} />
      {props.action !== undefined && (
        <View alignSelf="center" marginLeft={8}>
          {props.action}
        </View>
      )}
    </View>
  );
}
