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

export function NotificacionesScreen(props: NotificacionesScreenProps): ReactElement {
  const { onNavigate, testID } = props;
  const { t } = useTranslation();
  const [topTab, setTopTab] = useState<TopTab>('bandeja');
  const [filter, setFilter] = useState<AlertFilter>('all');

  // Inbox hooks
  const alertsQ = useDirectorAlerts(filter);
  const markRead = useMarkAlertRead();
  const markAllRead = useMarkAllAlertsRead();
  const alerts = alertsQ.data ?? [];

  // Config hooks
  const prefsQ = useNotificationPrefs();
  const updatePrefs = useUpdateNotificationPrefs();
  const flags = useFeatureFlags();
  const prefs = prefsQ.data;

  const topTabOptions = [
    { key: 'bandeja' as const, label: t('notificaciones.tabInbox') },
    { key: 'configurar' as const, label: t('notificaciones.tabConfig') },
  ] as const;

  const filterOptions = [
    { key: 'all' as const, label: t('notificaciones.filterAll') },
    { key: 'unread' as const, label: t('notificaciones.filterUnread') },
  ] as const;

  function handleToggleSource(source: string, newValue: boolean): void {
    const next = { ...prefs, [source]: newValue };
    updatePrefs.mutate(next);
  }

  return (
    <ScrollView
      testID={testID ?? 'notificaciones-screen'}
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
        {t('notificaciones.title')}
      </Text>

      {/* Top-level tab switcher */}
      <SegmentedToggle
        options={topTabOptions}
        value={topTab}
        onChange={(key) => setTopTab(key)}
      />

      {/* ── Bandeja tab ── */}
      {topTab === 'bandeja' && (
        <>
          <View flexDirection="row" alignItems="center" justifyContent="space-between" gap={12}>
            <SegmentedToggle
              options={filterOptions}
              value={filter}
              onChange={(key) => setFilter(key)}
            />
            <Btn
              size="sm"
              variant="ghost"
              onPress={() => markAllRead.mutate()}
              testID="mark-all-read-btn"
            >
              {t('notificaciones.markAllRead')}
            </Btn>
          </View>

          {alerts.length === 0 && (
            <EmptyState
              icon="bell"
              title={t('notificaciones.emptyTitle')}
              description={t('notificaciones.emptyHint')}
              testID="notificaciones-empty"
            />
          )}

          <View gap={10}>
            {alerts.map((alert) => (
              <AlertCard
                key={alert.id}
                alert={alert}
                onPress={() => {
                  if (!alert.read) markRead.mutate(alert.id);
                }}
                onAction={() => {
                  if (!alert.read) markRead.mutate(alert.id);
                  if (alert.actionRoute) onNavigate?.(alert.actionRoute);
                }}
              />
            ))}
          </View>
        </>
      )}

      {/* ── Configurar tab ── */}
      {topTab === 'configurar' && (
        <NotificacionesConfigTab
          prefs={prefs}
          flags={flags}
          onToggle={handleToggleSource}
        />
      )}
    </ScrollView>
  );
}
