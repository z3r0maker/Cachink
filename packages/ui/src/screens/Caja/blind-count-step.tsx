/**
 * BlindCountStep — Step 1 of the tamper-proof blind-close flow.
 *
 * Operator enters their counted cash on the Numpad WITHOUT seeing
 * the expected balance. On "CONTINUAR", the count is immediately
 * saved to the DB (locked) before showing Step 2.
 *
 * Redesigned for phone viewports (UX Audit May 2026):
 * - Yellow accent strip for brand identity
 * - Card containment around numpad + display
 * - Numpad uses 56px buttons on phones (72px on tablets)
 * - Sticky CTA footer pinned at bottom
 *
 * Caja Overhaul — Phase C.
 */

import type { ReactElement } from 'react';
import { ScrollView } from 'react-native';
import { Text, View, useMedia } from '@tamagui/core';
import type { Money } from '@cachink/domain';
import { ZERO } from '@cachink/domain';
import { Btn } from '../../components/Btn/btn';
import { Card } from '../../components/Card/card';
import { Icon } from '../../components/Icon/index';
import {
  Numpad,
  NumpadDisplay,
  useNumpadInput,
} from '../../components/Numpad/index';
import { useTranslation } from '../../i18n/index';
import { colors, radii, typography } from '../../theme';

export interface BlindCountStepProps {
  readonly onSubmit: (conteoCentavos: Money) => void;
  readonly submitting: boolean;
  readonly testID?: string;
}

export function BlindCountStep(props: BlindCountStepProps): ReactElement {
  const { t } = useTranslation();
  const media = useMedia();
  const numpad = useNumpadInput();
  const isPhone = media.sm === true;

  return (
    <View flex={1} testID={props.testID ?? 'blind-count-step'}>
      <BlindCountScrollBody isPhone={isPhone} numpad={numpad} t={t} />
      <BlindCountFooter
        onSubmit={() => props.onSubmit(numpad.centavos)}
        submitting={props.submitting}
        disabled={numpad.centavos <= ZERO}
        t={t}
      />
    </View>
  );
}

// --- Sub-components ---

type T = ReturnType<typeof useTranslation>['t'];

function BlindCountScrollBody(props: {
  isPhone: boolean;
  numpad: ReturnType<typeof useNumpadInput>;
  t: T;
}): ReactElement {
  const gap = props.isPhone ? 12 : 16;

  return (
    <ScrollView
      contentContainerStyle={{
        paddingHorizontal: 20,
        paddingBottom: 100,
        gap,
        alignItems: 'center',
      }}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <View width="100%" height={6} backgroundColor={colors.yellow} borderRadius={radii[0]} />
      <BlindCountHeader t={props.t} />
      <BlindCountNumpadCard isPhone={props.isPhone} numpad={props.numpad} />
      <BlindCountWarning t={props.t} />
    </ScrollView>
  );
}

function BlindCountNumpadCard(props: {
  isPhone: boolean;
  numpad: ReturnType<typeof useNumpadInput>;
}): ReactElement {
  const gap = props.isPhone ? 12 : 16;
  const numpadSize = props.isPhone ? 56 : 72;
  return (
    <Card variant="white" fullWidth padding="md" elevation="raised">
      <View gap={gap} alignItems="center">
        <NumpadDisplay value={props.numpad.display} testID="blind-count-display" />
        <Numpad onPress={props.numpad.onKey} buttonSize={numpadSize} testID="blind-count-numpad" />
      </View>
    </Card>
  );
}

function BlindCountHeader({ t }: { t: T }): ReactElement {
  return (
    <Card variant="white" padding="md" fullWidth testID="blind-count-header">
      <View flexDirection="row" alignItems="center" gap={10}>
        <Icon name="lock" size={28} color={colors.black} />
        <View flex={1} gap={2}>
          <Text
            fontFamily={typography.fontFamily}
            fontWeight={typography.weights.black.toString()}
            fontSize={18}
            color={colors.black}
          >
            {t('caja.blindCountHeader')}
          </Text>
          <Text
            fontFamily={typography.fontFamily}
            fontSize={14}
            color={colors.gray600}
          >
            {t('caja.blindCountHint')}
          </Text>
        </View>
      </View>
    </Card>
  );
}

function BlindCountWarning({ t }: { t: T }): ReactElement {
  return (
    <View
      flexDirection="row"
      alignItems="center"
      gap={8}
      paddingHorizontal={4}
    >
      <Icon name="triangle-alert" size={16} color={colors.yellow} />
      <Text
        fontFamily={typography.fontFamily}
        fontSize={12}
        color={colors.gray600}
        flex={1}
      >
        {t('caja.blindCountWarning')}
      </Text>
    </View>
  );
}

function BlindCountFooter(props: {
  onSubmit: () => void;
  submitting: boolean;
  disabled: boolean;
  t: T;
}): ReactElement {
  return (
    <View
      position="absolute"
      bottom={0}
      left={0}
      right={0}
      backgroundColor={colors.offwhite}
      paddingHorizontal={20}
      paddingVertical={16}
      borderTopWidth={2}
      borderTopColor={colors.gray200}
    >
      <Btn
        variant="dark"
        fullWidth
        size="lg"
        icon={<Icon name="check" size={18} color={colors.white} />}
        onPress={props.onSubmit}
        loading={props.submitting}
        disabled={props.disabled}
        testID="blind-count-continue"
      >
        {props.t('caja.blindCountContinue')}
      </Btn>
    </View>
  );
}
