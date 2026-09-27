import type { RegistroEnCola } from './types';

/** `Operador Pendientes.dc.html`: two cash sales and a gas expense, three in all (as the shell). */
export const COLA_FIXTURE: readonly RegistroEnCola[] = [
  {
    id: 'q-1',
    tipo: 'venta',
    titulo: 'Venta V-0412',
    detalle: '3 pastor · 1 gringa · 1 horchata · efectivo',
    monto: 160_00n,
    hora: '14:52',
  },
  {
    id: 'q-2',
    tipo: 'venta',
    titulo: 'Venta V-0410',
    detalle: '4 suadero · 1 agua · efectivo',
    monto: 123_00n,
    hora: '14:21',
  },
  {
    id: 'q-3',
    tipo: 'gasto',
    titulo: 'Gasto · Gas',
    detalle: 'Cilindro de 30 kg · con foto del comprobante',
    monto: 620_00n,
    hora: '14:10',
  },
];
