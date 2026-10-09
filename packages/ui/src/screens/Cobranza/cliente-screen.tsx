/**
 * A client's account on the phone (MvCobranza's client view, the web's
 * Detalle de cliente): who they are, the saldo hero, the open sales and the
 * latest abonos; «Recibir abono» (only while they owe) and «Recordarle su
 * saldo» in the thumb zone, each opening its sheet. After an abono the toast
 * says where it landed (`toastAbono`, as the web's).
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
import { Btn, ErrorState, PathIcon, Spinner, Toast } from '../../components/index';
import { borderColors, borderWidths, colors } from '../../theme';
import { COBRAR_GLYPHS } from '../Ventas/cobrar-glyphs';
import { AbonoSheet } from './abono-sheet';
import { Abonos } from './cliente-abonos';
import { Abiertas, ClienteCabeza, SaldoHero } from './cliente-partes';
import { RecordarSheet } from './recordar-sheet';

export interface ClienteScreenProps {
  readonly state: 'loading' | 'error' | 'happy';
  /** Null once loaded: no such client on this caja. */
  readonly cuenta: CuentaCliente | null;
  readonly hoy: string;
  readonly negocio: string;
  /** Opens with «Recibir abono» up (Inicio's «Cobrar a …»). */
  readonly abrirAbono?: boolean;
  /** Opens with «Recordarle su saldo» up (review stories). */
  readonly abrirRecordar?: boolean;
  /** Records the abono; rejects with the reason when it can't. */
  readonly onRecibir: (metodo: MetodoAbono, monto: Money) => Promise<void>;
  readonly onRetry: () => void;
}

type Hoja = 'abono' | 'recordar' | null;

function useHojas(p: ClienteScreenProps, cuenta: CuentaCliente) {
  const [hoja, setHoja] = useState<Hoja>(
    p.abrirAbono && saldo(cuenta) > 0n ? 'abono' : p.abrirRecordar ? 'recordar' : null,
  );
  const [vez, setVez] = useState(0);
  const [registrando, setRegistrando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const abrir = (h: Hoja) => {
    setError(null);
    setVez((n) => n + 1);
    setHoja(h);
  };
  const recibir = async (metodo: MetodoAbono, monto: Money) => {
    const aviso = toastAbono(vistaAbono(cuenta, estadoCuenta(cuenta), monto, false), monto, metodo);
    setRegistrando(true);
    try {
      await p.onRecibir(metodo, monto);
      setHoja(null);
      setToast(aviso);
    } catch (e) {
      setError(`No se pudo registrar el abono: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setRegistrando(false);
    }
  };
  return { hoja, vez, abrir, registrando, error, toast, setToast, recibir };
}

function Pie(p: { debe: boolean; onAbono: () => void; onRecordar: () => void }): ReactElement {
  return (
    <View
      gap={8}
      paddingHorizontal={16}
      paddingTop={10}
      paddingBottom={12}
      borderTopWidth={borderWidths.quiet}
      borderTopColor={borderColors.quiet}
      backgroundColor={colors.offwhite}
    >
      {p.debe ? (
        <Btn
          variant="primary"
          size="xl"
          sentence
          fullWidth
          onPress={p.onAbono}
          testID="cliente-abonar"
        >
          Recibir abono
        </Btn>
      ) : null}
      <Btn
        variant="secondary"
        size="lg"
        fullWidth
        icon={<PathIcon d={COBRAR_GLYPHS.whatsapp} size={18} />}
        onPress={p.onRecordar}
        testID="cliente-recordar"
      >
        Recordarle su saldo
      </Btn>
    </View>
  );
}

function Hojas(
  p: ClienteScreenProps & { cuenta: CuentaCliente; h: ReturnType<typeof useHojas> },
): ReactElement {
  const { h } = p;
  return (
    <>
      <AbonoSheet
        key={`abono-${h.vez}`}
        open={h.hoja === 'abono'}
        cuenta={p.cuenta}
        registrando={h.registrando}
        error={h.error}
        onClose={() => h.abrir(null)}
        onRecibir={(m, monto) => void h.recibir(m, monto)}
      />
      <RecordarSheet
        key={`recordar-${h.vez}`}
        open={h.hoja === 'recordar'}
        cuenta={p.cuenta}
        negocio={p.negocio}
        onClose={() => h.abrir(null)}
      />
    </>
  );
}

function Cuenta(p: ClienteScreenProps & { cuenta: CuentaCliente }): ReactElement {
  const h = useHojas(p, p.cuenta);
  return (
    <View flex={1} testID="cliente">
      <ScrollView contentContainerStyle={{ padding: 16, paddingTop: 14, gap: 14 }}>
        <ClienteCabeza c={p.cuenta} />
        <SaldoHero c={p.cuenta} hoy={p.hoy} />
        <Abiertas c={p.cuenta} />
        <Abonos c={p.cuenta} />
      </ScrollView>
      <Pie
        debe={saldo(p.cuenta) > 0n}
        onAbono={() => h.abrir('abono')}
        onRecordar={() => h.abrir('recordar')}
      />
      {h.toast ? (
        <Toast
          floating
          title="Abono recibido"
          body={h.toast}
          onClose={() => h.setToast(null)}
          testID="cliente-toast"
        />
      ) : null}
      <Hojas {...p} h={h} />
    </View>
  );
}

export function ClienteScreen(p: ClienteScreenProps): ReactElement {
  if (p.state === 'loading') {
    return (
      <View flex={1} alignItems="center" justifyContent="center" testID="cliente-cargando">
        <Spinner />
      </View>
    );
  }
  if (p.state === 'error' || p.cuenta === null) {
    return (
      <ErrorState
        title={p.state === 'error' ? 'No pudimos leer la cuenta' : 'No encontramos a este cliente'}
        body="Sus ventas fiadas y sus abonos siguen guardados en esta caja. Vuelve a intentarlo."
        retryLabel="Reintentar"
        onRetry={p.onRetry}
        testID="cliente-error"
      />
    );
  }
  return <Cuenta {...p} cuenta={p.cuenta} />;
}
