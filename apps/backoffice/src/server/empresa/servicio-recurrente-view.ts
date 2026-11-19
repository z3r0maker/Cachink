import { proximoCargo, type PlantillaRecurrente, type Servicio } from '@xangarro/domain/corp';

import { fechaCorta, nombreMes } from './fechas';
import { categoriaDe, montoEn } from './servicios-textos';

/**
 * «Su gasto recurrente» on a service's detail (E-24, board CD-18c): the
 * template it owns and when it charges next, or why it has none. Pure.
 */
export interface PanelRecurrente {
  readonly titulo: string;
  readonly texto: string;
  /** «Próximo: 3 nov»; null when it does not charge. */
  readonly proximo: string | null;
  /** Whether «Ver en Recurrentes» and the drop's note apply. */
  readonly activa: boolean;
}

function sinPlantilla(s: Servicio): PanelRecurrente {
  const panel = (titulo: string, texto: string) => ({
    titulo,
    texto,
    proximo: null,
    activa: false,
  });
  if (s.cobro === 'gratis') {
    return panel(
      'Sin gasto recurrente',
      'Un servicio gratis no crea gasto. Al cambiar a un plan de pago, edítalo y elige cómo cobra.',
    );
  }
  if (s.cobro === 'comision') {
    return panel(
      'Se registra con cada pago',
      'La comisión de Stripe sale de cada depósito; no lleva gasto recurrente.',
    );
  }
  if (s.estado === 'por_contratar') {
    return panel(
      'Todavía sin gasto recurrente',
      'Se crea al contratarlo: edítalo y quita «Por contratar».',
    );
  }
  return panel(
    'Sin gasto recurrente',
    'Edítalo y marca «Crear su gasto recurrente en Movimientos».',
  );
}

function tituloDe(p: PlantillaRecurrente): string {
  if (p.periodicidad === 'anual') {
    return `Cada ${p.diaCargo} de ${nombreMes(p.desde)} · ${montoEn(p.moneda, p.montoEstimado)}`;
  }
  if (p.montoEstimado === 0n) return `Cada día ${p.diaCargo}, sin monto fijo`;
  return `Cada día ${p.diaCargo} · ${montoEn(p.moneda, p.montoEstimado)}`;
}

export function panelRecurrente(
  s: Servicio,
  p: PlantillaRecurrente | null,
  hoy: string,
): PanelRecurrente {
  if (p === null) return sinPlantilla(s);
  if (!p.activo) {
    return {
      titulo: 'Ya no se repite',
      texto: 'Su gasto recurrente se detuvo. Los gastos ya registrados se quedan.',
      proximo: null,
      activa: false,
    };
  }
  const partes = [categoriaDe(s), s.pagaCon];
  if (p.montoEstimado === 0n) partes.push('el monto se pone al ver el cargo');
  const f = proximoCargo(s, hoy);
  return {
    titulo: tituloDe(p),
    texto: partes.filter((x): x is string => x !== null && x !== '').join(' · '),
    proximo:
      f === null
        ? null
        : `Próximo: ${fechaCorta(f)}${f.slice(0, 4) === hoy.slice(0, 4) ? '' : ` ${f.slice(0, 4)}`}`,
    activa: true,
  };
}
