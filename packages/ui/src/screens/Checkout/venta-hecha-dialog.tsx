/**
 * «Venta hecha» (MvVentaHecha) and «¡Listo! Anotaste…» (MvFiado): the centred
 * dialog after a sale. Cash shows the change to give, big; fiado what the
 * client owes now. «Mandar comprobante» opens the share sheet; «Nueva
 * venta» closes it on an empty ticket.
 */
import type { ReactElement } from 'react';
import { View } from '@tamagui/core';
import { formatMoney } from '@xangarro/domain';
import { aDueno } from '@xangarro/caja';
import { Btn } from '../../components/Btn/index';
import { Dialog } from '../../components/Dialog/index';
import { Eyebrow } from '../../components/Panel/index';
import { MText } from '../../components/Mostrador/index';
import { PathIcon } from '../../components/PathIcon/index';
import { GLYPHS } from '../../components/PathIcon/glyphs';
import { borderWidths, colors, radii, shapeRadii } from '../../theme';
import { COBRAR_GLYPHS } from '../Ventas/cobrar-glyphs';
import type { VentaHecha } from './venta-hecha';

export interface VentaHechaDialogProps {
  readonly venta: VentaHecha | null;
  readonly dueno: string;
  readonly onMandar: () => void;
  readonly onNueva: () => void;
}

function Cifra(p: {
  label: string;
  nota?: string;
  monto: string;
  tinta: string;
  fondo: string;
}): ReactElement {
  return (
    <View
      flexDirection="row"
      alignItems="center"
      justifyContent="space-between"
      padding={14}
      borderRadius={radii[4]}
      borderWidth={borderWidths.thin}
      borderColor={p.tinta}
      backgroundColor={p.fondo}
    >
      <View>
        <MText size="md" weight="extraBold" color={p.tinta}>
          {p.label}
        </MText>
        {p.nota ? (
          <MText size="sm" weight="bold" color={p.tinta}>
            {p.nota}
          </MText>
        ) : null}
      </View>
      <MText size="total" weight="extraBold" color={p.tinta} testID="venta-hecha-cifra">
        {p.monto}
      </MText>
    </View>
  );
}

function Hecho({ v }: { v: VentaHecha }): ReactElement {
  const texto =
    v.metodo === 'Fiado'
      ? `Se sumó a la cuenta de ${v.cliente ?? ''}.`
      : `Cobraste ${formatMoney(v.total)}`;
  return (
    <View flexDirection="row" alignItems="center" gap={12}>
      <View
        width={48}
        height={48}
        alignItems="center"
        justifyContent="center"
        borderRadius={shapeRadii.pill}
        borderWidth={borderWidths.thin}
        borderColor={colors.black}
        backgroundColor={colors.green}
        aria-hidden
      >
        <PathIcon d={GLYPHS.check} size={24} strokeWidth={3} />
      </View>
      <MText flex={1} size="lg" weight="bold" color={colors.ink}>
        {texto}
      </MText>
    </View>
  );
}

function Cuerpo({ v, dueno }: { v: VentaHecha; dueno: string }): ReactElement {
  return (
    <View gap={12}>
      <Hecho v={v} />
      {v.cambio !== null && v.recibido !== null ? (
        <Cifra
          label="Dale de cambio"
          nota={`Pagó con ${formatMoney(v.recibido)}`}
          monto={formatMoney(v.cambio)}
          tinta={colors.greenText}
          fondo={colors.greenSoft}
        />
      ) : null}
      {v.metodo === 'Fiado' && v.saldoCliente !== null ? (
        <Cifra
          label="Ahora debe"
          monto={formatMoney(v.saldoCliente)}
          tinta={colors.warningText}
          fondo={colors.warningSoft}
        />
      ) : null}
      <MText size="sm" weight="semibold" color={colors.gray600} textAlign="center">
        {`Se guardó en la caja y se le manda ${aDueno(dueno)}.`}
      </MText>
    </View>
  );
}

function Pie(p: VentaHechaDialogProps): ReactElement {
  return (
    <View gap={10}>
      {p.venta?.metodo === 'Fiado' ? null : (
        <Btn
          variant="secondary"
          size="lg"
          fullWidth
          icon={<PathIcon d={COBRAR_GLYPHS.enviar} size={18} />}
          onPress={p.onMandar}
          testID="venta-hecha-mandar"
        >
          Mandar comprobante
        </Btn>
      )}
      <Btn
        variant="primary"
        size="xl"
        sentence
        fullWidth
        onPress={p.onNueva}
        testID="venta-hecha-nueva"
      >
        Nueva venta
      </Btn>
    </View>
  );
}

export function VentaHechaDialog(p: VentaHechaDialogProps): ReactElement {
  const v = p.venta;
  const fiado = v?.metodo === 'Fiado';
  const titulo =
    fiado && v ? `¡Listo! Anotaste ${formatMoney(v.total)} a ${v.cliente ?? ''}` : 'Venta hecha';
  return (
    <Dialog
      open={v !== null}
      onClose={p.onNueva}
      eyebrow={v ? `${v.folio} · ${v.metodo}` : undefined}
      title={titulo}
      closeLabel="Cerrar y empezar otra venta"
      testID="venta-hecha"
      footer={<Pie {...p} />}
    >
      {v ? <Cuerpo v={v} dueno={p.dueno} /> : <Eyebrow>Venta hecha</Eyebrow>}
    </Dialog>
  );
}
