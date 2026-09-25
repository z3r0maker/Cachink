import 'server-only';

import { cache } from 'react';
import type { SupportItem } from '@xangarro/domain';

import type { CapacityReading } from '@/server/capacity/port';
import { drizzleCapacityProbe } from '@/server/db/capacity';
import { db } from '@/server/db/client';
import { drizzleSupportItems } from '@/server/db/support-items';
import { listSupportItems } from '@/server/inbox/list';

/**
 * What the frame (status bar, sidebar counts) and Inicio both read. `cache`
 * makes it one query per request however many components ask. A failure
 * reads as «no data», never as a broken page: the console must open even when
 * the thing it would tell you about is down.
 */

export const OPEN_ITEMS_CAP = 100;

export const capacityNow = cache(async (): Promise<CapacityReading | null> => {
  try {
    return await drizzleCapacityProbe(db()).read();
  } catch (error) {
    console.error('capacity probe failed', error);
    return null;
  }
});

export const openInboxItems = cache(async (): Promise<readonly SupportItem[] | null> => {
  try {
    const { items } = await listSupportItems(drizzleSupportItems(db()), {
      statuses: ['nuevo', 'en_curso'],
      limit: OPEN_ITEMS_CAP,
    });
    return items;
  } catch (error) {
    console.error('inbox count failed', error);
    return null;
  }
});
