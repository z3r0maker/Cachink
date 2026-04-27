/**
 * InformeMensualAction — Btn at the top of the Estados screen that
 * fetches the monthly informe and shares it as a PDF (P1C-M9-T02, T03,
 * Slice 3 C27).
 *
 * The hook `useInformeMensual` is disabled until the user taps the
 * Btn; the component wires `buildInformeMensualPdf` + `shareFile` just
 * like the Excel export flow.
 */

import { useCallback, useMemo, useState, type ReactElement } from 'react';
import { Text } from '@tamagui/core';
import { Btn, Card } from '../../components/index';
import { useInformeMensual } from '../../hooks/use-informe-mensual';
import { buildInformeMensualPdf } from '../../export/build-pdf';
import { shareFile } from '../../share/share-file';
import { useTranslation } from '../../i18n/index';
import { colors, typography } from '../../theme';

export interface InformeMensualActionProps {
  /** `YYYY-MM` prefix — the action infers the period from the picker. */
  readonly yearMonth: string;
  readonly businessName?: string;
  readonly testID?: string;
  /** Injection points for tests — keep the native renderer out of jsdom. */
  readonly buildPdf?: typeof buildInformeMensualPdf;
  readonly share?: typeof shareFile;
}

type ActionState = 'idle' | 'pending' | 'done' | 'error';

function useInformePress(
  props: InformeMensualActionProps,
  query: ReturnType<typeof useInformeMensual>,
  setState: (s: ActionState) => void,
  setFetchEnabled: (b: boolean) => void,
  filename: string,
  t: ReturnType<typeof useTranslation>['t'],
): () => Promise<void> {
  const builder = props.buildPdf ?? buildInformeMensualPdf;
  const sharer = props.share ?? shareFile;
  return useCallback(async () => {
    setState('pending');
    setFetchEnabled(true);
    try {
      const r = await query.refetch();
      if (!r.data) return setState('error');
      const blob = await builder(r.data, props.businessName ?? 'Cachink!');
      const result = await sharer({
        title: t('estados.informeMensualCta'),
        filename,
        blob,
      });
      setState(result.shared ? 'done' : 'error');
    } catch {
      setState('error');
    }
  }, [builder, filename, props.businessName, query, sharer, setFetchEnabled, setState, t]);
}

function statusLabel(state: ActionState, t: ReturnType<typeof useTranslation>['t']): string {
  switch (state) {
    case 'pending':
      return t('export.exportando');
    case 'done':
      return t('export.exportarListo');
    case 'error':
      return t('export.exportarError');
    default:
      return t('estados.informeMensualShare');
  }
}

interface ActionBodyProps {
  readonly state: ActionState;
  readonly onPress: () => void;
  readonly testID?: string;
  readonly t: ReturnType<typeof useTranslation>['t'];
}

function ActionBody(props: ActionBodyProps): ReactElement {
  return (
    <Card testID={props.testID ?? 'informe-mensual-card'} padding="md" fullWidth>
      <Text
        fontFamily={typography.fontFamily}
        fontWeight={typography.weights.medium}
        fontSize={13}
        color={colors.gray600}
        marginBottom={10}
        testID="informe-mensual-status"
      >
        {statusLabel(props.state, props.t)}
      </Text>
      <Btn
        variant="dark"
        onPress={props.onPress}
        disabled={props.state === 'pending'}
        fullWidth
        testID="informe-mensual-btn"
      >
        {props.t('estados.informeMensualCta')}
      </Btn>
    </Card>
  );
}

export function InformeMensualAction(props: InformeMensualActionProps): ReactElement {
  const { t } = useTranslation();
  const [state, setState] = useState<ActionState>('idle');
  const [fetchEnabled, setFetchEnabled] = useState(false);
  const query = useInformeMensual({
    yearMonth: props.yearMonth,
    enabled: fetchEnabled,
  });
  const filename = useMemo(() => {
    const stem = (props.businessName ?? 'cachink').toLowerCase().replaceAll(/\s+/g, '-');
    return `${stem}-informe-${props.yearMonth}.pdf`;
  }, [props.businessName, props.yearMonth]);

  const onPress = useInformePress(props, query, setState, setFetchEnabled, filename, t);

  return <ActionBody state={state} onPress={onPress} testID={props.testID} t={t} />;
}
