/**
 * Wizard — first-run database-mode picker (P1C-M2-T03).
 *
 * Single-screen decision: 4 mode cards per CLAUDE.md §7.4.
 *   1. 📱 Solo este dispositivo — default highlight. Functional. Phase 1C.
 *   2. ☁️ En la nube — disabled ("Próximamente"). Phase 1E.
 *   3. 🏠 Conectar a un servidor local — disabled. Phase 1D.
 *   4. 🖥️ Ser el servidor local — disabled AND hidden on mobile (Tauri-only
 *      decision) — mobile consumers pass `platform="mobile"`.
 *
 * Tapping a functional card fires `onSelectMode('local-standalone')`; the
 * app-shell route then writes the mode to AppConfig and routes to the
 * business-creation step. Disabled cards are no-ops.
 */

import type { ReactElement } from 'react';
import { Text, View } from '@tamagui/core';
import { useTranslation } from '../../i18n/index';
import { colors, typography } from '../../theme';
import type { AppMode } from '../../app-config/index';
import { WizardCard } from './wizard-card';

export interface WizardProps {
  readonly onSelectMode: (mode: AppMode) => void;
  /** 'mobile' hides the "Ser el servidor local" card (desktop-only option). */
  readonly platform?: 'mobile' | 'desktop';
  readonly testID?: string;
}

function WizardHeader({ title, subtitle }: { title: string; subtitle: string }): ReactElement {
  return (
    <>
      <Text
        fontFamily={typography.fontFamily}
        fontWeight={typography.weights.black}
        fontSize={36}
        letterSpacing={typography.letterSpacing.tightest}
        color={colors.black}
        textAlign="center"
      >
        {title}
      </Text>
      <Text
        fontFamily={typography.fontFamily}
        fontWeight={typography.weights.semibold}
        fontSize={16}
        color={colors.gray600}
        textAlign="center"
        marginBottom={8}
      >
        {subtitle}
      </Text>
    </>
  );
}

interface DisabledCardProps {
  readonly testID: string;
  readonly emoji: string;
  readonly title: string;
  readonly hint: string;
  readonly comingSoonLabel: string;
}

function DisabledCard(props: DisabledCardProps): ReactElement {
  return (
    <WizardCard
      testID={props.testID}
      emoji={props.emoji}
      title={props.title}
      hint={props.hint}
      disabled
      comingSoonLabel={props.comingSoonLabel}
    />
  );
}

interface WizardCardsProps {
  readonly t: (k: string) => string;
  readonly platform: 'mobile' | 'desktop';
  readonly onSelectMode: (mode: AppMode) => void;
}

function WizardCards({ t, platform, onSelectMode }: WizardCardsProps): ReactElement {
  const comingSoon = t('wizard.comingSoon');
  return (
    <>
      <WizardCard
        testID="wizard-local-standalone"
        emoji="📱"
        title={t('wizard.localStandalone.title')}
        hint={t('wizard.localStandalone.hint')}
        highlighted
        onPress={() => onSelectMode('local-standalone')}
      />
      <DisabledCard
        testID="wizard-cloud"
        emoji="☁️"
        title={t('wizard.cloud.title')}
        hint={t('wizard.cloud.hint')}
        comingSoonLabel={comingSoon}
      />
      <DisabledCard
        testID="wizard-lan-client"
        emoji="🏠"
        title={t('wizard.lanClient.title')}
        hint={t('wizard.lanClient.hint')}
        comingSoonLabel={comingSoon}
      />
      {platform === 'desktop' && (
        <DisabledCard
          testID="wizard-lan-host"
          emoji="🖥️"
          title={t('wizard.lanHost.title')}
          hint={t('wizard.lanHost.hint')}
          comingSoonLabel={comingSoon}
        />
      )}
    </>
  );
}

export function Wizard(props: WizardProps): ReactElement {
  const { t } = useTranslation();
  const platform = props.platform ?? 'desktop';
  return (
    <View
      testID={props.testID ?? 'wizard'}
      flex={1}
      backgroundColor={colors.offwhite}
      alignItems="center"
      justifyContent="center"
      padding={24}
      gap={16}
    >
      <WizardHeader title={t('wizard.title')} subtitle={t('wizard.subtitle')} />
      <WizardCards t={t} platform={platform} onSelectMode={props.onSelectMode} />
    </View>
  );
}
