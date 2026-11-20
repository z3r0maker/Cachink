/**
 * A client's account (MvCobranzaCliente, RvFiado's client page): who they
 * are and their state, the balance, the four indicators, the open tickets
 * and the movements — all derived from the account's two facts (ADR-074) —
 * the owner's limit note, and the two actions: «Recibir abono» while they
 * owe, «Recordarle su saldo» always. The page around it is `ClienteScreen`.
 */
import type { ReactElement } from 'react';
import { View } from '@tamagui/core';
import { formatMoney, type Money } from '@xangarro/domain';
import {
  estadoCuenta,
  estadoCliente,
  limiteNota,
  type CuentaCliente,
} from '@xangarro/caja/cobranza';
import { Btn } from '../../components/Btn/index';
import { MText } from '../../components/Mostrador/index';
import { Eyebrow } from '../../components/Panel/index';
import { borderColors, borderWidths, colors, radii, shapeRadii } from '../../theme';
import { Indicadores } from './cliente-indicadores';
import { Movimientos, VentasAbiertas } from './cliente-movimientos';
import { EstadoChip } from './estado-chip';

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

export function CuentaPie({
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
        Recordarle su saldo
      </Btn>
    </View>
  );
}

/** The account's body, as the page scrolls it. */
export function CuentaCuerpo(p: {
  readonly cuenta: CuentaCliente;
  readonly hoy: string;
  readonly dueno: string;
}): ReactElement {
  const c = p.cuenta;
  const e = estadoCuenta(c);
  return (
    <View gap={14}>
      <Heroe c={c} e={e} />
      <Indicadores c={c} e={e} dueno={p.dueno} />
      <VentasAbiertas cuenta={c} e={e} hoy={p.hoy} />
      <Movimientos cuenta={c} />
      <LimiteNota nota={limiteNota(c, e, p.dueno)} />
    </View>
  );
}

/** The owner's limit in words; nothing when none is set (M4). */
function LimiteNota({ nota }: { readonly nota: string | null }): ReactElement | null {
  if (nota === null) return null;
  return (
    <View padding={14} borderRadius={radii[4]} backgroundColor={colors.yellowSoft}>
      <MText size="sm" weight="semibold" color={colors.ink}>
        {nota}
      </MText>
    </View>
  );
}
