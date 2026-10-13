/**
 * A client's account (MvCobranzaCliente), the web's Detalle de cliente on a
 * bottom sheet: who they are and their state, the balance, the four
 * indicators, the open tickets and the movements — all derived from the
 * account's two facts (ADR-074) — the owner's limit note, and the two
 * actions: «Recibir abono» while they owe, «Recordarle por WhatsApp» always.
 */
import { useMemo, type ReactElement } from 'react';
import { View } from '@tamagui/core';
import { formatMoney, type Money } from '@xangarro/domain';
import {
  estadoCuenta,
  estadoCliente,
  limiteNota,
  type CuentaCliente,
} from '@xangarro/caja/cobranza';
import { BottomSheet } from '../../components/BottomSheet/index';
import { Btn } from '../../components/Btn/index';
import { MText } from '../../components/Mostrador/index';
import { Eyebrow } from '../../components/Panel/index';
import { borderColors, borderWidths, colors, radii, shapeRadii } from '../../theme';
import { Indicadores } from './cliente-indicadores';
import { Movimientos, VentasAbiertas } from './cliente-movimientos';
import { EstadoChip } from './cuenta-tarjeta';

type Estado = ReturnType<typeof estadoCuenta>;

const TONO: Record<string, { fondo: string }> = {
  'Al día': { fondo: colors.white },
  Atrasado: { fondo: colors.warningSoft },
  'Sin saldo': { fondo: colors.greenSoft },
};

function SaldoGrande({ saldo }: { readonly saldo: Money }): ReactElement {
  return (
    <View alignItems="flex-end" gap={2}>
      <Eyebrow>Saldo</Eyebrow>
      <MText size="balance" weight="extraBold" fontVariant={['tabular-nums']} letterSpacing={-1}>
        {formatMoney(saldo)}
      </MText>
    </View>
  );
}

function Quien({ c }: { readonly c: CuentaCliente }): ReactElement {
  return (
    <View flex={1} minWidth={0} gap={4} alignItems="flex-start">
      <MText size="sectionTitle" weight="extraBold" numberOfLines={1}>
        {c.nombre}
      </MText>
      <MText size="xs" weight="semibold" color={colors.gray600}>
        {`${c.telefono} · cliente desde ${c.desde}`}
      </MText>
    </View>
  );
}

function Heroe({ c, e }: { readonly c: CuentaCliente; readonly e: Estado }): ReactElement {
  return (
    <View
      flexDirection="row"
      alignItems="center"
      gap={12}
      padding={14}
      borderRadius={radii[5]}
      borderWidth={borderWidths.quiet}
      borderColor={borderColors.quiet}
      backgroundColor={TONO[estadoCliente(c, e)]?.fondo ?? colors.white}
    >
      <View
        width={48}
        height={48}
        alignItems="center"
        justifyContent="center"
        borderRadius={shapeRadii.pill}
        borderWidth={borderWidths.thin}
        borderColor={colors.black}
        backgroundColor={c.tint}
        aria-hidden
      >
        <MText size="body" weight="extraBold">
          {c.iniciales}
        </MText>
      </View>
      <Quien c={c} />
      <EstadoChip x={c} testID="cuenta-estado" />
      <SaldoGrande saldo={e.saldo} />
    </View>
  );
}

function Pie({
  debe,
  onAbonar,
  onRecordar,
}: {
  readonly debe: boolean;
  readonly onAbonar: () => void;
  readonly onRecordar: () => void;
}): ReactElement {
  return (
    <View gap={8}>
      <Btn
        variant="primary"
        size="xl"
        sentence
        fullWidth
        disabled={!debe}
        onPress={onAbonar}
        testID="cuenta-abonar"
      >
        {debe ? 'Recibir abono' : 'Sin saldo por cobrar'}
      </Btn>
      <Btn
        variant="secondary"
        size="xl"
        sentence
        fullWidth
        onPress={onRecordar}
        testID="cuenta-recordar"
      >
        Recordarle por WhatsApp
      </Btn>
    </View>
  );
}

export interface ClienteCuentaProps {
  readonly open: boolean;
  readonly cuenta: CuentaCliente;
  readonly hoy: string;
  readonly dueno: string;
  readonly onClose: () => void;
  readonly onAbonar: () => void;
  readonly onRecordar: () => void;
}

/** The account sheet; the balance and its derivations come from the facts. */
export function ClienteCuentaSheet(p: ClienteCuentaProps): ReactElement {
  const c = p.cuenta;
  const e = useMemo(() => estadoCuenta(p.cuenta), [p.cuenta]);
  return (
    <BottomSheet
      open={p.open}
      onClose={p.onClose}
      eyebrow="Cuenta de fiado"
      title={c.nombre}
      testID="cuenta-sheet"
      footer={<Pie debe={e.saldo > 0n} onAbonar={p.onAbonar} onRecordar={p.onRecordar} />}
    >
      <View gap={14}>
        <Heroe c={c} e={e} />
        <Indicadores c={c} e={e} dueno={p.dueno} />
        <VentasAbiertas cuenta={c} e={e} hoy={p.hoy} />
        <Movimientos cuenta={c} />
        <View padding={14} borderRadius={radii[4]} backgroundColor={colors.yellowSoft}>
          <MText size="sm" weight="semibold" color={colors.ink}>
            {limiteNota(c, e, p.dueno)}
          </MText>
        </View>
      </View>
    </BottomSheet>
  );
}
