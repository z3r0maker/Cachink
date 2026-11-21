/**
 * PorEnviarScreen: «Registros por enviar» (Track M, M-09; board RvEnvio).
 * The local queue's face: one line says how many wait and that they send
 * themselves; «La cola» lists them in order; «El servidor no aceptó» shows
 * what the server refused, each with its sentence; and one footer button in
 * the thumb zone flushes («Reintentar ahora») or requeues the refused
 * («Reintentar»). Presentational: the route hands it `usePorEnviar()`.
 */
import type { ReactElement } from 'react';
import { ScrollView } from 'react-native';
import { View } from '@tamagui/core';
import {
  intro,
  pieCola,
  type Fase,
  type FaseCola,
  type RechazoVisto,
  type RegistroEnCola,
} from '@xangarro/caja/pendientes';
import { Btn } from '../../components/Btn/index';
import { MText } from '../../components/Mostrador/index';
import { borderColors, borderWidths, colors, radii } from '../../theme';
import { ColaPanel } from './cola-panel';
import { NadaSePierde, TodoEnviado } from './por-enviar-don';
import { EstadosCaja } from './estados';
import { RechazadosPanel } from './rechazados-panel';

export interface PorEnviarScreenProps {
  readonly state: 'happy' | 'cargando' | 'sin-internet' | 'error';
  readonly fase: FaseCola;
  readonly cola: readonly RegistroEnCola[];
  readonly rechazados: readonly RechazoVisto[];
  /** "HH:MM" of the last run that reached the server. */
  readonly ultima?: string | null;
  /** The manual flush: what the pill's «Actualizar» runs. */
  readonly onReintentar: () => void;
  /** Requeues refused rows, then flushes. */
  readonly onReintentarRechazado: (xs: readonly RechazoVisto[]) => void;
  readonly onIrACierre: () => void;
  readonly onRetry: () => void;
  readonly testID?: string;
}

const SIN_INTERNET = 'sin-internet' as const;

/** The phase the line and the footer speak for: offline wins. */
const faseVista = (p: PorEnviarScreenProps): FaseCola =>
  p.state === SIN_INTERNET ? SIN_INTERNET : p.fase;

/** RvEnvio's line: how many wait, and that they send themselves. */
function Aviso(p: { readonly texto: string; readonly enviando: boolean }): ReactElement {
  return (
    <View
      testID="por-enviar-aviso"
      role="status"
      padding={12}
      borderRadius={radii[3]}
      borderWidth={borderWidths.quiet}
      borderColor={p.enviando ? colors.blueText : colors.warningText}
      backgroundColor={p.enviando ? colors.blueSoft : colors.warningSoft}
    >
      <MText size="sm" weight="extraBold" color={colors.ink} lineHeight={19}>
        {p.texto}
      </MText>
    </View>
  );
}

/** The one retry, in the thumb zone: flush, or requeue what a person must. */
function Pie(p: PorEnviarScreenProps): ReactElement {
  const pie = pieCola(faseVista(p), p.cola);
  const personas = p.rechazados.filter((x) => !x.reintentando);
  const requeue = p.fase === 'con-rechazados';
  const quieto = pie.ocupado || (requeue && personas.length === 0);
  const correr = (): void => (requeue ? p.onReintentarRechazado(personas) : p.onReintentar());
  return (
    <View
      padding={16}
      paddingTop={12}
      borderTopWidth={borderWidths.quiet}
      borderTopColor={borderColors.quiet}
      backgroundColor={colors.white}
    >
      <Btn
        variant="primary"
        size="xl"
        sentence
        fullWidth
        disabled={quieto}
        onPress={quieto ? undefined : correr}
        testID="por-enviar-reintentar"
      >
        {pie.boton}
      </Btn>
    </View>
  );
}

function Cabeza(p: { readonly vacia: boolean }): ReactElement {
  return (
    <View gap={2}>
      <MText size="xl4" weight="extraBold" letterSpacing={-0.9} role="heading">
        Registros por enviar
      </MText>
      <MText size="md" weight="semibold" color={colors.gray600}>
        {intro(p.vacia)}
      </MText>
    </View>
  );
}

/** The queue with data: the line, the cola, refusals and Don's note. */
function ConDatos(p: PorEnviarScreenProps): ReactElement {
  const offline = p.state === SIN_INTERNET || p.fase === SIN_INTERNET;
  const faseFila: Fase = p.fase === 'enviando' ? 'enviando' : 'espera';
  const pie = pieCola(faseVista(p), p.cola);
  return (
    <>
      {pie.aviso === null ? null : <Aviso texto={pie.aviso} enviando={pie.ocupado} />}
      <ColaPanel cola={p.cola} fase={faseFila} offline={offline} onIrACierre={p.onIrACierre} />
      {p.rechazados.length > 0 ? <RechazadosPanel rechazados={p.rechazados} /> : null}
      <NadaSePierde />
    </>
  );
}

function Cuerpo(p: PorEnviarScreenProps & { readonly alDia: boolean; readonly base: string }) {
  if (p.alDia) return <TodoEnviado {...p} />;
  if (p.state === 'happy' || p.state === SIN_INTERNET) return <ConDatos {...p} />;
  if (p.state === 'cargando') {
    return <EstadosCaja id="cargando" titulo="Leyendo la cola de esta caja…" testID={p.base} />;
  }
  return (
    <EstadosCaja
      id="falla"
      titulo="No pudimos leer la cola de esta caja"
      cuerpo="Nada se pierde: sigue todo guardado aquí. Vuelve a intentar en un momento."
      onRetry={p.onRetry}
      testID={p.base}
    />
  );
}

export function PorEnviarScreen(p: PorEnviarScreenProps): ReactElement {
  const vacia = p.cola.length === 0 && p.rechazados.length === 0;
  const base = p.testID ?? 'por-enviar';
  const alDia = vacia && p.state === 'happy' && p.fase === 'enviado';
  const conPie = !alDia && !vacia && (p.state === 'happy' || p.state === SIN_INTERNET);
  return (
    <View flex={1}>
      <ScrollView testID={base} contentContainerStyle={{ padding: 16, gap: 14, flexGrow: 1 }}>
        <Cabeza vacia={vacia} />
        <Cuerpo {...p} alDia={alDia} base={base} />
      </ScrollView>
      {conPie ? <Pie {...p} /> : null}
    </View>
  );
}
