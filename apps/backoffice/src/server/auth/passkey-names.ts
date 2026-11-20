/**
 * What «Mi acceso» calls a passkey (ADR-160): the provider that holds it, from
 * the AAGUID its authenticator reports, so nobody has to type a name. An
 * unknown provider is described by whether the passkey syncs.
 *
 * AAGUIDs from the community list the FIDO convenience metadata publishes
 * (passkey-authenticator-aaguids); only the providers a staff member is
 * likely to use are named here.
 */
/** Provider name, then the AAGUIDs it reports, one per line. */
const BY_PROVIDER: readonly (readonly [string, readonly string[]])[] = [
  [
    'Llavero de iCloud',
    ['fbfc3007-154e-4ecc-8c0b-6e020557d7bd', 'dd4ec289-e01d-41c9-bb89-70fa845d4bf2'],
  ],
  ['Administrador de contraseñas de Google', ['ea9b8d66-4d01-1d21-3ce4-b6b48cb575d4']],
  ['Chrome en Mac', ['adce0002-35bc-c60a-648b-0b25f1f05503']],
  [
    'Windows Hello',
    [
      '08987058-cadc-4b81-b6e1-30de50dcbe96',
      '9ddd1817-af5a-4672-a2b9-3e3dd95000a9',
      '6028b017-b1d4-4c02-b4b3-afcdafc96bb2',
    ],
  ],
  ['1Password', ['bada5566-a7aa-401f-bd96-45619a55120d']],
  ['Bitwarden', ['d548826e-79b4-db40-a3d8-11116f7e8349']],
  ['Samsung Pass', ['53414d53-554e-4700-0000-000000000000']],
];

const PROVIDERS: ReadonlyMap<string, string> = new Map(
  BY_PROVIDER.flatMap(([name, ids]) => ids.map((id) => [id, name] as const)),
);

export function passkeyName(aaguid: string, backedUp: boolean): string {
  return (
    PROVIDERS[aaguid.toLowerCase()] ?? (backedUp ? 'Llave sincronizada' : 'Llave de este equipo')
  );
}
