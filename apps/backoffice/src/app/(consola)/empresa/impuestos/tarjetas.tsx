import type { Route } from 'next';
import Link from 'next/link';

import { tarjetasDe, type Tarjeta } from '@/server/empresa/impuestos-tarjetas';
import type { MesImpuestos } from '@/server/empresa/impuestos-view';
import * as c from '@/styles/mostrador-impuestos-tarjetas.css';
import * as i from '@/styles/mostrador-impuestos.css';
import * as m from '@/styles/mostrador.css';

/** One tax (board CD-09): its working, then «Estimado», «Del contador» and «Diferencia». */
function UnaTarjeta({ t }: { readonly t: Tarjeta }) {
  return (
    <article className={c.tarjeta} data-testid={`tarjeta-${t.id}`}>
      <div>
        <h3 className={i.pasoTitulo}>{t.titulo}</h3>
        <span className={i.pasoSub}>{t.sub}</span>
      </div>
      <div>
        {t.lineas.map((l) => (
          <Link key={l.label} href={l.href as Route} className={c.linea}>
            <span>{l.label}</span>
            <span className={l.negativo ? c.montoNegativo : c.monto}>{l.monto}</span>
          </Link>
        ))}
        <div className={c.resultado}>
          <span>{t.resultadoLabel}</span>
          <span className={c.resultadoMonto}>{t.resultado}</span>
        </div>
        <span className={i.pasoSub}>{t.nota}</span>
      </div>
      <div className={c.columnas}>
        <span className={c.columna}>
          <span className={m.tileLabel}>Estimado</span>
          <span className={c.valor}>{t.estimado}</span>
        </span>
        <span className={c.columna}>
          <span className={m.tileLabel}>Del contador</span>
          <span className={c.valor}>{t.contador}</span>
        </span>
        <span className={c.columna}>
          <span className={m.tileLabel}>Diferencia</span>
          <span className={c.diferencia[t.difTono]} data-testid="diferencia">
            {t.diferencia}
          </span>
        </span>
      </div>
    </article>
  );
}

export function Tarjetas({ m: mes }: { readonly m: MesImpuestos }) {
  return (
    <div className={c.tarjetas}>
      {tarjetasDe(mes).map((t) => (
        <UnaTarjeta key={t.id} t={t} />
      ))}
    </div>
  );
}
