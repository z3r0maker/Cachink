'use client';

import { useState } from 'react';

import { Input, OptionCards, Switch } from '@/components';
import { hint } from '../negocio.css';

import { SectionShell } from '../parts';
import type { Edicion } from './use-edicion';

/**
 * Datos fiscales in edit mode (README Q15): any may stay blank; what is filled
 * in is checked with the CFDI router's own rules, the RFC's check digit too.
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
    <>
      <label style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 12 }}>
        <Switch
          checked={quiereFactura}
          label="Elegir el uso de CFDI de mi factura"
          onCheckedChange={(on) => {
            setQuiereFactura(on);
            if (!on) e.set({ usoCfdi: 'G03' });
          }}
        />
        Uso de CFDI: {quiereFactura ? 'elige uno' : 'G03 · Gastos en general (predeterminado)'}
      </label>
      {quiereFactura ? (
        <OptionCards
          ariaLabel="Uso de CFDI"
          options={USOS}
          value={e.draft.usoCfdi}
          onValueChange={(v) => e.set({ usoCfdi: v })}
        />
      ) : null}
    </>
  );
}

export function FiscalesEdit({ e }: { readonly e: Edicion }) {
  if (e.draft === null) return null;
  const d = e.draft;
  const err = e.errores.campos;
  return (
    <SectionShell title="Datos fiscales" tone="info">
      <p className={hint}>
        Solo si quieres factura de tu suscripción a Xangarro. No se usan para nada más; puedes
        dejarlos en blanco.
      </p>
      <Input
        labelText="RFC"
        value={d.rfc}
        onChange={(ev) => e.set({ rfc: ev.target.value.toUpperCase() })}
        error={err.rfc}
        data-testid="fiscal-rfc"
      />
      <Input
        labelText="Razón social"
        value={d.razonSocial}
        onChange={(ev) => e.set({ razonSocial: ev.target.value })}
        error={err.razonSocial}
        data-testid="fiscal-razon"
      />
      <Input
        labelText="Código postal fiscal"
        numeric
        value={d.codigoPostal}
        onChange={(ev) => e.set({ codigoPostal: ev.target.value })}
        error={err.codigoPostal}
        data-testid="fiscal-cp"
      />
      <UsoCfdi e={e} />
    </SectionShell>
  );
}
