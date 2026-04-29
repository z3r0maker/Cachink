/**
 * AtributosForm — renders one input per AttrDef.
 *
 * - `tipo='texto'` → <Input type="text" />
 * - `tipo='select'` → <Input type="select" options={def.opciones} />
 *
 * Embedded in NuevoProductoModal and EditarProductoModal between core
 * fields and submit button.
 */

import type { ReactElement } from 'react';
import { View } from '@tamagui/core';
import type { AttrDef } from '@cachink/domain';
import { Input } from '../Input/input';

export interface AtributosFormProps {
  /** Attribute definitions from Business.atributosProducto. */
  readonly defs: readonly AttrDef[];
  /** Current attribute values keyed by clave. */
  readonly values: Record<string, string>;
  /** Called with updated values map on every change. */
  readonly onChange: (values: Record<string, string>) => void;
  readonly testID?: string;
}

export function AtributosForm(props: AtributosFormProps): ReactElement | null {
  const { defs, values, onChange } = props;
  if (defs.length === 0) return null;

  function handleChange(clave: string, value: string): void {
    onChange({ ...values, [clave]: value });
  }

  return (
    <View testID={props.testID ?? 'atributos-form'} gap={12}>
      {defs.map((def) => (
        <Input
          key={def.clave}
          label={def.label}
          value={values[def.clave] ?? ''}
          onChange={(v) => handleChange(def.clave, v)}
          type={def.tipo === 'select' ? 'select' : 'text'}
          options={def.tipo === 'select' ? def.opciones : undefined}
          placeholder={def.obligatorio ? `${def.label} *` : def.label}
          testID={`attr-${def.clave}`}
        />
      ))}
    </View>
  );
}
