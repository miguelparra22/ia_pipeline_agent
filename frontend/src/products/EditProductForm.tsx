import { useState } from 'react';
import { updateProduct } from './api';
import { ProductForm } from './ProductForm';
import type { NewProduct, ProductFormValues } from './productValidation';
import type { Product } from './types';

export const NOT_FOUND_MESSAGE = 'El producto ya no existe. Actualiza la lista e intenta de nuevo.';
export const UPDATE_ERROR_MESSAGE = 'No fue posible actualizar el producto. Intenta de nuevo.';

interface EditProductFormProps {
  product: Product;
  onUpdated: (product: Product) => void;
  onCancel: () => void;
}

function toFormValues(product: Product): ProductFormValues {
  return {
    sku: product.sku,
    name: product.name,
    quantity: String(product.quantity),
    price: String(product.price),
  };
}

/** Formulario de edición de producto (HU-003): datos precargados y SKU de solo lectura. */
export function EditProductForm({ product, onUpdated, onCancel }: EditProductFormProps) {
  // Los valores iniciales solo se usan al montar; App cambia la key para editar otro producto.
  const [initialValues] = useState(() => toFormValues(product));
  const { id } = product;

  return (
    <ProductForm
      title="Editar producto"
      initialValues={initialValues}
      skuReadOnly
      submit={(values: NewProduct) => updateProduct(id, values)}
      unexpectedErrorMessage={UPDATE_ERROR_MESSAGE}
      notFoundMessage={NOT_FOUND_MESSAGE}
      onDone={onUpdated}
      onCancel={onCancel}
    />
  );
}
