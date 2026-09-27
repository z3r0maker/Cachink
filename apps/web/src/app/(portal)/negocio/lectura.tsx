'use client';

import { REGIMEN_NOMBRE } from '@xangarro/domain';
import { colors } from '@xangarro/tokens';

import type { Business } from './edicion/draft';
import type { Seccion } from './edicion/use-edicion';
import { EditarBoton, Fila, ICONO, Panel } from './parts';
import { predeterminado } from './negocio.css';

/**
 * The two data panels in read mode (CfgNegocio). Each opens its own drawer;
 * the fiscal one says «Completar» while something is missing.
 */

/** P-36.4: no régimen is a choice («Ninguno por ahora»), not something missing. */
const regimenLabel = (code: string | null): string =>
  code === null ? 'Ninguno por ahora' : `${code} · ${REGIMEN_NOMBRE[code] ?? code}`;

const TIPO: Readonly<Record<string, string>> = {
  'producto-con-stock': 'Productos con inventario',
  'producto-sin-stock': 'Productos sin inventario',
  servicio: 'Servicios',
  mixto: 'Mixto: productos y servicios',
};

export const tipoLabel = (t: string | null | undefined): string =>
  t ? (TIPO[t] ?? t) : 'Sin especificar';

const USO: Readonly<Record<string, string>> = {
  G03: 'G03 · Gastos en general',
  G01: 'G01 · Adquisición de mercancías',
  S01: 'S01 · Sin efectos fiscales',
};

export const faltanFiscales = (b: Business): boolean => !b.rfc || !b.razonSocial || !b.codigoPostal;

type Abrir = ((s: Seccion) => void) | null;

export function GeneralesCard({ b, abrir }: { readonly b: Business; readonly abrir: Abrir }) {
  return (
    <Panel
      id="negocio-generales"
      titulo="Datos generales"
      icono={ICONO.tienda}
      fondo={colors.yellow}
      accion={
        abrir ? (
          <EditarBoton
            texto="Editar"
            label="Editar datos generales"
            onClick={() => abrir('generales')}
          />
        ) : null
      }
    >
      <Fila label="Nombre del negocio" value={b.nombre} />
      <Fila label="Régimen fiscal" value={regimenLabel(b.regimenSat)} />
      <Fila label="Tasa de ISR" value={`${(b.isrTasa ?? 0) / 100}%`} />
      <Fila label="Tipo de negocio" value={tipoLabel(b.tipoNegocio)} />
    </Panel>
  );
}

export function FiscalesCard({ b, abrir }: { readonly b: Business; readonly abrir: Abrir }) {
  const falta = faltanFiscales(b);
  const texto = falta ? 'Completar' : 'Editar';
  return (
    <Panel
      id="negocio-fiscales"
      titulo="Datos fiscales"
      icono={ICONO.recibo}
      fondo={colors.blueSoft}
      accion={
        abrir ? (
          <EditarBoton
            texto={texto}
            label={`${texto} datos fiscales`}
            onClick={() => abrir('fiscales')}
          />
        ) : null
      }
    >
      <Fila label="RFC" value={b.rfc || null} />
      <Fila label="Razón social" value={b.razonSocial || null} />
      <Fila label="Código postal fiscal" value={b.codigoPostal || null} />
      {/* An empty uso is not missing: invoices use G03 until the owner picks. */}
      <Fila
        label="Uso de CFDI"
        value={USO[b.usoCfdi ?? 'G03'] ?? b.usoCfdi}
        extra={
          (b.usoCfdi ?? 'G03') === 'G03' ? (
            <span className={predeterminado}>predeterminado</span>
          ) : null
        }
      />
    </Panel>
  );
}
