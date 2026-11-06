/**
 * The photo sheet that is open on a product (M-13): the camera, the result,
 * «Cambiar o quitar» or the confirmation, from {@link useFotoFlujo}'s step.
 */
import type { ReactElement } from 'react';
import { useDeviceId } from '../app-config/use-app-config';
import { FotoCamaraSheet } from './foto-camara-sheet';
import { FotoCambiarSheet } from './foto-cambiar-sheet';
import { FotoListoSheet } from './foto-listo-sheet';
import { FotoQuitarDialog } from './foto-quitar-dialog';
import type { FotoAbierta, FotoFlujo } from './use-foto-flujo';

interface HojaProps {
  readonly a: FotoAbierta;
  readonly flujo: FotoFlujo;
  readonly dueno: string;
  /** This caja's name when the photo was taken here, else null. */
  readonly caja: string | null;
}

function Camara({ a, flujo }: HojaProps): ReactElement {
  return (
    <FotoCamaraSheet
      nombre={a.s.nombre}
      onTomada={flujo.tomada}
      onGaleria={() => flujo.galeria()}
      onCerrar={flujo.cerrar}
    />
  );
}

function Cambiar({ a, flujo, caja }: HojaProps): ReactElement {
  return (
    <FotoCambiarSheet
      abierta={a}
      caja={caja}
      onCamara={flujo.camara}
      onGaleria={() => flujo.galeria()}
      onQuitar={flujo.pedirQuitar}
      onCerrar={flujo.cerrar}
    />
  );
}

function Quitar({ a, flujo, dueno }: HojaProps): ReactElement {
  return (
    <FotoQuitarDialog
      abierta={a}
      dueno={dueno}
      guardando={flujo.guardando}
      onQuitar={flujo.quitar}
      onMejorNo={flujo.volver}
    />
  );
}

function Listo({ a, flujo, dueno }: HojaProps): ReactElement {
  return (
    <FotoListoSheet
      abierta={a}
      dueno={dueno}
      guardando={flujo.guardando}
      onGuardar={flujo.guardar}
      onOtra={flujo.camara}
      onCerrar={flujo.cerrar}
    />
  );
}

const HOJAS = { camara: Camara, cambiar: Cambiar, quitar: Quitar } as const;

export function FotoHojas(p: {
  readonly flujo: FotoFlujo;
  /** The owner's first name, for «el portal de Pedro». */
  readonly dueno: string;
  /** This caja's name, for «Tomada … en Caja 1». */
  readonly caja: string;
}): ReactElement | null {
  const deviceId = useDeviceId();
  const a = p.flujo.abierta;
  if (a === null) return null;
  const paso = a.paso.paso;
  const Hoja = paso === 'camara' || paso === 'cambiar' || paso === 'quitar' ? HOJAS[paso] : Listo;
  const caja = a.actual?.deviceId === deviceId ? p.caja : null;
  return <Hoja a={a} flujo={p.flujo} dueno={p.dueno} caja={caja} />;
}
