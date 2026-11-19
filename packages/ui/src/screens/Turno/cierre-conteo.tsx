/**
 * «Cuenta el efectivo de la caja» (Track M, M-09): bills $1000 to $20 and
 * coins $20 to 10¢ in two columns, billetes and monedas each saying their
 * subtotal; the step's fixed foot says the Contado (M-17). The rows live in
 * `cierre-conteo-fila`; everything is centavos end to end.
 */
import type { ReactElement } from 'react';
import { View } from '@tamagui/core';
import {
  DENOMINACIONES_MXN,
  formatMoney,
  totalContado,
  type ClaveDenominacion,
  type ConteoDenominaciones,
  type Denominacion,
} from '@xangarro/domain';
import { colors } from '@xangarro/tokens';
import { MText } from '../../components/Mostrador/index';
import { Eyebrow, QuietPanel } from '../../components/Panel/index';
import { Btn } from '../../components/Btn/index';
import { Fila } from './cierre-conteo-fila';

const BILLETES = DENOMINACIONES_MXN.filter((d) => d.tipo === 'billete');
const MONEDAS = DENOMINACIONES_MXN.filter((d) => d.tipo === 'moneda');

/** Only this kind's pieces, so each column shows its own subtotal. */
function subtotal(conteo: ConteoDenominaciones, lista: readonly Denominacion[]): bigint {
  const solo: Record<string, number> = {};
  for (const d of lista) solo[d.clave] = conteo[d.clave] ?? 0;
  return totalContado(solo);
}

function Columna(p: {
  readonly titulo: string;
  readonly lista: readonly Denominacion[];
  readonly conteo: ConteoDenominaciones;
  readonly poner: (clave: ClaveDenominacion, n: number) => void;
}): ReactElement {
  return (
    <View gap={10}>
      <View flexDirection="row" alignItems="baseline" gap={8}>
        <Eyebrow>{p.titulo}</Eyebrow>
        <MText size="sm" weight="extraBold" fontVariant={['tabular-nums']} color={colors.gray600}>
          {formatMoney(subtotal(p.conteo, p.lista))}
        </MText>
      </View>
      {p.lista.map((d) => (
        <Fila key={d.clave} d={d} n={p.conteo[d.clave] ?? 0} poner={p.poner} />
      ))}
    </View>
  );
}

/** The counter itself; «Empezar de cero» clears every piece. */
export function CierreConteo(p: {
  readonly conteo: ConteoDenominaciones;
  readonly poner: (clave: ClaveDenominacion, n: number) => void;
  readonly onLimpiar: () => void;
}): ReactElement {
  return (
    <View gap={12}>
      <QuietPanel label="Cuenta el efectivo de la caja" testID="cierre-conteo" padding={16}>
        <View gap={18}>
          <Columna titulo="Billetes" lista={BILLETES} conteo={p.conteo} poner={p.poner} />
          <Columna titulo="Monedas" lista={MONEDAS} conteo={p.conteo} poner={p.poner} />
        </View>
      </QuietPanel>
      {/* Under the count, centred (MvCierreFlujo): in the panel's head it was cut off. */}
      <View alignItems="center">
        <Btn
          variant="secondary"
          size="md"
          sentence
          onPress={p.onLimpiar}
          testID="cierre-empezar-de-cero"
        >
          Empezar de cero
        </Btn>
      </View>
    </View>
  );
}
