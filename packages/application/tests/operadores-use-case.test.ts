import assert from 'node:assert/strict';
import { beforeEach, describe, it } from 'vitest';
import {
  DuplicateOperatorError,
  InvalidPinError,
  OperatorLimitError,
  OperatorNotFoundError,
  type BusinessId,
  type UserId,
} from '@xangarro/domain';
import { compare } from 'bcryptjs';

import { InMemoryUsersRepository, TEST_DEVICE_ID } from '../../testing/src/index.js';
import {
  CrearOperadorUseCase,
  DesactivarOperadorUseCase,
  RestablecerPinOperadorUseCase,
} from '../src/index.js';

/**
 * Operator management (B-13) — the rules shared by every client that manages
 * operators. The portal is the first; nothing here knows it exists.
 */
const BIZ = '01HZ8XQN9GZJXV8AKQ5X0C7BJZ' as BusinessId;
const OTHER = '01HZ8XQN9GZJXV8AKQ5X0C7OTH' as BusinessId;

let users: InMemoryUsersRepository;
let crear: CrearOperadorUseCase;

beforeEach(() => {
  users = new InMemoryUsersRepository(TEST_DEVICE_ID);
  crear = new CrearOperadorUseCase(users);
});

const make = (nombre: string, limit = 5, businessId = BIZ) =>
  crear.execute({ businessId, nombre, pin: '1234', operatorLimit: limit });

describe('CrearOperadorUseCase', () => {
  it('creates an active operator with the PIN hashed, never stored plain', async () => {
    const op = await make('Ana');
    assert.equal(op.active, true);
    assert.notEqual(op.pinHash, '1234');
    assert.equal(await compare('1234', op.pinHash), true);
  });

  it('refuses once the plan allowance is used up', async () => {
    await make('Ana', 2);
    await make('Luis', 2);
    await assert.rejects(() => make('Rosa', 2), OperatorLimitError);
  });

  it('does not count deactivated operators against the allowance', async () => {
    const ana = await make('Ana', 1);
    await new DesactivarOperadorUseCase(users).execute({ businessId: BIZ, operatorId: ana.id });
    // The slot Ana held is free again — otherwise deactivating would be pointless.
    const luis = await make('Luis', 1);
    assert.equal(luis.active, true);
  });

  it('rejects a PIN that is not 4 to 6 digits', async () => {
    for (const pin of ['123', '1234567', '12ab', '', ' 1234']) {
      await assert.rejects(
        () => crear.execute({ businessId: BIZ, nombre: `Op ${pin}`, pin, operatorLimit: 5 }),
        InvalidPinError,
        `"${pin}" must be refused`,
      );
    }
  });

  it('refuses a second operator with the same name — the phone signs in by name', async () => {
    await make('Ana');
    await assert.rejects(() => make('Ana'), DuplicateOperatorError);
  });
});

describe('RestablecerPinOperadorUseCase', () => {
  it('replaces the PIN without needing the old one', async () => {
    const ana = await make('Ana');
    await new RestablecerPinOperadorUseCase(users).execute({
      businessId: BIZ,
      operatorId: ana.id,
      pin: '987654',
    });
    const after = await users.findById(ana.id);
    assert.equal(await compare('987654', after?.pinHash ?? ''), true);
    assert.equal(await compare('1234', after?.pinHash ?? ''), false);
  });

  it('rejects an invalid new PIN', async () => {
    const ana = await make('Ana');
    await assert.rejects(
      () =>
        new RestablecerPinOperadorUseCase(users).execute({
          businessId: BIZ,
          operatorId: ana.id,
          pin: '12',
        }),
      InvalidPinError,
    );
  });

  it('refuses an operator that does not exist', async () => {
    await assert.rejects(
      () =>
        new RestablecerPinOperadorUseCase(users).execute({
          businessId: BIZ,
          operatorId: '01HZ8XQN9GZJXV8AKQ5X0NONE1' as UserId,
          pin: '1234',
        }),
      OperatorNotFoundError,
    );
  });

  it("refuses another business's operator, as if it did not exist", async () => {
    const theirs = await make('Ana', 5, OTHER);
    await assert.rejects(
      () =>
        new RestablecerPinOperadorUseCase(users).execute({
          businessId: BIZ,
          operatorId: theirs.id,
          pin: '1234',
        }),
      OperatorNotFoundError,
    );
  });
});

describe('DesactivarOperadorUseCase', () => {
  const desactivar = () => new DesactivarOperadorUseCase(users);

  it('deactivates without a warning while others remain active', async () => {
    const ana = await make('Ana');
    await make('Luis');
    const result = await desactivar().execute({ businessId: BIZ, operatorId: ana.id });
    assert.equal(result.lastActive, false);
    assert.equal((await users.findById(ana.id))?.active, false);
  });

  it('allows deactivating the last active operator, but says so', async () => {
    // Allowed — a business may pause every phone — but the portal must warn,
    // because nobody will be able to sign in until someone is reactivated.
    const ana = await make('Ana');
    const result = await desactivar().execute({ businessId: BIZ, operatorId: ana.id });
    assert.equal(result.lastActive, true);
  });

  it('refuses an operator that does not exist', async () => {
    await assert.rejects(
      () =>
        desactivar().execute({
          businessId: BIZ,
          operatorId: '01HZ8XQN9GZJXV8AKQ5X0NONE1' as UserId,
        }),
      OperatorNotFoundError,
    );
  });

  it("refuses another business's operator", async () => {
    const theirs = await make('Ana', 5, OTHER);
    await assert.rejects(
      () => desactivar().execute({ businessId: BIZ, operatorId: theirs.id }),
      OperatorNotFoundError,
    );
  });
});
