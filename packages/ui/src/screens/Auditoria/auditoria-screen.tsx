/**
 * AuditoriaScreen — sub-tabs "Conteo" / "Historial" for inventory audits.
 *
 * - Tab "Conteo": active audit or "start new" button
 * - Tab "Historial": past audits list
 *
 * Part C4 of the feature-flagged screens plan.
 */

import { useState, type ReactElement } from 'react';
import { ScrollView, View as RNView } from 'react-native';
import { View } from '@tamagui/core';
import type { PeriodoState } from '../../components/PeriodPicker/period-picker';
import { SectionTitle, SegmentedToggle } from '../../components/index';
import { useTranslation } from '../../i18n/index';
import { useAuditoriasInventario } from '../../hooks/use-auditorias-inventario';
import { useCrearAuditoria } from '../../hooks/use-crear-auditoria';
import { useProductos } from '../../hooks/use-productos';
import { usePeriodLabels } from '../../hooks/use-period-labels';
import { defaultPeriodoState, usePeriodoRange } from '../../hooks/use-periodo-range';
import { AuditoriaBody, type AuditoriaTab } from './auditoria-body';

export interface AuditoriaScreenProps {
  readonly testID?: string;
}

function useAuditoriaScreenState() {
  const [tab, setTab] = useState<AuditoriaTab>('conteo');
  const [periodo, setPeriodo] = useState<PeriodoState>(defaultPeriodoState);
  const range = usePeriodoRange(periodo);
  const q = useAuditoriasInventario(range.from, range.to);
  const crear = useCrearAuditoria();
  const productosQ = useProductos();
  const hasStockProducts = (productosQ.data ?? []).some((p) => p.seguirStock !== false);
  const activeAudit = q.data?.find((a) => a.estado === 'borrador') ?? null;
  return {
    tab,
    setTab,
    periodo,
    setPeriodo,
    auditorias: q.data,
    isLoading: q.isLoading,
    error: q.error,
    crear,
    hasStockProducts,
    activeAudit,
  };
}

export function AuditoriaScreen(props: AuditoriaScreenProps): ReactElement {
  const { t } = useTranslation();
  const periodLabels = usePeriodLabels();
  const s = useAuditoriaScreenState();
  const tabOptions = [
    { key: 'conteo' as const, label: t('auditoria.tabConteo') },
    { key: 'historial' as const, label: t('auditoria.tabHistorial') },
  ];

  return (
    <RNView testID={props.testID ?? 'auditoria-screen'} style={{ flex: 1 }}>
      <ScrollView>
        <View padding={16} gap={16}>
          <SectionTitle title={t('auditoria.title')} />
          <SegmentedToggle
            value={s.tab}
            onChange={(v) => s.setTab(v as AuditoriaTab)}
            options={tabOptions}
            testID="auditoria-tabs"
          />
          <AuditoriaBody
            tab={s.tab}
            setTab={s.setTab}
            isLoading={s.isLoading}
            error={s.error}
            auditorias={s.auditorias}
            activeAudit={s.activeAudit}
            hasStockProducts={s.hasStockProducts}
            crear={s.crear}
            periodo={s.periodo}
            setPeriodo={s.setPeriodo}
            periodLabels={periodLabels}
            t={t}
          />
        </View>
      </ScrollView>
    </RNView>
  );
}
