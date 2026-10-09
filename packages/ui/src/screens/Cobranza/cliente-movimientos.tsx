/**
 * The account's two lists (MvCobranzaCliente), the web's Detalle de cliente
 * translated: «Ventas abiertas» — oldest first, each with its due date said
 * against today and what was already paid on it — and «Movimientos», tickets
 * and abonos newest first, each abono saying which tickets it reached.
 */
import type { ReactElement } from 'react';
import { View } from '@tamagui/core';
import { formatMoney, type EstadoCuenta } from '@xangarro/domain';
import { abiertas, historial, vence, type CuentaCliente } from '@xangarro/caja/cobranza';
import { MText } from '../../components/Mostrador/index';
import { PathIcon } from '../../components/PathIcon/index';
import { QuietPanel } from '../../components/Panel/index';
import { borderColors, borderWidths, colors, radii, shapeRadii } from '../../theme';

const ARRIBA = 'M12 19V5M5 12l7-7 7 7';
const ABAJO = 'M12 5v14M5 12l7 7 7-7';
const CHECK = 'M20 6 9 17l-5-5';

const FILA = {
  flexDirection: 'row' as const,
  alignItems: 'center' as const,
  gap: 10,
  paddingVertical: 10,
  borderBottomWidth: borderWidths.quiet,
  borderBottomColor: borderColors.quiet,
} as const;

function FilaAbierta({
  x,
  due,
}: {
  readonly x: ReturnType<typeof abiertas>[number];
  readonly due: ReturnType<typeof vence>;
}): ReactElement {
  return (
    <View style={FILA}>
      <View flex={1} minWidth={0} gap={2} alignItems="flex-start">
        <MText size="sm" weight="extraBold" numberOfLines={1}>
          {`${x.venta.folio} · ${x.venta.concepto}`}
        </MText>
        <MText size="xs" weight="semibold" color={colors.gray600}>
          {`${x.venta.dia} · ${x.orden}`}
        </MText>
        <MText size="xs" weight="bold" color={due.vencido ? colors.redText : colors.gray600}>
          {due.texto}
        </MText>
        {x.pagado > 0n ? (
          <View
            backgroundColor={colors.blueSoft}
            borderRadius={shapeRadii.pill}
            paddingHorizontal={8}
            paddingVertical={2}
          >
            <MText size="tag" weight="extraBold" color={colors.blueText}>
              {`Ya abonó ${formatMoney(x.pagado)}`}
            </MText>
          </View>
        ) : null}
      </View>
      <MText size="body" weight="extraBold" fontVariant={['tabular-nums']}>
        {formatMoney(x.pendiente)}
      </MText>
    </View>
  );
}

function NoDebe(): ReactElement {
  return (
    <View padding={14} gap={6} alignItems="center">
      <View
        width={40}
        height={40}
        alignItems="center"
        justifyContent="center"
        borderRadius={shapeRadii.pill}
        borderWidth={borderWidths.thin}
        borderColor={colors.black}
        backgroundColor={colors.greenSoft}
      >
        <PathIcon d={CHECK} size={20} strokeWidth={2.6} color={colors.greenText} />
      </View>
      <MText size="body" weight="extraBold">
        No debe nada
      </MText>
      <MText size="sm" weight="semibold" color={colors.gray600} textAlign="center">
        Todas sus ventas fiadas están liquidadas.
      </MText>
    </View>
  );
}

/** «Ventas abiertas», oldest first; what they abono lands on the first one. */
export function VentasAbiertas(p: {
  readonly cuenta: CuentaCliente;
  readonly e: EstadoCuenta;
  readonly hoy: string;
}): ReactElement {
  const lista = abiertas(p.cuenta, p.e);
  return (
    <QuietPanel
      label="Ventas abiertas"
      count={lista.length}
      note="Lo que abone se aplica a la más antigua primero."
      padding={14}
      testID="cuenta-abiertas"
    >
      {lista.map((x) => (
        <FilaAbierta key={x.venta.folio} x={x} due={vence(x.venta.fecha, p.cuenta.plazo, p.hoy)} />
      ))}
      {lista.length === 0 ? <NoDebe /> : null}
    </QuietPanel>
  );
}

const ICONO = {
  width: 32,
  height: 32,
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: radii[2],
} as const;

function SelloMovimiento({ abono }: { readonly abono: boolean }): ReactElement {
  return (
    <View style={ICONO} backgroundColor={abono ? colors.greenSoft : colors.warningSoft} aria-hidden>
      <PathIcon
        d={abono ? ARRIBA : ABAJO}
        size={16}
        strokeWidth={2.4}
        color={abono ? colors.greenText : colors.warningText}
      />
    </View>
  );
}

function FilaMovimiento({
  m,
  ultima,
}: {
  readonly m: ReturnType<typeof historial>[number];
  readonly ultima: boolean;
}): ReactElement {
  const abono = m.tipo === 'abono';
  return (
    <View style={ultima ? { ...FILA, borderBottomWidth: 0 } : FILA}>
      <SelloMovimiento abono={abono} />
      <View flex={1} minWidth={0} gap={2} alignItems="flex-start">
        <MText size="sm" weight="extraBold" numberOfLines={1}>
          {m.titulo}
        </MText>
        <MText size="xs" weight="semibold" color={colors.gray600} numberOfLines={2}>
          {m.detalle}
        </MText>
      </View>
      <MText
        size="sm"
        weight="extraBold"
        color={abono ? colors.greenText : colors.black}
        fontVariant={['tabular-nums']}
      >
        {`${abono ? '−' : '+'}${formatMoney(m.monto)}`}
      </MText>
    </View>
  );
}

/** «Movimientos»: tickets (+) and abonos (−), newest first. */
export function Movimientos({ cuenta }: { readonly cuenta: CuentaCliente }): ReactElement {
  const movs = historial(cuenta);
  return (
    <QuietPanel label="Movimientos" count={movs.length} padding={14} testID="cuenta-movimientos">
      {movs.map((m, i) => (
        <FilaMovimiento key={`${m.tipo}${m.fecha}${i}`} m={m} ultima={i === movs.length - 1} />
      ))}
    </QuietPanel>
  );
}
