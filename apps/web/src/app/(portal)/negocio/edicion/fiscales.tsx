'use client';

import { useState } from 'react';

import { Input, OptionCards, Switch } from '@/components';

import * as g from '../general.css';
import type { Edicion } from './use-edicion';

/**
 * Datos fiscales in the drawer (README Q15): any may stay blank; what is
 * filled in is checked with the CFDI router's own rules, the RFC's check digit too.
 */
const USOS = [
  { value: 'G03', title: 'G03 · Gastos en general', description: 'Lo habitual para un negocio.' },
  {
    value: 'G01',
    title: 'G01 · Adquisición de mercancías',
    description: 'Si revendes lo que compras.',
  },
  { value: 'S01', title: 'S01 · Sin efectos fiscales', description: 'Si no deduces la factura.' },
];

/** P-36.4: the uso only matters for Xangarro's invoice to the business; G03 unless asked. */
function UsoCfdi({ e }: { readonly e: Edicion }) {
  const [quiereFactura, setQuiereFactura] = useState(e.draft?.usoCfdi !== 'G03');
  if (e.draft === null) return null;
  return (
    <div className={g.grupo}>
      <label className={g.interruptorQuieto}>
        <Switch
          checked={quiereFactura}
          label="Elegir el uso de CFDI de mi factura"
          onCheckedChange={(on) => {
            setQuiereFactura(on);
            if (!on) e.set({ usoCfdi: 'G03' });
          }}
        />
        <span style={{ display: 'flex', flexDirection: 'column' }}>
          Elegir el uso de CFDI de mi factura
          <span className={g.pista}>
            {quiereFactura ? 'Elige uno.' : 'Si no, usamos G03 · Gastos en general.'}
          </span>
        </span>
      </label>
      {quiereFactura ? (
        <OptionCards
          ariaLabel="Uso de CFDI"
          options={USOS}
          value={e.draft.usoCfdi}
          onValueChange={(v) => e.set({ usoCfdi: v })}
        />
      ) : null}
    </div>
  );
}

function Rfc({ e }: { readonly e: Edicion }) {
  return (
    <Input
      labelText="RFC"
      hintText="Revisamos el dígito verificador al guardar."
      placeholder="13 letras y números"
      maxLength={13}
      value={e.draft?.rfc ?? ''}
      onChange={(ev) => e.set({ rfc: ev.target.value.toUpperCase() })}
      error={e.errores.campos.rfc}
      data-testid="fiscal-rfc"
    />
  );
}

export function FiscalesEdit({ e }: { readonly e: Edicion }) {
  if (e.draft === null) return null;
  const d = e.draft;
  const err = e.errores.campos;
  return (
    <div className={g.campos}>
      <p className={g.pistaAzul}>
        Solo si quieres factura de tu suscripción a Xangarro. No se usan para nada más; puedes
        dejarlos en blanco.
      </p>
      <Rfc e={e} />
      <Input
        labelText="Razón social"
        placeholder="Como aparece en tu constancia"
        value={d.razonSocial}
        onChange={(ev) => e.set({ razonSocial: ev.target.value })}
        error={err.razonSocial}
        data-testid="fiscal-razon"
      />
      <Input
        labelText="Código postal fiscal"
        placeholder="5 números"
        maxLength={5}
        numeric
        value={d.codigoPostal}
        onChange={(ev) => e.set({ codigoPostal: ev.target.value })}
        error={err.codigoPostal}
        data-testid="fiscal-cp"
      />
      <UsoCfdi e={e} />
    </div>
  );
}
