import { useId, useState, type FormEvent } from 'react';
import {
  validateProduct,
  type FieldErrors,
  type NewProduct,
  type ProductField,
  type ProductFormValues,
} from './productValidation';
import type { Product } from './types';

/** Resultado de enviar el formulario: éxito, errores por campo o producto inexistente. */
export type ProductFormResult =
  | { ok: true; product: Product }
  | { ok: false; errors: FieldErrors }
  | { ok: false; notFound: true };

const FIELDS: { field: ProductField; label: string; inputMode?: 'numeric' | 'decimal' }[] = [
  { field: 'sku', label: 'SKU' },
  { field: 'name', label: 'Nombre' },
  { field: 'quantity', label: 'Cantidad en stock', inputMode: 'numeric' },
  { field: 'price', label: 'Precio unitario', inputMode: 'decimal' },
];

interface ProductFormProps {
  title: string;
  /** Solo se usan al montar el formulario. */
  initialValues: ProductFormValues;
  skuReadOnly?: boolean;
  /** Envía los valores ya validados. Lanza un error ante un fallo inesperado. */
  submit: (values: NewProduct) => Promise<ProductFormResult>;
  unexpectedErrorMessage: string;
  notFoundMessage?: string;
  onDone: (product: Product) => void;
  onCancel: () => void;
}

/**
 * Formulario de producto compartido por el alta (HU-002) y la edición (HU-003): campos,
 * validación en el cliente, bloqueo de doble envío, errores por campo y avisos generales.
 */
export function ProductForm({
  title,
  initialValues,
  skuReadOnly = false,
  submit,
  unexpectedErrorMessage,
  notFoundMessage,
  onDone,
  onCancel,
}: ProductFormProps) {
  const id = useId();
  const [values, setValues] = useState<ProductFormValues>(initialValues);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    setGeneralError(null);

    const validation = validateProduct(values);
    if (!validation.ok) {
      setErrors(validation.errors);
      return;
    }

    setErrors({});
    setSubmitting(true);
    try {
      const result = await submit(validation.value);
      if (result.ok) {
        onDone(result.product);
        return;
      }
      if ('notFound' in result) {
        // HU-003: el producto ya no existe; se conservan los datos escritos.
        setGeneralError(notFoundMessage ?? unexpectedErrorMessage);
      } else {
        setErrors(result.errors);
      }
    } catch (error) {
      console.error(error);
      setGeneralError(unexpectedErrorMessage);
    }
    setSubmitting(false);
  }

  return (
    <section className="add-product" aria-labelledby={`${id}-title`}>
      <h2 id={`${id}-title`}>{title}</h2>
      <form noValidate onSubmit={handleSubmit}>
        <div className="add-product-fields">
          {FIELDS.map(({ field, label, inputMode }) => {
            const inputId = `${id}-${field}`;
            const errorId = `${inputId}-error`;
            const error = errors[field];
            return (
              <div className="field" key={field}>
                <label htmlFor={inputId}>{label}</label>
                <input
                  id={inputId}
                  name={field}
                  type="text"
                  inputMode={inputMode}
                  autoComplete="off"
                  // HU-003: readOnly y no disabled, para que siga siendo legible y seleccionable.
                  readOnly={field === 'sku' && skuReadOnly ? true : undefined}
                  value={values[field]}
                  aria-invalid={error ? true : undefined}
                  aria-describedby={error ? errorId : undefined}
                  onChange={(event) => setValues({ ...values, [field]: event.target.value })}
                />
                {error && (
                  <p id={errorId} className="field-error">
                    {error}
                  </p>
                )}
              </div>
            );
          })}
        </div>
        {generalError && (
          <p role="alert" className="error">
            {generalError}
          </p>
        )}
        <div className="add-product-actions">
          <button type="submit" className="primary" disabled={submitting} aria-busy={submitting}>
            Guardar
          </button>
          <button type="button" onClick={onCancel}>
            Cancelar
          </button>
        </div>
      </form>
    </section>
  );
}
