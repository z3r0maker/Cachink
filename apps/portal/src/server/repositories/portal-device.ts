/**
 * The `device_id` of every row created in the portal rather than on a phone.
 *
 * A valid ULID so it satisfies the domain, and a fixed, greppable one so a row
 * that never came from a phone is obvious in the data rather than looking like
 * a device nobody can find. Declared once in the domain, because usage
 * metering tells a portal movement by it (C-12, `classifyMovementOrigin`,
 * data-pg 0010).
 */
export { PORTAL_DEVICE_ID } from '@xangarro/domain/usage';
