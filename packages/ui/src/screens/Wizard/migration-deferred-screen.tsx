/**
 * MigrationDeferredScreen — Step 2B importLink destination (ADR-039).
 *
 * Solo → LAN migration is deferred to Phase 2 (see ARCHITECTURE.md
 * "Deferred Decisions"). This screen explains the manual workaround
 * (export from the source device, transfer the file, then start the
 * desktop fresh or as a client) so the user has a path forward without
 * us pretending a feature exists that doesn't.
 *
 * Reachable only from Step 2B on desktop. Mobile cannot host LAN, so
 * the link is hidden there.
 */

import type { ReactElement } from 'react';
import { Text, View } from '@tamagui/core';
import { Card, SectionTitle } from '../../components/index';
import { useTranslation } from '../../i18n/index';
import { colors, typography } from '../../theme';

type T = ReturnType<typeof useTranslation>['t'];

interface MigrationDeferredProps {
  readonly onBack: () => void;
}

function BulletText({ children }: { children: string }): ReactElement {
  return (
    <Text
      fontFamily={typography.fontFamily}
      fontWeight={typography.weights.medium}
      fontSize={14}
      color={colors.ink}
      marginTop={6}
    >
      {children}
    </Text>
  );
}

function BodyCard({ t }: { t: T }): ReactElement {
  return (
    <Card padding="lg" fullWidth>
      <Text
        fontFamily={typography.fontFamily}
        fontWeight={typography.weights.semibold}
        fontSize={14}
        color={colors.gray600}
      >
        {t('wizard.migrationDeferred.body')}
      </Text>
      <BulletText>{t('wizard.migrationDeferred.bullet1')}</BulletText>
      <BulletText>{t('wizard.migrationDeferred.bullet2')}</BulletText>
      <BulletText>{t('wizard.migrationDeferred.bullet3')}</BulletText>
    </Card>
  );
}

function BackLink({ label, onPress }: { label: string; onPress: () => void }): ReactElement {
  return (
    <View
      testID="wizard-migration-deferred-back"
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

export function MigrationDeferredScreen(props: MigrationDeferredProps): ReactElement {
  const { t } = useTranslation();
  return (
    <View
      testID="wizard-migration-deferred-screen"
      width="100%"
      maxWidth={520}
      gap={14}
      paddingHorizontal={4}
    >
      <SectionTitle title={t('wizard.migrationDeferred.title')} />
      <BodyCard t={t} />
      <BackLink label={t('wizard.migrationDeferred.backCta')} onPress={props.onBack} />
    </View>
  );
}
