'use client';

import { parseAtributos } from '@xangarro/domain';
import { colors } from '@xangarro/tokens';
import Link from 'next/link';

import { Button, Don } from '@/components';
import { Icon } from '@/shell/icon';

import type { Business } from './edicion/draft';
import * as g from './general.css';
import * as n from './negocio.css';
import { ICONO, Tile } from './parts';

/** The small pieces of CfgNegocio around the two data panels. */

/** Don points at the missing fiscal data; only the owner gets «Completar». */
export function AvisoFiscal({ onCompletar }: { readonly onCompletar: (() => void) | null }) {
  return (
    <div className={g.avisoFiscal} role="note">
      <span className={g.avisoDon}>
        <Don pose="senalando" size={40} />
      </span>
      <span className={g.avisoTexto}>
        Sin datos fiscales: solo los necesitas si quieres factura de tu suscripción.
      </span>
      {onCompletar ? (
        <Button variant="secondary" size="sm" onClick={onCompletar}>
          Completar
        </Button>
      ) : null}
    </div>
  );
}

const describe = (tipo: string, opciones: readonly string[] | undefined) =>
  tipo === 'select' ? (opciones ?? []).join(' · ') : 'Texto libre';

export function AtributosCard(props: {
  readonly business: Business;
  readonly onEditar: (() => void) | null;
}) {
  const saved = parseAtributos(props.business.atributosProducto);
  return (
    <section className={n.compacta} aria-labelledby="negocio-atributos">
      <Tile path={ICONO.etiqueta} fondo={colors.purpleSoft} />
      <span className={n.compactaTexto}>
        <h2 id="negocio-atributos" className={n.compactaTitulo}>
          Atributos de producto
        </h2>
        {saved.length === 0 ? (
          <span className={n.compactaSub}>
            Sin atributos. Agrégalos si vendes tallas, colores o sabores.
          </span>
        ) : (
          saved.map((a) => (
            <span key={a.clave} className={g.attrResumen}>
              <span className={g.attrNombre}>{a.label}:</span>
              <span>{describe(a.tipo, a.opciones)}</span>
            </span>
          ))
        )}
      </span>
      {props.onEditar ? (
        <Button
          variant="secondary"
          size="sm"
          aria-label={saved.length === 0 ? 'Agregar atributos' : 'Editar atributos'}
          onClick={props.onEditar}
        >
          {saved.length === 0 ? 'Agregar' : 'Editar'}
        </Button>
      ) : null}
    </section>
  );
}

/** Re-run the onboarding wizard (N-15): answers change, features follow. */
export function VolverCard() {
  return (
    <Link href="/bienvenida/revisar" className={n.enlace}>
      <Tile path={ICONO.repetir} fondo={colors.peachSoft} />
      <span className={n.compactaTexto}>
        <span className={n.compactaTitulo}>Volver a configurar mi negocio</span>
        <span className={n.compactaSub}>
          Responde otra vez las preguntas del inicio; tus funciones se acomodan solas.
        </span>
      </span>
      <Icon path={ICONO.flecha} size={18} strokeWidth={2.4} />
    </Link>
  );
}
