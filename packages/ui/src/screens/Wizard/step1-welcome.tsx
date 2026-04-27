/**
 * Step1WelcomeScreen — first wizard screen (ADR-039).
 *
 * Asks "¿Cómo lo vas a usar?" with two primary cards (Solo / Multi)
 * plus two secondary text links: "¿Ya tienes Cachink en otro
 * dispositivo?" advances to Step 3 (join existing setup), and
 * "¿No estás seguro? Ayúdame a decidir →" opens the help modal.
 *
 * If the help modal previously pre-selected a scenario, the matching
 * card renders with a small "Recomendado" chip — the user still has
 * to tap it (no auto-advance).
 */

import type { ReactElement } from 'react';
import { Text, View } from '@tamagui/core';
import { useTranslation } from '../../i18n/index';
import { colors, typography } from '../../theme';
import { WizardCard, type WizardCardChip } from './wizard-card';
import type { WizardScenario } from './state';

type T = ReturnType<typeof useTranslation>['t'];

interface Step1Props {
  readonly platform: 'mobile' | 'desktop';
  readonly preselectedScenario: WizardScenario | null;
  readonly onSelectSolo: () => void;
  readonly onSelectMulti: () => void;
  readonly onJoinExistingLink: () => void;
  readonly onHelpLink: () => void;
}

function recommendedChip(active: boolean): WizardCardChip | undefined {
  if (!active) return undefined;
  return { label: 'Recomendado', tone: 'green' };
}

function WelcomeHeader({ t }: { t: T }): ReactElement {
  return (
    <>
      <Text
        fontFamily={typography.fontFamily}
        fontWeight={typography.weights.black}
        fontSize={32}
        letterSpacing={typography.letterSpacing.tightest}
        color={colors.black}
        textAlign="center"
      >
        {t('wizard.step1.welcomeTitle')}
      </Text>
      <Text
        fontFamily={typography.fontFamily}
        fontWeight={typography.weights.semibold}
        fontSize={15}
        color={colors.gray600}
        textAlign="center"
        marginBottom={8}
      >
        {t('wizard.step1.welcomeBody')}
      </Text>
    </>
  );
}

function SecondaryLink({
  label,
  testID,
  onPress,
}: {
  label: string;
  testID: string;
  onPress: () => void;
}): ReactElement {
  return (
    <View
      testID={testID}
      onPress={onPress}
      role="button"
      aria-label={label}
      cursor="pointer"
      // Audit 4.13 — bumped paddingVertical 6 → 14 so the effective
      // tap target reaches the §8 / iOS-HIG 44-pt minimum.
      // 14 + 13-px label + 14 = ~41 + 6-pt hitSlop = 47 pt.
      paddingVertical={14}
      hitSlop={{ top: 6, bottom: 6, left: 8, right: 8 }}
    >
      <Text
        fontFamily={typography.fontFamily}
        fontWeight={typography.weights.semibold}
        fontSize={13}
        color={colors.blue}
        textAlign="center"
      >
        {label}
      </Text>
    </View>
  );
}

export function Step1WelcomeScreen(props: Step1Props): ReactElement {
  const { t } = useTranslation();
  const soloRecommended =
    props.preselectedScenario === 'solo-local' || props.preselectedScenario === 'solo-cloud';
  const multiRecommended = props.preselectedScenario === 'multi-device';
  return (
    <>
      <WelcomeHeader t={t} />
      <WizardCard
        testID="wizard-step1-solo"
        icon="smartphone"
        title={t('wizard.step1.soloTitle')}
        hint={t('wizard.step1.soloBody')}
        highlighted={soloRecommended || props.preselectedScenario === null}
        chip={recommendedChip(soloRecommended)}
        onPress={props.onSelectSolo}
      />
      <WizardCard
        testID="wizard-step1-multi"
        icon="building-2"
        title={t('wizard.step1.multiTitle')}
        hint={t('wizard.step1.multiBody')}
        highlighted={multiRecommended}
        chip={recommendedChip(multiRecommended)}
        onPress={props.onSelectMulti}
      />
      <SecondaryLink
        testID="wizard-step1-join-existing-link"
        label={t('wizard.step1.joinExistingLink')}
        onPress={props.onJoinExistingLink}
      />
      <SecondaryLink
        testID="wizard-step1-help-link"
        label={t('wizard.step1.helpLink')}
        onPress={props.onHelpLink}
      />
    </>
  );
}
