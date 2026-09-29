import type { FieldErrors, NewProduct } from './productValidation';
import type { Product } from './types';

/** Llama a GET /api/products, con el filtro opcional por nombre o SKU. */
export async function fetchProducts(query: string, signal?: AbortSignal): Promise<Product[]> {
  const trimmed = query.trim();
  const url = trimmed ? `/api/products?query=${encodeURIComponent(trimmed)}` : '/api/products';
  const response = await fetch(url, { signal, headers: { Accept: 'application/json' } });
  if (!response.ok) {
    throw new Error(`Error ${response.status} al consultar el inventario`);
  }
  return (await response.json()) as Product[];
}

export type CreateProductResult =
  | { ok: true; product: Product }
  | { ok: false; errors: FieldErrors };

/**
 * Llama a POST /api/products (HU-002). Los números viajan como texto normalizado para no pasar
 * por coma flotante. Los 400/409 con errores por campo se devuelven como resultado; cualquier
 * otro fallo lanza un error.
 */
export async function createProduct(product: NewProduct): Promise<CreateProductResult> {
  const response = await fetch('/api/products', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(product),
  });
  if (response.status === 201) {
    return { ok: true, product: (await response.json()) as Product };
  }
  if (response.status === 400 || response.status === 409) {
    const body = (await response.json().catch(() => null)) as { errors?: FieldErrors } | null;
    if (body?.errors && Object.keys(body.errors).length > 0) {
      return { ok: false, errors: body.errors };
    }
  }
  throw new Error(`Error ${response.status} al crear el producto`);
}

export type UpdateProductResult =
  | { ok: true; product: Product }
  | { ok: false; errors: FieldErrors }
  | { ok: false; notFound: true };

/**
 * Llama a PUT /api/products/{id} (HU-003). Solo envía los campos editables: el SKU no se puede
 * modificar. Los 400 con errores por campo y el 404 se devuelven como resultado; cualquier otro
 * fallo lanza un error.
 */
export async function updateProduct(id: number, values: NewProduct): Promise<UpdateProductResult> {
  const { name, quantity, price } = values;
  const response = await fetch(`/api/products/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ name, quantity, price }),
  });
  if (response.status === 200) {
    return { ok: true, product: (await response.json()) as Product };
  }
  if (response.status === 404) {
    return { ok: false, notFound: true };
  }
  if (response.status === 400) {
    const body = (await response.json().catch(() => null)) as { errors?: FieldErrors } | null;
    if (body?.errors && Object.keys(body.errors).length > 0) {
      return { ok: false, errors: body.errors };
    }
  }
  throw new Error(`Error ${response.status} al actualizar el producto`);
}
