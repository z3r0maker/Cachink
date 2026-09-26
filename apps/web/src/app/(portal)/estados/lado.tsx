'use client';

import { formatMoneyEntero, type EstadoDeResultados } from '@xangarro/domain';

import { DonDice } from '@/components';

import * as s from './lado.css';
import { mayorGolpe, margenes, paraNoPerder } from './lado-data';

/** «Para no perder»: the month's break-even and how far along the owner is. */
/** Selling below cost has no break-even: say that instead of hiding the tile. */
function SinMargen() {
  return (
    <section className={s.equilibrio} aria-labelledby="para-no-perder" data-testid="para-no-perder">
      <h2 id="para-no-perder" className={s.eyebrow}>
        Para no perder
      </h2>
      <span className={s.lead}>Hoy vendes abajo de lo que te cuesta.</span>
      <p className={s.explica}>
        Mientras lo vendido cueste más de lo que cobras, ninguna cantidad de ventas cubre tus
        gastos. Revisa tus precios en Productos.
      </p>
    </section>
  );
}

function Equilibrio({ er }: { readonly er: EstadoDeResultados }) {
  const p = paraNoPerder(er);
  if (p === null) return er.ingresos > 0n && er.utilidadBruta <= 0n ? <SinMargen /> : null;
  return (
    <section className={s.equilibrio} aria-labelledby="para-no-perder" data-testid="para-no-perder">
      <h2 id="para-no-perder" className={s.eyebrow}>
        Para no perder
      </h2>
      <span className={s.lead}>Necesitas vender unos</span>
      <span className={s.meta}>
        {formatMoneyEntero(p.meta)} <span className={s.metaSub}>en el periodo</span>
      </span>
      <div
        className={s.pista}
        role="img"
        aria-label={`Llevas ${p.avance}% de tu punto de equilibrio`}
      >
        <span className={s.relleno} style={{ width: `${p.avance}%` }} />
        <span className={s.pistaTexto}>
          {formatMoneyEntero(p.llevas)} · {p.avance}%
        </span>
      </div>
      <p className={s.explica}>
        Es lo que cubre tus gastos con el margen que hoy tienes.{' '}
        {p.faltan > 0n ? (
          <>
            Te faltan <strong>{formatMoneyEntero(p.faltan)}</strong>.
          </>
        ) : (
          <strong>¡Ya los cubriste!</strong>
        )}
      </p>
    </section>
  );
}

function Margen(p: {
  readonly titulo: string;
  readonly valor: number | null;
  readonly dice: string;
}) {
  if (p.valor === null) return null;
  return (
    <div className={s.margen}>
      <span className={s.eyebrow}>{p.titulo}</span>
      <span className={s.margenValor[p.valor < 0 ? 'mal' : 'bien']}>
        {p.valor < 0 ? '−' : ''}
        {Math.abs(p.valor)}%
      </span>
      <span className={s.explica}>{p.dice}</span>
    </div>
  );
}

function Margenes({ er }: { readonly er: EstadoDeResultados }) {
  const m = margenes(er);
  const op = m.operacion ?? 0;
  return (
    <section className={s.margenes} aria-label="Márgenes">
      <Margen
        titulo="Margen bruto"
        valor={m.bruto}
        dice={
          (m.bruto ?? 0) < 0
            ? `Lo vendido te cuesta más de lo que cobras: pierdes $${-(m.bruto ?? 0)} de cada $100.`
            : `De cada $100 que vendes, te quedan $${m.bruto ?? 0} después de pagar lo vendido.`
        }
      />
      <Margen
        titulo="Margen de operación"
        valor={m.operacion}
        dice={
          op < 0
            ? `Tus gastos se comieron eso y $${-op} más por cada $100.`
            : `Después de tus gastos, te quedan $${op} de cada $100.`
        }
      />
    </section>
  );
}

/** Beside the cascade: the break-even, the two margins, and Don's read of it. */
export function LadoResultados({ er }: { readonly er: EstadoDeResultados }) {
  const golpe = mayorGolpe(er);
  const perdiendo = er.utilidadOperativa < 0n;
  return (
    <aside className={s.lado}>
      <Equilibrio er={er} />
      <Margenes er={er} />
      {golpe === null ? null : (
        <DonDice pose={perdiendo ? 'preocupado' : 'celebrando'} size={110}>
          {perdiendo
            ? `El golpe está en ${golpe.label.toLowerCase()}: ${formatMoneyEntero(golpe.monto)}. Ábrelo abajo y vemos en qué se fue.`
            : `¡Vas ganando! Lo que más te cuesta es ${golpe.label.toLowerCase()}: ${formatMoneyEntero(golpe.monto)}.`}
        </DonDice>
      )}
    </aside>
  );
}
