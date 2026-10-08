/**
 * The cancel dialog's pieces (MvVentas «cancelar-venta»): the sale it is
 * about, the motivo chips (one of four, required), the optional note's
 * footer, and the consequence and refusal avisos. Pure display; the step
 * machine and the write stay in `venta-cancelar.tsx`.
 */
import type { ReactElement } from 'react';
import { View } from '@tamagui/core';
import { formatMoney } from '@xangarro/domain';
import { MOTIVOS_CANCELAR, avisoCancelar, type VentaTurno } from '@xangarro/caja/ventas';
import { Btn } from '../../components/Btn/index';
import { Input } from '../../components/Input/index';
import { Chip } from '../../components/Chip/index';
import { MText } from '../../components/Mostrador/index';
import { Eyebrow } from '../../components/Panel/index';
import { borderColors, borderWidths, colors, radii } from '../../theme';

export function Resumen({ venta }: { readonly venta: VentaTurno }): ReactElement {
  return (
    <View
      padding={12}
      gap={6}
      borderRadius={radii[3]}
      borderWidth={borderWidths.thin}
      borderColor={colors.black}
      backgroundColor={colors.gray100}
      testID="cancelar-resumen"
    >
      <MText size="md" weight="bold">
        {venta.concepto}
      </MText>
      <View flexDirection="row" alignItems="baseline" gap={10}>
        <Eyebrow color={colors.gray600}>{`${venta.metodo} · ${venta.hora}`}</Eyebrow>
        <View flex={1} alignItems="flex-end">
          <MText size="xl3" weight="extraBold" style={{ fontVariant: ['tabular-nums'] }}>
            {formatMoney(venta.monto)}
          </MText>
        </View>
      </View>
    </View>
  );
}

/** The consequence, in amber; a refused cancellation, in red. */
export function Aviso(p: { readonly texto: string; readonly error?: boolean }): ReactElement {
  return (
    <View
      role={p.error ? 'alert' : undefined}
      padding={12}
      borderRadius={radii[3]}
      borderWidth={borderWidths.quiet}
      borderColor={borderColors.quiet}
      backgroundColor={p.error ? colors.redSoft : colors.warningSoft}
      testID={p.error ? 'cancelar-error' : 'cancelar-aviso'}
    >
      <MText size="sm" weight="bold" color={p.error ? colors.redText : colors.warningText}>
        {p.texto}
      </MText>
    </View>
  );
}

function MotivoChips(p: {
  readonly motivo: string | null;
  readonly onMotivo: (m: string) => void;
}): ReactElement {
  return (
    <View gap={8} alignItems="flex-start">
      <Eyebrow color={colors.gray600}>Motivo</Eyebrow>
      <View flexDirection="row" flexWrap="wrap" gap={8} role="radiogroup" aria-label="Motivo">
        {MOTIVOS_CANCELAR.map((m) => (
          <Chip
            key={m}
            label={m}
            marked
            selected={p.motivo === m}
            onPress={() => p.onMotivo(m)}
            testID={`cancelar-motivo-${m}`}
          />
        ))}
      </View>
    </View>
  );
}

function Pie(p: {
  readonly listo: boolean;
  readonly enviando: boolean;
  readonly onCancelar: () => void;
  readonly onVolver: () => void;
}): ReactElement {
  return (
    <View flexDirection="row" gap={10}>
      <Btn variant="secondary" size="xl" onPress={p.onVolver} testID="cancelar-volver">
        Volver
      </Btn>
      <View flex={1}>
        <Btn
          variant="destructiveFilled"
          size="xl"
          sentence
          fullWidth
          disabled={p.listo === false || p.enviando}
          loading={p.enviando}
          onPress={p.onCancelar}
          testID="cancelar-confirmar"
        >
          Cancelar la venta
        </Btn>
      </View>
    </View>
  );
}

/** The board's dialog body: the sale, one of its four motivos, the note, what it does. */
export function MotivoStep(p: {
  readonly venta: VentaTurno;
  readonly dueno: string;
  readonly motivo: string | null;
  readonly nota: string;
  readonly enviando: boolean;
  readonly onMotivo: (m: string) => void;
  readonly onNota: (n: string) => void;
  readonly onCancelar: () => void;
  readonly onVolver: () => void;
}): ReactElement {
  return (
    <View gap={12}>
      <Resumen venta={p.venta} />
      <MotivoChips motivo={p.motivo} onMotivo={p.onMotivo} />
      <Input
        label="Nota (opcional)"
        value={p.nota}
        onChange={p.onNota}
        placeholder="Se cobró de más"
        testID="cancelar-nota"
      />
      <Aviso texto={avisoCancelar(p.venta.metodo, p.venta.monto, p.venta.cliente, p.dueno)} />
      <Pie
        listo={p.motivo !== null}
        enviando={p.enviando}
        onCancelar={p.onCancelar}
        onVolver={p.onVolver}
      />
      {p.motivo === null ? (
        <MText size="xs" weight="semibold" color={colors.gray600}>
          Elige un motivo para cancelar.
        </MText>
      ) : null}
    </View>
  );
}
