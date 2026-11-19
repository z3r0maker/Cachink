'use client';

import Link from 'next/link';
import { useState } from 'react';
import type { DiferenciaCorte } from '@xangarro/domain';

import { Don, type DonPose } from '../../components/don/don';
import { Icon } from '../../shell/icon';
import { OPERADOR_BASE } from '@xangarro/caja';
import {
  avisoPorEnviar,
  CHIP_CIERRE,
  corteDeCierre,
  DIF,
  fechaCorta,
  lineaHecho,
  mensajeCorte,
  segundaLinea,
  tituloHecho,
  type CierreData,
} from '@xangarro/caja/cierre';
import { Corte } from './corte';
import * as h from './hecho.css';
import { Mandar } from './mandar';
import { OtroTurno } from './otro-turno';
import type { Cierre } from './use-cierre';

const CHECK = 'M20 6 9 17l-5-5';
const RELOJ = 'M12 3a9 9 0 1 0 0 18a9 9 0 1 0 0-18zM12 7v5l3 2';
const ENVIAR = 'M22 2 11 13M22 2 15 22l-4-9-9-4Z';
const MAS = 'M12 5v14M5 12h14';
const SALIR = 'M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9';

/** Don celebrates only a count that cuadró and worries on a shortfall. */
const POSE: Record<DiferenciaCorte['tipo'], DonPose> = {
  cuadra: 'celebrando',
  falta: 'preocupado',
  sobra: 'quieto',
};

type Dialogo = 'mandar' | 'otro' | null;

/**
 * «¡Turno cerrado!» (OpCierreCorte, P-43; ADR-147): Don, what happened and
 * when los patrones see it, the corte beside it; then send the corte, open
 * another turno or leave. No handover button: the portal has no such
 * confirmation, so the corte only reminds whose the cash is.
 */
export function Hecho({ x, data }: { readonly x: Cierre; readonly data: CierreData }) {
  const [fecha] = useState(() => fechaCorta());
  const [dialogo, setDialogo] = useState<Dialogo>(null);
  const cerrar = (): void => setDialogo(null);
  return (
    <div className={h.hecho}>
      <div className={h.izquierda}>
        <Cabeza dif={x.dif} />
        <p className={h.texto}>{lineaHecho(x.dif, x.motivo, x.enviado, data.operador)}</p>
        {x.pendientes > 0 ? (
          <p role="status" className={h.porEnviar}>
            <Icon path={RELOJ} size={20} strokeWidth={2.2} />
            {avisoPorEnviar(x.pendientes)}
          </p>
        ) : null}
        <Acciones onMandar={() => setDialogo('mandar')} onOtro={() => setDialogo('otro')} />
      </div>
      <Corte x={x} data={data} fecha={fecha} />
      <Mandar
        open={dialogo === 'mandar'}
        texto={mensajeCorte(corteDeCierre(data, x, x.motivo, fecha))}
        onClose={cerrar}
      />
      <OtroTurno
        open={dialogo === 'otro'}
        operador={data.operador}
        contado={x.contado}
        onCerrar={cerrar}
      />
    </div>
  );
}

function Cabeza({ dif }: { readonly dif: DiferenciaCorte }) {
  const t = DIF[dif.tipo];
  return (
    <>
      <div className={h.donFila}>
        <Don pose={POSE[dif.tipo]} size={200} />
        <span className={h.chip} style={{ background: t.bg, color: t.color, borderColor: t.color }}>
          {dif.tipo === 'cuadra' ? <Icon path={CHECK} size={16} strokeWidth={2.8} /> : null}
          {CHIP_CIERRE[dif.tipo]}
        </span>
      </div>
      <h1 className={h.titulo}>
        {tituloHecho(dif)}
        <br />
        {segundaLinea(dif)}
      </h1>
    </>
  );
}

function Acciones(p: { readonly onMandar: () => void; readonly onOtro: () => void }) {
  return (
    <div className={h.acciones}>
      <button type="button" className={h.mandar} data-onyellow="" onClick={p.onMandar}>
        <Icon path={ENVIAR} size={20} strokeWidth={2.2} />
        Mandar el corte a los patrones
      </button>
      <div className={h.botones}>
        <button type="button" className={h.otro} onClick={p.onOtro}>
          <Icon path={MAS} size={18} strokeWidth={2.4} />
          Abrir otro turno
        </button>
        <Link href={OPERADOR_BASE} className={h.salir}>
          <Icon path={SALIR} size={18} strokeWidth={2} />
          Salir de la caja
        </Link>
      </div>
    </div>
  );
}
