/**
 * ExportarDatosAction — Settings row that triggers the full Excel
 * export flow (P1C-M9-T01, Slice 3 C26).
 *
 * Composes:
 *   - `useExportarDatos` (walks every repository)
 *   - `buildExcelWorkbook` (serialises to .xlsx bytes)
 *   - `shareFile` (native share on mobile, `<a download>` on Tauri)
 *
 * Lazy: the query is disabled until the user taps the Btn. The Btn
 * disables itself while in-flight.
 */

import { useCallback, useMemo, useState, type ReactElement } from 'react';
import { Text } from '@tamagui/core';
import { Btn, Card, SectionTitle } from '../../components/index';
import { useExportarDatos } from '../../hooks/use-exportar-datos';
import { buildExcelWorkbook } from '../../export/build-excel';
import { shareFile } from '../../share/share-file';
import { useTranslation } from '../../i18n/index';
import { colors, typography } from '../../theme';

export interface ExportarDatosActionProps {
  readonly businessName?: string;
  readonly testID?: string;
  /**
   * Injected for tests. Production wiring uses the real `shareFile` /
   * `buildExcelWorkbook`; tests replace both to keep the build-graph
   * out of jsdom.
   */
  readonly buildExcel?: typeof buildExcelWorkbook;
  readonly share?: typeof shareFile;
}

type ActionState = 'idle' | 'pending' | 'done' | 'error';

function statusLabel(state: ActionState, t: ReturnType<typeof useTranslation>['t']): string {
  switch (state) {
    case 'pending':
      return t('export.exportando');
    case 'done':
      return t('export.exportarListo');
    case 'error':
      return t('export.exportarError');
    default:
      return t('export.exportarHint');
  }
}

/** Hook-extracted onPress logic so the component stays under 40 lines. */
function useExportPress(
  props: ExportarDatosActionProps,
  query: ReturnType<typeof useExportarDatos>,
  setState: (s: ActionState) => void,
  setFetchEnabled: (b: boolean) => void,
  filename: string,
  t: ReturnType<typeof useTranslation>['t'],
): () => Promise<void> {
  const builder = props.buildExcel ?? buildExcelWorkbook;
  const sharer = props.share ?? shareFile;
  return useCallback(async () => {
    setState('pending');
    setFetchEnabled(true);
    try {
      const ds = await query.refetch();
      if (!ds.data) return setState('error');
      const buffer = await builder(ds.data);
      const result = await sharer({
        title: t('export.title'),
        filename,
        blob: new Blob([buffer], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        }),
      });
      setState(result.shared ? 'done' : 'error');
    } catch {
      setState('error');
    }
  }, [builder, filename, query, sharer, setFetchEnabled, setState, t]);
}

export function ExportarDatosAction(props: ExportarDatosActionProps): ReactElement {
  const { t } = useTranslation();
  const [state, setState] = useState<ActionState>('idle');
  const [fetchEnabled, setFetchEnabled] = useState(false);
  const query = useExportarDatos({ enabled: fetchEnabled });

  const filename = useMemo(() => {
    const stamp = new Date().toISOString().slice(0, 10);
    const stem = (props.businessName ?? 'cachink').toLowerCase().replaceAll(/\s+/g, '-');
    return `${stem}-export-${stamp}.xlsx`;
  }, [props.businessName]);

  const onPress = useExportPress(props, query, setState, setFetchEnabled, filename, t);

  return (
    <Card testID={props.testID ?? 'export-datos-card'} padding="md" fullWidth>
      <SectionTitle title={t('export.title')} />
      <Text
        fontFamily={typography.fontFamily}
        fontWeight={typography.weights.medium}
        fontSize={13}
        color={colors.gray600}
        marginBottom={10}
        testID="export-datos-status"
      >
        {statusLabel(state, t)}
      </Text>
      <Btn
        variant="primary"
        onPress={onPress}
        disabled={state === 'pending'}
        fullWidth
        testID="export-datos-btn"
      >
        {t('export.exportarCta')}
      </Btn>
    </Card>
  );
}
