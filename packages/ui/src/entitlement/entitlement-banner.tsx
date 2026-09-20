/**
 * EntitlementBanner — one line under the top bar when the plan needs
 * attention (A-10): payment grace ("tienes hasta <fecha>") or a paid plan
 * that fell back to Freelancer. Nothing when all is well.
 */

import type { ReactElement } from 'react';
import { Text, View } from '@tamagui/core';
import type { ResolvedEntitlement } from '@xangarro/sync';
import { useTranslation } from '../i18n/index';
import { colors, fontSizes, typography } from '../theme';
import { useEntitlement } from './use-entitlement';

export type BannerKind = 'grace' | 'fellBack' | null;

export function bannerKind(e: ResolvedEntitlement | undefined): BannerKind {
  if (!e?.verified) return null;
  if (e.state === 'grace') return 'grace';
  if (e.state === 'lapsed' && e.grantedPlan !== null && e.grantedPlan !== 'xangarrito')
    return 'fellBack';
  return null;
}

function formatDay(iso: string | null): string {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('es-MX', { day: 'numeric', month: 'long' });
}

export function EntitlementBanner(): ReactElement | null {
  const { t } = useTranslation();
  const entitlement = useEntitlement();
  const kind = bannerKind(entitlement);
  if (kind === null) return null;
  const text =
    kind === 'grace'
      ? t('planBanner.grace', { date: formatDay(entitlement?.graceUntil ?? null) })
      : t('planBanner.fellBack');
  return (
    <View
      backgroundColor={kind === 'grace' ? colors.yellow : colors.redSoft}
      paddingHorizontal={16}
      paddingVertical={8}
      testID={`plan-banner-${kind}`}
    >
      <Text fontFamily={typography.fontFamily} fontSize={fontSizes.sm} color={colors.black}>
        {text}
      </Text>
    </View>
  );
}
