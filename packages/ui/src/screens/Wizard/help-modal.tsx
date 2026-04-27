/**
 * HelpModal — "¿No estás seguro? Ayúdame a decidir" modal (ADR-039).
 *
 * Three concrete scenarios with a recommended option for each. Tapping
 * a scenario closes the modal and pre-highlights the matching card on
 * Step 1 (the user still has to tap to confirm — never auto-advance).
 *
 * The fallback footer reassures the user that nothing they pick is
 * irreversible — this is the most important line on the screen for
 * users who freeze on the decision.
 */

import type { ReactElement } from 'react';
import { Text, View } from '@tamagui/core';
import { Btn, Modal } from '../../components/index';
import { useTranslation } from '../../i18n/index';
import { colors, typography } from '../../theme';
import type { WizardScenario } from './state';

type T = ReturnType<typeof useTranslation>['t'];

interface HelpModalProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly onPick: (scenario: WizardScenario) => void;
}

interface ScenarioRowProps {
  readonly emoji: string;
  readonly title: string;
  readonly recommendation: string;
  readonly cta: string;
  readonly testID: string;
  readonly onPress: () => void;
}

function ScenarioRow(props: ScenarioRowProps): ReactElement {
  return (
    <View
      testID={props.testID}
      flexDirection="column"
      gap={6}
      paddingVertical={10}
      borderBottomWidth={1}
      borderBottomColor={colors.gray200}
    >
      <View flexDirection="row" alignItems="center" gap={10}>
        <Text fontSize={28}>{props.emoji}</Text>
        <Text
          flex={1}
          fontFamily={typography.fontFamily}
          fontWeight={typography.weights.bold}
          fontSize={15}
          color={colors.black}
        >
          {props.title}
        </Text>
      </View>
      <Text
        fontFamily={typography.fontFamily}
        fontWeight={typography.weights.medium}
        fontSize={13}
        color={colors.gray600}
      >
        {props.recommendation}
      </Text>
      <View alignSelf="flex-start">
        <Btn variant="dark" size="sm" onPress={props.onPress} testID={`${props.testID}-cta`}>
          {props.cta}
        </Btn>
      </View>
    </View>
  );
}

function FallbackFooter({ t }: { t: T }): ReactElement {
  return (
    <View paddingTop={12}>
      <Text
        fontFamily={typography.fontFamily}
        fontWeight={typography.weights.bold}
        fontSize={13}
        color={colors.black}
      >
        {t('wizard.helpModal.fallbackTitle')}
      </Text>
      <Text
        fontFamily={typography.fontFamily}
        fontWeight={typography.weights.medium}
        fontSize={13}
        color={colors.gray600}
        marginTop={4}
      >
        {t('wizard.helpModal.fallbackBody')}
      </Text>
    </View>
  );
}

function ScenarioGrid({
  t,
  pick,
}: {
  t: T;
  pick: (s: WizardScenario) => () => void;
}): ReactElement {
  const cta = t('wizard.helpModal.startCta');
  return (
    <>
      <ScenarioRow
        testID="wizard-help-solo-local"
        emoji={t('wizard.helpModal.soloLocalEmoji')}
        title={t('wizard.helpModal.soloLocalTitle')}
        recommendation={t('wizard.helpModal.soloLocalRecommendation')}
        cta={cta}
        onPress={pick('solo-local')}
      />
      <ScenarioRow
        testID="wizard-help-multi-device"
        emoji={t('wizard.helpModal.multiDeviceEmoji')}
        title={t('wizard.helpModal.multiDeviceTitle')}
        recommendation={t('wizard.helpModal.multiDeviceRecommendation')}
        cta={cta}
        onPress={pick('multi-device')}
      />
      <ScenarioRow
        testID="wizard-help-solo-cloud"
        emoji={t('wizard.helpModal.soloCloudEmoji')}
        title={t('wizard.helpModal.soloCloudTitle')}
        recommendation={t('wizard.helpModal.soloCloudRecommendation')}
        cta={cta}
        onPress={pick('solo-cloud')}
      />
    </>
  );
}

export function HelpModal(props: HelpModalProps): ReactElement {
  const { t } = useTranslation();
  const pick =
    (scenario: WizardScenario): (() => void) =>
    () => {
      props.onPick(scenario);
      props.onClose();
    };
  return (
    <Modal
      open={props.open}
      onClose={props.onClose}
      title={t('wizard.helpModal.title')}
      testID="wizard-help-modal"
    >
      <ScenarioGrid t={t} pick={pick} />
      <FallbackFooter t={t} />
    </Modal>
  );
}
