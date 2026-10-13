/**
 * CierreScreen — «Cierre de turno» (Track M, M-09; board states cuadra,
 * falta, con-registros-por-enviar, hecho-*): count the drawer by
 * denomination against the expected cash, explain a difference, and close.
 * Records still to send warn in the band but never block the close
 * (ADR-123); closing ends on CierreHecho (cuadró, faltante, sobrante).
 * Presentational: the route hands it `useCierreTurno()` and the navigation.
 */
import { useRef, useState, type ReactElement } from 'react';
import { ScrollView } from 'react-native';
import { View } from '@tamagui/core';
import type { CierreData } from '@xangarro/caja/cierre';
import { MText } from '../../components/Mostrador/index';
import { CierreBanda, type ColaCierre } from './cierre-banda';
import { CierreCerrar } from './cierre-cerrar';
import { CierreConteo } from './cierre-conteo';
import { CierreEstados, type CierreEstado } from './cierre-estados';
import { CierreHecho } from './cierre-hecho';
import { CierreDiferencia, CierreEsperado } from './cierre-lado';
import { CierreResumen } from './cierre-resumen';
import { useCierreEstado, type CargaCierre } from './use-cierre-estado';
import { borderColors, borderWidths, colors, radii } from '../../theme';

export type { CargaCierre };

export interface CierreScreenProps {
  readonly state: CierreEstado;
  readonly data: CierreData | null;
  readonly cola: ColaCierre;
  /** The close write; resolves the error to show, or null once closed. */
  readonly onCerrar: (c: CargaCierre) => Promise<string | null>;
  readonly onRetry: () => void;
  /** From the hecho screen: back to Inicio (to open another turno). */
  readonly onSalir: () => void;
  /** The route's share for the WhatsApp corte. */
  readonly onCompartir: (texto: string) => void;
  readonly testID?: string;
}

function Cabeza(p: { readonly data: CierreData }): ReactElement {
  return (
    <View gap={2}>
      <MText size="xl4" weight="extraBold" letterSpacing={-0.8} role="heading">
        Cierre de turno
      </MText>
      <MText
        size="sm"
        weight="semibold"
        color={colors.gray600}
      >{`${p.data.operador}, ${p.data.caja}, de ${p.data.desde} a ${p.data.hasta}`}</MText>
    </View>
  );
}

/** The failed close, in red, above the button that stays. */
function ErrorCierre(p: { readonly texto: string }): ReactElement {
  return (
    <View
      role="alert"
      testID="cierre-error-cerrar"
      padding={12}
      borderRadius={radii[3]}
      borderWidth={borderWidths.quiet}
      borderColor={borderColors.quiet}
      backgroundColor={colors.redSoft}
    >
      <MText size="sm" weight="bold" color={colors.redText}>
        {p.texto}
      </MText>
    </View>
  );
}

/** The count itself: everything between the head and the hecho. */
function Contando(p: CierreScreenProps & { readonly data: CierreData }): ReactElement {
  const x = useCierreEstado(p.data);
  if (x.cerrado) {
    return (
      <ScrollView testID={`${p.testID ?? 'cierre'}-hecho-scroll`}>
        <CierreHecho
          data={p.data}
          e={x.e}
          motivo={x.motivo}
          porEnviar={p.cola.porEnviar}
          onCompartir={p.onCompartir}
          onSalir={p.onSalir}
        />
      </ScrollView>
    );
  }
  return (
    <ScrollView
      testID={p.testID ?? 'cierre'}
      contentContainerStyle={{ padding: 16, gap: 14 }}
      keyboardShouldPersistTaps="handled"
    >
      <Cabeza data={p.data} />
      {p.cola.porEnviar > 0 ? <CierreBanda {...p.cola} /> : null}
      <CierreConteo conteo={x.conteo} contado={x.e.contado} poner={x.poner} onLimpiar={x.limpiar} />
      <CierreEsperado e={x.e} data={p.data} />
      <CierreDiferencia
        e={x.e}
        data={p.data}
        motivo={x.motivo}
        onMotivo={x.setMotivo}
        nota={x.nota}
        onNota={x.setNota}
      />
      <CierreResumen data={p.data} porEnviar={p.cola.porEnviar} />
      {x.error ? <ErrorCierre texto={x.error} /> : null}
      <CierreCerrar e={x.e} guardando={x.guardando} onCerrar={() => x.cerrar(p.onCerrar)} />
    </ScrollView>
  );
}

export function CierreScreen(p: CierreScreenProps): ReactElement {
  // The close invalidates the query, the turno then reads null and the screen
  // would fall to its sin-turno state — killing the hecho screen the close
  // just earned. The latch keeps Contando mounted on its last data (its own
  // `cerrado` renders CierreHecho with the count still in hand).
  const [cerradoLatch, setCerradoLatch] = useState(false);
  const ultimo = useRef<CierreData | null>(null);
  if (p.state === 'happy' && p.data !== null) ultimo.current = p.data;
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
        <CierreEstados id={id} onRetry={p.onRetry} onIrAInicio={p.onSalir} />
      </View>
    );
  }
  const data = p.data ?? ultimo.current;
  return data === null ? <></> : <Contando {...p} data={data} onCerrar={escribir} />;
}
