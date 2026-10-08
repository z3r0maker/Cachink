/**
 * The figures of «Fiado y abonos» (MvCobranzaLista): the three the board puts
 * under the title — por cobrar, abonos de hoy, en efectivo, each with its hint
 * (`kpisCobranza` in the caja package) — and «Abonos que recibiste hoy» as a
 * quiet panel, newest first, with the operator's note when there is one.
 */
import type { ReactElement } from 'react';
import { View } from '@tamagui/core';
import { formatMoney } from '@xangarro/domain';
import {
  abonosDeHoy,
  kpisCobranza,
  type AbonoDelDia,
  type CuentaCliente,
} from '@xangarro/caja/cobranza';
import { MText } from '../../components/Mostrador/index';
import { QuietPanel } from '../../components/Panel/index';
import { borderColors, borderWidths, colors } from '../../theme';

function Cifra(p: {
  readonly label: string;
  readonly value: string;
  readonly hint: string;
  readonly color: string;
  readonly fuerte: boolean;
}): ReactElement {
  return (
    <View
      flexDirection="row"
      alignItems="baseline"
      gap={10}
      paddingVertical={8}
      borderBottomWidth={borderWidths.quiet}
      borderBottomColor={borderColors.quiet}
    >
      <View flex={1} gap={2} alignItems="flex-start">
        <MText
          size="xs"
          weight="extraBold"
          letterSpacing={1.2}
          color={p.fuerte ? colors.ink : colors.textMuted}
          style={{ textTransform: 'uppercase' }}
        >
          {p.label}
        </MText>
        <MText size="xs" weight="semibold" color={colors.gray600}>
          {p.hint}
        </MText>
      </View>
      <MText size="xl3" weight="extraBold" color={p.color} fontVariant={['tabular-nums']}>
        {p.value}
      </MText>
    </View>
  );
}

/** The board's three figures, stacked on one panel. */
export function ResumenFiado(p: {
  readonly cuentas: readonly CuentaCliente[];
  readonly hoy: string;
}): ReactElement {
  const items = kpisCobranza(p.cuentas, p.hoy);
  return (
    <QuietPanel label="Resumen de fiado" padding={14} testID="cobranza-kpis">
      {items.map((k, i) => (
        <Cifra
          key={k.label}
          label={k.label}
          value={k.value}
          hint={k.hint}
          color={k.color}
          fuerte={k.strong === true && i === 0}
        />
      ))}
    </QuietPanel>
  );
}

function FilaAbono({
  a,
  ultima,
}: {
  readonly a: AbonoDelDia;
  readonly ultima: boolean;
}): ReactElement {
  return (
    <View
      flexDirection="row"
      alignItems="center"
      gap={10}
      paddingVertical={10}
      borderBottomWidth={ultima ? 0 : borderWidths.quiet}
      borderBottomColor={borderColors.quiet}
    >
      <MText size="sm" weight="extraBold" color={colors.gray600} fontVariant={['tabular-nums']}>
        {a.hora}
      </MText>
      <View flex={1} minWidth={0} gap={2} alignItems="flex-start">
        <MText size="sm" weight="extraBold" numberOfLines={1}>
          {a.cliente}
        </MText>
        <MText size="xs" weight="semibold" color={colors.gray600} numberOfLines={2}>
          {a.detalle}
        </MText>
      </View>
      <MText size="body" weight="extraBold" color={colors.greenText} fontVariant={['tabular-nums']}>
        {formatMoney(a.monto)}
      </MText>
    </View>
  );
}

/** «Abonos que recibiste hoy», newest first; nothing when there were none. */
export function AbonosHoyPanel(p: {
  readonly cuentas: readonly CuentaCliente[];
  readonly hoy: string;
}): ReactElement | null {
  const abonos = abonosDeHoy(p.cuentas, p.hoy);
  if (abonos.length === 0) return null;
  return (
    <QuietPanel
      label="Abonos que recibiste hoy"
      count={abonos.length}
      padding={14}
      testID="cobranza-abonos-hoy"
    >
      {abonos.map((a, i) => (
        <FilaAbono key={a.id} a={a} ultima={i === abonos.length - 1} />
      ))}
    </QuietPanel>
  );
}
