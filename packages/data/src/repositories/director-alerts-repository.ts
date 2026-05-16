/**
 * DirectorAlertsRepository — notification inbox CRUD. Phase 11.
 */
import type { DirectorAlert } from '@cachink/domain';
import type { BusinessId, DirectorAlertId } from '@cachink/domain';
import type { AlertSeverity, AlertSource } from '@cachink/domain';

export type { DirectorAlert };

export interface CreateDirectorAlertInput {
  readonly source: AlertSource;
  readonly severity: AlertSeverity;
  readonly titleKey: string;
  readonly message: string;
  readonly actionRoute: string | null;
  readonly metadata?: string;
  readonly businessId: BusinessId;
}

export interface DirectorAlertsRepository {
  create(input: CreateDirectorAlertInput): Promise<DirectorAlert>;
  findById(id: DirectorAlertId): Promise<DirectorAlert | null>;
  findUnread(businessId: BusinessId): Promise<readonly DirectorAlert[]>;
  findAll(businessId: BusinessId): Promise<readonly DirectorAlert[]>;
  markRead(id: DirectorAlertId): Promise<void>;
  markAllRead(businessId: BusinessId): Promise<void>;
}
