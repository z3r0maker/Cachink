/**
 * WizardCard — one card on the wizard grid.
 *
 * Neobrutalist card with emoji badge + title + subtitle + optional
 * "Próximamente" chip for the future-phase options. Disabled cards
 * dim to 50% opacity and reject taps. The functional
 * `local-standalone` card renders highlighted by default.
 */

import type { ReactElement } from 'react';
import { Text, View } from '@tamagui/core';
import { Card, Tag } from '../../components/index';
import { colors, typography } from '../../theme';

export interface WizardCardProps {
  readonly emoji: string;
  readonly title: string;
  readonly hint: string;
  readonly disabled?: boolean;
  readonly highlighted?: boolean;
  readonly comingSoonLabel?: string;
  readonly onPress?: () => void;
  readonly testID?: string;
}

function TitleRow({
  title,
  showChip,
  chipLabel,
}: {
  title: string;
  showChip: boolean;
  chipLabel: string;
}): ReactElement {
  return (
    <View flexDirection="row" alignItems="center" gap={8}>
      <Text
        fontFamily={typography.fontFamily}
        fontWeight={typography.weights.black}
        fontSize={18}
        color={colors.black}
        letterSpacing={typography.letterSpacing.tighter}
      >
        {title}
      </Text>
      {showChip && <Tag variant="soft">{chipLabel}</Tag>}
    </View>
  );
}

function WizardCardBody(props: {
  emoji: string;
  title: string;
  hint: string;
  showChip: boolean;
  chipLabel: string;
}): ReactElement {
  return (
    <View flexDirection="row" alignItems="center" gap={12}>
      <Text fontSize={32}>{props.emoji}</Text>
      <View flex={1}>
        <TitleRow title={props.title} showChip={props.showChip} chipLabel={props.chipLabel} />
        <Text
          fontFamily={typography.fontFamily}
          fontWeight={typography.weights.medium}
          fontSize={13}
          color={colors.gray600}
          marginTop={4}
        >
          {props.hint}
        </Text>
      </View>
    </View>
  );
}

export function WizardCard(props: WizardCardProps): ReactElement {
  const isDisabled = props.disabled === true;
  const showChip = isDisabled && props.comingSoonLabel !== undefined;
  return (
    <View testID={props.testID} opacity={isDisabled ? 0.5 : 1} width="100%" maxWidth={480}>
      <Card
        testID={`${props.testID ?? 'wizard-card'}-card`}
        variant={props.highlighted === true ? 'yellow' : 'white'}
        padding="lg"
        onPress={isDisabled ? undefined : props.onPress}
        fullWidth
      >
        <WizardCardBody
          emoji={props.emoji}
          title={props.title}
          hint={props.hint}
          showChip={showChip}
          chipLabel={props.comingSoonLabel ?? ''}
        />
      </Card>
    </View>
  );
}
