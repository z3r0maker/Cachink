/**
 * CajaEstado — the caja's loading · empty · error block (MvEstados, the web's
 * `OperadorEstado` in `operador/estado.tsx`), so every list on the phone says
 * those three moments the same way:
 *
 * - loading: Don Cuentas counting with his coin, a line that changes every
 *   1.8 s («Contando monedas», «Cuadrando la caja»…; one line under Reduce
 *   Motion) and pale rows where the list will be;
 * - empty: Don helping, what is missing and, when there is one, the action
 *   that fills it;
 * - error: Don worried, a red edge, the promise that nothing captured is
 *   lost, and «Intentar de nuevo» that says «Intentando…» for a moment.
 *
 * The happy state is the screen's own content.
 */
import { useEffect, useRef, useState, type ReactElement } from 'react';
import { View } from '@tamagui/core';
import type { EstadoMode } from '@xangarro/caja';
import { useReducedMotion } from '../../hooks/use-reduced-motion';
import { borderWidths, colors, shapeRadii } from '../../theme';
import { Btn } from '../Btn/index';
import { Don } from '../Don/index';
import { MText } from '../Mostrador/mtext';
import { GLYPHS } from '../PathIcon/glyphs';
import { PathIcon } from '../PathIcon/path-icon';
import { Cuerpo, FilasPalidas, Tarjeta, Titulo } from './caja-estado-partes';

export const FRASES = [
  'Contando monedas',
  'Cuadrando la caja',
  'Sacando cuentas',
  'Ya casi, ya casi',
];

const OTRA_VEZ = 'M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8M21 3v5h-5';
const FLECHA = 'M5 12h14M13 6l6 6-6 6';

export interface CajaEstadoProps {
  readonly mode: EstadoMode;
  readonly emptyTitle?: string;
  readonly emptyBody?: string;
  /** The empty state's action («Cobrar la primera»). */
  readonly cta?: { readonly label: string; readonly onPress: () => void };
  readonly errorTitle?: string;
  readonly onRetry?: () => void;
  /** Prefix of the three states' testIDs: `<id>-cargando`, `-vacio`, `-error`. */
  readonly testID?: string;
}

function useFrase(): string {
  const reduced = useReducedMotion();
  const [i, setI] = useState(0);
  useEffect(() => {
    if (reduced) return;
    const t = setInterval(() => setI((n) => (n + 1) % FRASES.length), 1800);
    return () => clearInterval(t);
  }, [reduced]);
  return FRASES[reduced ? 0 : i] ?? '';
}

function Moneda(): ReactElement {
  return (
    <View
      position="absolute"
      left={18}
      top={30}
      width={30}
      height={30}
      alignItems="center"
      justifyContent="center"
      borderRadius={shapeRadii.pill}
      borderWidth={borderWidths.thick}
      borderColor={colors.black}
      backgroundColor={colors.yellow}
    >
      <MText size="xs" weight="extraBold">
        $
      </MText>
    </View>
  );
}

export function EstadoCargando({ testID }: { readonly testID: string }): ReactElement {
  const frase = useFrase();
  return (
    <Tarjeta testID={testID} role="status" busy label={`${frase}…`}>
      <View position="relative" width={170} height={150} aria-hidden>
        <Don pose="contando" size={150} />
        <Moneda />
      </View>
      <MText size="xl" weight="extraBold">{`${frase}…`}</MText>
      <MText size="sm" weight="semibold" color={colors.textMuted}>
        Don Cuentas está sacando tus números
      </MText>
      <FilasPalidas />
    </Tarjeta>
  );
}

function Vacio(p: CajaEstadoProps & { readonly id: string }): ReactElement {
  const title = p.emptyTitle ?? 'Nada por aquí todavía';
  return (
    <Tarjeta testID={p.id} label={title}>
      <Don pose="ayuda" size={170} />
      <Titulo>{title}</Titulo>
      <Cuerpo>{p.emptyBody ?? 'En cuanto captures algo, aparece en esta lista.'}</Cuerpo>
      {p.cta ? (
        <View alignSelf="stretch" marginTop={12}>
          <Btn
            variant="primary"
            size="xl"
            sentence
            fullWidth
            onPress={p.cta.onPress}
            icon={<PathIcon d={FLECHA} size={20} strokeWidth={2.6} />}
            testID={`${p.id}-cta`}
          >
            {p.cta.label}
          </Btn>
        </View>
      ) : null}
    </Tarjeta>
  );
}

/** «Intentando…» for a moment after a retry, as the web does. */
function useReintento(onRetry: (() => void) | undefined) {
  const [intentando, setIntentando] = useState(false);
  const t = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(t.current), []);
  const reintentar = (): void => {
    setIntentando(true);
    onRetry?.();
    clearTimeout(t.current);
    t.current = setTimeout(() => setIntentando(false), 1600);
  };
  return { intentando, reintentar };
}

function Falla(p: CajaEstadoProps & { readonly id: string }): ReactElement {
  const r = useReintento(p.onRetry);
  return (
    <Tarjeta testID={p.id} tono="alerta" role="alert">
      <Don pose="preocupado" size={170} />
      <Titulo>{p.errorTitle ?? 'No pudimos leer la caja'}</Titulo>
      <Cuerpo>
        <MText size="body" weight="extraBold" color={colors.greenText}>
          Tus datos están a salvo en esta caja.
        </MText>{' '}
        Lo que capturaste no se pierde. Vuelve a intentar en un momento.
      </Cuerpo>
      {p.onRetry ? (
        <View alignSelf="stretch" marginTop={12}>
          <Btn
            variant="primary"
            size="xl"
            sentence
            fullWidth
            disabled={r.intentando}
            onPress={r.reintentar}
            icon={
              <PathIcon d={r.intentando ? GLYPHS.nube : OTRA_VEZ} size={20} strokeWidth={2.4} />
            }
            testID={`${p.id}-reintentar`}
          >
            {r.intentando ? 'Intentando…' : 'Intentar de nuevo'}
          </Btn>
        </View>
      ) : null}
    </Tarjeta>
  );
}

export function CajaEstado(props: CajaEstadoProps): ReactElement {
  const base = props.testID ?? 'estado';
  if (props.mode === 'loading') return <EstadoCargando testID={`${base}-cargando`} />;
  if (props.mode === 'error') return <Falla {...props} id={`${base}-error`} />;
  return <Vacio {...props} id={`${base}-vacio`} />;
}
