/**
 * «Fiado y abonos» (Track M, M-08; the phone board MvCobranza*): who owes
 * what and who already abonó in your turno. The list with the three figures,
 * the search and the filters; a client's account, receiving an abono and the
 * WhatsApp reminder are bottom sheets (the web's side panel and dialogs).
 * Presentational: the route hands it `useCobranza()` and the write.
 */
import { useState, type ReactElement } from 'react';
import { ScrollView } from 'react-native';
import { View } from '@tamagui/core';
import {
  estadoCuenta,
  recordatorio,
  toastAbono,
  vistaAbono,
  type CuentaCliente,
  type FiltroCobranza,
  type MetodoAbono,
} from '@xangarro/caja/cobranza';
import type { Money } from '@xangarro/domain';
import { ErrorState, Spinner, Toast } from '../../components/index';
import { Buscador, Filtros } from './cobranza-barra';
import { Cabeza, Cuerpo } from './cobranza-lista';
import { AbonosHoyPanel, ResumenFiado } from './cobranza-resumen';
import { ClienteCuentaSheet } from './cliente-cuenta';
import { RecibirAbonoSheet } from './recibir-abono-sheet';
import { RecordarSaldoSheet } from './recordar-saldo-sheet';
import type { AbonoHecho, DatosCobranza } from './use-cobranza';

export interface CobranzaScreenProps {
  readonly state: 'cargando' | 'error' | 'happy';
  readonly data: DatosCobranza | null;
  /** Records the abono; returns the error message, or null when it landed. */
  readonly onRegistrar: (a: AbonoHecho) => Promise<string | null>;
  readonly onRetry: () => void;
  /** Back to Inicio, the atajo that opened this. */
  readonly onBack: () => void;
  readonly testID?: string;
}

type Capa = 'cuenta' | 'abono' | 'recordar' | null;
type Aviso = { readonly texto: string; readonly ok: boolean } | null;

/** What the operator picked: the search, the filter, the open client and sheet. */
function useVista() {
  const [q, setQ] = useState('');
  const [filtro, setFiltro] = useState<FiltroCobranza>('Todos');
  const [sel, setSel] = useState<string | null>(null);
  const [capa, setCapa] = useState<Capa>(null);
  const [aviso, setAviso] = useState<Aviso>(null);
  const abrir = (id: string, conAbono: boolean): void => {
    setSel(id);
    setCapa(conAbono ? 'abono' : 'cuenta');
  };
  const cerrar = (): void => {
    setCapa(null);
    setSel(null);
  };
  return { q, setQ, filtro, setFiltro, sel, capa, setCapa, abrir, cerrar, aviso, setAviso };
}

/** The optimistic toast says where it landed; a failed write replaces it. */
function alGuardar(
  cliente: CuentaCliente,
  onRegistrar: CobranzaScreenProps['onRegistrar'],
  avisa: (a: Aviso) => void,
  cierra: () => void,
) {
  return async (metodo: MetodoAbono, monto: Money): Promise<string | null> => {
    const e = estadoCuenta(cliente);
    const exito = toastAbono(vistaAbono(cliente, e, monto, false), monto, metodo, cliente.nombre);
    cierra();
    avisa({ texto: exito, ok: true });
    const error = await onRegistrar({ clienteId: cliente.id, metodo, monto });
    if (error !== null) avisa({ texto: error, ok: false });
    return error;
  };
}

function Capas(p: {
  readonly cliente: CuentaCliente | null;
  readonly capa: Capa;
  readonly data: DatosCobranza;
  readonly setCapa: (c: Capa) => void;
  readonly guardar: (metodo: MetodoAbono, monto: Money) => Promise<string | null>;
  readonly cerrar: () => void;
}): ReactElement | null {
  const c = p.cliente;
  if (c === null) return null;
  return (
    <>
      <ClienteCuentaSheet
        open={p.capa === 'cuenta'}
        cuenta={c}
        hoy={p.data.hoy}
        dueno={p.data.dueno}
        onClose={p.cerrar}
        onAbonar={() => p.setCapa('abono')}
        onRecordar={() => p.setCapa('recordar')}
      />
      <RecibirAbonoSheet
        open={p.capa === 'abono'}
        cuenta={c}
        onClose={() => p.setCapa('cuenta')}
        onGuardar={p.guardar}
      />
      <RecordarSaldoSheet
        open={p.capa === 'recordar'}
        nombre={c.nombre}
        telefono={c.telefono}
        mensaje={recordatorio(c, estadoCuenta(c), p.data.negocio)}
        onClose={() => p.setCapa('cuenta')}
      />
    </>
  );
}

function Feliz(
  p: CobranzaScreenProps & {
    readonly data: DatosCobranza;
    readonly v: ReturnType<typeof useVista>;
    readonly guardar: (metodo: MetodoAbono, monto: Money) => Promise<string | null>;
  },
): ReactElement {
  const { v } = p;
  const cliente = p.data.cuentas.find((c) => c.id === v.sel) ?? null;
  return (
    <View flex={1} testID={p.testID ?? 'cobranza'}>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 14 }}>
        <Cabeza onBack={p.onBack} />
        <ResumenFiado cuentas={p.data.cuentas} hoy={p.data.hoy} />
        <Buscador q={v.q} onQ={v.setQ} />
        <Filtros value={v.filtro} onChange={v.setFiltro} />
        <Cuerpo cuentas={p.data.cuentas} filtro={v.filtro} q={v.q} abrir={v.abrir} />
        <AbonosHoyPanel cuentas={p.data.cuentas} hoy={p.data.hoy} />
      </ScrollView>
      <Capas
        cliente={cliente}
        capa={v.capa}
        data={p.data}
        setCapa={v.setCapa}
        guardar={p.guardar}
        cerrar={v.cerrar}
      />
      {v.aviso ? (
        <Toast
          title={v.aviso.ok ? 'Abono registrado' : 'No se pudo registrar el abono'}
          body={v.aviso.texto}
          tone={v.aviso.ok ? 'ok' : 'warn'}
          floating
          onClose={() => v.setAviso(null)}
          testID="cobranza-toast"
        />
      ) : null}
    </View>
  );
}

export function CobranzaScreen(p: CobranzaScreenProps): ReactElement {
  const v = useVista();
  if (p.state === 'error') {
    return (
      <View flex={1} justifyContent="center" padding={16} testID={p.testID ?? 'cobranza'}>
        <ErrorState
          title="No pudimos cargar el fiado"
          body="Lo que has cobrado sigue guardado en esta caja. Intenta otra vez."
          retryLabel="Intentar otra vez"
          onRetry={p.onRetry}
          testID="cobranza-error"
        />
      </View>
    );
  }
  if (p.state === 'cargando' || p.data === null) {
    return (
      <View flex={1} testID={p.testID}>
        <View flex={1} alignItems="center" justifyContent="center" testID="cobranza-cargando">
          <Spinner />
        </View>
      </View>
    );
  }
  const cliente = p.data.cuentas.find((c) => c.id === v.sel) ?? null;
  const guardar =
    cliente === null
      ? async (): Promise<string> => 'No hay cliente elegido.'
      : alGuardar(cliente, p.onRegistrar, v.setAviso, v.cerrar);
  return <Feliz {...p} data={p.data} v={v} guardar={guardar} />;
}
