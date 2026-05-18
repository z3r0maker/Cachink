/**
 * NotificacionesScreen — Director notification inbox + preferences.
 *
 * Two tabs:
 *   - **Bandeja** — scrollable alert list with Todas/Sin leer filter
 *   - **Configurar** — per-source toggle cards grouped by category
 *
 * Phase 11 — Director Notification Inbox.
 */

import { useState, type ReactElement } from 'react';
import { ScrollView } from 'react-native';
import { Text, View } from '@tamagui/core';
import { Btn, EmptyState, SegmentedToggle } from '../../components/index';
import { useTranslation } from '../../i18n/index';
import { colors, typography } from '../../theme';
import { useDirectorAlerts, type AlertFilter } from '../../hooks/use-director-alerts';
import { useMarkAlertRead, useMarkAllAlertsRead } from '../../hooks/use-mark-alert-read';
import {
  useNotificationPrefs,
  useUpdateNotificationPrefs,
} from '../../hooks/use-notification-prefs';
import { useFeatureFlags } from '../../hooks/use-feature-flags';
import { AlertCard } from './alert-card';
import { NotificacionesConfigTab } from './notificaciones-config-tab';

export interface NotificacionesScreenProps {
  readonly onNavigate?: (path: string) => void;
  readonly testID?: string;
}

type TopTab = 'bandeja' | 'configurar';

function useNotificacionesState(onNavigate?: (path: string) => void) {
  const { t } = useTranslation();
  const [topTab, setTopTab] = useState<TopTab>('bandeja');
  const [filter, setFilter] = useState<AlertFilter>('all');
  const alertsQ = useDirectorAlerts(filter);
  const markRead = useMarkAlertRead();
  const markAllRead = useMarkAllAlertsRead();
  const prefsQ = useNotificationPrefs();
  const updatePrefs = useUpdateNotificationPrefs();
  const flags = useFeatureFlags();

  const handleToggleSource = (source: string, newValue: boolean): void => {
    updatePrefs.mutate({ ...prefsQ.data, [source]: newValue });
  };

  return {
    t, topTab, setTopTab, filter, setFilter,
    alerts: alertsQ.data ?? [], markRead, markAllRead,
    prefs: prefsQ.data, flags, handleToggleSource, onNavigate,
  };
}

function BandejaTab({ ctx }: { ctx: ReturnType<typeof useNotificacionesState> }): ReactElement {
  const filterOptions = [
    { key: 'all' as const, label: ctx.t('notificaciones.filterAll') },
    { key: 'unread' as const, label: ctx.t('notificaciones.filterUnread') },
  ] as const;
  return (
    <>
      <View flexDirection="row" alignItems="center" justifyContent="space-between" gap={12}>
        <SegmentedToggle options={filterOptions} value={ctx.filter} onChange={(key) => ctx.setFilter(key)} />
        <Btn size="sm" variant="ghost" onPress={() => ctx.markAllRead.mutate()} testID="mark-all-read-btn">
          {ctx.t('notificaciones.markAllRead')}
        </Btn>
      </View>
      {ctx.alerts.length === 0 && (
        <EmptyState
          icon="bell"
          title={ctx.t('notificaciones.emptyTitle')}
          description={ctx.t('notificaciones.emptyHint')}
          testID="notificaciones-empty"
        />
      )}
      <View gap={10}>
        {ctx.alerts.map((alert) => (
          <AlertCard
            key={alert.id}
            alert={alert}
            onPress={() => { if (!alert.read) ctx.markRead.mutate(alert.id); }}
            onAction={() => {
              if (!alert.read) ctx.markRead.mutate(alert.id);
              if (alert.actionRoute) ctx.onNavigate?.(alert.actionRoute);
            }}
          />
        ))}
      </View>
    </>
  );
}

export function NotificacionesScreen(props: NotificacionesScreenProps): ReactElement {
  const ctx = useNotificacionesState(props.onNavigate);
  const topTabOptions = [
    { key: 'bandeja' as const, label: ctx.t('notificaciones.tabInbox') },
    { key: 'configurar' as const, label: ctx.t('notificaciones.tabConfig') },
  ] as const;

  return (
    <ScrollView
      testID={props.testID ?? 'notificaciones-screen'}
      style={{ flex: 1, backgroundColor: colors.offwhite }}
      contentContainerStyle={{ padding: 20, gap: 16, paddingBottom: 40 }}
    >
      <Text
        fontFamily={typography.fontFamily}
        fontWeight={typography.weights.black}
        fontSize={28}
        color={colors.black}
        letterSpacing={typography.letterSpacing.tighter}
      >
        {ctx.t('notificaciones.title')}
      </Text>
      <SegmentedToggle options={topTabOptions} value={ctx.topTab} onChange={(key) => ctx.setTopTab(key)} />
      {ctx.topTab === 'bandeja' && <BandejaTab ctx={ctx} />}
      {ctx.topTab === 'configurar' && (
        <NotificacionesConfigTab prefs={ctx.prefs} flags={ctx.flags} onToggle={ctx.handleToggleSource} />
      )}
    </ScrollView>
  );
}
