/**
 * «Recibir abono» (MvCobranzaAbono): the web's modal on a bottom sheet. How
 * much they abono (free or one of the quick amounts), how they pay, and where
 * the amount would land — oldest ticket first, an excess as saldo a favor
 * (D5: the whole amount is recorded). The action is disabled until the amount
 * parses («Escribe cuánto abona» says why), exactly the web's rules.
 */
import type { ReactElement } from 'react';
import { View } from '@tamagui/core';
import { formatMoney, type Money } from '@xangarro/domain';
import type { CuentaCliente, MetodoAbono } from '@xangarro/caja/cobranza';
import { BottomSheet } from '../../components/BottomSheet/index';
import { MText } from '../../components/Mostrador/index';
import { Eyebrow } from '../../components/Panel/index';
import { useAbono } from './abono-forma';
import { CuantoAbona, Metodos, PieAbono, SeAplica } from './abono-campos';

export interface RecibirAbonoSheetProps {
  readonly open: boolean;
  readonly cuenta: CuentaCliente;
  readonly onClose: () => void;
  /** Returns the error message, or null when the abono landed. */
  readonly onGuardar: (metodo: MetodoAbono, monto: Money) => Promise<string | null>;
}

export function RecibirAbonoSheet(p: RecibirAbonoSheetProps): ReactElement {
  const x = useAbono(p.cuenta);
  const guardar = async (): Promise<void> => {
    if (x.monto !== null) await p.onGuardar(x.metodo, x.monto);
  };
  return (
    <BottomSheet
      open={p.open}
      onClose={p.onClose}
      eyebrow="Recibir abono"
      title={`Abono de ${p.cuenta.nombre}`}
      testID="abono-sheet"
      footer={<PieAbono monto={x.monto} onClose={p.onClose} guardar={() => void guardar()} />}
    >
      <View gap={16}>
        <View flexDirection="row" alignItems="baseline" justifyContent="space-between">
          <Eyebrow>Saldo actual</Eyebrow>
          <MText size="xl3" weight="extraBold" fontVariant={['tabular-nums']}>
            {formatMoney(x.saldo)}
          </MText>
        </View>
        <CuantoAbona x={x} />
        <View gap={8}>
          <Eyebrow>Cómo paga</Eyebrow>
          <Metodos value={x.metodo} onChange={x.setMetodo} />
        </View>
        <SeAplica x={x} />
      </View>
    </BottomSheet>
  );
}
