/**
 * WizardCard — one card on the wizard grid.
 *
 * Neobrutalist card with emoji + title + hint + optional pros/cons/
 * requirement bullets and an optional `chip` (e.g. "Recomendado"). The
 * disabled state dims to 50% and rejects taps; the legacy
 * `comingSoonLabel` prop is mapped to a soft chip for back-compat.
 */

import type { ReactElement } from 'react';
import { Text, View } from '@tamagui/core';
import { Card, Icon, Tag, type IconName, type TagVariant } from '../../components/index';
import { colors, typography } from '../../theme';

export type WizardCardBulletKind = 'pro' | 'con' | 'requirement';

export interface WizardCardBullet {
  readonly kind: WizardCardBulletKind;
  readonly text: string;
}

export interface WizardCardChip {
  readonly label: string;
  readonly tone?: 'soft' | 'green';
}

export interface WizardCardProps {
  /**
   * @deprecated Pass `icon` instead. Audit PR 2 / UXD-M2-T04 — emoji
   * glyphs are being replaced with Lucide icons via `<Icon>`. Existing
   * callers that still pass `emoji` continue to render the emoji
   * verbatim until they migrate.
   */
  readonly emoji?: string;
  /**
   * Curated icon name. When set, replaces the emoji slot with a 32-px
   * `<Icon>` rendered inside a yellow rounded square (matches the
   * mock 4 left-icon pattern).
   */
  readonly icon?: IconName;
  readonly title: string;
  readonly hint: string;
  readonly bullets?: ReadonlyArray<WizardCardBullet>;
  readonly chip?: WizardCardChip;
  readonly disabled?: boolean;
  /**
   * Optional explanation rendered below the card when `disabled === true`.
   * Used by Step 2B on mobile to explain why the lan-server card cannot
   * be tapped (ADR-039).
   */
  readonly disabledNote?: string;
  readonly highlighted?: boolean;
  /** @deprecated Use `chip` instead. Retained for back-compat. */
  readonly comingSoonLabel?: string;
  readonly onPress?: () => void;
  readonly testID?: string;
}

/**
 * Bullet glyphs are Unicode line/check marks, never emoji — per
 * CLAUDE.md §8 brand and the audit's icon-system rule (4.12 / 7.3).
 * `•` is a typographic bullet (U+2022) that renders consistently in
 * Plus Jakarta Sans on every platform; `✓` and `✗` are math symbols,
 * not emoji.
 */
const BULLET_PREFIX: Record<WizardCardBulletKind, { glyph: string; color: string }> = {
  pro: { glyph: '✓', color: colors.green },
  con: { glyph: '✗', color: colors.red },
  requirement: { glyph: '•', color: colors.ink },
};

function BulletRow({ bullet }: { bullet: WizardCardBullet }): ReactElement {
  const prefix = BULLET_PREFIX[bullet.kind];
  return (
    <View flexDirection="row" alignItems="flex-start" gap={6}>
      <Text
        fontFamily={typography.fontFamily}
        fontWeight={typography.weights.bold}
        fontSize={13}
        color={prefix.color}
      >
        {prefix.glyph}
      </Text>
      <Text
        flex={1}
        fontFamily={typography.fontFamily}
        fontWeight={typography.weights.medium}
        fontSize={13}
        color={colors.ink}
      >
        {bullet.text}
      </Text>
    </View>
  );
}

function BulletList({ bullets }: { bullets: ReadonlyArray<WizardCardBullet> }): ReactElement {
  return (
    <View flexDirection="column" gap={4} marginTop={8}>
      {bullets.map((b, i) => (
        <BulletRow key={i} bullet={b} />
      ))}
    </View>
  );
}

function TitleRow({ title, chip }: { title: string; chip?: WizardCardChip }): ReactElement {
  const variant: TagVariant = chip?.tone === 'green' ? 'success' : 'soft';
  return (
    <View flexDirection="row" alignItems="center" gap={8}>
      <Text
        flex={1}
        fontFamily={typography.fontFamily}
        fontWeight={typography.weights.black}
        fontSize={18}
        color={colors.black}
        letterSpacing={typography.letterSpacing.tighter}
      >
        {title}
      </Text>
      {chip !== undefined && <Tag variant={variant}>{chip.label}</Tag>}
    </View>
  );
}

function CardGlyph({ emoji, icon }: { emoji?: string; icon?: IconName }): ReactElement {
  if (icon !== undefined) {
    return (
      <View
        width={48}
        height={48}
        borderRadius={10}
        backgroundColor={colors.yellowSoft}
        borderColor={colors.black}
        borderWidth={2}
        alignItems="center"
        justifyContent="center"
      >
        <Icon name={icon} size={24} color={colors.black} />
      </View>
    );
  }
  return <Text fontSize={32}>{emoji ?? ''}</Text>;
}

function WizardCardBody(props: WizardCardProps & { chip?: WizardCardChip }): ReactElement {
  return (
    <View flexDirection="row" alignItems="flex-start" gap={12}>
      <CardGlyph emoji={props.emoji} icon={props.icon} />
      <View flex={1}>
        <TitleRow title={props.title} chip={props.chip} />
        <Text
          fontFamily={typography.fontFamily}
          fontWeight={typography.weights.medium}
          fontSize={13}
          color={colors.gray600}
          marginTop={4}
        >
          {props.hint}
        </Text>
        {props.bullets !== undefined && props.bullets.length > 0 && (
          <BulletList bullets={props.bullets} />
        )}
      </View>
    </View>
  );
}

function resolveChip(props: WizardCardProps): WizardCardChip | undefined {
  if (props.chip !== undefined) return props.chip;
  if (props.disabled === true && props.comingSoonLabel !== undefined) {
    return { label: props.comingSoonLabel, tone: 'soft' };
  }
  return undefined;
}

function DisabledNote({ text, testID }: { text: string; testID?: string }): ReactElement {
  return (
    <View testID={testID} marginTop={6} paddingHorizontal={4}>
      <Text
        fontFamily={typography.fontFamily}
        fontWeight={typography.weights.medium}
        fontSize={12}
        color={colors.gray600}
      >
        {text}
      </Text>
    </View>
  );
}

export function WizardCard(props: WizardCardProps): ReactElement {
  const isDisabled = props.disabled === true;
  return (
    <View testID={props.testID} width="100%" maxWidth={480}>
      <View opacity={isDisabled ? 0.5 : 1}>
        <Card
          testID={`${props.testID ?? 'wizard-card'}-card`}
          variant={props.highlighted === true ? 'yellow' : 'white'}
          padding="lg"
          onPress={isDisabled ? undefined : props.onPress}
          fullWidth
        >
          <WizardCardBody {...props} chip={resolveChip(props)} />
        </Card>
      </View>
      {isDisabled && props.disabledNote !== undefined && (
        <DisabledNote
          text={props.disabledNote}
          testID={props.testID ? `${props.testID}-note` : undefined}
        />
      )}
    </View>
  );
}
