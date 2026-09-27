'use client';

import { colors } from '@xangarro/tokens';

import { direccionVisible, fechaLarga, HEX, NO_FISCAL, tinta, VENTA, type Marca } from './muestra';
import * as p from './papel.css';
import * as pp from './papel-pie.css';

/** Clásico, Moderno and Minimal (CfgComprobantes): the brand colour dresses them. */
type Otra = 'clasico' | 'moderno' | 'minimal';

function Logo({
  m,
  t,
  color,
}: {
  readonly m: Marca;
  readonly t: 'clasico' | 'moderno';
  readonly color: string;
}) {
  const fondo =
    t === 'clasico' && !m.logoUrl ? { background: color, color: tinta(color) } : undefined;
  return (
    <span className={`${p.logo} ${p.logoTam[t]}`} style={fondo}>
      {m.logoUrl ? <img src={m.logoUrl} alt="" className={p.logoImg} /> : m.iniciales}
    </span>
  );
}

function Cabeza({ m, t, color }: { readonly m: Marca; readonly t: Otra; readonly color: string }) {
  const dir = direccionVisible(m.form);
  if (t === 'moderno') {
    const ink = tinta(color);
    return (
      <div className={p.banda} style={{ background: color, color: ink }}>
        <Logo m={m} t="moderno" color={color} />
        <span style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
          <span className={p.nombre.moderno}>{m.nombre}</span>
          {dir ? (
            <span className={p.direccion} style={{ color: ink }}>
              {dir}
            </span>
          ) : null}
        </span>
      </div>
    );
  }
  return (
    <div className={p.cabezaVariante[t]}>
      {t === 'clasico' ? <Logo m={m} t="clasico" color={color} /> : null}
      <span className={p.nombre[t]}>{m.nombre}</span>
      {dir ? <span className={p.direccion}>{dir}</span> : null}
    </div>
  );
}

function Total({ t, color }: { readonly t: Otra; readonly color: string }) {
  const estilo =
    t === 'clasico'
      ? { background: color, color: tinta(color) }
      : t === 'moderno'
        ? { boxShadow: `inset 6px 0 0 ${color}` }
        : undefined;
  return (
    <div className={`${p.total} ${p.totalVariante[t]}`} style={estilo}>
      <span className={p.mini} style={t === 'clasico' ? { color: 'inherit' } : undefined}>
        TOTAL MXN
      </span>
      <span className={p.totalValor[t]}>{VENTA.total}</span>
    </div>
  );
}

function Pie({ m, linea }: { readonly m: Marca; readonly linea: string }) {
  const leyenda = m.form.receiptLeyenda.trim();
  const wa = m.form.whatsapp.trim();
  return (
    <div className={`${pp.pie} ${linea}`}>
      {leyenda ? <span className={pp.leyenda}>{leyenda}</span> : null}
      {wa ? <span className={pp.whatsapp}>WhatsApp {wa}</span> : null}
      <span className={pp.fiscal}>
        {NO_FISCAL}
        <br />
        Hecho con Xangarro
      </span>
    </div>
  );
}

function Cuerpo({ m, t, color }: { readonly m: Marca; readonly t: Otra; readonly color: string }) {
  const linea = p.linea[t];
  return (
    <div className={`${p.cuerpo} ${t === 'moderno' ? p.cuerpoModerno : ''}`}>
      <div className={`${p.folio} ${linea}`}>
        <span style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <span className={p.mini}>COMPROBANTE DE VENTA</span>
          <span className={p.num}>{VENTA.folio}</span>
        </span>
        <span className={p.fecha}>
          {fechaLarga()}
          <br />
          {VENTA.hora}
        </span>
      </div>
      <div className={`${p.tabla} ${linea}`}>
        <span style={{ display: 'flex', flexDirection: 'column' }}>
          <span className={p.concepto}>{VENTA.producto}</span>
          <span className={p.fecha} style={{ textAlign: 'left' }}>
            {VENTA.cantidad} × {VENTA.unitario}
          </span>
        </span>
        <span className={`${p.num} ${p.centro}`}>{VENTA.cantidad}</span>
        <span className={`${p.num} ${p.derecha}`}>{VENTA.importe}</span>
      </div>
      <Total t={t} color={color} />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span className={p.mini}>FORMA DE PAGO</span>
        <span className={`${p.pagoTexto} ${p.pago[t]}`}>{VENTA.metodo}</span>
      </div>
      <Pie m={m} linea={linea} />
    </div>
  );
}

export function PapelPreview({ m, t }: { readonly m: Marca; readonly t: Otra }) {
  // Minimal never uses colour; an unfinished hex falls back to the yellow.
  const color = HEX.test(m.form.brandColor) ? m.form.brandColor : colors.yellow;
  return (
    <div
      role="img"
      aria-label={`Vista previa del comprobante de la venta ${VENTA.folio} por ${VENTA.total}`}
      className={p.papel[t]}
    >
      <Cabeza m={m} t={t} color={color} />
      <Cuerpo m={m} t={t} color={color} />
    </div>
  );
}
