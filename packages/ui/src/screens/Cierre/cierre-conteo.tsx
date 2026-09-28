/**
 * «Cuenta el efectivo» (MvCierre): bills $1000 to $20, then coins $20 to 10¢,
 * each list with its subtotal, «Empezar de cero», and «Contaste» at the foot.
 * The form's panel keeps the black edge (§1: black means you act on it).
 */
import type { ReactElement } from 'react';
import { View } from '@tamagui/core';
import {
  DENOMINACIONES_MXN,
  formatMoney,
  totalContado,
  type ConteoDenominaciones,
  type Denominacion,
} from '@xangarro/domain';
import { Btn, Eyebrow, MText } from '../../components/index';
import { borderColors, borderWidths, colors, radii } from '../../theme';
import { Paso } from './cierre-paso';
import type { ConteoCierre } from './use-conteo-cierre';

const BILLETES = DENOMINACIONES_MXN.filter((d) => d.tipo === 'billete');
const MONEDAS = DENOMINACIONES_MXN.filter((d) => d.tipo === 'moneda');
const NUM = { fontVariant: ['tabular-nums' as const] };

/** Only this kind's pieces, so each list shows its own subtotal. */
function subtotal(conteo: ConteoDenominaciones, lista: readonly Denominacion[]): bigint {
  const solo: Record<string, number> = {};
  for (const d of lista) solo[d.clave] = conteo[d.clave] ?? 0;
  return totalContado(solo);
}

function Lista(p: {
  titulo: string;
  lista: readonly Denominacion[];
  x: ConteoCierre;
}): ReactElement {
  return (
    <View>
      <View flexDirection="row" alignItems="center" paddingTop={10} paddingBottom={4}>
        <View flex={1}>
          <Eyebrow>{p.titulo}</Eyebrow>
        </View>
        <MText size="xs" weight="extraBold" {...NUM}>
          {formatMoney(subtotal(p.x.conteo, p.lista))}
        </MText>
      </View>
      {p.lista.map((d) => (
        <Paso key={d.clave} d={d} n={p.x.conteo[d.clave] ?? 0} poner={p.x.poner} />
      ))}
    </View>
  );
}

function Cabeza({ onLimpiar }: { onLimpiar: () => void }): ReactElement {
  return (
    <View
      flexDirection="row"
      alignItems="center"
      gap={10}
      paddingLeft={16}
      paddingRight={10}
      paddingVertical={8}
      backgroundColor={colors.gray100}
      borderBottomWidth={borderWidths.quiet}
      borderBottomColor={borderColors.quiet}
    >
      <View flex={1}>
        <Eyebrow>Cuenta el efectivo</Eyebrow>
      </View>
      <Btn variant="quiet" size="sm" onPress={onLimpiar} testID="cierre-limpiar">
        Empezar de cero
      </Btn>
    </View>
  );
}

function Contaste({ contado }: { contado: bigint }): ReactElement {
  return (
    <View
      flexDirection="row"
      alignItems="center"
      paddingHorizontal={16}
      paddingVertical={12}
      borderTopWidth={borderWidths.thin}
      borderTopColor={colors.black}
      backgroundColor={colors.yellowSoft}
    >
      <View flex={1}>
        <Eyebrow color={colors.ink}>Contaste</Eyebrow>
      </View>
      <MText size="xl5" weight="extraBold" letterSpacing={-0.9} testID="cierre-contado" {...NUM}>
        {formatMoney(contado)}
      </MText>
    </View>
  );
}

export function Conteo({ x }: { x: ConteoCierre }): ReactElement {
  return (
    <View
      role="region"
      aria-label="Cuenta el efectivo de la caja"
      testID="cierre-conteo"
      backgroundColor={colors.white}
      borderWidth={borderWidths.thick}
      borderColor={colors.black}
      borderRadius={radii[7]}
      overflow="hidden"
    >
      <Cabeza onLimpiar={x.limpiar} />
      <View paddingHorizontal={14} paddingBottom={8}>
        <Lista titulo="Billetes" lista={BILLETES} x={x} />
        <Lista titulo="Monedas" lista={MONEDAS} x={x} />
      </View>
      <Contaste contado={x.contado} />
    </View>
  );
}
