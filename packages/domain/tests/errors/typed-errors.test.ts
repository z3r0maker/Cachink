import { describe, it } from 'vitest';
import assert from 'node:assert/strict';

import {
  AbonoInvalidoError,
  BusinessNotFoundError,
  CajaNoAbiertaError,
  ClientInvalidError,
  ClientNotFoundError,
  ConfirmacionNombreError,
  CorteInvalidoError,
  DuplicateOperatorError,
  EmpleadoInvalidoError,
  EmpleadoNoEncontradoError,
  FlagDependencyError,
  FlagNotAllowedError,
  ImportacionAsistidaInvalida,
  ImportacionAsistidaNoDisponible,
  ImportacionAsistidaYaActiva,
  InitialStockNotAllowedError,
  InventarioInicialInvalidoError,
  InventarioInicialYaCapturadoError,
  InvalidPinError,
  MissingPeriodEndError,
  NegocioInvalidoError,
  OperatorLimitError,
  OperatorNotFoundError,
  PermisosNoIncluidosError,
  PlanLimitError,
  ProductInvalidError,
  ProductNotFoundError,
  SaldosBloqueadosError,
  SaldosInvalidosError,
  StockNotEmptyError,
  SuscripcionActivaError,
  UnknownPlanError,
} from '../../src/index.js';

/**
 * §8: a domain error carries a `code` and a `message`, never a bare Error.
 * The code is what callers branch on, and the message is what the owner
 * reads — both are part of the contract, so each class is constructed once
 * and pinned. (The catch-alls that merely wrap — conversion, feature-flag
 * transitions — are covered beside their use cases.)
 */
describe('typed errors carry their code and their sentence', () => {
  const casos: readonly [string, Error & { readonly code: string }, string][] = [
    ['client', new ClientInvalidError(['nombre', 'rfc']), 'CLIENT_INVALID'],
    ['client gone', new ClientNotFoundError('c-1'), 'CLIENT_NOT_FOUND'],
    ['plan limit', new PlanLimitError('xangarrito', 300), 'PLAN_LIMIT_RECORDS'],
    ['caja cerrada', new CajaNoAbiertaError(), 'CAJA_NO_ABIERTA'],
    ['corte imposible', new CorteInvalidoError('negativo'), 'CORTE_INVALIDO'],
    ['plan desconocido', new UnknownPlanError('patrocinado'), 'UNKNOWN_PLAN'],
    ['sin periodo', new MissingPeriodEndError('active'), 'MISSING_PERIOD_END'],
    ['saldos bloqueados', new SaldosBloqueadosError('2026-05-01'), 'SALDOS_BLOQUEADOS'],
    ['saldos inválidos', new SaldosInvalidosError(['caja']), 'SALDOS_INVALIDOS'],
    ['inventario ya', new InventarioInicialYaCapturadoError(), 'INVENTARIO_INICIAL_YA_CAPTURADO'],
    [
      'inventario mal',
      new InventarioInicialInvalidoError(['fila 2']),
      'INVENTARIO_INICIAL_INVALIDO',
    ],
    ['producto mal', new ProductInvalidError(['precio']), 'PRODUCT_INVALID'],
    ['sin stock inicial', new InitialStockNotAllowedError(), 'INITIAL_STOCK_NOT_ALLOWED'],
    ['producto gone', new ProductNotFoundError('p-1'), 'PRODUCT_NOT_FOUND'],
    ['stock no vacío', new StockNotEmptyError(7), 'STOCK_NOT_EMPTY'],
    ['abono en cero', new AbonoInvalidoError(), 'ABONO_INVALIDO'],
    [
      'negocio mal',
      new NegocioInvalidoError({ campos: { rfc: 'RFC inválido' }, atributos: {} }),
      'NEGOCIO_INVALIDO',
    ],
    ['confirmación', new ConfirmacionNombreError(), 'CONFIRMACION_NOMBRE'],
    ['suscripción viva', new SuscripcionActivaError(), 'SUSCRIPCION_ACTIVA'],
    ['empleado mal', new EmpleadoInvalidoError({ nombre: 'Falta el nombre' }), 'EMPLEADO_INVALIDO'],
    ['empleado gone', new EmpleadoNoEncontradoError(), 'EMPLEADO_NO_ENCONTRADO'],
    ['límite operadores', new OperatorLimitError(2), 'OPERATOR_LIMIT'],
    ['nip mal', new InvalidPinError(), 'INVALID_PIN'],
    ['operador gone', new OperatorNotFoundError(), 'OPERATOR_NOT_FOUND'],
    ['operador duplicado', new DuplicateOperatorError('Ana'), 'DUPLICATE_OPERATOR'],
    ['permisos de plan', new PermisosNoIncluidosError(), 'PERMISOS_NO_INCLUIDOS'],
    ['negocio gone', new BusinessNotFoundError(), 'BUSINESS_NOT_FOUND'],
    ['dependencia', new FlagDependencyError('merma'), 'FLAG_DEPENDENCY'],
    ['fuera de plan', new FlagNotAllowedError(), 'FLAG_NOT_ALLOWED'],
    [
      'asistida fuera de plan',
      new ImportacionAsistidaNoDisponible(),
      'IMPORTACION_ASISTIDA_NO_DISPONIBLE',
    ],
    ['asistida ya activa', new ImportacionAsistidaYaActiva(), 'IMPORTACION_ASISTIDA_YA_ACTIVA'],
    ['asistida mal', new ImportacionAsistidaInvalida(['url']), 'IMPORTACION_ASISTIDA_INVALIDA'],
  ];

  it('every error names its code', () => {
    for (const [nombre, error, code] of casos) {
      assert.equal(error.code, code, `${nombre} carry ${code}`);
    }
  });

  it('every error says something to the owner, in a name callers can catch', () => {
    for (const [nombre, error] of casos) {
      assert.ok(error.message.length > 0, `${nombre} message`);
      assert.ok(error.name.length > 0, `${nombre} name`);
      assert.ok(error instanceof Error, `${nombre} is an Error`);
    }
  });
});
