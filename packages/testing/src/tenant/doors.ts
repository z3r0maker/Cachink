/**
 * The portal's two doors, walked through the real UI: the owner's sign-in and
 * the register's Acceso (link the browser, pick the operator, type the NIP,
 * count the fondo). The portal's e2e and Synth's runner (S-05) both walk them
 * from here.
 *
 * They are typed on the few page methods they use, not on Playwright, so this
 * package needs no browser dependency: a Playwright `Page` from either
 * `@playwright/test` or `playwright-core` fits.
 */
export interface DoorLocator {
  fill(value: string): Promise<void>;
  click(): Promise<void>;
  filter(options: { hasText: string }): DoorLocator;
  getAttribute(name: string): Promise<string | null>;
  waitFor(): Promise<void>;
}

export interface DoorPage {
  goto(url: string): Promise<unknown>;
  getByTestId(id: string): DoorLocator;
  getByRole(role: 'button' | 'heading', options: { name: string; exact?: boolean }): DoorLocator;
  waitForURL(url: (u: URL) => boolean): Promise<void>;
  waitForTimeout(ms: number): Promise<void>;
}

/** Fills the owner's door and presses it, without claiming it opens. */
export async function submitOwnerDoor(
  page: DoorPage,
  account: { readonly email: string; readonly password: string },
): Promise<void> {
  await page.goto('/login');
  await page.getByTestId('login-door-owner').click();
  await page.getByTestId('login-email').fill(account.email);
  await page.getByTestId('login-password').fill(account.password);
  await page.getByRole('button', { name: 'Abrir mi changarro' }).click();
}

/** Through the owner's door, and inside. */
export async function walkOwnerDoor(
  page: DoorPage,
  account: { readonly email: string; readonly password: string },
): Promise<void> {
  await submitOwnerDoor(page, account);
  await page.waitForURL((u) => !u.pathname.startsWith('/login'));
}

export class DoorError extends Error {
  readonly code = 'DOOR_NIP_NOT_TAKEN';
  constructor(message: string) {
    super(message);
    this.name = 'DoorError';
  }
}

/**
 * A cold build can drop a keypad tap to hydration; the dots say how many
 * digits actually landed, so a digit is tapped again only while it is missing.
 */
async function typeNip(page: DoorPage, nip: string): Promise<void> {
  const dots = page.getByTestId('nip-cajas');
  const filled = async () => Number(await dots.getAttribute('data-llenos'));
  for (const [i, digit] of [...nip].entries()) {
    for (let tries = 0; (await filled()) <= i; tries += 1) {
      if (tries === 15) throw new DoorError(`the keypad did not take digit ${i + 1} of the NIP`);
      await page.getByTestId(`nip-tecla-${digit}`).click();
      await page.waitForTimeout(200);
    }
  }
  await page.getByTestId('nip-tecla-→').click();
}

export interface OperatorDoor {
  /** The owner's email the activation code was minted for. */
  readonly email: string;
  readonly code: string;
  /** The operator's name as the picker shows it. */
  readonly operador: string;
  readonly nip: string;
  /**
   * The opening cash, in pesos as typed. Given, the walk opens the till and
   * waits for Cobrar; left out, it stops at the fondo, for whoever comes next.
   */
  readonly fondo?: string;
}

/** The register's Acceso, from an unlinked browser on `/operador/caja`. */
export async function walkOperatorDoor(page: DoorPage, door: OperatorDoor): Promise<void> {
  await page.getByTestId('vincular-correo').fill(door.email);
  await page.getByTestId('vincular-codigo').fill(door.code);
  await page.getByTestId('vincular-continuar').click();
  await page.getByTestId('acceso-operador').filter({ hasText: door.operador }).click();
  await typeNip(page, door.nip);
  if (door.fondo === undefined) {
    await page.getByTestId('fondo-input').waitFor();
    return;
  }
  await page.getByTestId('fondo-input').fill(door.fondo);
  await page.getByTestId('fondo-abrir').click();
  await page.getByRole('heading', { name: 'Cobrar', exact: true }).waitFor();
}
