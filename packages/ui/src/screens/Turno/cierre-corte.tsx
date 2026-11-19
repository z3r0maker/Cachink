/**
 * «Corte de caja» (M-16, MvCierreFlujo): the closed turno as a printed-style
 * ticket — the business, the caja, the operator and the hours; Contado,
 * Esperado and the difference tinted by its kind; the sales; and at its foot
 * the reminder that the counted cash is los patrones' (ADR-146: a reminder,
 * not a record).
 */
import type { ReactElement } from 'react';
import { View } from '@tamagui/core';
import { formatMoney } from '@xangarro/domain';
import {
  conSigno,
  DIF,
  recordatorioEfectivo,
  type CierreData,
  type EstadoConteo,
} from '@xangarro/caja/cierre';
import { MText } from '../../components/Mostrador/index';
import { Eyebrow } from '../../components/Panel/index';
import { PathIcon } from '../../components/PathIcon/index';
import { borderColors, borderWidths, colors, radii, shadows, shapeRadii } from '../../theme';

const BILLETE = 'M2 6h20v12H2V6Zm10 4a2 2 0 1 0 0 4 2 2 0 0 0 0-4M6 12h.01M18 12h.01';

function Renglon(p: { readonly k: string; readonly v: string; readonly color?: string }) {
  return (
    <View flexDirection="row" alignItems="center" minHeight={30}>
      <MText size="md" weight="semibold" color={colors.gray600} flex={1}>
        {p.k}
      </MText>
      <MText size="lg" weight="extraBold" fontVariant={['tabular-nums']} color={p.color}>
        {p.v}
      </MText>
    </View>
  );
}

function Regla(): ReactElement {
  return <View height={borderWidths.quiet} backgroundColor={borderColors.quiet} aria-hidden />;
}

function Cabeza(p: { readonly data: CierreData; readonly fecha: string }): ReactElement {
  const d = p.data;
  return (
    <View gap={2}>
      <View flexDirection="row" alignItems="center">
        <Eyebrow>Corte de caja</Eyebrow>
        <View
          marginLeft="auto"
          paddingHorizontal={9}
          paddingVertical={2}
          borderRadius={shapeRadii.pill}
          backgroundColor={colors.gray100}
        >
          <MText size="xs" weight="extraBold" fontVariant={['tabular-nums']}>
            {`${p.fecha} · ${d.hasta}`}
          </MText>
        </View>
      </View>
      {d.negocio === undefined ? null : (
        <MText size="sectionTitle" weight="extraBold" letterSpacing={-0.4}>
          {d.negocio}
        </MText>
      )}
      <MText size="sm" weight="semibold" color={colors.gray600} fontVariant={['tabular-nums']}>
        {`${d.caja} · ${d.operador} · ${d.desde} a ${d.hasta}`}
      </MText>
    </View>
  );
}

function Diferencia(p: { readonly e: EstadoConteo }): ReactElement {
  const t = DIF[p.e.dif.tipo];
  return (
    <View
      flexDirection="row"
      alignItems="center"
      minHeight={44}
      marginTop={4}
      paddingHorizontal={12}
      borderRadius={radii[3]}
      borderWidth={borderWidths.quiet}
      borderColor={t.color}
      backgroundColor={t.bg}
      testID="cierre-corte-diferencia"
    >
      <MText size="body" weight="extraBold" color={t.color} flex={1}>
        Diferencia
      </MText>
      <MText size="xl" weight="extraBold" fontVariant={['tabular-nums']} color={t.color}>
        {conSigno(p.e.dif)}
      </MText>
    </View>
  );
}

/** The counted cash is the owner's: the reminder at the ticket's foot. */
function Recordatorio(p: { readonly contado: bigint }): ReactElement {
  return (
    <View
      testID="cierre-recordatorio"
      flexDirection="row"
      alignItems="center"
      gap={10}
      paddingHorizontal={18}
      paddingVertical={12}
      borderTopWidth={borderWidths.thin}
      borderTopColor={colors.black}
      backgroundColor={colors.yellowSoft}
      borderBottomLeftRadius={radii[6]}
      borderBottomRightRadius={radii[6]}
    >
      <PathIcon d={BILLETE} size={22} strokeWidth={2} />
      <MText size="md" weight="extraBold" flex={1}>
        {recordatorioEfectivo(p.contado)}
      </MText>
    </View>
  );
}

export function CierreCorte(p: {
  readonly data: CierreData;
  readonly e: EstadoConteo;
  readonly fecha: string;
}): ReactElement {
  const r = p.data.resumen;
  return (
    <View
      testID="cierre-corte"
      role="region"
      aria-label="Corte de caja"
      backgroundColor={colors.white}
      borderWidth={borderWidths.thick}
      borderColor={colors.black}
      borderRadius={radii[7]}
      style={{ boxShadow: shadows.card }}
    >
      <View paddingHorizontal={18} paddingTop={14} paddingBottom={10} gap={10}>
        <Cabeza data={p.data} fecha={p.fecha} />
        <Regla />
        <View>
          <Renglon k="Contado" v={formatMoney(p.e.contado)} />
          <Renglon k="Esperado" v={formatMoney(p.e.esperado)} />
          <Diferencia e={p.e} />
        </View>
        <Regla />
        <Renglon
          k={r.ventas === 1 ? '1 venta' : `${r.ventas} ventas`}
          v={formatMoney(r.cobrado)}
          color={colors.greenText}
        />
      </View>
      <Recordatorio contado={p.e.contado} />
    </View>
  );
}
