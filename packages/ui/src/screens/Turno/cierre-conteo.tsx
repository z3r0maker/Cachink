/**
 * «Cuenta el efectivo de la caja» (Track M, M-09): bills $1000 to $20 and
 * coins $20 to 10¢ in two columns, billetes and monedas each saying their
 * subtotal, and the foot saying the Contado. The rows themselves live in
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
import { borderWidths } from '../../theme';
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

/** The foot: «Contaste», and the total the pieces add to. */
function Contado(p: { readonly contado: bigint }): ReactElement {
  return (
    <View
      flexDirection="row"
      alignItems="baseline"
      gap={12}
      paddingTop={12}
      borderTopWidth={borderWidths.thick}
      borderTopColor={colors.black}
    >
      <Eyebrow>Contaste</Eyebrow>
      <MText
        size="total"
        weight="extraBold"
        fontVariant={['tabular-nums']}
        letterSpacing={-1}
        marginLeft="auto"
        testID="cierre-contado"
      >
        {formatMoney(p.contado)}
      </MText>
    </View>
  );
}

/** The counter itself; «Empezar de cero» clears every piece. */
export function CierreConteo(p: {
  readonly conteo: ConteoDenominaciones;
  readonly contado: bigint;
  readonly poner: (clave: ClaveDenominacion, n: number) => void;
  readonly onLimpiar: () => void;
}): ReactElement {
  return (
    <QuietPanel
      label="Cuenta el efectivo de la caja"
      testID="cierre-conteo"
      padding={16}
      action={
        <Btn variant="quiet" size="sm" onPress={p.onLimpiar} testID="cierre-empezar-de-cero">
          Empezar de cero
        </Btn>
      }
    >
      <View gap={18}>
        <Columna titulo="Billetes" lista={BILLETES} conteo={p.conteo} poner={p.poner} />
        <Columna titulo="Monedas" lista={MONEDAS} conteo={p.conteo} poner={p.poner} />
        <Contado contado={p.contado} />
      </View>
    </QuietPanel>
  );
}
