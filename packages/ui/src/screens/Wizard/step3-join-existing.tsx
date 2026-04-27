/**
 * Step3JoinExistingScreen — "Ya tengo Cachink en otro dispositivo"
 * branch (ADR-039).
 *
 * Two cards:
 *   · Conectarme al servidor de mi negocio       → mode='lan-client'
 *   · Iniciar sesión en mi cuenta de Cachink     → cloud sub-flow (sign-in)
 *
 * Reached via the secondary link on Step 1, never as a sub-step of
 * Step 1's primary cards. Selection drives the right downstream
 * gate (LanGate join screen / CloudOnboarding sign-in tab).
 */

import type { ReactElement } from 'react';
import { Text, View } from '@tamagui/core';
import { useTranslation } from '../../i18n/index';
import { colors, typography } from '../../theme';
import { WizardCard } from './wizard-card';
import { DataPreservedCallout } from './data-preserved-callout';

interface Step3Props {
  readonly onSelectLanClient: () => void;
  readonly onSelectCloudSignIn: () => void;
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

export function Step3JoinExistingScreen(props: Step3Props): ReactElement {
  const { t } = useTranslation();
  return (
    <>
      <StepHeader title={t('wizard.step3.title')} subtitle={t('wizard.step3.subtitle')} />
      <DataPreservedCallout />
      <WizardCard
        testID="wizard-step3-lan"
        icon="plug"
        title={t('wizard.step3.lanTitle')}
        hint={t('wizard.step3.lanBody')}
        highlighted
        onPress={props.onSelectLanClient}
      />
      <WizardCard
        testID="wizard-step3-cloud"
        icon="cloud"
        title={t('wizard.step3.cloudTitle')}
        hint={t('wizard.step3.cloudBody')}
        onPress={props.onSelectCloudSignIn}
      />
      <BackLink label={t('wizard.back')} onPress={props.onBack} />
    </>
  );
}
