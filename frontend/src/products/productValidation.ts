// Reglas y mensajes del alta de producto (HU-002). Son los mismos que valida el backend.

export const MESSAGES = {
  skuRequired: 'El SKU es obligatorio',
  nameRequired: 'El nombre es obligatorio',
  quantityRequired: 'La cantidad es obligatoria',
  quantityInvalid: 'La cantidad debe ser un número entero mayor o igual a 0',
  priceRequired: 'El precio es obligatorio',
  priceInvalid: 'El precio debe ser mayor o igual a 0 y tener máximo 2 decimales',
} as const;

export type ProductField = 'sku' | 'name' | 'quantity' | 'price';

/** Valores tal como los escribe el usuario en el formulario. */
export type ProductFormValues = Record<ProductField, string>;

export type FieldErrors = Partial<Record<ProductField, string>>;

/** Valores listos para enviar: sin espacios alrededor y con punto decimal. */
export type NewProduct = ProductFormValues;

export type ValidationResult =
  | { ok: true; value: NewProduct }
  | { ok: false; errors: FieldErrors };

// Límites técnicos alineados con el backend (@Digits): 9 dígitos de stock y 13 enteros de precio.
const QUANTITY_PATTERN = /^\d{1,9}$/;
const PRICE_PATTERN = /^\d{1,13}(\.\d{1,2})?$/;

/** Acepta punto o coma como separador decimal, sin separadores de miles. */
function normalizeNumber(text: string): string {
  return text.trim().replace(',', '.');
}

export function validateProduct(values: ProductFormValues): ValidationResult {
  const sku = values.sku.trim();
  const name = values.name.trim();
  const quantity = normalizeNumber(values.quantity);
  const price = normalizeNumber(values.price);
  const errors: FieldErrors = {};

  if (!sku) errors.sku = MESSAGES.skuRequired;
  if (!name) errors.name = MESSAGES.nameRequired;

  if (!quantity) errors.quantity = MESSAGES.quantityRequired;
  else if (!QUANTITY_PATTERN.test(quantity)) errors.quantity = MESSAGES.quantityInvalid;

  if (!price) errors.price = MESSAGES.priceRequired;
  else if (!PRICE_PATTERN.test(price)) errors.price = MESSAGES.priceInvalid;

  if (Object.keys(errors).length > 0) return { ok: false, errors };
  return { ok: true, value: { sku, name, quantity, price } };
}
