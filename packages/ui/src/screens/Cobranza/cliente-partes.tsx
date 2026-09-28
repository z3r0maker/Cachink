/**
 * A client's account on the phone (MvCobranza, the client view): who they
 * are, the saldo hero (state, plazo and límite, how old the debt is, the last
 * abono), the open sales oldest first with what is left on each, and the
 * latest abonos. Derived by `@xangarro/caja/cobranza`, as the web's Detalle
 * de cliente.
 */
import type { ReactElement } from 'react';
import { View } from '@tamagui/core';
import {
  abiertas,
  antiguedad,
  estado,
  estadoCuenta,
  haceDiasTexto,
  ultimoAbono,
  type CuentaCliente,
} from '@xangarro/caja/cobranza';
import { formatMoney } from '@xangarro/domain';
import { Don, Eyebrow, HeroPanel, MText } from '../../components/index';
import { borderColors, borderWidths, colors, radii } from '../../theme';
import { colorSaldo, lineaAbierta } from './cobranza-logic';
import { Avatar, Cifra, EstadoChip } from './cobranza-partes';

export function ClienteCabeza({ c }: { readonly c: CuentaCliente }): ReactElement {
  const quien = [c.telefono, `desde ${c.desde}`].filter(Boolean).join(' · ');
  return (
    <View flexDirection="row" alignItems="center" gap={12}>
      <Avatar c={c} size={52} />
      <View flex={1} minWidth={0}>
        <MText
          textAlign="left"
          size="xl4"
          weight="extraBold"
          letterSpacing={-0.9}
          numberOfLines={1}
          role="heading"
        >
          {c.nombre}
        </MText>
        <MText textAlign="left" size="sm" weight="semibold" color={colors.textMuted}>
          {quien}
        </MText>
      </View>
    </View>
  );
}

function Dato(p: { label: string; valor: string; color?: string; testID: string }): ReactElement {
  return (
    <View flex={1} padding={10} gap={1} borderRadius={radii[3]} backgroundColor={colors.offwhite}>
      <MText textAlign="left" size="xs" weight="bold" color={colors.textMuted}>
        {p.label}
      </MText>
      <Cifra size="body" color={p.color} testID={p.testID}>
        {p.valor}
      </Cifra>
    </View>
  );
}

/** «Plazo 15 días · límite $1,500.00»; nothing when the owner set neither. */
function condiciones(c: CuentaCliente): string | null {
  if (c.plazo === '' && c.limite === 0n) return null;
  return [
    c.plazo ? `Plazo ${c.plazo}` : null,
    c.limite > 0n ? `límite ${formatMoney(c.limite)}` : null,
  ]
    .filter(Boolean)
    .join(' · ');
}

export function SaldoHero(p: { readonly c: CuentaCliente; readonly hoy: string }): ReactElement {
  const e = estadoCuenta(p.c);
  const a = antiguedad(p.c, p.hoy);
  const cond = condiciones(p.c);
  const atrasado = estado(p.c) === 'Atrasado';
  return (
    <HeroPanel tone="white" label="Saldo" testID="cliente-saldo">
      <View gap={6}>
        <View flexDirection="row" alignItems="center" gap={8}>
          <Eyebrow>Saldo</Eyebrow>
          <EstadoChip c={p.c} />
        </View>
        <Cifra size="display" color={colorSaldo(e.saldo)} testID="cliente-saldo-monto">
          {formatMoney(e.saldo)}
        </Cifra>
        {cond ? (
          <MText textAlign="left" size="sm" weight="semibold" color={colors.gray600}>
            {cond}
          </MText>
        ) : null}
        <View flexDirection="row" gap={8} marginTop={4}>
          <Dato
            label="Debe desde hace"
            valor={a.diasDeuda === null ? 'No debe' : haceDiasTexto(a.diasDeuda)}
            color={atrasado ? colors.redText : colors.black}
            testID="cliente-dias-deuda"
          />
          <Dato
            label="Último abono"
            valor={ultimoAbono(p.c)?.dia ?? 'Sin abonos'}
            testID="cliente-ultimo-abono"
          />
        </View>
      </View>
    </HeroPanel>
  );
}

export const FILA = {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 10,
  paddingVertical: 10,
  paddingHorizontal: 12,
  borderRadius: radii[3],
  borderWidth: borderWidths.quiet,
  borderColor: borderColors.quiet,
  backgroundColor: colors.white,
} as const;

function SinSaldo(): ReactElement {
  return (
    <View
      testID="cliente-sin-saldo"
      flexDirection="row"
      alignItems="center"
      gap={12}
      padding={12}
      borderRadius={radii[6]}
      borderWidth={borderWidths.quiet}
      borderColor={colors.greenText}
      backgroundColor={colors.greenSoft}
    >
      <Don pose="celebrando" size={60} />
      <MText textAlign="left" flex={1} size="md" weight="bold">
        No debe nada. Cuando le fíes algo, aquí vas a ver sus ventas abiertas.
      </MText>
    </View>
  );
}

export function Abiertas({ c }: { readonly c: CuentaCliente }): ReactElement {
  const vivas = abiertas(c, estadoCuenta(c));
  if (vivas.length === 0) return <SinSaldo />;
  return (
    <View gap={6} role="list" aria-label="Ventas abiertas" testID="cliente-abiertas">
      <Eyebrow>{`Ventas abiertas · ${vivas.length}`}</Eyebrow>
      {vivas.map((a) => (
        <View key={a.venta.folio} role="listitem" {...FILA}>
          <Cifra size="sm">{a.venta.folio}</Cifra>
          <View flex={1} minWidth={0}>
            <MText textAlign="left" size="md" weight="bold" numberOfLines={1}>
              {a.venta.concepto}
            </MText>
            <MText
              textAlign="left"
              size="xs"
              weight="semibold"
              color={colors.textMuted}
              numberOfLines={1}
            >
              {lineaAbierta(a)}
            </MText>
          </View>
          <Cifra size="body" color={colors.warningText}>
            {formatMoney(a.pendiente)}
          </Cifra>
        </View>
      ))}
    </View>
  );
}
