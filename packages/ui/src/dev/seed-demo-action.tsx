/**
 * SeedDemoAction — dev-only Settings card that populates the app with
 * ~130 realistic demo records for manual testing.
 *
 * Guarded by `__DEV__` — tree-shaken out of production builds.
 * Uses ConfirmDialog to prevent accidental taps.
 */

import { useCallback, useState, type ReactElement } from 'react';
import { Text } from '@tamagui/core';
import { Btn, Card, ConfirmDialog, SectionTitle } from '../components/index';
import { useRepositories } from '../app/repository-provider';
import { useCurrentBusinessId, useDeviceId } from '../app-config/use-app-config';
import { useTranslation } from '../i18n/index';
import { colors, typography } from '../theme';
import { seedDemoData } from './seed-demo-data';
import type { BusinessId, DeviceId } from '@cachink/domain';

type ActionState = 'idle' | 'confirm' | 'pending' | 'done' | 'error' | 'already';

export function SeedDemoAction(): ReactElement | null {
  // Guard: only in development
  if (typeof __DEV__ !== 'undefined' && !__DEV__) return null;

  return <SeedDemoActionInner />;
}

function SeedDemoActionInner(): ReactElement {
  const { t } = useTranslation();
  const repos = useRepositories();
  const businessId = useCurrentBusinessId() as BusinessId | null;
  const deviceId = useDeviceId() as DeviceId | null;

  const [state, setState] = useState<ActionState>('idle');
  const [count, setCount] = useState(0);

  const handleSeed = useCallback(async () => {
    if (!businessId || !deviceId) return;
    setState('pending');
    try {
      const result = await seedDemoData({
        repositories: repos,
        businessId,
        deviceId,
      });
      if (result.alreadySeeded) {
        setState('already');
      } else {
        setCount(result.totalRecords);
        setState('done');
      }
    } catch {
      setState('error');
    }
  }, [repos, businessId, deviceId]);

  const disabled = !businessId || state === 'pending' || state === 'done';
  return (
    <>
      <Card testID="seed-demo-card" padding="md" fullWidth>
        <SectionTitle title={t('dev.seedTitle')} />
        <SeedStatus state={state} count={count} />

        <Btn
          variant="primary"
          onPress={() => setState('confirm')}
          disabled={disabled}
          fullWidth
          testID="seed-demo-btn"
        >
          {t('dev.seedBtn')}
        </Btn>
      </Card>
      <ConfirmDialog
        open={state === 'confirm'}
        onClose={() => setState('idle')}
        onConfirm={handleSeed}
        title={t('dev.seedConfirmTitle')}
        description={t('dev.seedConfirmBody')}
        confirmLabel={t('dev.seedConfirmBtn')}
      />
    </>
  );
}

function SeedStatus({ state, count }: { state: ActionState; count: number }): ReactElement {
  const { t } = useTranslation();
  let msg: string;
  if (state === 'pending') msg = '⏳ Cargando datos…';
  else if (state === 'done') msg = t('dev.seedSuccess').replace('{count}', String(count));
  else if (state === 'error') msg = t('dev.seedError');
  else if (state === 'already') msg = t('dev.seedAlreadyLoaded');
  else msg = t('dev.seedHint');

  return (
    <Text
      fontFamily={typography.fontFamily}
      fontWeight={typography.weights.medium}
      fontSize={13}
      color={state === 'error' ? colors.red : colors.gray600}
      marginBottom={10}
      testID="seed-demo-status"
    >
      {msg}
    </Text>
  );
}
