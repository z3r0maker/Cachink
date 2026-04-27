/**
 * Step2aSoloScreen — single-device branch (ADR-039).
 *
 * Two cards:
 *   · Guardar todo en este dispositivo  → mode='local'
 *   · Guardar todo en la nube           → cloud sub-flow (sign-up)
 *
 * Plus a back link returning to Step 1. Honest copy on the cloud card
 * makes the account requirement explicit so the user sees the cost
 * before tapping.
 */

import type { ReactElement } from 'react';
import { Text, View } from '@tamagui/core';
import { useTranslation } from '../../i18n/index';
import { colors, typography } from '../../theme';
import { WizardCard } from './wizard-card';
import { DataPreservedCallout } from './data-preserved-callout';

interface Step2aProps {
  readonly onSelectLocal: () => void;
  readonly onSelectCloud: () => void;
  readonly onBack: () => void;
}

function StepHeader({ title, subtitle }: { title: string; subtitle: string }): ReactElement {
  return (
    <>
      <Text
        fontFamily={typography.fontFamily}
        fontWeight={typography.weights.black}
        fontSize={28}
        letterSpacing={typography.letterSpacing.tightest}
        color={colors.black}
        textAlign="center"
      >
        {title}
      </Text>
      <Text
        fontFamily={typography.fontFamily}
        fontWeight={typography.weights.semibold}
        fontSize={14}
        color={colors.gray600}
        textAlign="center"
        marginBottom={8}
      >
        {subtitle}
      </Text>
    </>
  );
}

function BackLink({ label, onPress }: { label: string; onPress: () => void }): ReactElement {
  return (
    <View
      testID="wizard-back"
      onPress={onPress}
      role="button"
      aria-label={label}
      cursor="pointer"
      paddingVertical={6}
      paddingHorizontal={12}
    >
      <Text
        fontFamily={typography.fontFamily}
        fontWeight={typography.weights.bold}
        fontSize={14}
        color={colors.gray600}
        letterSpacing={typography.letterSpacing.wide}
      >
        {label}
      </Text>
    </View>
  );
}

export function Step2aSoloScreen(props: Step2aProps): ReactElement {
  const { t } = useTranslation();
  return (
    <>
      <StepHeader title={t('wizard.step2a.title')} subtitle={t('wizard.step2a.subtitle')} />
      <DataPreservedCallout />
      <WizardCard
        testID="wizard-step2a-local"
        icon="hard-drive"
        title={t('wizard.step2a.localTitle')}
        hint={t('wizard.step2a.localBody')}
        highlighted
        onPress={props.onSelectLocal}
      />
      <WizardCard
        testID="wizard-step2a-cloud"
        icon="cloud"
        title={t('wizard.step2a.cloudTitle')}
        hint={t('wizard.step2a.cloudBody')}
        onPress={props.onSelectCloud}
      />
      <BackLink label={t('wizard.back')} onPress={props.onBack} />
    </>
  );
}
