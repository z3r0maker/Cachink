/** What a console form action returns to `useActionState`. */
export type FormState = {
  readonly ok: boolean;
  readonly message: string;
  /** Where to go to fix it, e.g. a closed month's Cierre (E-14). */
  readonly enlace?: { readonly texto: string; readonly href: string };
} | null;

export function field(form: FormData, name: string): string {
  const value = form.get(name);
  return typeof value === 'string' ? value.trim() : '';
}
