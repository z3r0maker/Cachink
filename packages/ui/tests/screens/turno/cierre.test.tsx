/**
 * Cierre (M-09): the count and the close as values, the phone's rows said as
 * `CierreData`, and the screen: steppers, the difference and its motive, the
 * queue's band that never blocks (ADR-123) and «¡Turno cerrado!».
 */
import type { ReactElement } from 'react';
import { describe, expect, it, vi } from 'vitest';
import type { CierreData } from '@xangarro/caja/cierre';
import { initI18n } from '../../../src/i18n/index';
import { cierreMovil, type FilasCierre } from '../../../src/screens/Cierre/cierre-lectura';
import {
  derivar,
  entradaCierre,
  piezasDe,
  poner,
  textoDelCorte,
} from '../../../src/screens/Cierre/cierre-logica';
import { lineaResumen } from '../../../src/screens/Cierre/cierre-resumen';
import { CierreScreen } from '../../../src/screens/Cierre/cierre-screen';
import type { CierreHecho, ColaCierre } from '../../../src/screens/Cierre/cierre-tipos';
import { useConteoCierre } from '../../../src/screens/Cierre/use-conteo-cierre';
import { fireEvent, renderWithProviders, screen } from '../../test-utils';
import { FILAS, turno } from './filas';

initI18n();

const AHORA = new Date(2026, 4, 14, 21, 4);
const ENTORNO = {
  operador: 'Ana Robledo',
  caja: 'Caja 1',
  negocio: 'Taquería Don Pedro',
  dueno: 'Pedro Salas',
  deviceId: 'D',
  ahora: AHORA,
};
const entrada = (motivo: string) =>
  ({
    id: `M${motivo}`,
    productoId: 'P1',
    tipo: motivo === 'Merma / daño' ? 'salida' : 'entrada',
    cantidad: 3,
    motivo,
    nota: null,
    origen: 'manual',
    deviceId: 'D',
    createdAt: new Date(2026, 4, 14, 12, 0).toISOString(),
    deletedAt: null,
  }) as never;

const FILAS_CIERRE: FilasCierre = {
  turno: turno(),
  ...FILAS,
  inventario: [entrada('Compra a proveedor'), entrada('Merma / daño'), entrada('Venta')],
};

const DATA: CierreData = cierreMovil(FILAS_CIERRE, ENTORNO);

describe('cierreMovil', () => {
  it('says the turno as the close screen reads it', () => {
    expect(DATA.partes).toEqual({
      fondo: 800_00n,
      ventasEfectivo: 1_980_00n,
      abonosEfectivo: 550_00n,
      gastosEfectivo: 620_00n,
    });
    expect(DATA.desde).toBe('08:15');
    expect(DATA.hasta).toBe('21:04');
    expect(DATA.dueno).toBe('Pedro');
    expect(DATA.resumen).toMatchObject({
      ventas: 2,
      canceladas: 1,
      canceladaHora: '12:58',
      fiado: 182_00n,
      entradas: 1,
      mermas: 1,
    });
    expect(lineaResumen(DATA.resumen)).toBe(
      '2 ventas · 1 cancelada (12:58) · Fiado $182.00 · 1 entrada · 1 merma',
    );
  });
});

describe('the count and the close', () => {
  it('derives the difference and what blocks the button', () => {
    const cuadra = derivar(
      { 'billete-1000': 2, 'billete-500': 1, 'billete-200': 1, 'moneda-10': 1 },
      DATA.partes,
      null,
      '',
    );
    expect(cuadra.contado).toBe(2_710_00n);
    expect(cuadra.dif.tipo).toBe('cuadra');
    expect(cuadra.puede).toBe(true);
    const falta = derivar({ 'billete-1000': 2 }, DATA.partes, null, '');
    expect(falta.dif).toEqual({ tipo: 'falta', monto: 710_00n });
    expect(falta.faltaMotivo).toBe(true);
    expect(derivar({}, DATA.partes, 'Otra razón', '  ').faltaNota).toBe(true);
    expect(derivar({}, DATA.partes, 'Otra razón', 'Se pagó el gas').puede).toBe(true);
  });

  it('maps the motive onto the domain enum, the note only for «Otra razón», the pieces', () => {
    const conteo = { 'billete-1000': 2, 'moneda-1': 0 };
    const d = derivar(conteo, DATA.partes, 'Cambio mal dado', '');
    expect(entradaCierre(d, conteo, 'Cambio mal dado', 'x')).toEqual({
      montoCierreCentavos: 2_000_00n,
      discrepancyReason: 'error-en-cambio',
      explicacion: null,
      denominaciones: { 'billete-1000': 2 },
    });
    const otra = entradaCierre(d, conteo, 'Otra razón', ' Se pagó el gas ');
    expect(otra.discrepancyReason).toBe('otro');
    expect(otra.explicacion).toBe('Se pagó el gas');
    const c = derivar({ 'billete-1000': 3 }, DATA.partes, 'Venta no registrada', '');
    expect(entradaCierre(c, {}, 'Venta no registrada', '').discrepancyReason).toBe('sobrante');
  });

  it('keeps pieces whole and never below zero', () => {
    expect(poner({}, 'moneda-5', -1)).toEqual({ 'moneda-5': 0 });
    expect(poner({}, 'moneda-5', 2.7)).toEqual({ 'moneda-5': 2 });
    expect(piezasDe('1a2')).toBe(12);
    expect(piezasDe('')).toBe(0);
  });
});

const COLA: ColaCierre = {
  porEnviar: 0,
  reintentando: 0,
  enviando: false,
  sinRed: false,
  reintentar: vi.fn(),
};

function Arnes(p: { cola?: ColaCierre; hecho?: CierreHecho; cerrar?: () => void }): ReactElement {
  const conteo = useConteoCierre(DATA);
  return (
    <CierreScreen
      x={{
        state: 'happy',
        data: DATA,
        conteo,
        cola: p.cola ?? COLA,
        cerrar: p.cerrar ?? vi.fn(),
        cerrando: false,
        fallo: false,
        hecho: p.hecho ?? null,
        refetch: vi.fn(),
      }}
      onVerCuales={vi.fn()}
      onCompartir={vi.fn()}
      onSalir={vi.fn()}
      onVolver={vi.fn()}
    />
  );
}

const tap = (id: string): void => {
  const el = screen.getByTestId(id);
  fireEvent.pointerDown(el);
  fireEvent.pointerUp(el);
  fireEvent.click(el);
};

describe('CierreScreen', () => {
  it('counts with the steppers, asks a motive for the difference, then closes', () => {
    const cerrar = vi.fn();
    renderWithProviders(<Arnes cerrar={cerrar} />);
    expect(screen.getByTestId('cierre-esperado')).toHaveTextContent('$2,710.00');
    tap('conteo-billete-1000-mas');
    tap('conteo-billete-1000-mas');
    expect(screen.getByTestId('cierre-contado')).toHaveTextContent('$2,000.00');
    expect(screen.getByTestId('cierre-diferencia-falta')).toHaveTextContent('Falta −$710.00');
    expect(screen.getByTestId('cierre-hint')).toHaveTextContent(
      'Elige un motivo para poder cerrar.',
    );
    tap('cierre-cerrar');
    expect(cerrar).not.toHaveBeenCalled();
    tap('cierre-motivo-0');
    expect(screen.getByTestId('cierre-cerrar')).toHaveTextContent(
      'Cerrar turno con faltante de $710.00',
    );
    tap('cierre-cerrar');
    expect(cerrar).toHaveBeenCalled();
    expect(screen.queryByTestId('cierre-por-enviar')).toBeNull();
  });

  it('warns about records to send without blocking the close (ADR-123)', () => {
    renderWithProviders(<Arnes cola={{ ...COLA, porEnviar: 3, reintentando: 1 }} />);
    expect(screen.getByTestId('cierre-por-enviar')).toHaveTextContent(
      'Tienes 3 registros por enviar (1 se reintentará solo).',
    );
    expect(screen.getByTestId('cierre-ver-cuales')).toBeInTheDocument();
  });

  it('once closed: Don, the corte and the way to send it', () => {
    const hecho: CierreHecho = {
      data: DATA,
      contado: 2_710_00n,
      esperado: 2_710_00n,
      dif: { tipo: 'cuadra', monto: 0n },
      motivo: null,
      porEnviar: 0,
      fecha: '14 may',
    };
    renderWithProviders(<Arnes hecho={hecho} />);
    expect(screen.getByTestId('cierre-hecho')).toHaveTextContent('Cuadró al centavo.');
    expect(screen.getByTestId('cierre-hecho')).toHaveTextContent(
      'Pedro ya lo tiene en su portal. Gracias por tu turno, Ana.',
    );
    expect(screen.getByTestId('don-celebrando')).toBeInTheDocument();
    expect(screen.getByTestId('corte-diferencia')).toHaveTextContent('$0.00');
    expect(screen.getByTestId('cierre-compartir')).toHaveTextContent('Mandar el corte a Pedro');
    expect(textoDelCorte(hecho)).toBe(
      'Corte Caja 1, Ana Robledo, 14 may: contado $2,710.00, esperado $2,710.00, cuadró.',
    );
  });
});
