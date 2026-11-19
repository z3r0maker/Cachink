/**
 * CierreScreen — «Cierre de turno» in two steps (M-17, MvCierreFlujo;
 * ADR-147): count the drawer by denomination without the expected cash,
 * then see the result, explain a difference and close; «Volver a contar»
 * goes back with the count kept. Records still to send warn but never block
 * the close (ADR-123). Closing ends on CierreHecho, which sends the corte or
 * opens another turno. Presentational: the route hands it `useCierreTurno()`,
 * the navigation and, if it wants the header to follow, the step.
 */
import { useRef, useState, type ReactElement } from 'react';
import { View } from '@tamagui/core';
import type { CierreData } from '@xangarro/caja/cierre';
import type { ColaCierre } from './cierre-banda';
import { CierreEstados, type CierreEstado } from './cierre-estados';
import { CierreHecho } from './cierre-hecho';
import { CierrePasoContar } from './cierre-paso-contar';
import { CierrePasoResultado } from './cierre-paso-resultado';
import { useCierreEstado, type CargaCierre } from './use-cierre-estado';

export type { CargaCierre };

/** Where the operator is: counting, reading the result, or closed. */
export type PasoCierre = 'contar' | 'resultado' | 'hecho';

export interface CierreScreenProps {
  readonly state: CierreEstado;
  readonly data: CierreData | null;
  readonly cola: ColaCierre;
  /** The close write; resolves the error to show, or null once closed. */
  readonly onCerrar: (c: CargaCierre) => Promise<string | null>;
  readonly onRetry: () => void;
  /** From the hecho screen: leave the caja. */
  readonly onSalir: () => void;
  /** Sin turno: opens the fondo sheet over this screen. */
  readonly onAbrirTurno: () => void;
  /** From the hecho screen: the fondo sheet for another turno (ADR-147). */
  readonly onOtroTurno: () => void;
  /** The step, when the route owns it (its header's back follows it). */
  readonly paso?: PasoCierre;
  readonly onPaso?: (paso: PasoCierre) => void;
  readonly testID?: string;
}

/** The step, owned by the route when it passes one, else here. */
function usePaso(p: CierreScreenProps): readonly [PasoCierre, (x: PasoCierre) => void] {
  const [propio, setPropio] = useState<PasoCierre>('contar');
  const ir = (x: PasoCierre): void => {
    setPropio(x);
    p.onPaso?.(x);
  };
  return [p.paso ?? propio, ir];
}

/**
 * The close reached the cloud: a sync run that ended after the close, with
 * nothing left to send and nothing on its way (review M7).
 */
export function corteEnviado(cola: ColaCierre, cerradoAt: number | null): boolean {
  if (cerradoAt === null || cola.porEnviar > 0 || cola.enviando) return false;
  const ultimo = Date.parse(cola.ultimoEnvio ?? '');
  return ultimo >= cerradoAt;
}

/** The close write that, once it lands, sends it at once and moves on (review M7). */
function cerrarYEnviar(
  p: CierreScreenProps,
  x: ReturnType<typeof useCierreEstado>,
  alCerrar: () => void,
): () => void {
  return () =>
    x.cerrar(async (c) => {
      const fallo = await p.onCerrar(c);
      if (fallo === null) {
        alCerrar();
        // Send the close now rather than on the next cycle.
        p.cola.onReintentar();
      }
      return fallo;
    });
}

/** The two steps over one count, and the hecho the close earns. */
function Contando(p: CierreScreenProps & { readonly data: CierreData }): ReactElement {
  const x = useCierreEstado(p.data);
  const [paso, ir] = usePaso(p);
  const [cerradoAt, setCerradoAt] = useState<number | null>(null);
  const id = p.testID ?? 'cierre';
  const cerrar = cerrarYEnviar(p, x, () => {
    setCerradoAt(Date.now());
    ir('hecho');
  });
  if (x.cerrado) {
    return (
      <CierreHecho
        data={p.data}
        e={x.e}
        motivo={x.motivo}
        enviado={corteEnviado(p.cola, cerradoAt)}
        onOtroTurno={p.onOtroTurno}
        onSalir={p.onSalir}
      />
    );
  }
  if (paso === 'contar') {
    return <CierrePasoContar x={x} onSeguir={() => ir('resultado')} testID={id} />;
  }
  return (
    <CierrePasoResultado
      x={x}
      data={p.data}
      cola={p.cola}
      onCerrar={cerrar}
      onVolver={() => ir('contar')}
      testID={id}
    />
  );
}

export function CierreScreen(p: CierreScreenProps): ReactElement {
  // The close invalidates the query, the turno then reads null (or, once
  // another turno opens, the new one) and the screen would leave the hecho
  // the close just earned. The latch keeps Contando mounted on the data it
  // closed with.
  const [cerradoLatch, setCerradoLatch] = useState(false);
  const ultimo = useRef<CierreData | null>(null);
  if (!cerradoLatch && p.state === 'happy' && p.data !== null) ultimo.current = p.data;
  const escribir = async (c: CargaCierre): Promise<string | null> => {
    const fallo = await p.onCerrar(c);
    if (fallo === null) setCerradoLatch(true);
    return fallo;
  };
  if ((p.state !== 'happy' || p.data === null) && !cerradoLatch) {
    const id = p.state === 'happy' ? 'loading' : p.state;
    // The route's identity testID rides every state — flows assert the
    // screen, not whichever branch the turno left it in.
    return (
      <View flex={1} testID={p.testID}>
        <CierreEstados id={id} onRetry={p.onRetry} onAbrirTurno={p.onAbrirTurno} />
      </View>
    );
  }
  const data = cerradoLatch ? ultimo.current : (p.data ?? ultimo.current);
  return data === null ? <></> : <Contando {...p} data={data} onCerrar={escribir} />;
}
