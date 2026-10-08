/**
 * «¿Cancelar la venta V-0412?» (MvCancelarVenta, the web's `CancelarVenta`):
 * a centred dialog with Don worried, the sale in one line, a required
 * motive, an optional note for the owner, the NIP, and what cancelling does
 * to the money (`consecuencia`). A refusal (wrong NIP, no permission) stays
 * in the dialog. Rendered only while a sale is chosen, so each opening
 * starts clean.
 */
import { useState, type ReactElement } from 'react';
import { ScrollView, useWindowDimensions } from 'react-native';
import { View } from '@tamagui/core';
import { formatMoney, PIN_LENGTH } from '@xangarro/domain';
import { consecuencia, type VentaTurno } from '@xangarro/caja/ventas';
import { Btn } from '../../components/Btn/index';
import { Dialog } from '../../components/Dialog/index';
import { Don } from '../../components/Don/index';
import { MText } from '../../components/Mostrador/index';
import { colors } from '../../theme';
import { Motivos, NipCampo, NotaDueno, type Motivo } from './cancelar-campos';
import { Nota } from './venta-sheet-partes';

export interface CancelarVentaDialogProps {
  readonly venta: VentaTurno;
  readonly dueno: string;
  readonly onClose: () => void;
  /** Resolves to the error to show, or null once cancelled. */
  readonly onConfirm: (motivo: Motivo, nip: string, nota: string) => Promise<string | null>;
}

function useCancelar(p: CancelarVentaDialogProps) {
  const [motivo, setMotivo] = useState<Motivo | null>(null);
  const [nip, setNip] = useState('');
  const [nota, setNota] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const pista =
    motivo === null
      ? 'Elige un motivo para cancelar.'
      : nip.length === PIN_LENGTH && /^\d+$/.test(nip)
        ? null
        : 'Escribe tu NIP para cancelar.';
  const confirmar = (): void => {
    if (motivo === null || pista !== null) return;
    setEnviando(true);
    setError(null);
    void p.onConfirm(motivo, nip, nota).then((e) => {
      setEnviando(false);
      if (e === null) return;
      setError(e);
      setNip('');
    });
  };
  return { motivo, setMotivo, nip, setNip, nota, setNota, error, enviando, pista, confirmar };
}

function Pie(p: { f: ReturnType<typeof useCancelar>; onClose: () => void }): ReactElement {
  return (
    <>
      {p.f.pista ? (
        <MText size="sm" weight="semibold" color={colors.textMuted} textAlign="center">
          {p.f.pista}
        </MText>
      ) : null}
      <View flexDirection="row" gap={10}>
        <View flex={1}>
          <Btn variant="secondary" size="lg" fullWidth onPress={p.onClose} testID="cancelar-no">
            Mejor no
          </Btn>
        </View>
        <View flex={1.3}>
          <Btn
            variant="destructiveFilled"
            size="lg"
            fullWidth
            disabled={p.f.pista !== null}
            loading={p.f.enviando}
            onPress={p.f.confirmar}
            testID="cancelar-confirmar"
          >
            Cancelar venta
          </Btn>
        </View>
      </View>
    </>
  );
}

export function CancelarVentaDialog(p: CancelarVentaDialogProps): ReactElement {
  const f = useCancelar(p);
  const alto = useWindowDimensions().height;
  const v = p.venta;
  const resumen = `${formatMoney(v.monto)} · ${v.concepto.split(' · ').join(', ')} · ${v.metodo.toLowerCase()}`;
  return (
    <Dialog
      open
      onClose={p.onClose}
      title={`¿Cancelar la venta ${v.folio.replace('-', '\u2011')}?`}
      closeLabel="Cerrar sin cancelar"
      testID="cancelar-venta"
      footer={<Pie f={f} onClose={p.onClose} />}
    >
      <ScrollView
        style={{ maxHeight: Math.round(alto * 0.5) }}
        contentContainerStyle={{ gap: 14 }}
        keyboardShouldPersistTaps="handled"
      >
        <View flexDirection="row" alignItems="center" gap={10}>
          <Don pose="preocupado" size={64} />
          <MText flex={1} size="md" weight="semibold" color={colors.gray600}>
            {resumen}
          </MText>
        </View>
        <Motivos value={f.motivo} onChange={f.setMotivo} />
        <NotaDueno dueno={p.dueno} value={f.nota} onChange={f.setNota} />
        <NipCampo value={f.nip} onChange={f.setNip} />
        <Nota tono="ambar" texto={consecuencia(v.metodo, v.monto, v.cliente, p.dueno)} />
        {f.error ? <Nota tono="rojo" texto={f.error} testID="cancelar-error" /> : null}
      </ScrollView>
    </Dialog>
  );
}
