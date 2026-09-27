'use client';

import { soloMonto } from '../_primeros/formato';
import * as p from '../_primeros/primeros.css';
import type { Linea, LineasProps } from './lineas';
import { lineaDe, type ClienteOpcion } from './use-saldos';
import * as s from './cxc.css';

const iniciales = (nombre: string) =>
  nombre
    .split(/\s+/)
    .filter((w) => w.length > 2)
    .slice(0, 2)
    .map((w) => w.charAt(0))
    .join('')
    .toUpperCase() || '?';

export function TablaLineas({ lineas, setLineas, editable, clientes }: LineasProps) {
  const cambiar = (clave: string, fn: (l: Linea) => Linea) =>
    setLineas((ls) => ls.map((x) => (x.clave === clave ? fn(x) : x)));
  const usados = new Set(lineas.map((l) => l.clienteId));
  return (
    <>
      <div className={s.encabezados} aria-hidden="true">
        <span>Cliente</span>
        <span>Teléfono</span>
        <span className={s.derecha}>Saldo inicial</span>
        <span />
      </div>
      {lineas.length === 0 ? (
        <p className={`${p.texto} ${s.vacio}`}>
          Sin saldos por cliente todavía. Si nadie te debía, déjalo así.
        </p>
      ) : (
        <ul role="list" aria-label="Saldos por cliente" style={{ margin: 0, padding: 0 }}>
          {lineas.map((l) => (
            <LineaRow
              key={l.clave}
              linea={l}
              editable={editable}
              opciones={clientes.filter((c) => !usados.has(c.id))}
              onElegir={(c) =>
                cambiar(l.clave, (x) => ({ ...lineaDe(c, c.id, x.saldo), clave: x.clave }))
              }
              onSaldo={(v) => cambiar(l.clave, (x) => ({ ...x, saldo: v }))}
              onQuitar={() => setLineas((ls) => ls.filter((x) => x.clave !== l.clave))}
            />
          ))}
        </ul>
      )}
    </>
  );
}

interface FilaProps {
  readonly linea: Linea;
  readonly editable: boolean;
  readonly opciones: readonly ClienteOpcion[];
  readonly onElegir: (c: ClienteOpcion) => void;
  readonly onSaldo: (v: string) => void;
  readonly onQuitar: () => void;
}

function LineaRow({ linea, editable, opciones, onElegir, onSaldo, onQuitar }: FilaProps) {
  const nombre = linea.nombre || 'cliente nuevo';
  return (
    <li className={s.fila} style={{ listStyle: 'none' }}>
      <span className={s.cliente}>
        <span className={s.avatar} aria-hidden="true">
          {linea.clienteId === '' ? '?' : iniciales(linea.nombre)}
        </span>
        {linea.clienteId === '' ? (
          <ElegirCliente opciones={opciones} onElegir={onElegir} />
        ) : (
          <span className={s.nombre}>{linea.nombre}</span>
        )}
      </span>
      <span className={s.telefono}>{linea.telefono}</span>
      <SaldoCelda nombre={nombre} valor={linea.saldo} editable={editable} onSaldo={onSaldo} />
      {editable ? (
        <button
          type="button"
          className={s.quitar}
          aria-label={`Quitar a ${nombre}`}
          onClick={onQuitar}
        >
          <IconoBasura />
        </button>
      ) : (
        <span />
      )}
    </li>
  );
}

function SaldoCelda(props: {
  readonly nombre: string;
  readonly valor: string;
  readonly editable: boolean;
  readonly onSaldo: (v: string) => void;
}) {
  return (
    <label className={s.saldo}>
      <span className={p.nota} aria-hidden="true">
        $
      </span>
      <input
        className={s.saldoInput}
        aria-label={`Saldo de ${props.nombre}`}
        value={props.valor}
        placeholder="0.00"
        inputMode="decimal"
        disabled={!props.editable}
        onChange={(e) => props.onSaldo(soloMonto(e.target.value))}
      />
    </label>
  );
}

function ElegirCliente({
  opciones,
  onElegir,
}: {
  readonly opciones: readonly ClienteOpcion[];
  readonly onElegir: (c: ClienteOpcion) => void;
}) {
  return (
    <select
      className={s.elegir}
      aria-label="Elige un cliente"
      defaultValue=""
      onChange={(e) => {
        const c = opciones.find((o) => o.id === e.target.value);
        if (c !== undefined) onElegir(c);
      }}
    >
      <option value="">Elige un cliente…</option>
      {opciones.map((o) => (
        <option key={o.id} value={o.id}>
          {o.nombre}
        </option>
      ))}
    </select>
  );
}

function IconoBasura() {
  return (
    <svg
      viewBox="0 0 24 24"
      width={18}
      height={18}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M10 11v6M14 11v6M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  );
}
