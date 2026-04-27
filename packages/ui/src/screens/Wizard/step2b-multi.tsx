/**
 * Step2bMultiScreen — multi-device branch (ADR-039).
 *
 * Two cards:
 *   · Esta computadora guarda los datos       → mode='lan-server' (desktop only)
 *   · La nube guarda los datos                → cloud sub-flow (sign-up)
 *
 * Mobile renders the lan-server card disabled with the inline
 * `serverDisabledNote` explanation. The desktop variant adds a small
 * `importLink` below the cards that opens the migration-deferred
 * screen (Solo → LAN import is parked in Phase 2 — see
 * ARCHITECTURE.md "Deferred Decisions").
 */

import type { ReactElement } from 'react';
import { Text, View } from '@tamagui/core';
import { useTranslation } from '../../i18n/index';
import { colors, typography } from '../../theme';
import { WizardCard } from './wizard-card';
import { DataPreservedCallout } from './data-preserved-callout';

interface Step2bProps {
  readonly platform: 'mobile' | 'desktop';
  readonly onSelectLanServer: () => void;
  readonly onSelectCloud: () => void;
  readonly onImportLink: () => void;
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

function ImportLink({ label, onPress }: { label: string; onPress: () => void }): ReactElement {
  return (
    <View
      testID="wizard-step2b-import-link"
      onPress={onPress}
      role="button"
      aria-label={label}
      cursor="pointer"
      paddingVertical={6}
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

export function Step2bMultiScreen(props: Step2bProps): ReactElement {
  const { t } = useTranslation();
  const isMobile = props.platform === 'mobile';
  return (
    <>
      <StepHeader title={t('wizard.step2b.title')} subtitle={t('wizard.step2b.subtitle')} />
      <DataPreservedCallout />
      <WizardCard
        testID="wizard-step2b-server"
        icon="monitor"
        title={t('wizard.step2b.serverTitle')}
        hint={t('wizard.step2b.serverBody')}
        disabled={isMobile}
        disabledNote={isMobile ? t('wizard.step2b.serverDisabledNote') : undefined}
        highlighted={!isMobile}
        onPress={props.onSelectLanServer}
      />
      <WizardCard
        testID="wizard-step2b-cloud"
        icon="cloud"
        title={t('wizard.step2b.cloudTitle')}
        hint={t('wizard.step2b.cloudBody')}
        onPress={props.onSelectCloud}
      />
      {!isMobile && (
        <ImportLink label={t('wizard.step2b.importLink')} onPress={props.onImportLink} />
      )}
      <BackLink label={t('wizard.back')} onPress={props.onBack} />
    </>
  );
}
