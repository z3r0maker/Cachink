import { colors } from '@xangarro/tokens';

import type { CobranzaData } from './types';

/**
 * `Operador Cobranza.dc.html`, in centavos: $1,780.00 owed by three clients;
 * three abonos today, $760.00, of which $550.00 in cash (as on Turno).
 */
export const COBRANZA_FIXTURE: CobranzaData = {
  clientes: [
    {
      id: 'mari',
      nombre: 'Doña Mari de la tienda',
      iniciales: 'DM',
      telefono: '5512 447 903',
      tint: colors.yellow,
      atrasado: false,
      abiertas: [
        { folio: 'V-0409', fecha: '2026-05-14', dia: '14 may', pendiente: 90_00n },
        { folio: 'V-0388', fecha: '2026-05-11', dia: '11 may', pendiente: 150_00n },
        { folio: 'V-0361', fecha: '2026-05-08', dia: '8 may', pendiente: 100_00n },
      ],
    },
    {
      id: 'chuy',
      nombre: 'Taller de Chuy',
      iniciales: 'TC',
      telefono: '5533 981 204',
      tint: colors.blueSoft,
      atrasado: true,
      abiertas: [
        { folio: 'V-0310', fecha: '2026-05-02', dia: '2 may', pendiente: 460_00n },
        { folio: 'V-0288', fecha: '2026-04-28', dia: '28 abr', pendiente: 400_00n },
      ],
    },
    {
      id: 'raul',
      nombre: 'Raúl (obra de la esquina)',
      iniciales: 'RO',
      telefono: '5521 664 019',
      tint: colors.peachSoft,
      atrasado: false,
      abiertas: [
        { folio: 'V-0402', fecha: '2026-05-13', dia: '13 may', pendiente: 320_00n },
        { folio: 'V-0375', fecha: '2026-05-10', dia: '10 may', pendiente: 260_00n },
      ],
    },
    {
      id: 'delgado',
      nombre: 'Oficina Delgado',
      iniciales: 'OD',
      telefono: '5544 120 887',
      tint: colors.greenSoft,
      atrasado: false,
      abiertas: [],
      ultimaLiquidada: '9 may',
    },
  ],
  abonos: [
    {
      id: 'a-3',
      clienteId: 'chuy',
      detalle: 'Efectivo contra saldo de $1,260.00 · se aplicó a V-0288 y parte de V-0310',
      monto: 400_00n,
      metodo: 'Efectivo',
      hora: '13:52',
    },
    {
      id: 'a-2',
      clienteId: 'mari',
      detalle: 'Transferencia · se aplicó a V-0340 completa',
      monto: 210_00n,
      metodo: 'Transferencia',
      hora: '11:18',
    },
    {
      id: 'a-1',
      clienteId: 'raul',
      detalle: 'Efectivo · abono parcial a V-0351',
      monto: 150_00n,
      metodo: 'Efectivo',
      hora: '09:40',
    },
  ],
};
