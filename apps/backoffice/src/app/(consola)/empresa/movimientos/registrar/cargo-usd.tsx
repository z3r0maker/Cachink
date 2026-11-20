'use client';

import { pesosToCentavos } from '@xangarro/domain';
import { tipoCambioDelCargo, tipoCambioRaro } from '@xangarro/domain/corp';
import { useState } from 'react';

import * as d from '@/styles/mostrador-data.css';
import * as mv from '@/styles/mostrador-movimientos.css';

import { Campo } from './opciones';

/**
 * A USD expense paid from a peso account (E-42, board CD-01g): the invoice's
 * dollars and what the bank charged in pesos; the rate is worked out, never
 * typed. Outside 15–25 pesos per dollar it asks «¿Seguro?», and still allows it.
 */
function tipoDe(usd: string, cargo: string): string | null {
  const u = pesosToCentavos(usd);
  const c = pesosToCentavos(cargo);
  if (u === null || c === null || u <= 0n || c <= 0n) return null;
  return tipoCambioDelCargo(u, c);
}

function Tipo({ tc }: { readonly tc: string | null }) {
  if (tc === null) {
    return (
      <p className={mv.tcPendiente} data-testid="tc-pendiente">
        Escribe lo que cobró el banco y lo calculamos: pesos cobrados entre dólares de la factura.
        Cópialo de tu banca en línea o del estado de cuenta de la tarjeta, con la comisión incluida.
      </p>
    );
  }
  const raro = tipoCambioRaro(tc);
  return (
    <div className={raro ? mv.tcRaro : mv.tc} role="status" data-testid="tc-del-banco">
      <span className={mv.tcTitulo}>
        {raro ? '¿Seguro? Eso es cobrar a' : 'El banco te cobró a'}
      </span>
      <span className={mv.tcValor}>{tc} pesos por dólar</span>
      <span className={d.hint}>
        {raro
          ? 'Un dólar suele costar entre 15 y 25 pesos. Revisa el cargo: quizá sobra un dígito. Si es correcto, puedes registrarlo así.'
          : 'Pesos cobrados entre dólares de la factura, con la comisión del banco incluida. Se guarda con el movimiento.'}
      </span>
    </div>
  );
}

export function CargoUsd(props: { readonly inicial?: string; readonly nombreUsd?: string }) {
  const [usd, setUsd] = useState(props.inicial ?? '');
  const [cargo, setCargo] = useState('');
  return (
    <>
      <div className={d.fields}>
        <Campo
          label="Monto de la factura (USD)"
          name={props.nombreUsd ?? 'monto'}
          inputMode="decimal"
          required
          value={usd}
          onChange={(e) => setUsd(e.target.value)}
        />
        <Campo
          label="Lo que cobró el banco (MXN)"
          name="cargo"
          inputMode="decimal"
          required
          placeholder="Como aparece el cargo"
          value={cargo}
          onChange={(e) => setCargo(e.target.value)}
        />
      </div>
      <Tipo tc={tipoDe(usd, cargo)} />
    </>
  );
}

/** For an invoice whose dollars come from its XML: only the charge is typed. */
export function CargoDeFactura(props: {
  readonly usd: string;
  readonly tipoXml: string;
  /** `cargo-<uuid>` when several invoices share a form. */
  readonly name?: string;
}) {
  const [cargo, setCargo] = useState('');
  const tc = tipoDe(props.usd, cargo);
  return (
    <>
      <Campo
        label="Lo que cobró el banco (MXN)"
        name={props.name ?? 'cargo'}
        inputMode="decimal"
        required
        placeholder="Como aparece el cargo"
        value={cargo}
        onChange={(e) => setCargo(e.target.value)}
        hint={`La factura es de USD ${props.usd} y dice ${props.tipoXml}, el tipo de cambio que fijó el proveedor. En los libros queda lo que cobró el banco.`}
      />
      <Tipo tc={tc} />
    </>
  );
}
