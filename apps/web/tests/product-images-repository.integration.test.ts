import { afterAll, beforeAll } from 'vitest';
import { sql } from 'drizzle-orm';
import { createDb, withBusiness, type Db } from '@xangarro/data-pg';
import type { ProductImagesRepository } from '@xangarro/data';
import type { BusinessId, ProductId } from '@xangarro/domain';
import { describeProductImagesRepositoryContract } from '@xangarro/testing/contract';
import { integrationSuite } from '@xangarro/testing/integration';

import { pgProductImagesRepository } from '../src/server/repositories/product-images';
import { PORTAL_DEVICE_ID } from '../src/server/repositories/portal-device';

/**
 * The portal's Postgres `ProductImagesRepository` (P-42) against the shared
 * contract the phone's Drizzle and in-memory ones pass (M-13). The portal
 * binds a repository to one tenant transaction, so the adapter opens the
 * tenant each call names, as the server action does: that is also why the
 * contract's second business lands under its own RLS claim.
 */
const { url, describe: suite } = integrationSuite();

/** The contract's two businesses (`packages/testing/src/contract/product-images-repository.ts`). */
const BUSINESSES = ['01HZ8XQN9GZJXV8AKQ5X0C7BJZ', '01HZ8XQN9GZJXV8AKQ5X0C7BJY'];

suite('pgProductImagesRepository', () => {
  let db: Db;

  beforeAll(async () => {
    db = createDb(url as string);
    // The app role may not DELETE (0050), and the contract's ids are fixed:
    // clear what an earlier run left, as the owner.
    const owner = createDb(process.env.DATABASE_SUPER_URL ?? (url as string));
    await owner.execute(
      sql`DELETE FROM product_images WHERE business_id IN (${BUSINESSES[0]}, ${BUSINESSES[1]})`,
    );
    await owner.$client.end({ timeout: 5 });
  });

  afterAll(async () => {
    await db?.$client.end({ timeout: 5 });
  });

  const repo = (): ProductImagesRepository => {
    const inTenant = <T>(biz: string, fn: (r: ProductImagesRepository) => Promise<T>) =>
      withBusiness(db, biz, (tx) => fn(pgProductImagesRepository(tx, biz as BusinessId)));
    return {
      create: (input) => inTenant(input.businessId, (r) => r.create(input)),
      latestForProduct: (productoId: ProductId) =>
        inTenant(BUSINESSES[0] as string, (r) => r.latestForProduct(productoId)),
      latestForBusiness: (biz) => inTenant(biz, (r) => r.latestForBusiness(biz)),
    };
  };

  describeProductImagesRepositoryContract('Postgres (portal)', repo, PORTAL_DEVICE_ID);
});
