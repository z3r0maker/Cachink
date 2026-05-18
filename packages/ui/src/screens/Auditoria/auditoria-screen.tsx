/**
 * AuditoriaScreen — sub-tabs "Conteo" / "Historial" for inventory audits.
 *
 * - Tab "Conteo": active audit or "start new" button
 * - Tab "Historial": past audits list
 *
 * Part C4 of the feature-flagged screens plan.
 */

import { useState, type ReactElement } from 'react';
import { ScrollView } from 'react-native';
import { View } from '@tamagui/core';
import type { AuditoriaInventario } from '@cachink/domain';
import {
  Btn,
  EmptyState,
  ErrorState,
  PeriodPicker,
  SectionTitle,
  SegmentedToggle,
  Skeleton,
} from '../../components/index';
import type { PeriodoState } from '../../components/PeriodPicker/period-picker';
import { useTranslation } from '../../i18n/index';
import { useAuditoriasInventario } from '../../hooks/use-auditorias-inventario';
import { useCrearAuditoria } from '../../hooks/use-crear-auditoria';
import { useProductos } from '../../hooks/use-productos';
import { usePeriodLabels } from '../../hooks/use-period-labels';
import { defaultPeriodoState, usePeriodoRange } from '../../hooks/use-periodo-range';
import { EmptyAuditoria } from './empty-auditoria';
import { AuditoriaConteo } from './auditoria-conteo';
import { AuditoriaHistorial } from './auditoria-historial';

export interface AuditoriaScreenProps {
  readonly testID?: string;
}

type AuditoriaTab = 'conteo' | 'historial';

function ConteoTabContent({ activeAudit, hasStockProducts, crear, setTab, t }: {
  activeAudit: AuditoriaInventario | null;
  hasStockProducts: boolean;
  crear: ReturnType<typeof useCrearAuditoria>;
  setTab: (t: AuditoriaTab) => void;
  t: ReturnType<typeof useTranslation>['t'];
}): ReactElement {
  if (activeAudit !== null) {
    return <AuditoriaConteo auditoria={activeAudit} onFinalized={() => setTab('historial')} onCancelled={() => {}} />;
  }
  if (!hasStockProducts) {
    return (
      <EmptyState icon="clipboard-list" title={t('auditoria.noProducts')}
        description={t('auditoria.noProductsHint')} testID="auditoria-no-products" />
    );
  }
  return (
    <View gap={16}>
      <EmptyAuditoria />
      <Btn onPress={() => crear.mutateAsync()} disabled={crear.isPending} fullWidth testID="nueva-auditoria-btn">
        {t('auditoria.nuevaAuditoria')}
      </Btn>
    </View>
  );
}

function HistorialTabContent({ auditorias, periodo, setPeriodo, periodLabels }: {
  auditorias: readonly AuditoriaInventario[] | undefined;
  periodo: PeriodoState;
  setPeriodo: (p: PeriodoState) => void;
  periodLabels: ReturnType<typeof usePeriodLabels>;
}): ReactElement {
  return (
    <View gap={12}>
      <PeriodPicker value={periodo} onChange={setPeriodo} labels={periodLabels} />
      {auditorias !== undefined && auditorias.length === 0 && <EmptyAuditoria />}
      {auditorias !== undefined && auditorias.length > 0 && <AuditoriaHistorial auditorias={auditorias} />}
    </View>
  );
}

function AuditoriaBody({ tab, setTab, isLoading, error, auditorias, activeAudit, hasStockProducts, crear, periodo, setPeriodo, periodLabels, t }: {
  tab: AuditoriaTab; setTab: (t: AuditoriaTab) => void;
  isLoading: boolean; error: Error | null;
  auditorias: readonly AuditoriaInventario[] | undefined;
  activeAudit: AuditoriaInventario | null;
  hasStockProducts: boolean; crear: ReturnType<typeof useCrearAuditoria>;
  periodo: PeriodoState; setPeriodo: (p: PeriodoState) => void;
  periodLabels: ReturnType<typeof usePeriodLabels>;
  t: ReturnType<typeof useTranslation>['t'];
}): ReactElement {
  if (isLoading) {
    return (
      <View gap={8}>
        <Skeleton.Row index={0} testIDPrefix="auditoria-skeleton" />
        <Skeleton.Row index={1} testIDPrefix="auditoria-skeleton" />
      </View>
    );
  }
  if (error !== null) return <ErrorState title={t('common.error')} body={error.message} testID="auditoria-error" />;
  if (tab === 'conteo') {
    return (
      <View gap={12}>
        <ConteoTabContent activeAudit={activeAudit} hasStockProducts={hasStockProducts} crear={crear} setTab={setTab} t={t} />
      </View>
    );
  }
  return <HistorialTabContent auditorias={auditorias} periodo={periodo} setPeriodo={setPeriodo} periodLabels={periodLabels} />;
}

export function AuditoriaScreen(props: AuditoriaScreenProps): ReactElement {
  const { t } = useTranslation();
  const periodLabels = usePeriodLabels();
  const [tab, setTab] = useState<AuditoriaTab>('conteo');
  const [periodo, setPeriodo] = useState<PeriodoState>(defaultPeriodoState);
  const range = usePeriodoRange(periodo);
  const { data: auditorias, isLoading, error } = useAuditoriasInventario(range.from, range.to);
  const crear = useCrearAuditoria();
  const productosQ = useProductos();
  const hasStockProducts = (productosQ.data ?? []).filter((p) => p.seguirStock !== false).length > 0;
  const activeAudit = auditorias?.find((a) => a.estado === 'borrador') ?? null;

  return (
    <ScrollView testID={props.testID ?? 'auditoria-screen'}>
      <View padding={16} gap={16}>
        <SectionTitle title={t('auditoria.title')} />
        <SegmentedToggle value={tab} onChange={(v) => setTab(v as AuditoriaTab)}
          options={[{ key: 'conteo', label: t('auditoria.tabConteo') }, { key: 'historial', label: t('auditoria.tabHistorial') }]}
          testID="auditoria-tabs" />
        <AuditoriaBody tab={tab} setTab={setTab} isLoading={isLoading} error={error} auditorias={auditorias}
          activeAudit={activeAudit} hasStockProducts={hasStockProducts} crear={crear}
          periodo={periodo} setPeriodo={setPeriodo} periodLabels={periodLabels} t={t} />
      </View>
    </ScrollView>
  );
}
