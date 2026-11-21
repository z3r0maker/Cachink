/**
 * The report sheet (M-23, ADR-162; RpHoja, RpTableta): «¿Qué pasó?» with four
 * cards to tap, then what happened to the report. A bottom sheet on the phone
 * and a centred dialog, with the four cards in one row, on the tablet.
 *
 * Presentation only: `onEnviar` sends (or keeps) the report and answers what
 * to say. It always sends, whatever the automatic-reports switch says, and it
 * never attaches a screenshot.
 */
import { useEffect, useState, type ReactElement } from 'react';
import type { ReportResult } from '@xangarro/application';
import type { BugReportCategory } from '@xangarro/domain';
import { BottomSheet, Dialog } from '../components/index';
import { useTranslation } from '../i18n/index';
import { FormularioFoot, ReportarFormulario, type FormularioState } from './reportar-formulario';
import { ReportarResultado, ResultadoFoot, tituloDe } from './reportar-resultado';

export interface ReporteEnviado {
  readonly category: BugReportCategory;
  readonly description: string;
}

export interface ReportarHojaProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly onEnviar: (report: ReporteEnviado) => Promise<ReportResult>;
  /** Who is signed in, for «Gracias, Ana». */
  readonly nombre: string | null;
  /** Reports waiting on the device, said with «Guardado. Se envía solo.». */
  readonly porEnviar: number;
  /** The tablet's centred dialog instead of the phone's bottom sheet. */
  readonly ancho?: boolean;
  /** Starts on a result (Storybook, tests). */
  readonly inicial?: ReportResult;
}

const VACIO: FormularioState = { category: 'could_not_charge', description: '' };
const DIALOG_WIDTH = 760;

function useHoja(props: ReportarHojaProps) {
  const [form, setForm] = useState<FormularioState>(VACIO);
  const [enviando, setEnviando] = useState(false);
  const [result, setResult] = useState<ReportResult | null>(props.inicial ?? null);
  const { open, inicial } = props;
  // A sheet opened again starts over: the last report's answer is not this one's.
  useEffect(() => {
    if (!open) return;
    setForm(VACIO);
    setResult(inicial ?? null);
  }, [open, inicial]);
  const enviar = async (): Promise<void> => {
    setEnviando(true);
    try {
      setResult(await props.onEnviar(form));
    } finally {
      setEnviando(false);
    }
  };
  return { form, setForm, enviando, result, enviar, reintentar: () => setResult(null) };
}

export function ReportarHoja(props: ReportarHojaProps): ReactElement {
  const { t } = useTranslation();
  const h = useHoja(props);
  const { result } = h;
  const title = result === null ? t('reportar.titulo') : tituloDe(result, props.nombre, t);
  const body =
    result === null ? (
      <ReportarFormulario value={h.form} onChange={h.setForm} enFila={props.ancho} />
    ) : (
      <ReportarResultado result={result} nombre={props.nombre} porEnviar={props.porEnviar} />
    );
  const footer =
    result === null ? (
      <FormularioFoot
        enviando={h.enviando}
        onEnviar={() => void h.enviar()}
        onCancelar={props.onClose}
      />
    ) : (
      <ResultadoFoot result={result} onListo={props.onClose} onReintentar={h.reintentar} />
    );
  const frame = {
    open: props.open,
    onClose: props.onClose,
    title,
    footer,
    testID: 'reportar-hoja',
  };
  return props.ancho ? (
    <Dialog {...frame} width={DIALOG_WIDTH}>
      {body}
    </Dialog>
  ) : (
    <BottomSheet {...frame}>{body}</BottomSheet>
  );
}
