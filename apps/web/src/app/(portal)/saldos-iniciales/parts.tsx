'use client';

import { useState } from 'react';

import { Aviso, Pastilla } from '../_primeros/aviso';
import { Encabezado } from '../_primeros/encabezado';
import { dinero, fechaLarga } from '../_primeros/formato';
import * as p from '../_primeros/primeros.css';
import { CamposApertura, ConfirmarBloqueo } from './campos';
import { LineasCxC } from './lineas';
import { ResumenSaldos, totalDe } from './resumen';
import { useSaldos, type ClienteOpcion, type Saldos, type SaldosView } from './use-saldos';

export type { ClienteOpcion, SaldosView };

/**
 * Saldos iniciales (N-17, `CfgSaldosIniciales.dc.html`): fecha de apertura,
 * caja, bancos and one saldo per cliente. One save; one explicit, one-way
 * lock (the confirm lives here, the gate in the use case).
 */
export function SaldosScreen(view: SaldosView) {
  const f = useSaldos(view);
  const [confirmar, setConfirmar] = useState(false);
  const bloqueado = view.lockedAt !== null;
  const editable = view.mayWrite && !bloqueado;
  const clientesConSaldo = f.lineas.filter(
    (l) => l.clienteId !== '' && l.saldo.trim() !== '',
  ).length;
  const resumen = `Empiezas con ${dinero(totalDe(f.totales))}${f.fecha === '' ? '' : ` al ${fechaLarga(f.fecha)}`}. Esto no se deshace.`;

  return (
    <>
      <Encabezado
        aqui="Saldos iniciales"
        titulo="Saldos iniciales"
        subtitulo="Lo que tu negocio tenía el día que empezó: efectivo, bancos y lo que te deben."
        extra={f.resultado?.ok ? <Pastilla tono="success">{f.resultado.texto}</Pastilla> : null}
      />
      <div className={p.dosColumnas}>
        <Columna f={f} view={view} editable={editable} />
        <ResumenSaldos
          totales={f.totales}
          fecha={f.fecha}
          clientes={clientesConSaldo}
          estado={bloqueado ? 'bloqueado' : editable ? 'editable' : 'lectura'}
          pending={f.pending}
          onGuardar={f.guardar}
          onBloquear={() => setConfirmar(true)}
        />
      </div>
      <ConfirmarBloqueo
        abierto={confirmar}
        resumen={resumen}
        onCerrar={() => setConfirmar(false)}
        onBloquear={f.bloquear}
      />
    </>
  );
}

function Columna({
  f,
  view,
  editable,
}: {
  readonly f: Saldos;
  readonly view: SaldosView;
  readonly editable: boolean;
}) {
  return (
    <div className={p.columna}>
      {f.resultado !== null && !f.resultado.ok ? (
        <Aviso tono="critical">{f.resultado.texto}</Aviso>
      ) : null}
      {view.lockedAt !== null ? (
        <Aviso tono="info">Bloqueados el {fechaLarga(view.lockedAt)}. Ya no se editan.</Aviso>
      ) : null}
      <CamposApertura f={f} hoy={view.hoy} editable={editable} />
      <LineasCxC
        lineas={f.lineas}
        setLineas={f.setLineas}
        editable={editable}
        clientes={view.clientes}
        cxc={f.totales.cxc}
      />
    </div>
  );
}
