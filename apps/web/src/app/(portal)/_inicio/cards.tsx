'use client';

import { formatMoney } from '@xangarro/domain';
import { colors } from '@xangarro/tokens';

import { Card, StatusPill, Tag } from '@/components';
import type { InicioData } from '@/server/inicio';

import {
  amountNegative,
  amountPositive,
  badge,
  listRow,
  rowAmount,
  rowMeta,
  sectionTitle,
} from './inicio.css';

export function CajaCard({ cortes }: { readonly cortes: InicioData['cortes'] }) {
  return (
    <Card emphasis="quiet">
      <h2 className={sectionTitle}>Caja</h2>
      {cortes.length === 0 ? (
        <p className={rowMeta}>Sin cortes registrados todavía.</p>
      ) : (
        cortes.map((c) => (
          <div key={c.fecha} className={listRow}>
            <span style={{ fontWeight: 700 }}>{c.fecha}</span>
            <span className={rowAmount}>
              {c.diferencia === 0n ? (
                <Tag tone="neutral">Cuadra</Tag>
              ) : c.diferencia < 0n ? (
                <Tag tone="danger">Falta {formatMoney(-c.diferencia)}</Tag>
              ) : (
                <Tag tone="success">Sobra {formatMoney(c.diferencia)}</Tag>
              )}
            </span>
          </div>
        ))
      )}
    </Card>
  );
}

export function ActividadReciente({ rows }: { readonly rows: InicioData['activity'] }) {
  return (
    <Card emphasis="quiet">
      <h2 className={sectionTitle}>Actividad reciente</h2>
      {rows.map((r) => {
        const venta = r.kind === 'venta';
        return (
          <div key={r.id} className={listRow}>
            <span
              className={badge}
              style={{ background: venta ? colors.greenSoft : colors.redSoft }}
              aria-hidden="true"
            >
              {venta ? '$' : '−'}
            </span>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 700 }}>{r.concepto}</div>
              <div className={rowMeta}>
                <StatusPill tone={venta ? 'info' : 'peach'}>{r.tag}</StatusPill>
              </div>
            </div>
            <span className={`${rowAmount} ${venta ? amountPositive : amountNegative}`}>
              {venta ? '+' : '−'}
              {formatMoney(r.amount)}
            </span>
          </div>
        );
      })}
    </Card>
  );
}
