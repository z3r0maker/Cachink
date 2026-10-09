/**
 * «Efectivo que debe haber en la caja» (Track M, M-09; the Turno board's
 * yellow hero): the figure, its four parts signed the way the board reads
 * them, the total row, and the one way out — «Cerrar mi turno».
 */
import type { ReactElement } from 'react';
import { View } from '@tamagui/core';
import { formatMoney } from '@xangarro/domain';
import type { TurnoData } from '@xangarro/caja/turno';
import { Btn } from '../../components/Btn/index';
import { MText } from '../../components/Mostrador/index';
import { Eyebrow, HeroPanel } from '../../components/Panel/index';
import { PathIcon } from '../../components/PathIcon/index';
import { borderWidths, colors } from '../../theme';

const CANDADO =
  'M5 11h14a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2ZM7 11V7a5 5 0 0 1 10 0v4';

/** The four parts, signed («+$1,980.00», «−$620.00»), the gasto in red. */
function partes(d: TurnoData): readonly {
  readonly label: string;
  readonly nota?: string;
  readonly valor: string;
  readonly rojo?: boolean;
}[] {
  return [
    { label: 'Fondo de caja', nota: 'con el que abriste', valor: formatMoney(d.fondo) },
    { label: 'Ventas en efectivo', valor: `+${formatMoney(d.ventasEfectivo)}` },
    { label: 'Abonos en efectivo', valor: `+${formatMoney(d.abonosEfectivo)}` },
    { label: 'Gastos de caja chica', valor: `−${formatMoney(d.gastosEfectivo)}`, rojo: true },
  ];
}

function Parte(p: {
  readonly label: string;
  readonly nota?: string;
  readonly valor: string;
  readonly rojo?: boolean;
  readonly ultima: boolean;
}): ReactElement {
  return (
    <View
      paddingBottom={8}
      borderBottomWidth={p.ultima ? 0 : borderWidths.thin}
      borderBottomColor={colors.yellowDeep}
      gap={2}
    >
      <View flexDirection="row" alignItems="baseline" gap={10}>
        <MText size="sm" weight="bold" flex={1}>
          {p.label}
        </MText>
        <MText
          size="body"
          weight="extraBold"
          fontVariant={['tabular-nums']}
          color={p.rojo ? colors.redText : colors.black}
        >
          {p.valor}
        </MText>
      </View>
      {p.nota ? (
        <MText size="xs" weight="semibold" color={colors.gray600}>
          {p.nota}
        </MText>
      ) : null}
    </View>
  );
}

/** The figure, what it is for, and the total it repeats. */
function Cifra(p: { readonly data: TurnoData }): ReactElement {
  return (
    <View gap={6}>
      <Eyebrow>Efectivo que debe haber en la caja</Eyebrow>
      <MText size="total" weight="extraBold" fontVariant={['tabular-nums']} letterSpacing={-1.4}>
        {formatMoney(p.data.esperado)}
      </MText>
      <MText size="sm" weight="semibold" color={colors.gray600}>
        Es lo que debes contar cuando cierres tu turno.
      </MText>
    </View>
  );
}

export function MiTurnoHero(p: {
  readonly data: TurnoData;
  /** «Cerrar mi turno»: opens the Cierre flow. */
  readonly onCerrar: () => void;
}): ReactElement {
  const filas = partes(p.data);
  return (
    <HeroPanel label="Efectivo que debe haber en la caja" testID="turno-hero">
      <View gap={16}>
        <Cifra data={p.data} />
        <View gap={8}>
          {filas.map((f, i) => (
            <Parte key={f.label} {...f} ultima={i === filas.length - 1} />
          ))}
        </View>
        <Total data={p.data} />
        <Btn
          variant="secondary"
          size="xl"
          sentence
          fullWidth
          icon={<PathIcon d={CANDADO} size={20} strokeWidth={2.4} />}
          onPress={p.onCerrar}
          testID="turno-cerrar-mi-turno"
        >
          Cerrar mi turno
        </Btn>
      </View>
    </HeroPanel>
  );
}

/** «Debe haber», the parts summed, above the way out. */
function Total(p: { readonly data: TurnoData }): ReactElement {
  return (
    <View
      flexDirection="row"
      alignItems="baseline"
      gap={10}
      paddingTop={4}
      borderTopWidth={borderWidths.thin}
      borderTopColor={colors.black}
    >
      <MText size="body" weight="extraBold" flex={1}>
        Debe haber
      </MText>
      <MText size="xl3" weight="extraBold" fontVariant={['tabular-nums']}>
        {formatMoney(p.data.esperado)}
      </MText>
    </View>
  );
}
