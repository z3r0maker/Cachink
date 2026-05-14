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
import {
  Btn,
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
import { usePeriodLabels } from '../../hooks/use-period-labels';
import { defaultPeriodoState, usePeriodoRange } from '../../hooks/use-periodo-range';
import { EmptyAuditoria } from './empty-auditoria';
import { AuditoriaConteo } from './auditoria-conteo';
import { AuditoriaHistorial } from './auditoria-historial';

export interface AuditoriaScreenProps {
  readonly testID?: string;
}

type AuditoriaTab = 'conteo' | 'historial';

export function AuditoriaScreen(props: AuditoriaScreenProps): ReactElement {
  const { t } = useTranslation();
  const periodLabels = usePeriodLabels();
  const [tab, setTab] = useState<AuditoriaTab>('conteo');
  const [periodo, setPeriodo] = useState<PeriodoState>(defaultPeriodoState);
  const range = usePeriodoRange(periodo);

  const { data: auditorias, isLoading, error } = useAuditoriasInventario(range.from, range.to);
  const crear = useCrearAuditoria();

  const activeAudit = auditorias?.find((a) => a.estado === 'borrador') ?? null;

  const handleNew = async (): Promise<void> => {
    await crear.mutateAsync();
  };

  return (
    <ScrollView testID={props.testID ?? 'auditoria-screen'}>
      <View padding={16} gap={16}>
        <SectionTitle title={t('auditoria.title')} />

        <SegmentedToggle
          value={tab}
          onChange={(v) => setTab(v as AuditoriaTab)}
          options={[
            { key: 'conteo', label: t('auditoria.tabConteo') },
            { key: 'historial', label: t('auditoria.tabHistorial') },
          ]}
          testID="auditoria-tabs"
        />

        {isLoading && (
          <View gap={8}>
            <Skeleton.Row index={0} testIDPrefix="auditoria-skeleton" />
            <Skeleton.Row index={1} testIDPrefix="auditoria-skeleton" />
          </View>
        )}

        {error !== null && !isLoading && (
          <ErrorState
            title={t('common.error')}
            body={error.message}
            testID="auditoria-error"
          />
        )}

        {tab === 'conteo' && !isLoading && error === null && (
          <View gap={12}>
            {activeAudit !== null ? (
              <AuditoriaConteo
                auditoria={activeAudit}
                onFinalized={() => setTab('historial')}
              />
            ) : (
              <View gap={16}>
                <EmptyAuditoria />
                <Btn
                  onPress={handleNew}
                  disabled={crear.isPending}
                  fullWidth
                  testID="nueva-auditoria-btn"
                >
                  {t('auditoria.nuevaAuditoria')}
                </Btn>
              </View>
            )}
          </View>
        )}

        {tab === 'historial' && !isLoading && error === null && (
          <View gap={12}>
            <PeriodPicker value={periodo} onChange={setPeriodo} labels={periodLabels} />
            {auditorias !== undefined && auditorias.length === 0 && (
              <EmptyAuditoria />
            )}
            {auditorias !== undefined && auditorias.length > 0 && (
              <AuditoriaHistorial auditorias={auditorias} />
            )}
          </View>
        )}
      </View>
    </ScrollView>
  );
}
