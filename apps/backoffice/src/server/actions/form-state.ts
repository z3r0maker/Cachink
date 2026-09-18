/** What a console form action returns to `useActionState`. */
export type FormState = { readonly ok: boolean; readonly message: string } | null;

export function field(form: FormData, name: string): string {
  const value = form.get(name);
  return typeof value === 'string' ? value.trim() : '';
}
