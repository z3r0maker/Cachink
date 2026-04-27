/**
 * ConflictosRecientesCard — DirectorHome surface for LAN-sync conflict
 * visibility (P1D-M4 C20).
 *
 * CLAUDE.md §1 mandates "Conflicts surface inline, never silently." When
 * the LAN pull applier rejects an inbound delta (because the local row
 * won the LWW comparison), it records a row in `__cachink_conflicts`.
 * This card shows the N most-recent losers so the Director can verify
 * the app's behavior instead of discovering a data mismatch later.
 *
 * Renders nothing when there are zero conflicts — the card is purely
 * diagnostic, not a persistent nag.
 */

import type { ReactElement } from 'react';
import { Text, View } from '@tamagui/core';
import { type SyncConflictRow, useLastConflicts } from '../../hooks/use-last-conflicts';
import { useTranslation } from '../../i18n/index';
import { colors, radii, typography } from '../../theme';
import { Card } from '../../components/Card/card';
import { List } from '../../components/List/index';
import { Tag } from '../../components/Tag/tag';

export interface ConflictosRecientesCardProps {
  readonly testID?: string;
}

type T = ReturnType<typeof useTranslation>['t'];

function Header({ t }: { t: T }): ReactElement {
  return (
    <>
      <View flexDirection="row" alignItems="center" gap={8} marginBottom={8}>
        <Tag variant="warning">{t('directorHome.conflictosBadge')}</Tag>
        <Text
          fontFamily={typography.fontFamily}
          fontWeight={typography.weights.bold}
          fontSize={14}
          color={colors.black}
          flex={1}
        >
          {t('directorHome.conflictosTitle')}
        </Text>
      </View>
      <Text
        fontFamily={typography.fontFamily}
        fontWeight={typography.weights.medium}
        fontSize={12}
        color={colors.gray600}
        marginBottom={10}
      >
        {t('directorHome.conflictosSubtitle')}
      </Text>
    </>
  );
}

function ConflictRow({ c }: { c: SyncConflictRow }): ReactElement {
  return (
    <View
      flexDirection="row"
      justifyContent="space-between"
      paddingVertical={6}
      paddingHorizontal={10}
      backgroundColor={colors.gray100}
      borderColor={colors.black}
      borderWidth={2}
      borderRadius={radii[0]}
    >
      <Text
        fontFamily={typography.fontFamily}
        fontWeight={typography.weights.semibold}
        fontSize={12}
        color={colors.black}
      >
        {c.tableName}
      </Text>
      <Text
        fontFamily={typography.fontFamily}
        fontWeight={typography.weights.medium}
        fontSize={11}
        color={colors.gray600}
      >
        {c.reason} · {shortDeviceId(c.loserDeviceId)}
      </Text>
    </View>
  );
}

export function ConflictosRecientesCard(props: ConflictosRecientesCardProps): ReactElement | null {
  const { t } = useTranslation();
  const { conflicts, loading } = useLastConflicts(5);
  if (loading || conflicts.length === 0) return null;
  return (
    <Card variant="white" testID={props.testID ?? 'conflictos-recientes-card'}>
      <Header t={t} />
      <View>
        <List<SyncConflictRow>
          data={conflicts}
          keyExtractor={(c) => String(c.id)}
          renderItem={(c) => (
            <View marginBottom={6}>
              <ConflictRow c={c} />
            </View>
          )}
          testID="conflictos-recientes-list"
        />
      </View>
    </Card>
  );
}

function shortDeviceId(id: string): string {
  if (id.length <= 6) return id;
  return `…${id.slice(-6)}`;
}
