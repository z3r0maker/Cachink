import { describe, it } from 'vitest';
import assert from 'node:assert/strict';

import { COLA_FIXTURE } from '../src/pendientes/fixture';
import { faseTelefono, pieCola, NOTA_NADA_SE_PIERDE, todoEnviado } from '../src/pendientes/movil';
import { cuentaRechazados, describeRechazado } from '../src/pendientes/rechazado';

const VENTA = {
  id: 's-1',
  monto: '12000' as const,
  concepto: 'Tacos',
  fecha: '2026-05-14',
};

describe('registros por enviar, móviles', () => {
  it('the status line and the footer of each phase, as RvEnvio words them', () => {
    assert.deepEqual(pieCola('sin-internet', COLA_FIXTURE), {
      aviso: '3 registros esperan conexión. Puedes seguir cobrando; se envían solos.',
      boton: 'Reintentar ahora',
      ocupado: false,
    });
    assert.deepEqual(pieCola('espera', COLA_FIXTURE), {
      aviso: '3 registros por enviar. Puedes seguir cobrando; se envían solos.',
      boton: 'Reintentar ahora',
      ocupado: false,
    });
    assert.equal(
      pieCola('sin-internet', [COLA_FIXTURE[0]!]).aviso,
      '1 registro espera conexión. Puedes seguir cobrando; se envían solos.',
    );
  });

  it('sending holds the button and never says the close waits (R3, ADR-123)', () => {
    const p = pieCola('enviando', COLA_FIXTURE);
    assert.deepEqual(p, {
      aviso: 'Enviando 3 registros… Puedes seguir cobrando y cerrar el turno mientras suben.',
      boton: 'Enviando…',
      ocupado: true,
    });
    assert.doesNotMatch(p.aviso ?? '', /espera|esperar/);
  });

  it('refused rows say why on their own card: the footer only retries them', () => {
    assert.deepEqual(pieCola('con-rechazados', []), {
      aviso: null,
      boton: 'Reintentar',
      ocupado: false,
    });
    assert.equal(cuentaRechazados(1), '1 registro');
  });

  it('a queue that only moves cash still says it sends itself', () => {
    const apertura = {
      id: 'q-a',
      tipo: 'movimiento' as const,
      titulo: 'Apertura de caja',
      detalle: 'Fondo contado al abrir',
      monto: 500_00n,
      hora: '08:15',
    };
    assert.equal(
      pieCola('sin-internet', [apertura]).aviso,
      '1 registro espera conexión. Puedes seguir cobrando; se envían solos.',
    );
  });

  it('the note says nothing is lost, and the turno closes with rows still to send (R3)', () => {
    assert.equal(NOTA_NADA_SE_PIERDE.titulo, 'Nada se pierde');
    assert.equal(
      NOTA_NADA_SE_PIERDE.cuerpo,
      'Puedes cerrar el turno; se envían cuando vuelva la conexión.',
    );
    assert.doesNotMatch(NOTA_NADA_SE_PIERDE.cuerpo, /No podrás/);
  });

  it('the phase reads in the pill’s order: sending, refused, offline, waiting, done', () => {
    assert.equal(faseTelefono('syncing', 3, 2), 'enviando');
    assert.equal(faseTelefono('idle', 3, 2), 'con-rechazados');
    assert.equal(faseTelefono('offline', 3, 0), 'sin-internet');
    assert.equal(faseTelefono('idle', 3, 0), 'espera');
    assert.equal(faseTelefono('idle', 0, 0), 'enviado');
    assert.equal(faseTelefono('error', 0, 0), 'enviado');
  });
});

describe('rechazados, la sentencia del servidor', () => {
  it('says the record, the sentence and the way out', () => {
    const v = describeRechazado(
      {
        tableName: 'sales',
        rowId: 'r-1',
        code: 'FK_PRODUCT_MISSING',
        message: 'x',
        retryable: false,
      },
      VENTA,
    );
    assert.equal(v.key, 'sales:r-1');
    assert.equal(v.titulo, 'Venta');
    assert.equal(v.detalle, '$120.00 · Tacos · 2026-05-14');
    assert.equal(v.razon, 'El producto de este registro ya no existe en el portal.');
    assert.equal(
      v.pista,
      'Pídele al dueño que recupere el producto en el portal y toca Reintentar. No la vuelvas a capturar: se contaría dos veces.',
    );
    assert.equal(v.reintentando, false);
  });

  it('the hint names the owner and never says to capture it again (R5)', () => {
    const cliente = describeRechazado(
      {
        tableName: 'expenses',
        rowId: 'r-5',
        code: 'FK_CLIENT_MISSING',
        message: 'x',
        retryable: false,
      },
      null,
      'Pedro',
    );
    assert.equal(
      cliente.pista,
      'Pídele a Pedro que recupere el cliente en el portal y toca Reintentar. No lo vuelvas a capturar: se contaría dos veces.',
    );
    assert.doesNotMatch(cliente.pista ?? '', /regístral/);
  });

  it('every code a push can be refused with is said in Spanish (R5)', () => {
    const codigos = [
      'VALIDATION',
      'BUSINESS_MISMATCH',
      'BUSINESS_SUSPENDED',
      'TABLE_NOT_WRITABLE',
      'HYBRID_UPDATE_FORBIDDEN',
      'FK_PRODUCT_MISSING',
      'FK_USER_MISSING',
      'FK_CLIENT_MISSING',
      'FK_MENSAJE_MISSING',
      'DUPLICATE_CONFLICT',
      'PROTOCOL_UNSUPPORTED',
      'UNAUTHENTICATED',
      'DEVICE_REVOKED',
      'RATE_LIMITED',
      'INTERNAL',
    ];
    for (const code of codigos) {
      const v = describeRechazado(
        {
          tableName: 'sales',
          rowId: 'r',
          code,
          message: 'sales/r already exists',
          retryable: false,
        },
        null,
      );
      assert.notEqual(v.razon, 'sales/r already exists', code);
    }
  });

  it('a duplicate says the server has it and not to capture it again', () => {
    const v = describeRechazado(
      {
        tableName: 'sales',
        rowId: 'r-6',
        code: 'DUPLICATE_CONFLICT',
        message: 'sales/r-6 already exists',
        retryable: false,
      },
      null,
      'Pedro',
    );
    assert.equal(
      v.razon,
      'El servidor ya tiene un registro distinto con este mismo identificador.',
    );
    assert.equal(
      v.pista,
      'Pídele a Pedro que lo revise en el portal. No la vuelvas a capturar: se contaría dos veces.',
    );
  });

  it('money arrives as text or bigint, never a float', () => {
    assert.equal(
      describeRechazado(
        {
          tableName: 'expenses',
          rowId: 'r-2',
          code: 'DUPLICATE_CONFLICT',
          message: 'raw',
          retryable: true,
        },
        { id: 'e-1', monto: 620_00n, concepto: 'Gas' },
      ).detalle,
      '$620.00 · Gas',
    );
    assert.equal(
      describeRechazado(
        {
          tableName: 'day_closes',
          rowId: 'r-3',
          code: 'VALIDATION',
          message: 'raw',
          retryable: false,
        },
        null,
      ).detalle,
      '',
    );
  });

  it('an unknown code says it in Spanish, never the server’s own words (R5)', () => {
    const v = describeRechazado(
      {
        tableName: 'clients',
        rowId: 'r-4',
        code: 'ALGO_NUEVO',
        message: 'Rechazado por el portal',
        retryable: false,
      },
      { id: 'c-1', nombre: 'Chuy' },
    );
    assert.equal(v.razon, 'El servidor no aceptó este registro.');
    assert.equal(v.pista, null);
    assert.equal(v.titulo, 'Cliente');
    assert.equal(v.detalle, 'Chuy');
  });
});

describe('todo enviado (RvEnvio): Don and the owner who already has it', () => {
  it('names the owner and the last send', () => {
    assert.deepEqual(todoEnviado('Pedro', '09:41'), {
      titulo: 'Todo está enviado',
      cuerpo: 'Pedro ya tiene lo que capturaste. Última vez a las 09:41.',
    });
  });

  it('a send moments ago says so', () => {
    assert.equal(
      todoEnviado('Pedro', null).cuerpo,
      'Pedro ya tiene lo que capturaste. Última vez hace unos segundos.',
    );
  });

  it('without the owner’s name it says «tu negocio»', () => {
    assert.equal(
      todoEnviado(null, '09:41').cuerpo,
      'Tu negocio ya tiene lo que capturaste. Última vez a las 09:41.',
    );
  });

  it('a blank name is no name', () => {
    assert.match(todoEnviado('  ', null).cuerpo, /^Tu negocio ya tiene/);
  });
});
