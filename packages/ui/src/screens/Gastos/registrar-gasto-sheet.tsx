/**
 * «Registrar gasto» (M-08, the web drawer as a bottom sheet): what, how much
 * and the category are required; who was paid and the receipt photo (M-18,
 * board CgHoja) are optional. Saving goes through the route's write path and
 * the sheet closes; the list's new row on top is the confirmation. Mounted
 * fresh on every opening.
 */
import type { ReactElement } from 'react';
import { View } from '@tamagui/core';
import type { ComprobanteGasto } from '@xangarro/application';
import type { NuevoGasto } from '@xangarro/caja/gastos';
import { formatMoney } from '@xangarro/domain';
import { BottomSheet } from '../../components/BottomSheet/index';
import { CampoComprobante } from '../../comprobante-gasto/campo-comprobante';
import { ComprobanteCamara } from '../../comprobante-gasto/comprobante-camara';
import {
  useComprobanteCaptura,
  type ComprobanteCaptura,
} from '../../comprobante-gasto/use-comprobante-captura';
import { Categorias, Concepto, Monto, NotaFirma, PieGasto, Proveedor } from './gasto-campos';
import { useGastoForm, useGuardarHoja, type GastoForm } from './use-gasto-form';

export interface RegistrarGastoSheetProps {
  readonly open: boolean;
  /** «Ana Robledo, Caja 1», from the session. */
  readonly firma: string;
  readonly onClose: () => void;
  readonly onGuardar: (n: NuevoGasto, comprobante: ComprobanteGasto | null) => Promise<void>;
}

/** «Tortillas · $180.00» over the camera, as far as the form knows it. */
function tituloCamara(f: GastoForm): string {
  const que = f.concepto.trim() === '' ? 'Gasto' : f.concepto.trim();
  return f.monto !== null && f.monto > 0n ? `${que} · ${formatMoney(f.monto)}` : que;
}

const comoComprobante = (c: ComprobanteCaptura): ComprobanteGasto | null =>
  c.foto === null ? null : { bytes: c.foto.base64, width: c.foto.width, height: c.foto.height };

/** The receipt row and its camera; omitted where the app has no camera (web, tests). */
function Comprobante(p: { readonly c: ComprobanteCaptura; readonly titulo: string }) {
  const { c } = p;
  if (!c.disponible) return null;
  return (
    <>
      <CampoComprobante
        foto={c.uri}
        procesando={c.procesando}
        error={c.error}
        onTomar={c.abrir}
        onGaleria={c.galeria}
        onQuitar={c.quitar}
      />
      <ComprobanteCamara
        abierta={c.camara}
        titulo={p.titulo}
        onTomada={c.tomada}
        onGaleria={c.galeria}
        onCerrar={c.cerrar}
      />
    </>
  );
}

function Abierto(p: RegistrarGastoSheetProps): ReactElement {
  const f = useGastoForm(null);
  const captura = useComprobanteCaptura();
  const conFoto = (n: NuevoGasto): Promise<void> => p.onGuardar(n, comoComprobante(captura));
  const { guardando, error, guardar } = useGuardarHoja(conFoto, p.onClose);
  return (
    <BottomSheet
      open
      onClose={p.onClose}
      eyebrow="Gasto de caja chica"
      title="Registrar gasto"
      closeLabel="Cerrar sin registrar"
      testID="registrar-gasto-sheet"
      footer={
        <PieGasto
          f={f}
          guardando={guardando || captura.procesando}
          error={error}
          onCancelar={p.onClose}
          onGuardar={() => void guardar(f.payload())}
        />
      }
    >
      <View gap={18}>
        <Concepto f={f} />
        <Monto f={f} />
        <Categorias f={f} />
        <Proveedor f={f} />
        <Comprobante c={captura} titulo={tituloCamara(f)} />
        <NotaFirma firma={p.firma} />
      </View>
    </BottomSheet>
  );
}

export function RegistrarGastoSheet(p: RegistrarGastoSheetProps): ReactElement | null {
  return p.open ? <Abierto {...p} /> : null;
}
