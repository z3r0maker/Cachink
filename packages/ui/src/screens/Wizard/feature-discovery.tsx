/**
 * FeatureDiscovery — informational carousel introducing feature flags.
 *
 * Shown once at the end of the first-run wizard. Each card describes
 * a feature the Director can enable later in Funciones del negocio.
 *
 * KEY CONSTRAINTS:
 * - Informational only — no toggles on this screen
 * - First-run only — not shown on wizard re-run
 * - Skippable — "Comenzar" button always visible
 *
 * Phase 12 of the Feature Flags plan.
 */

import type { ReactElement } from 'react';
import { ScrollView } from 'react-native';
import { Text, View } from '@tamagui/core';
import { Btn, Card, Icon, SafeAreaSpacer } from '../../components/index';
import { useTranslation } from '../../i18n/index';
import { colors, typography } from '../../theme';
import type { IconName } from '../../components/Icon/index';

type T = ReturnType<typeof useTranslation>['t'];

interface FeatureCard {
  readonly icon: IconName;
  readonly nameKey: string;
  readonly descKey: string;
  readonly active: boolean;
}

const CARDS: readonly FeatureCard[] = [
  { icon: 'package', nameKey: 'discovery.stock', descKey: 'discovery.stockDesc', active: true },
  {
    icon: 'refresh-cw',
    nameKey: 'discovery.conversion',
    descKey: 'discovery.conversionDesc',
    active: false,
  },
  {
    icon: 'clipboard-list',
    nameKey: 'discovery.auditoria',
    descKey: 'discovery.auditoriaDesc',
    active: false,
  },
  {
    icon: 'trending-down',
    nameKey: 'discovery.merma',
    descKey: 'discovery.mermaDesc',
    active: false,
  },
  {
    icon: 'credit-card',
    nameKey: 'discovery.ventasCredito',
    descKey: 'discovery.ventasCreditoDesc',
    active: false,
  },
];

export interface FeatureDiscoveryProps {
  readonly stockActive: boolean;
  readonly onContinue: () => void;
  readonly testID?: string;
}

function DiscoveryActiveTag({ t }: { t: T }): ReactElement {
  return (
    <View
      backgroundColor={colors.green}
      borderRadius={12}
      paddingHorizontal={8}
      paddingVertical={2}
    >
      <Text fontSize={11} color={colors.white}>
        {t('discovery.active')}
      </Text>
    </View>
  );
}

function DiscoveryCardContent({
  card,
  stockActive,
}: {
  card: FeatureCard;
  stockActive: boolean;
}): ReactElement {
  const { t } = useTranslation();
  const isActive = card.active && stockActive;
  return (
    <View flexDirection="row" alignItems="center" gap={12}>
      <Icon name={card.icon} size={32} color={colors.black} />
      <View flex={1}>
        <Text
          fontFamily={typography.fontFamily}
          fontWeight={typography.weights.bold}
          fontSize={16}
          color={colors.black}
        >
          {t(card.nameKey as never)}
        </Text>
        <Text fontFamily={typography.fontFamily} fontSize={13} color={colors.gray600} marginTop={2}>
          {t(card.descKey as never)}
        </Text>
      </View>
      {isActive && <DiscoveryActiveTag t={t} />}
    </View>
  );
}

function DiscoveryCard(props: {
  readonly card: FeatureCard;
  readonly stockActive: boolean;
}): ReactElement {
  return (
    <Card variant="white" padding="md" fullWidth>
      <DiscoveryCardContent card={props.card} stockActive={props.stockActive} />
    </Card>
  );
}

function DiscoveryHeader({ t }: { t: T }): ReactElement {
  return (
    <>
      <Text
        fontFamily={typography.fontFamily}
        fontWeight={typography.weights.black}
        fontSize={28}
        color={colors.black}
        textAlign="center"
      >
        {t('discovery.title')}
      </Text>
      <Text
        fontFamily={typography.fontFamily}
        fontSize={14}
        color={colors.gray600}
        textAlign="center"
        maxWidth={320}
      >
        {t('discovery.subtitle')}
      </Text>
    </>
  );
}

export function FeatureDiscovery(props: FeatureDiscoveryProps): ReactElement {
  const { t } = useTranslation();
  return (
    <ScrollView
      testID={props.testID ?? 'feature-discovery'}
      contentContainerStyle={{ padding: 24, gap: 16, alignItems: 'center' }}
    >
      <SafeAreaSpacer />
      <DiscoveryHeader t={t} />
      <View width="100%" maxWidth={400} gap={10}>
        {CARDS.map((card) => (
          <DiscoveryCard key={card.nameKey} card={card} stockActive={props.stockActive} />
        ))}
      </View>
      <View marginTop={16} width="100%" maxWidth={320}>
        <Btn variant="primary" onPress={props.onContinue} fullWidth testID="discovery-continue">
          {t('discovery.continue')}
        </Btn>
      </View>
      <Text
        fontFamily={typography.fontFamily}
        fontSize={12}
        color={colors.gray400}
        textAlign="center"
      >
        {t('discovery.hint')}
      </Text>
    </ScrollView>
  );
}
