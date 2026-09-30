import { useEffect, useRef, useState } from 'react';
import { AddProductForm } from './products/AddProductForm';
import { EditProductForm } from './products/EditProductForm';
import { ProductTable } from './products/ProductTable';
import { SearchBar } from './products/SearchBar';
import type { Product } from './products/types';
import { useProducts } from './products/useProducts';

export const LOAD_ERROR_MESSAGE = 'No fue posible cargar el inventario. Intenta de nuevo más tarde.';

export const createdMessage = (name: string) => `Producto ${name} creado correctamente`;

export const updatedMessage = (name: string) => `Producto ${name} actualizado correctamente`;

/** HU-003: un solo estado para el formulario, así es imposible tener dos abiertos a la vez. */
type FormState = null | { mode: 'create' } | { mode: 'edit'; product: Product };

interface AppProps {
  /** HU-004: cierra la sesión y vuelve a mostrar el login; la app no gestiona sesión por sí sola. */
  onLogout?: () => void;
}

/**
 * Vista principal: consulta de inventario (HU-001), alta de productos (HU-002) y edición de
 * productos (HU-003).
 */
export function App({ onLogout }: AppProps = {}) {
  const [query, setQuery] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  const [form, setForm] = useState<FormState>(null);
  const [confirmation, setConfirmation] = useState<string | null>(null);
  const { products, error } = useProducts(query, refreshKey);
  const formRef = useRef<HTMLDivElement>(null);

  // HU-003: la fila editada puede quedar lejos, así que el formulario abierto se lleva a la vista.
  // jsdom no implementa scrollIntoView, de ahí la comprobación.
  useEffect(() => {
    const element = formRef.current;
    if (form && element && typeof element.scrollIntoView === 'function') {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [form]);

  function openCreate() {
    setConfirmation(null);
    setForm({ mode: 'create' });
  }

  function openEdit(product: Product) {
    setConfirmation(null);
    setForm({ mode: 'edit', product });
  }

  function handleCreated(product: Product) {
    // El formulario se desmonta, así que al abrirlo de nuevo aparece vacío.
    setForm(null);
    setConfirmation(createdMessage(product.name));
    setQuery('');
    setRefreshKey((key) => key + 1);
  }

  function handleUpdated(product: Product) {
    // HU-003: se conserva el filtro actual; solo se vuelve a consultar.
    setForm(null);
    setConfirmation(updatedMessage(product.name));
    setRefreshKey((key) => key + 1);
  }

  function handleSearch(value: string) {
    setConfirmation(null);
    setQuery(value);
  }

  const closeForm = () => setForm(null);

  return (
    <main className="app">
      <header className="app-header">
        <h1>Consulta de inventario</h1>
        <div className="app-header-actions">
          {/* Oculto solo mientras el alta está abierta; desde la edición permite cambiar al alta. */}
          {form?.mode !== 'create' && (
            <button type="button" className="primary" onClick={openCreate}>
              Agregar producto
            </button>
          )}
          {/* HU-004: siempre visible mientras hay sesión activa. */}
          {onLogout && (
            <button type="button" onClick={onLogout}>
              Cerrar sesión
            </button>
          )}
        </div>
      </header>
      {form && (
        <div ref={formRef} className="form-anchor">
          {form.mode === 'create' ? (
            <AddProductForm onCreated={handleCreated} onCancel={closeForm} />
          ) : (
            <EditProductForm
              key={form.product.id}
              product={form.product}
              onUpdated={handleUpdated}
              onCancel={closeForm}
            />
          )}
        </div>
      )}
      {confirmation && (
        <p role="status" className="confirmation">
          {confirmation}
        </p>
      )}
      <SearchBar value={query} onChange={handleSearch} />
      {error ? (
        <p role="alert" className="error">
          {LOAD_ERROR_MESSAGE}
        </p>
      ) : products === null ? (
        <p role="status">Cargando inventario…</p>
      ) : (
        <ProductTable products={products} onEdit={openEdit} />
      )}
    </main>
  );
}
