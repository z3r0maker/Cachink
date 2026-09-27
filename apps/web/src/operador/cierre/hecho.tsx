'use client';

import Link from 'next/link';
import { useState } from 'react';
import { formatMoney, type DiferenciaCorte } from '@xangarro/domain';

import { Don, type DonPose } from '../../components/don/don';
import { Icon } from '../../shell/icon';
import { OPERADOR_BASE, aDueno } from '@xangarro/caja';
import { conSigno, DIF, lineaCerrado, type CierreData } from '@xangarro/caja/cierre';
import { Corte, fechaCorta } from './corte';
import { Entrega } from './entrega';
import * as h from './hecho.css';
import type { Cierre } from './use-cierre';

const CHECK = 'M20 6 9 17l-5-5';
const BILLETE = 'M2 6h20v12H2V6Zm10 4a2 2 0 1 0 0 4 2 2 0 0 0 0-4M6 12h.01M18 12h.01';
const DERECHA = 'M9 6l6 6-6 6';
const CHAT = 'M7.9 20A9 9 0 1 0 4 16.1L2 22Z';
const SALIR = 'M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9';

/** Don celebrates only a count that cuadró and worries on a shortfall. */
const POSE: Record<DiferenciaCorte['tipo'], DonPose> = {
  cuadra: 'celebrando',
  falta: 'preocupado',
  sobra: 'quieto',
};
const CHIP = { cuadra: 'Cuadró', falta: 'Faltante', sobra: 'Sobrante' } as const;

function segundaLinea(d: DiferenciaCorte): string {
  if (d.tipo === 'cuadra') return 'Cuadró al centavo.';
  return `Con un ${d.tipo === 'falta' ? 'faltante' : 'sobrante'} de ${formatMoney(d.monto)}.`;
}

function whatsapp(x: Cierre, data: CierreData): string {
  const dif = x.dif.tipo === 'cuadra' ? 'cuadró' : `diferencia ${conSigno(x.dif)}`;
  const txt = `Corte ${data.caja}, ${data.operador}, ${fechaCorta()}: contado ${formatMoney(x.contado)}, esperado ${formatMoney(x.esperado)}, ${dif}.`;
  return `https://wa.me/?text=${encodeURIComponent(txt)}`;
}

/** «¡Turno cerrado!»: Don, what happened, handing the cash over; the corte beside it. */
export function Hecho({ x, data }: { readonly x: Cierre; readonly data: CierreData }) {
  const t = DIF[x.dif.tipo];
  const nombre = data.operador.split(' ')[0] ?? data.operador;
  const gracias = x.dif.tipo === 'cuadra' ? ` Gracias por tu turno, ${nombre}.` : '';
  return (
    <div className={h.hecho}>
      <div className={h.izquierda}>
        <div className={h.donFila}>
          <Don pose={POSE[x.dif.tipo]} size={220} />
          <span
            className={h.chip}
            style={{ background: t.bg, color: t.color, borderColor: t.color }}
          >
            {x.dif.tipo === 'cuadra' ? <Icon path={CHECK} size={16} strokeWidth={2.8} /> : null}
            {CHIP[x.dif.tipo]}
          </span>
        </div>
        <h1 className={h.titulo}>
          {x.dif.tipo === 'cuadra' ? '¡Turno cerrado!' : 'Turno cerrado'}
          <br />
          {segundaLinea(x.dif)}
        </h1>
        <p className={h.texto}>{`${lineaCerrado(x.dif, x.motivo, data.dueno)}${gracias}`}</p>
        <Pasos x={x} data={data} />
      </div>
      <Corte x={x} data={data} />
    </div>
  );
}

function Pasos({ x, data }: { readonly x: Cierre; readonly data: CierreData }) {
  const [open, setOpen] = useState(false);
  const [entregado, setEntregado] = useState(false);
  const monto = formatMoney(x.contado);
  return (
    <div className={h.pasos}>
      {entregado ? (
        <Entregado dueno={data.dueno} />
      ) : (
        <PorEntregar monto={monto} dueno={data.dueno} onClick={() => setOpen(true)} />
      )}
      <div className={h.botones}>
        <a href={whatsapp(x, data)} className={h.whatsapp} target="_blank" rel="noreferrer">
          <Icon path={CHAT} size={20} strokeWidth={2} />
          Mandar el corte por WhatsApp
        </a>
        <Link href={OPERADOR_BASE} className={h.salir}>
          <Icon path={SALIR} size={18} strokeWidth={2} />
          Salir de la caja
        </Link>
      </div>
      <Entrega
        open={open}
        monto={monto}
        dueno={data.dueno}
        onClose={() => setOpen(false)}
        onEntregar={() => {
          setOpen(false);
          setEntregado(true);
        }}
      />
    </div>
  );
}

function PorEntregar(p: {
  readonly monto: string;
  readonly dueno: string;
  readonly onClick: () => void;
}) {
  return (
    <button type="button" className={h.entregar} data-onyellow="" onClick={p.onClick}>
      <span className={h.icono}>
        <Icon path={BILLETE} size={22} strokeWidth={2} />
      </span>
      <span style={{ flex: 1 }}>
        <span className={h.pasoTitulo}>{`Entregar el efectivo ${aDueno(p.dueno)}`}</span>
        <span className={h.pasoTexto}>
          {`Dale los ${p.monto} en la mano. Él confirma en su portal que los recibió.`}
        </span>
      </span>
      <Icon path={DERECHA} size={20} strokeWidth={2.6} />
    </button>
  );
}

function Entregado({ dueno }: { readonly dueno: string }) {
  return (
    <div role="status" className={h.entregado}>
      <span className={`${h.icono} ${h.iconoVerde}`}>
        <Icon path={CHECK} size={22} strokeWidth={2.8} />
      </span>
      <span>
        <span className={h.pasoTitulo} style={{ color: 'inherit' }}>
          {`Le entregaste el efectivo ${aDueno(dueno)}`}
        </span>
        <span className={h.pasoTexto}>Cuando lo confirme, lo verás en tus cortes.</span>
      </span>
    </div>
  );
}
