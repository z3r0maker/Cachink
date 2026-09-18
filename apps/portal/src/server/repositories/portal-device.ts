/**
 * The `device_id` of every row created in the portal rather than on a phone.
 *
 * A valid ULID so it satisfies the domain, and a fixed, greppable one so a row
 * that never came from a phone is obvious in the data rather than looking like
 * a device nobody can find.
 */
export const PORTAL_DEVICE_ID = '01HZ8XQN9GZJXV8AKQ5X0WEB01';
