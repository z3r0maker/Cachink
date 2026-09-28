/**
 * «Recibir abono» (MvCobranza's sheet, the web's RecibirAbono): the amount on
 * the keypad or a quick one, how the client pays, where it lands and the new
 * balance, then one button. The abono is recorded whole through the use case
 * by the caller; an excess is saldo a favor, as on the web (ADR-083 D5).
 */
import { useState, type ReactElement } from 'react';
import { View } from '@tamagui/core';
import { estadoCuenta, type CuentaCliente, type MetodoAbono } from '@xangarro/caja/cobranza';
import { formatMoney, type Money } from '@xangarro/domain';
import { BottomSheet, Btn, MText } from '../../components/index';
import { colors } from '../../theme';
import { teclear } from '../Checkout/cobro-logic';
import { Metodo, Monto, SeAplica, Teclas } from './abono-partes';
import { estadoAbono, type EstadoAbono } from './cobranza-logic';

export interface AbonoSheetProps {
  readonly open: boolean;
  readonly cuenta: CuentaCliente;
  readonly registrando: boolean;
  readonly error: string | null;
  readonly onClose: () => void;
  readonly onRecibir: (metodo: MetodoAbono, monto: Money) => void;
}

function Cuerpo(
  p: AbonoSheetProps & {
    tecleado: string;
    setTecleado: (t: string) => void;
    metodo: MetodoAbono;
    setMetodo: (m: MetodoAbono) => void;
  },
): ReactElement {
  const e = estadoAbono(p.cuenta, p.tecleado);
  return (
    <View gap={12}>
      <Monto tecleado={p.tecleado} saldo={estadoCuenta(p.cuenta).saldo} onMonto={p.setTecleado} />
      <Metodo value={p.metodo} onChange={p.setMetodo} />
      <SeAplica e={e} />
      <Teclas onTecla={(k) => p.setTecleado(teclear(p.tecleado, k))} />
      {p.error ? (
        <MText role="alert" size="md" weight="bold" color={colors.redText} testID="abono-error">
          {p.error}
        </MText>
      ) : null}
    </View>
  );
}

function PieAbono(p: { e: EstadoAbono; registrando: boolean; onPress: () => void }): ReactElement {
  return (
    <Btn
      variant="primary"
      size="xl"
      sentence
      fullWidth
      disabled={!p.e.listo || p.registrando}
      loading={p.registrando}
      onPress={p.onPress}
      testID="abono-recibir"
    >
      {p.e.cta}
    </Btn>
  );
}

export function AbonoSheet(p: AbonoSheetProps): ReactElement {
  const [tecleado, setTecleado] = useState('');
  const [metodo, setMetodo] = useState<MetodoAbono>('Efectivo');
  const e = estadoAbono(p.cuenta, tecleado);
  const recibir = () => (e.monto === null ? undefined : p.onRecibir(metodo, e.monto));
  return (
    <BottomSheet
      open={p.open}
      onClose={p.onClose}
      eyebrow={`Recibir abono · debe ${formatMoney(estadoCuenta(p.cuenta).saldo)}`}
      title={p.cuenta.nombre}
      closeLabel="Cerrar sin recibir"
      testID="abono-sheet"
      footer={<PieAbono e={e} registrando={p.registrando} onPress={recibir} />}
    >
      <Cuerpo
        {...p}
        tecleado={tecleado}
        setTecleado={setTecleado}
        metodo={metodo}
        setMetodo={setMetodo}
      />
    </BottomSheet>
  );
}
