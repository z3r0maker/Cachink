/**
 * «¿Cómo paga?» (Track M, M-07; board MvCobro): the ticket's total, the
 * method, and for cash the amount received with the change; «Cobrar»
 * registers the ticket. Fiado goes on to choose the client (MvFiado).
 * Presentation only; the route registers the sale.
 */
import { useState, type ReactElement } from 'react';
import { ScrollView } from 'react-native';
import { View } from '@tamagui/core';
import { formatMoney, type Money } from '@xangarro/domain';
import { Eyebrow } from '../../components/Panel/index';
import { MText } from '../../components/Mostrador/index';
import { colors } from '../../theme';
import { piezasTexto } from '../Ventas/ticket-en-curso';
import { CobroEfectivo } from './cobro-efectivo';
import { Metodos, PanelSinEfectivo } from './cobro-metodos';
import {
  estadoEfectivo,
  etiquetaCobrar,
  teclear,
  type EstadoEfectivo,
  type MetodoCobro,
} from './cobro-logic';
import { PieAccion } from './pie-accion';

export interface CobroScreenProps {
  readonly folio: string | null;
  readonly piezas: number;
  readonly total: Money;
  readonly metodos: readonly MetodoCobro[];
  readonly metodoInicial: MetodoCobro;
  readonly registrando: boolean;
  /** What went wrong with the last try, in the operator's words. */
  readonly error: string | null;
  readonly onCobrar: (c: { metodo: MetodoCobro; recibido: Money | null }) => void;
  readonly onFiado: () => void;
  readonly testID?: string;
}

function Cabeza(p: CobroScreenProps): ReactElement {
  const eyebrow = [p.folio, piezasTexto(p.piezas)].filter(Boolean).join(' · ');
  return (
    <View flexDirection="row" alignItems="flex-end" justifyContent="space-between" gap={12}>
      <View flex={1}>
        <Eyebrow color={colors.gray600}>{eyebrow}</Eyebrow>
        <MText size="xl4" weight="extraBold" letterSpacing={-0.9} role="heading">
          ¿Cómo paga?
        </MText>
      </View>
      <MText size="xl5" weight="extraBold" testID="cobro-total">
        {formatMoney(p.total)}
      </MText>
    </View>
  );
}

function Pago(p: {
  total: Money;
  metodo: MetodoCobro;
  tecleado: string;
  setTecleado: (f: (t: string) => string) => void;
  e: EstadoEfectivo;
}): ReactElement {
  if (p.metodo !== 'Efectivo') {
    const m = p.metodo === 'Tarjeta' ? 'Tarjeta' : 'Transferencia';
    return <PanelSinEfectivo metodo={m} total={p.total} />;
  }
  return (
    <CobroEfectivo
      total={p.total}
      tecleado={p.tecleado}
      estado={p.e}
      onTecla={(k) => p.setTecleado((t) => teclear(t, k))}
      onMonto={(v) => p.setTecleado(() => v)}
    />
  );
}

export function CobroScreen(p: CobroScreenProps): ReactElement {
  const inicial = p.metodoInicial === 'Fiado' ? 'Efectivo' : p.metodoInicial;
  const [metodo, setMetodo] = useState<MetodoCobro>(inicial);
  const [tecleado, setTecleado] = useState('');
  const e = estadoEfectivo(tecleado, p.total);
  const efectivo = metodo === 'Efectivo';
  return (
    <View flex={1} testID={p.testID ?? 'checkout-cobro'}>
      <ScrollView
        contentContainerStyle={{ padding: 16, gap: 14 }}
        keyboardShouldPersistTaps="handled"
      >
        <Cabeza {...p} />
        <Metodos metodos={p.metodos} metodo={metodo} onMetodo={setMetodo} onFiado={p.onFiado} />
        <Pago total={p.total} metodo={metodo} tecleado={tecleado} setTecleado={setTecleado} e={e} />
      </ScrollView>
      <PieAccion
        label={etiquetaCobrar(metodo, p.total, e)}
        disabled={!(p.total > 0n && (!efectivo || e.alcanza))}
        loading={p.registrando}
        error={p.error}
        onPress={() => p.onCobrar({ metodo, recibido: efectivo ? e.recibido : null })}
        testID="cobro-submit"
      />
    </View>
  );
}
