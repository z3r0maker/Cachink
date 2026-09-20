'use client';

import { useState } from 'react';
import { formatMoney, type Money } from '@xangarro/domain';
import { colors } from '@xangarro/tokens';

import { Icon } from '../../shell/icon';
import * as c from './cobro.css';
import { MontoInput } from '../ui/monto';
import * as e from './efectivo.css';
import { cambio as calcCambio, parseRecibido } from './ticket';
import type { Caja } from './use-caja';

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', '⌫'] as const;
type Key = (typeof KEYS)[number];
const CLEAR = 'M6 6l12 12M18 6 6 18';

/** Whole pesos type as «200», not «200.00» — what the design's field shows. */
const pesos = (v: Money): string =>
  v % 100n === 0n ? String(v / 100n) : `${v / 100n}.${String(v % 100n).padStart(2, '0')}`;

function press(cur: string, k: Key): string {
  if (k === '⌫') return cur.slice(0, -1);
  if (k === '.' && cur.includes('.')) return cur;
  return cur + k;
}

/** «Exacto» and the round bills at or above the total, four at most. */
function quickAmounts(total: Money): readonly Money[] {
  const all = [total, 100_00n, 200_00n, 500_00n, 1000_00n];
  return all.filter((v, i) => all.indexOf(v) === i && v >= total).slice(0, 4);
}

/** Pago en efectivo: typed or tapped, with the change (or what is missing) in 38 px. */
export function Efectivo({ caja }: { readonly caja: Caja }) {
  const [raw, setRaw] = useState('');
  // Set on the first «Registrar venta» and never reset here: React flushes
  // discrete clicks synchronously, so the rest of a button smash lands on a
  // disabled button instead of the catalogue behind the closing sheet.
  const [registrando, setRegistrando] = useState(false);
  const diff = calcCambio(parseRecibido(raw), caja.total);
  const ok = diff !== null && diff >= 0n && caja.total > 0n;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <Monto raw={raw} setRaw={setRaw} />
      <div className={e.quick}>
        {quickAmounts(caja.total).map((v) => (
          <button
            key={String(v)}
            type="button"
            className={e.quickChip}
            onClick={() => setRaw(pesos(v))}
          >
            {v === caja.total ? 'Exacto' : formatMoney(v)}
          </button>
        ))}
      </div>
      <Teclado onKey={(k) => setRaw((cur) => press(cur, k))} />
      <Cambio diff={diff} />
      <button
        type="button"
        className={c.confirm}
        disabled={!ok || registrando}
        onClick={() => {
          if (registrando) return;
          setRegistrando(true);
          caja.vender({ metodo: 'Efectivo', cambio: diff, nota: '' });
        }}
      >
        Registrar venta
      </button>
    </div>
  );
}

function Monto({ raw, setRaw }: { readonly raw: string; readonly setRaw: (v: string) => void }) {
  return (
    <MontoInput
      id="cx-recibido"
      label="Con cuánto paga"
      value={raw}
      onChange={setRaw}
      size="caja"
      trailing={
        <button type="button" className={e.clear} title="Borrar" onClick={() => setRaw('')}>
          <Icon path={CLEAR} size={17} strokeWidth={2.5} />
        </button>
      }
    />
  );
}

function Teclado({ onKey }: { readonly onKey: (k: Key) => void }) {
  return (
    <div className={e.keypad}>
      {KEYS.map((k) => (
        <button
          key={k}
          type="button"
          className={e.key}
          data-muted={k === '⌫' ? '' : undefined}
          onClick={() => onKey(k)}
        >
          {k}
        </button>
      ))}
    </div>
  );
}

function Cambio({ diff }: { readonly diff: Money | null }) {
  const falta = diff !== null && diff < 0n;
  const bg = diff === null ? colors.gray100 : falta ? colors.redSoft : colors.greenSoft;
  return (
    <div className={e.change} style={{ background: bg }}>
      <span className={e.changeLabel}>{falta ? 'Falta' : 'Cambio'}</span>
      <span className={e.changeValue}>
        {diff === null ? '—' : formatMoney(falta ? -diff : diff)}
      </span>
    </div>
  );
}
