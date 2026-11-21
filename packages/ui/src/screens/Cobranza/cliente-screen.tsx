/**
 * A client's page on Fiado y abonos (RvFiado «Cliente», MvCobranzaCliente):
 * the account scrolls, «Recibir abono» and «Recordarle su saldo» stay in the
 * thumb zone, and each opens its sheet — the abono, and the reminder with
 * WhatsApp, Mensajes or the phone's share menu (MvRecordarSaldo), so a
 * client with no number still gets the message. After an abono the toast
 * says where it landed; a failed write replaces it. Presentational: the
 * route hands it the account and `useCobranza().registrar`.
 */
import { useState, type ReactElement } from 'react';
import { ScrollView } from 'react-native';
import { View } from '@tamagui/core';
import {
  estadoCuenta,
  saldo,
  toastAbono,
  vistaAbono,
  type CuentaCliente,
  type MetodoAbono,
} from '@xangarro/caja/cobranza';
import type { Money } from '@xangarro/domain';
import { CajaEstado, EstadoCargando, Toast } from '../../components/index';
import { borderColors, borderWidths, colors } from '../../theme';
import { CuentaCuerpo, CuentaPie } from './cliente-cuenta';
import { RecibirAbonoSheet } from './recibir-abono-sheet';
import { RecordarSheet } from './recordar-sheet';
import type { AbonoHecho, DatosCobranza } from './use-cobranza';

export interface ClienteScreenProps {
  readonly state: 'cargando' | 'error' | 'happy';
  /** Null once loaded: no such client on this caja. */
  readonly cuenta: CuentaCliente | null;
  readonly data: DatosCobranza | null;
  /** Opens with «Recibir abono» up (Inicio's «Cobrar a …»). */
  readonly abrirAbono?: boolean;
  /** Records the abono; returns the error message, or null when it landed. */
  readonly onRegistrar: (a: AbonoHecho) => Promise<string | null>;
  readonly onRetry: () => void;
  readonly testID?: string;
}

type Hoja = 'abono' | 'recordar' | null;
type Aviso = { readonly texto: string; readonly ok: boolean } | null;

function useHojas(p: ClienteScreenProps, cuenta: CuentaCliente) {
  const [hoja, setHoja] = useState<Hoja>(p.abrirAbono && saldo(cuenta) > 0n ? 'abono' : null);
  const [aviso, setAviso] = useState<Aviso>(null);
  // Each opening is a fresh sheet: a reminder left half-edited doesn't come back.
  const [vez, setVez] = useState(0);
  const abrir = (x: Hoja): void => {
    setVez((n) => n + 1);
    setHoja(x);
  };
  const guardar = async (metodo: MetodoAbono, monto: Money): Promise<string | null> => {
    const v = vistaAbono(cuenta, estadoCuenta(cuenta), monto, false);
    setHoja(null);
    setAviso({ texto: toastAbono(v, monto, metodo, cuenta.nombre), ok: true });
    const error = await p.onRegistrar({ clienteId: cuenta.id, metodo, monto });
    if (error !== null) setAviso({ texto: error, ok: false });
    return error;
  };
  return { hoja, setHoja, abrir, vez, aviso, setAviso, guardar };
}

/** Where the abono landed, or what went wrong with it. */
function AvisoAbono(p: { readonly aviso: Aviso; readonly onClose: () => void }) {
  if (p.aviso === null) return null;
  return (
    <Toast
      title={p.aviso.ok ? 'Abono registrado' : 'No se pudo registrar el abono'}
      body={p.aviso.texto}
      tone={p.aviso.ok ? 'ok' : 'warn'}
      floating
      onClose={p.onClose}
      testID="cliente-toast"
    />
  );
}

function Pagina(p: ClienteScreenProps & { cuenta: CuentaCliente; data: DatosCobranza }) {
  const h = useHojas(p, p.cuenta);
  return (
    <View flex={1} testID={p.testID ?? 'cliente'}>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 14 }}>
        <CuentaCuerpo cuenta={p.cuenta} hoy={p.data.hoy} />
      </ScrollView>
      <View
        padding={16}
        paddingTop={12}
        borderTopWidth={borderWidths.quiet}
        borderTopColor={borderColors.quiet}
        backgroundColor={colors.offwhite}
      >
        <CuentaPie
          debe={saldo(p.cuenta) > 0n}
          onAbonar={() => h.abrir('abono')}
          onRecordar={() => h.abrir('recordar')}
        />
      </View>
      <RecibirAbonoSheet
        key={`abono-${h.vez}`}
        open={h.hoja === 'abono'}
        cuenta={p.cuenta}
        onClose={() => h.setHoja(null)}
        onGuardar={h.guardar}
      />
      <RecordarSheet
        key={`recordar-${h.vez}`}
        open={h.hoja === 'recordar'}
        cuenta={p.cuenta}
        negocio={p.data.negocio}
        onClose={() => h.setHoja(null)}
      />
      <AvisoAbono aviso={h.aviso} onClose={() => h.setAviso(null)} />
    </View>
  );
}

export function ClienteScreen(p: ClienteScreenProps): ReactElement {
  if (p.state === 'cargando' || (p.state === 'happy' && p.data === null)) {
    return <EstadoCargando testID="cliente-cargando" />;
  }
  if (p.state === 'error' || p.cuenta === null || p.data === null) {
    return (
      <CajaEstado
        mode="error"
        errorTitle={
          p.state === 'error' ? 'No pudimos leer la cuenta' : 'No encontramos a este cliente'
        }
        onRetry={p.onRetry}
        testID="cliente"
      />
    );
  }
  return <Pagina {...p} cuenta={p.cuenta} data={p.data} />;
}
