/**
 * «Pagar» a due recurring gasto (M-08, the phone's pagar-recurrente): the
 * sheet opens filled from the template — the amount and the words can still
 * be corrected — and one write records the egreso and advances the schedule,
 * so the row leaves «Pendientes de registrar» and Inicio's «Para hoy».
 */
import type { ReactElement } from 'react';
import { View } from '@tamagui/core';
import { formatMoney } from '@xangarro/domain';
import { mayuscula } from '@xangarro/caja';
import { chipVence, type NuevoGasto, type RecurrentePorPagar } from '@xangarro/caja/gastos';
import { detalleRecurrente } from '@xangarro/caja/turno';
import { BottomSheet } from '../../components/BottomSheet/index';
import { MText } from '../../components/Mostrador/index';
import { Eyebrow } from '../../components/Panel/index';
import { borderColors, borderWidths, colors, radii } from '../../theme';
import { Categorias, Concepto, Monto, NotaFirma, PieGasto, Proveedor } from './gasto-campos';
import { useGastoForm, useGuardarHoja } from './use-gasto-form';

const minuscula = (s: string): string => `${s.charAt(0).toLowerCase()}${s.slice(1)}`;

/** The template as a card: what it is, when it was due, what it costs. */
function Tarjeta({ x }: { readonly x: RecurrentePorPagar }): ReactElement {
  return (
    <View
      testID="pagar-recurrente-tarjeta"
      gap={6}
      padding={12}
      borderRadius={radii[4]}
      borderWidth={borderWidths.quiet}
      borderColor={borderColors.quiet}
      backgroundColor={colors.gray100}
    >
      <Eyebrow color={colors.gray600}>{detalleRecurrente(x.para)}</Eyebrow>
      <View flexDirection="row" alignItems="baseline" gap={10} flexWrap="wrap">
        <MText size="xl2" weight="extraBold" flex={1}>
          {mayuscula(x.para.concepto)}
        </MText>
        {/* A due template is vence ≤ 0 (`comoRecurrente` clamps), so it always reads red here. */}
        <MText size="body" weight="extraBold" color={colors.redText}>
          {`${chipVence(x.para.vence)} · ${formatMoney(BigInt(x.para.montoCentavos))}`}
        </MText>
      </View>
    </View>
  );
}

export interface PagarRecurrenteSheetProps {
  readonly open: boolean;
  /** The due recurring gasto to pay, with what the sheet opens filled with. */
  readonly x: RecurrentePorPagar;
  /** «Ana Robledo, Caja 1», from the session. */
  readonly firma: string;
  readonly onClose: () => void;
  readonly onGuardar: (n: NuevoGasto) => Promise<void>;
}

function Abierto(p: PagarRecurrenteSheetProps): ReactElement {
  const f = useGastoForm(p.x.prefill);
  const { guardando, error, guardar } = useGuardarHoja(p.onGuardar, p.onClose);
  return (
    <BottomSheet
      open
      onClose={p.onClose}
      eyebrow="Gasto que se repite"
      title={`Pagar ${minuscula(p.x.para.concepto)}`}
      closeLabel="Cerrar sin pagar"
      testID="pagar-recurrente-sheet"
      footer={
        <PieGasto
          f={f}
          guardando={guardando}
          error={error}
          onCancelar={p.onClose}
          onGuardar={() => void guardar(f.payload())}
        />
      }
    >
      <View gap={18}>
        <Tarjeta x={p.x} />
        <Concepto f={f} />
        <Monto f={f} />
        <Categorias f={f} />
        <Proveedor f={f} />
        <NotaFirma firma={p.firma} />
      </View>
    </BottomSheet>
  );
}

export function PagarRecurrenteSheet(p: PagarRecurrenteSheetProps): ReactElement | null {
  return p.open ? <Abierto {...p} /> : null;
}
