/**
 * Tag — the Cachink pill/label primitive.
 *
 * A small classification chip used across the mock for `categoria`, `metodo`,
 * and other short status labels (see `VentaCard`, egresos list, inventario
 * categoria tag). Display-only — not interactive. A tappable categoria chip
 * would be a different primitive (`<Chip>`) added when a real usage demands.
 *
 * The seven variants map to brand + semantic tokens from CLAUDE.md §8.1 so the
 * prop surface stays disciplined (no raw color props). Every variant ships the
 * same 2px hard border per CLAUDE.md §8.3, overriding the mock's 1.5px default.
 *
 * All visual values come from `../../theme` — no inline hex codes, no invented
 * radii. Label casing is preserved (no `textTransform`) — mock shows proper-
 * cased Spanish categoria strings like `Producto`, `Transferencia`.
 */
import type { ReactElement } from 'react';
import { Text, View } from '@tamagui/core';
import { colors, radii, typography } from '../../theme';

export type TagVariant = 'neutral' | 'brand' | 'soft' | 'success' | 'info' | 'danger' | 'warning';

export interface TagProps {
  /** Pill content — a short proper-cased string (categoria, metodo, status). */
  readonly children: string;
  /** Semantic variant. Defaults to `neutral`. */
  readonly variant?: TagVariant;
  /** Forwarded to the root View so E2E tests can anchor to it. */
  readonly testID?: string;
}

interface VariantStyle {
  readonly background: string;
  readonly color: string;
}

const VARIANTS: Record<TagVariant, VariantStyle> = {
  neutral: { background: colors.gray100, color: colors.black },
  brand: { background: colors.yellow, color: colors.black },
  soft: { background: colors.yellowSoft, color: colors.black },
  success: { background: colors.greenSoft, color: colors.black },
  info: { background: colors.blueSoft, color: colors.blue },
  danger: { background: colors.redSoft, color: colors.red },
  warning: { background: colors.warningSoft, color: colors.black },
};

/** Pill radius — 20 from the §8.3 scale, matches the mock's 20. */
const TAG_RADIUS = radii[6];

function TagText({ text, color }: { text: string; color: string }): ReactElement {
  return (
    <Text
      color={color}
      fontFamily={typography.fontFamily}
      fontWeight={typography.weights.bold}
      fontSize={11}
      letterSpacing={typography.letterSpacing.wide}
    >
      {text}
    </Text>
  );
}

/**
 * Renders a Cachink-branded classification pill. See `tag.stories.tsx` for
 * the full variant matrix.
 */
export function Tag(props: TagProps): ReactElement {
  const variant = props.variant ?? 'neutral';
  const v = VARIANTS[variant];

  return (
    <View
      testID={props.testID ?? 'tag'}
      backgroundColor={v.background}
      borderColor={colors.black}
      borderWidth={2}
      borderRadius={TAG_RADIUS}
      paddingHorizontal={10}
      paddingVertical={3}
      alignSelf="flex-start"
      flexDirection="row"
    >
      <TagText text={props.children} color={v.color} />
    </View>
  );
}
