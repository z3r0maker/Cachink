/**
 * PlanLimitSheet — "Llegaste a 50 registros este mes" (A-10). Informational
 * only: it says which plan removes the limit and where to change plans. No
 * purchase button or link in the app (store rules; payments live on the web).
 */

import type { ReactElement } from 'react';
import { Text, View } from '@tamagui/core';
import { Btn, Modal } from '../components/index';
import { useTranslation } from '../i18n/index';
import { colors, fontSizes, typography } from '../theme';
import { usePlanLimitStore } from './plan-limit-store';

export function PlanLimitSheet(): ReactElement {
  const { t } = useTranslation();
  const hit = usePlanLimitStore((s) => s.hit);
  const dismiss = usePlanLimitStore((s) => s.dismiss);
  return (
    <Modal
      open={hit !== null}
      onClose={dismiss}
      title={t('planLimit.title', { limit: hit?.limit ?? 0 })}
      testID="plan-limit-sheet"
    >
      <View gap={12}>
        <Text fontFamily={typography.fontFamily} fontSize={fontSizes.md} color={colors.black}>
          {t('planLimit.body')}
        </Text>
        <Text fontFamily={typography.fontFamily} fontSize={fontSizes.sm} color={colors.gray600}>
          {t('planLimit.where')}
        </Text>
        <Btn variant="dark" onPress={dismiss} fullWidth testID="plan-limit-dismiss">
          {t('planLimit.ok')}
        </Btn>
      </View>
    </Modal>
  );
}
