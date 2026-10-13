/**
 * The account's four indicators (MvCobranzaCliente), the web's Detalle de
 * cliente `Indicadores`: the open tickets with the oldest one's day, the
 * owner's limit and plazo, what is left to fiar, and the last abono.
 */
import type { ReactElement } from 'react';
import { View } from '@tamagui/core';
import { formatMoney } from '@xangarro/domain';
import type { estadoCuenta } from '@xangarro/caja/cobranza';
import { abiertas, libre, ultimoAbono, type CuentaCliente } from '@xangarro/caja/cobranza';
import { MText } from '../../components/Mostrador/index';
import { borderColors, borderWidths, colors, radii } from '../../theme';

type Estado = ReturnType<typeof estadoCuenta>;

const MARCO = {
  flex: 1,
  minWidth: 0,
  gap: 3,
  paddingHorizontal: 12,
  paddingVertical: 10,
  borderRadius: radii[3],
  borderWidth: borderWidths.quiet,
  borderColor: borderColors.quiet,
  backgroundColor: colors.white,
} as const;

function Indicador({
  label,
  valor,
  hint,
  color,
}: {
  readonly label: string;
  readonly valor: string;
  readonly hint: string;
  readonly color: string;
}): ReactElement {
  return (
    <View style={MARCO}>
      <MText
        size="xs"
        weight="extraBold"
        letterSpacing={1.2}
        color={colors.textMuted}
        style={{ textTransform: 'uppercase' }}
      >
        {label}
      </MText>
      <MText size="xl" weight="extraBold" color={color} fontVariant={['tabular-nums']}>
        {valor}
      </MText>
      <MText size="xs" weight="semibold" color={colors.gray600}>
        {hint}
      </MText>
    </View>
  );
}

export function Indicadores({
  c,
  e,
  dueno,
}: {
  readonly c: CuentaCliente;
  readonly e: Estado;
  readonly dueno: string;
}): ReactElement {
  const vieja = abiertas(c, e)[0];
  const ultimo = ultimoAbono(c);
  return (
    <View flexDirection="row" gap={8} flexWrap="wrap" testID="cuenta-indicadores">
      <Indicador
        label="Ventas abiertas"
        valor={String(abiertas(c, e).length)}
        hint={vieja ? `La más antigua es del ${vieja.venta.dia}` : 'Ninguna pendiente'}
        color={colors.black}
      />
      <Indicador
        label="Límite de fiado"
        valor={formatMoney(c.limite)}
        hint={`Lo fijó ${dueno} · plazo ${c.plazo}`}
        color={e.saldo * 10n > c.limite * 8n ? colors.redText : colors.black}
      />
      <Indicador
        label="Disponible"
        valor={formatMoney(libre(c, e))}
        hint="Lo que le puedes fiar hoy"
        color={colors.greenText}
      />
      <Indicador
        label="Último abono"
        valor={ultimo ? formatMoney(ultimo.monto) : 'Ninguno'}
        hint={ultimo ? `${ultimo.dia} · ${ultimo.metodo.toLowerCase()}` : 'Todavía no ha abonado'}
        color={colors.black}
      />
    </View>
  );
}
