/**
 * «Registrar gasto» (MvGastos' sheet; the web's `gastos/registrar.tsx`):
 * money that leaves the drawer and lowers the expected cash. Opened empty
 * from the screen's button, or filled from a due recurring gasto. The parent
 * mounts it with a `key` per opening, so each one starts clean.
 */
import { useState, type ReactElement } from 'react';
import { View } from '@tamagui/core';
import { formatMoney } from '@xangarro/domain';
import type { NuevoGasto, PrefillGasto } from '@xangarro/caja/gastos';
import { BottomSheet } from '../../components/BottomSheet/index';
import { Btn } from '../../components/Btn/index';
import { MText } from '../../components/Mostrador/index';
import { colors } from '../../theme';
import { Nota } from '../VentasTurno/venta-sheet-partes';
import { Campo, Categorias, Cuanto } from './gasto-campos';
import { faltante, formInicial, montoDe, nuevoDe, teclear, type GastoForm } from './gasto-form';

export interface RegistrarGastoSheetProps {
  readonly open: boolean;
  readonly prefill: PrefillGasto | null;
  /** «Ana Robledo, Caja 1»: whose name the gasto goes under. */
  readonly quien: string | null;
  /** Resolves to the error to show, or null once saved. */
  readonly onGuardar: (n: NuevoGasto) => Promise<string | null>;
  readonly onClose: () => void;
}

function Pie(p: {
  readonly f: GastoForm;
  readonly enviando: boolean;
  readonly onGuardar: () => void;
  readonly onClose: () => void;
}): ReactElement {
  const monto = montoDe(p.f);
  const falta = faltante(p.f);
  return (
    <View gap={8}>
      {falta ? (
        <MText size="sm" weight="semibold" color={colors.textMuted} textAlign="center">
          {falta}
        </MText>
      ) : null}
      <View flexDirection="row" gap={10}>
        <Btn variant="quiet" size="xl" onPress={p.onClose} testID="gasto-cancelar">
          Cancelar
        </Btn>
        <View flex={1}>
          <Btn
            variant="primary"
            size="xl"
            sentence
            fullWidth
            disabled={falta !== null}
            loading={p.enviando}
            onPress={p.onGuardar}
            testID="gasto-guardar"
          >
            {`Registrar gasto de ${monto === null ? '$___' : formatMoney(monto)}`}
          </Btn>
        </View>
      </View>
    </View>
  );
}

function Preguntas(p: {
  readonly f: GastoForm;
  readonly setF: (fn: (x: GastoForm) => GastoForm) => void;
  readonly quien: string | null;
  readonly error: string | null;
}): ReactElement {
  const set = (parte: Partial<GastoForm>): void => p.setF((x) => ({ ...x, ...parte }));
  return (
    <View gap={16}>
      <MText size="sm" weight="semibold" color={colors.gray600}>
        Sale del efectivo de tu caja y baja lo esperado en tu corte.
      </MText>
      <Cuanto raw={p.f.monto.raw} onTecla={(t) => p.setF((x) => teclear(x, t))} />
      <Campo
        pregunta="¿Qué compraste?"
        placeholder="Cilindro de gas"
        value={p.f.concepto}
        onChange={(concepto) => set({ concepto })}
        maxLength={200}
        testID="gasto-concepto"
      />
      <Categorias value={p.f.categoria} onChange={(categoria) => set({ categoria })} />
      <Campo
        pregunta="¿A quién le pagaste?"
        opcional
        placeholder="La tienda, el gasero, el taxista"
        value={p.f.proveedor}
        onChange={(proveedor) => set({ proveedor })}
        maxLength={120}
        testID="gasto-proveedor"
      />
      {p.quien ? (
        <MText size="sm" weight="semibold" color={colors.textMuted}>
          {`Queda a tu nombre: ${p.quien}.`}
        </MText>
      ) : null}
      {p.error ? <Nota tono="rojo" texto={p.error} testID="gasto-error" /> : null}
    </View>
  );
}

export function RegistrarGastoSheet(p: RegistrarGastoSheetProps): ReactElement {
  const [f, setF] = useState<GastoForm>(() => formInicial(p.prefill));
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const guardar = (): void => {
    const n = nuevoDe(f);
    if (n === null) return;
    setEnviando(true);
    setError(null);
    void p.onGuardar(n).then((e) => {
      setEnviando(false);
      setError(e);
    });
  };
  return (
    <BottomSheet
      open={p.open}
      onClose={p.onClose}
      eyebrow={p.prefill ? 'Gasto que se repite' : 'Gasto de caja chica'}
      title="Registrar gasto"
      closeLabel="Cerrar sin registrar"
      testID="registrar-gasto"
      footer={<Pie f={f} enviando={enviando} onGuardar={guardar} onClose={p.onClose} />}
    >
      <Preguntas f={f} setF={setF} quien={p.quien} error={error} />
    </BottomSheet>
  );
}
