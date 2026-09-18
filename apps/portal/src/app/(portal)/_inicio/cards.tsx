'use client';

import { formatMoney } from '@xangarro/domain';
import { colors } from '@xangarro/tokens';

import { Card, KpiCard, StatusPill, Tag, Verdict, kpiGrid } from '@/components';
import type { InicioData } from '@/server/inicio';

import {
  amountNegative,
  amountPositive,
  badge,
  heroEyebrow,
  heroFigure,
  heroRange,
  listRow,
  lowStockCount,
  rowAmount,
  rowMeta,
  sectionTitle,
} from './inicio.css';

/**
 * The yellow hero. "Utilidad del mes" is arithmetic — ventas minus gastos —
 * not a NIF statement, so it renders on **every** plan; only "Ver estados"
 * lands on the locked state for Xangarrito (ADR-059).
 *
 * The verdict uses its on-yellow form: `greenText` on `yellow` is 3.58:1, below
 * AA, so the dot carries the colour and the text stays black.
 */
export function UtilidadHero({ month }: { readonly month: InicioData['month'] }) {
  const positive = month.utilidad >= 0n;
  return (
    <Card tone="hero" emphasis="hero">
      <span className={heroEyebrow}>Utilidad del mes</span>
      <p className={heroFigure}>{formatMoney(month.utilidad)}</p>
      <div className={heroRange}>01/may/2026 – 31/may/2026</div>
      <Verdict onYellow tone={positive ? 'healthy' : 'critical'}>
        {positive
          ? 'Tu negocio fue rentable este periodo.'
          : 'Tu negocio operó a pérdida este periodo.'}
      </Verdict>
    </Card>
  );
}

export function ResumenDeHoy({ today }: { readonly today: InicioData['today'] }) {
  return (
    <div className={kpiGrid}>
      <KpiCard
        label="Ventas hoy"
        value={formatMoney(today.ventas)}
        tone="positive"
        hint={`${today.ventasCount} ventas registradas`}
      />
      <KpiCard
        label="Gastos hoy"
        value={formatMoney(today.gastos)}
        tone="negative"
        hint={`${today.gastosCount} egresos registrados`}
      />
      <KpiCard
        label="Utilidad hoy"
        value={formatMoney(today.utilidad)}
        hint="Lo que te quedó después de gastos"
      />
    </div>
  );
}

export function CajaCard({ cortes }: { readonly cortes: InicioData['cortes'] }) {
  return (
    <Card>
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

export function StockBajoCard({ rows }: { readonly rows: InicioData['lowStock'] }) {
  return (
    <Card>
      <h2 className={sectionTitle}>Stock bajo</h2>
      <p className={lowStockCount}>{rows.length}</p>
      {rows.map((p) => (
        <div key={p.producto} className={listRow}>
          <span style={{ fontWeight: 700 }}>{p.producto}</span>
          <span className={rowAmount}>
            <Tag tone="danger">
              quedan {p.stock} (umbral {p.umbral})
            </Tag>
          </span>
        </div>
      ))}
    </Card>
  );
}

export function ActividadReciente({ rows }: { readonly rows: InicioData['activity'] }) {
  return (
    <Card>
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
