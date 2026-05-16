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
  /** Called with the counted amount. Parent must save to DB immediately. */
  readonly onSubmit: (conteoCentavos: Money) => void;
  readonly submitting: boolean;
  readonly testID?: string;
}

export function BlindCountStep(props: BlindCountStepProps): ReactElement {
  const { t } = useTranslation();
  const media = useMedia();
  const numpad = useNumpadInput();
  const isPhone = media.sm === true;
  const numpadSize = isPhone ? 56 : 72;

  return (
    <View flex={1} testID={props.testID ?? 'blind-count-step'}>
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingBottom: 100,
          gap: isPhone ? 12 : 16,
          alignItems: 'center',
        }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Yellow accent strip */}
        <View
          width="100%"
          height={6}
          backgroundColor={colors.yellow}
          borderRadius={radii[0]}
        />

        {/* Header Card */}
        <BlindCountHeader t={t} />

        {/* Entry Card — numpad + display */}
        <Card variant="white" fullWidth padding="md" elevation="raised">
          <View gap={isPhone ? 12 : 16} alignItems="center">
            <NumpadDisplay
              value={numpad.display}
              testID="blind-count-display"
            />
            <Numpad
              onPress={numpad.onKey}
              buttonSize={numpadSize}
              testID="blind-count-numpad"
            />
          </View>
        </Card>

        {/* Warning notice */}
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
      </ScrollView>

      {/* Sticky footer CTA */}
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
          onPress={() => props.onSubmit(numpad.centavos)}
          loading={props.submitting}
          disabled={numpad.centavos <= ZERO}
          testID="blind-count-continue"
        >
          {t('caja.blindCountContinue')}
        </Btn>
      </View>
    </View>
  );
}

// --- Sub-component ---

function BlindCountHeader({
  t,
}: {
  t: ReturnType<typeof useTranslation>['t'];
}): ReactElement {
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
