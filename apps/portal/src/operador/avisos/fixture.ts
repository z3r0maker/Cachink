import { ICONS, OPERADOR_BASE } from '../shell/nav';
import type { AvisosData } from './types';

const PERSONA = 'M16 20v-2a4 4 0 0 0-8 0v2M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8';
const NUBE = 'M21 11a9 9 0 0 0-15-5.5L3 8m0-5v5h5m-5 3a9 9 0 0 0 15 5.5l3-2.5m0 5v-5h-5';
const CHECK = 'M20 6 9 17l-5-5';

/** The design's six notices (`Operador Avisos.dc.html`). Replaced in O-06 / C-19. */
export const AVISOS_FIXTURE: AvisosData = {
  dueno: 'Pedro',
  avisos: [
    {
      id: 'corte',
      grupo: 'dueno',
      tipo: 'Mensaje de Pedro',
      titulo: 'Aclara el corte del 13 de mayo',
      cuerpo:
        'Faltaron $60.00 en la Caja 2 al cerrar. No hay problema, solo dime qué recuerdas para cerrarlo.',
      hora: 'Hoy 09:12',
      icono: PERSONA,
      tono: 'alerta',
      responder: { asunto: 'el corte del 13 de mayo' },
      leido: false,
    },
    {
      id: 'precio',
      grupo: 'dueno',
      tipo: 'Mensaje de Pedro',
      titulo: 'La gringa sube a $65.00 desde mañana',
      cuerpo: 'Ya lo cambié en el catálogo. Si un cliente pregunta, es por el queso.',
      hora: 'Ayer 19:40',
      icono: PERSONA,
      tono: 'dueno',
      cta: { label: 'Ver catálogo', href: `${OPERADOR_BASE}/caja` },
      leido: false,
    },
    {
      id: 'tripa',
      grupo: 'caja',
      tipo: 'Inventario',
      titulo: 'Taco de tripa está por debajo del umbral',
      cuerpo:
        'Quedan 6 y el umbral es 15. Si llega mercancía, registra la entrada para que el stock cuadre.',
      hora: 'Hoy 13:20',
      icono: ICONS.inventario,
      tono: 'atencion',
      cta: { label: 'Ir a inventario', href: `${OPERADOR_BASE}/inventario` },
      leido: false,
    },
    {
      id: 'cola',
      grupo: 'caja',
      tipo: 'Sincronización',
      titulo: '3 registros siguen sin enviarse',
      cuerpo:
        'Se capturaron sin conexión y viven en este navegador. No podrás cerrar el turno hasta que suban.',
      hora: 'Hoy 14:55',
      icono: NUBE,
      tono: 'atencion',
      cta: { label: 'Ver la cola', href: `${OPERADOR_BASE}/pendientes` },
      leido: false,
    },
    {
      id: 'producto',
      grupo: 'caja',
      tipo: 'Revisión de caja',
      titulo: 'Pedro aprobó «Orden de tripa»',
      cuerpo: 'Ya está en el catálogo con su costo y existencias. Puedes venderla normal.',
      hora: 'Hoy 10:05',
      icono: CHECK,
      tono: 'hecho',
      leido: false,
    },
    {
      id: 'chuy',
      grupo: 'caja',
      tipo: 'Cobranza',
      titulo: 'El Taller de Chuy lleva 16 días sin abonar',
      cuerpo: 'Debe $860.00. Si pasa por aquí, puedes recibirle un abono en efectivo.',
      hora: 'Ayer 08:00',
      icono: ICONS.cobranza,
      tono: 'info',
      cta: { label: 'Ir a cobranza', href: `${OPERADOR_BASE}/cobranza` },
      leido: false,
    },
  ],
};
