/**
 * EmptyState — the Cachink "there's nothing here yet" primitive.
 *
 * Rendered inside list views (Ventas, Egresos, Movimientos, Cuentas por
 * Cobrar, Inventario) when the list is empty OR when a search yields no
 * results. Composes an icon (or legacy emoji), a bold title, an optional
 * muted description, and an optional action slot (typically a primary
 * `<Btn>` CTA).
 *
 * Pure composition — no platform APIs involved — so no `.native.tsx` /
 * `.web.tsx` split is needed (CLAUDE.md §5.3 justified-split test: there's
 * no platform-specific capability involved). Identical rendering on mobile
 * and desktop.
 *
 * Per ADR-040 the canonical illustration is a Lucide line icon inside a
 * yellow rounded square (matches the §8.3 brand). The legacy `emoji`
 * prop is kept as a soft-deprecated escape hatch so existing callers
 * keep rendering until each migrates.
 *
 * All visual values come from `../../theme` — no inline hex codes, no
 * invented sizes. Transparent background by design: this is content, and
 * the parent view owns the surface.
 */
import type { ReactElement, ReactNode } from 'react';
import { Text, View } from '@tamagui/core';
import { colors, radii, typography } from '../../theme';
import { Icon, type IconName } from '../Icon/index';

export interface EmptyStateProps {
  /** Bold headline — short, imperative when possible ("Sin ventas todavía"). */
  readonly title: string;
  /** Optional 1–2-sentence description in muted gray text. */
  readonly description?: string;
  /**
   * Curated `<Icon>` name rendered in a 72-px yellow rounded square
   * above the title. Wins over the legacy `emoji` prop when both are
   * provided.
   */
  readonly icon?: IconName;
  /**
   * @deprecated Pass `icon` instead. Kept for back-compat with callers
   * authored before ADR-040.
   */
  readonly emoji?: string;
  /** Optional CTA slot — `<Btn>`, a link, or a stack of both. */
  readonly action?: ReactNode;
  /** Forwarded to the root View so E2E tests can anchor to it. */
  readonly testID?: string;
}

const ILLUSTRATION_RADIUS = radii[3]; // 14
const ILLUSTRATION_SIZE = 72;

function IconBox({ name }: { name: IconName }): ReactElement {
  return (
    <View
      testID="empty-state-icon-box"
      backgroundColor={colors.yellow}
      borderColor={colors.black}
      borderWidth={2}
      borderRadius={ILLUSTRATION_RADIUS}
      width={ILLUSTRATION_SIZE}
      height={ILLUSTRATION_SIZE}
      alignItems="center"
      justifyContent="center"
      marginBottom={16}
    >
      <Icon name={name} size={36} color={colors.black} strokeWidth={2.25} />
    </View>
  );
}

function Emoji({ glyph }: { glyph: string }): ReactElement {
  return (
    <Text testID="empty-state-emoji" fontSize={56} marginBottom={16}>
      {glyph}
    </Text>
  );
}

function Title({ text }: { text: string }): ReactElement {
  return (
    <Text
      testID="empty-state-title"
      color={colors.black}
      fontFamily={typography.fontFamily}
      fontWeight={typography.weights.black}
      fontSize={20}
      letterSpacing={typography.letterSpacing.tight}
      textAlign="center"
      marginBottom={6}
      // Audit 9.3 — empty-state titles are typically short Spanish
      // imperatives ("Sin ventas todavía"); allow up to 2 lines so
      // a slightly longer phrase ("No tienes egresos registrados")
      // doesn't truncate, then ellipsize.
      numberOfLines={2}
      ellipsizeMode="tail"
      // Audit 9.4 — at 20-pt, 1.5× scaling pushes the title to 30 px
      // and risks crowding the description / action stack. Cap at 1.3×.
      maxFontSizeMultiplier={1.3}
    >
      {text}
    </Text>
  );
}

function Description({ text }: { text: string }): ReactElement {
  return (
    <Text
      testID="empty-state-description"
      color={colors.gray400}
      fontFamily={typography.fontFamily}
      fontWeight={typography.weights.medium}
      fontSize={14}
      lineHeight={20}
      textAlign="center"
      maxWidth={320}
      marginBottom={20}
      // Audit 9.3 — empty-state descriptions are 1–2 sentence Spanish
      // copy. Cap at 4 lines so a generous description still renders
      // intact, then ellipsize before it pushes the action button off
      // the card.
      numberOfLines={4}
      ellipsizeMode="tail"
      // Audit 9.4 — secondary copy can scale more generously than
      // primary text; cap at 1.5×.
      maxFontSizeMultiplier={1.5}
    >
      {text}
    </Text>
  );
}

/**
 * Renders the canonical Cachink empty-state block. See
 * `empty-state.stories.tsx` for the full variant catalog.
 */
export function EmptyState(props: EmptyStateProps): ReactElement {
  return (
    <View
      testID={props.testID ?? 'empty-state'}
      alignItems="center"
      paddingVertical={48}
      paddingHorizontal={24}
    >
      {props.icon !== undefined ? (
        <IconBox name={props.icon} />
      ) : (
        props.emoji !== undefined && <Emoji glyph={props.emoji} />
      )}
      <Title text={props.title} />
      {props.description !== undefined && <Description text={props.description} />}
      {props.action !== undefined && (
        <View marginTop={4} alignItems="center">
          {props.action}
        </View>
      )}
    </View>
  );
}
