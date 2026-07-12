/**
 * Audit config extra smoke tests — verify all mutation configs have valid shape.
 */

import { describe, it, expect } from 'vitest';
import {
  MUTATION_ELIMINAR_PRODUCTO,
  MUTATION_CREAR_CLIENTE,
  MUTATION_EDITAR_CLIENTE,
  MUTATION_ELIMINAR_CLIENTE,
  MUTATION_CREAR_EMPLEADO,
  MUTATION_EDITAR_EMPLEADO,
  MUTATION_ELIMINAR_EMPLEADO,
  MUTATION_CREAR_USUARIO,
  MUTATION_ELIMINAR_USUARIO,
  MUTATION_TOGGLE_FLAG,
  MUTATION_PROCESAR_RECURRENTE,
  MUTATION_DESCARTAR_RECURRENTE,
  MUTATION_CREAR_RECETA,
  MUTATION_ELIMINAR_RECETA,
  MUTATION_CREAR_AUDITORIA,
  MUTATION_ACTUALIZAR_AUDITORIA,
  MUTATION_CREAR_BUSINESS,
} from '../../src/observability/audit-configs-extra';

const ALL_CONFIGS = [
  { name: 'MUTATION_ELIMINAR_PRODUCTO', config: MUTATION_ELIMINAR_PRODUCTO },
  { name: 'MUTATION_CREAR_CLIENTE', config: MUTATION_CREAR_CLIENTE },
  { name: 'MUTATION_EDITAR_CLIENTE', config: MUTATION_EDITAR_CLIENTE },
  { name: 'MUTATION_ELIMINAR_CLIENTE', config: MUTATION_ELIMINAR_CLIENTE },
  { name: 'MUTATION_CREAR_EMPLEADO', config: MUTATION_CREAR_EMPLEADO },
  { name: 'MUTATION_EDITAR_EMPLEADO', config: MUTATION_EDITAR_EMPLEADO },
  { name: 'MUTATION_ELIMINAR_EMPLEADO', config: MUTATION_ELIMINAR_EMPLEADO },
  { name: 'MUTATION_CREAR_USUARIO', config: MUTATION_CREAR_USUARIO },
  { name: 'MUTATION_ELIMINAR_USUARIO', config: MUTATION_ELIMINAR_USUARIO },
  { name: 'MUTATION_TOGGLE_FLAG', config: MUTATION_TOGGLE_FLAG },
  { name: 'MUTATION_PROCESAR_RECURRENTE', config: MUTATION_PROCESAR_RECURRENTE },
  { name: 'MUTATION_DESCARTAR_RECURRENTE', config: MUTATION_DESCARTAR_RECURRENTE },
  { name: 'MUTATION_CREAR_RECETA', config: MUTATION_CREAR_RECETA },
  { name: 'MUTATION_ELIMINAR_RECETA', config: MUTATION_ELIMINAR_RECETA },
  { name: 'MUTATION_CREAR_AUDITORIA', config: MUTATION_CREAR_AUDITORIA },
  { name: 'MUTATION_ACTUALIZAR_AUDITORIA', config: MUTATION_ACTUALIZAR_AUDITORIA },
  { name: 'MUTATION_CREAR_BUSINESS', config: MUTATION_CREAR_BUSINESS },
];

describe('Audit mutation configs', () => {
  for (const { name, config } of ALL_CONFIGS) {
    describe(name, () => {
      it('has a valid operation with dot separator', () => {
        expect(config.operation).toContain('.');
      });

      it('has a non-empty entityType', () => {
        expect(config.entityType.length).toBeGreaterThan(0);
      });

      it('extractEntityId is a function', () => {
        expect(typeof config.extractEntityId).toBe('function');
      });
    });
  }

  it('MUTATION_CREAR_CLIENTE extracts id from result', () => {
    const id = MUTATION_CREAR_CLIENTE.extractEntityId(
      { id: 'cli-123' } as never,
      {} as never,
    );
    expect(id).toBe('cli-123');
  });

  it('MUTATION_ELIMINAR_EMPLEADO extracts id from input (string)', () => {
    const id = MUTATION_ELIMINAR_EMPLEADO.extractEntityId(
      undefined as never,
      'emp-456' as never,
    );
    expect(id).toBe('emp-456');
  });

  it('MUTATION_TOGGLE_FLAG extracts key as entity ID', () => {
    const id = MUTATION_TOGGLE_FLAG.extractEntityId(
      {} as never,
      { key: 'merma', newValue: true } as never,
    );
    expect(id).toBe('merma');
  });

  it('MUTATION_EDITAR_CLIENTE falls back to input.id when result is null', () => {
    const id = MUTATION_EDITAR_CLIENTE.extractEntityId(
      null as never,
      { id: 'fallback-id' } as never,
    );
    expect(id).toBe('fallback-id');
  });
});
