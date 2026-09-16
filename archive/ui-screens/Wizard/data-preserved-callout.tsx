/**
 * DataPreservedCallout — green Callout shown on every wizard screen that
 * would change AppMode on a re-run (ADR-039 safety rail).
 *
 * Returns `null` when the device has no data yet (`hasAny === false`)
 * so the first-run wizard doesn't show empty stats. The body copy
 * differs for cloud users — their data already lives outside the
 * device, so the message says so.
 */

import type { ReactElement } from 'react';
import { Callout } from '../../components/index';
import { useTranslation } from '../../i18n/index';
import { useMode } from '../../app-config/index';
import { useDataCounts } from '../../hooks/use-data-counts';

export interface DataPreservedCalloutProps {
  readonly testID?: string;
}

export function DataPreservedCallout(props: DataPreservedCalloutProps): ReactElement | null {
  const { t } = useTranslation();
  const mode = useMode();
  const { counts, loading } = useDataCounts();
  if (loading) return null;
  if (!counts.hasAny) return null;
  const body =
    mode === 'cloud'
      ? t('wizard.callout.dataPreservedCloudBody')
      : t('wizard.callout.dataPreservedBody', {
          ventas: String(counts.ventas),
          productos: String(counts.productos),
          clientes: String(counts.clientes),
        });
  return (
    <Callout
      testID={props.testID ?? 'wizard-data-preserved-callout'}
      tone="success"
      title={t('wizard.callout.dataPreservedTitle')}
      body={body}
    />
  );
}
