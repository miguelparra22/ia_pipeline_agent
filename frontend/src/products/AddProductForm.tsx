import { createProduct } from './api';
import { ProductForm } from './ProductForm';
import type { ProductFormValues } from './productValidation';
import type { Product } from './types';

export const CREATE_ERROR_MESSAGE = 'No fue posible crear el producto. Intenta de nuevo.';

const EMPTY: ProductFormValues = { sku: '', name: '', quantity: '', price: '' };

interface AddProductFormProps {
  onCreated: (product: Product) => void;
  onCancel: () => void;
}

/** Formulario de alta de producto (HU-002), sobre el formulario compartido (HU-003). */
export function AddProductForm({ onCreated, onCancel }: AddProductFormProps) {
  return (
    <ProductForm
      title="Agregar producto"
      initialValues={EMPTY}
      submit={createProduct}
      unexpectedErrorMessage={CREATE_ERROR_MESSAGE}
      onDone={onCreated}
      onCancel={onCancel}
    />
  );
}
