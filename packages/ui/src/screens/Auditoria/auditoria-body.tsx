/** AuditoriaBody — loading / error / tab routing for AuditoriaScreen. */

import type { ReactElement } from 'react';
import { View } from '@tamagui/core';
import type { AuditoriaInventario } from '@cachink/domain';
import { Btn, EmptyState, ErrorState, PeriodPicker, Skeleton } from '../../components/index';
import type { PeriodoState } from '../../components/PeriodPicker/period-picker';
import type { useTranslation } from '../../i18n/index';
import type { useCrearAuditoria } from '../../hooks/use-crear-auditoria';
import type { usePeriodLabels } from '../../hooks/use-period-labels';
import { EmptyAuditoria } from './empty-auditoria';
import { AuditoriaConteo } from './auditoria-conteo';
import { AuditoriaHistorial } from './auditoria-historial';

export type AuditoriaTab = 'conteo' | 'historial';
type T = ReturnType<typeof useTranslation>['t'];

export interface AuditoriaBodyProps {
  readonly tab: AuditoriaTab;
  readonly setTab: (t: AuditoriaTab) => void;
  readonly isLoading: boolean;
  readonly error: Error | null;
  readonly auditorias: readonly AuditoriaInventario[] | undefined;
  readonly activeAudit: AuditoriaInventario | null;
  readonly hasStockProducts: boolean;
  readonly crear: ReturnType<typeof useCrearAuditoria>;
  readonly periodo: PeriodoState;
  readonly setPeriodo: (p: PeriodoState) => void;
  readonly periodLabels: ReturnType<typeof usePeriodLabels>;
  readonly t: T;
}

function ConteoTabContent(
  p: Pick<AuditoriaBodyProps, 'activeAudit' | 'hasStockProducts' | 'crear' | 'setTab' | 't'>,
): ReactElement {
  if (p.activeAudit !== null) {
    return (
      <AuditoriaConteo
        auditoria={p.activeAudit}
        onFinalized={() => p.setTab('historial')}
        onCancelled={() => {}}
      />
    );
  }
  if (!p.hasStockProducts) {
    return (
      <EmptyState
        icon="clipboard-list"
        title={p.t('auditoria.noProducts')}
        description={p.t('auditoria.noProductsHint')}
        testID="auditoria-no-products"
      />
    );
  }
  return (
    <View gap={16}>
      <EmptyAuditoria />
      <Btn
        onPress={() => p.crear.mutateAsync()}
        disabled={p.crear.isPending}
        fullWidth
        testID="nueva-auditoria-btn"
      >
        {p.t('auditoria.nuevaAuditoria')}
      </Btn>
    </View>
  );
}

function HistorialTabContent(
  p: Pick<AuditoriaBodyProps, 'auditorias' | 'periodo' | 'setPeriodo' | 'periodLabels'>,
): ReactElement {
  return (
    <View gap={12}>
      <PeriodPicker value={p.periodo} onChange={p.setPeriodo} labels={p.periodLabels} />
      {p.auditorias !== undefined && p.auditorias.length === 0 && <EmptyAuditoria />}
      {p.auditorias !== undefined && p.auditorias.length > 0 && (
        <AuditoriaHistorial auditorias={p.auditorias} />
      )}
    </View>
  );
}

function LoadingSkeleton(): ReactElement {
  return (
    <View gap={8}>
      <Skeleton.Row index={0} testIDPrefix="auditoria-skeleton" />
      <Skeleton.Row index={1} testIDPrefix="auditoria-skeleton" />
    </View>
  );
}

function TabContent(p: AuditoriaBodyProps): ReactElement {
  if (p.tab === 'conteo') {
    return (
      <View gap={12}>
        <ConteoTabContent
          activeAudit={p.activeAudit}
          hasStockProducts={p.hasStockProducts}
          crear={p.crear}
          setTab={p.setTab}
          t={p.t}
        />
      </View>
    );
  }
  return (
    <HistorialTabContent
      auditorias={p.auditorias}
      periodo={p.periodo}
      setPeriodo={p.setPeriodo}
      periodLabels={p.periodLabels}
    />
  );
}

export function AuditoriaBody(p: AuditoriaBodyProps): ReactElement {
  if (p.isLoading) return <LoadingSkeleton />;
  if (p.error !== null)
    return (
      <ErrorState title={p.t('common.error')} body={p.error.message} testID="auditoria-error" />
    );
  return <TabContent {...p} />;
}
