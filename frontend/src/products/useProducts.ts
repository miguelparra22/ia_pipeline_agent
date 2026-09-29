import { useEffect, useState } from 'react';
import { fetchProducts } from './api';
import type { Product } from './types';

export const SEARCH_DEBOUNCE_MS = 300;

interface ProductsState {
  /** `null` mientras no ha terminado la primera consulta. */
  products: Product[] | null;
  error: boolean;
}

/**
 * Consulta el inventario cada vez que cambia `query`, tras una pausa de escritura.
 * Cancela la petición anterior para que una respuesta antigua no pise a la más reciente.
 * Mientras llega la nueva respuesta se conserva el último resultado.
 * Cambiar `refreshKey` vuelve a consultar aunque `query` no cambie (p. ej. tras crear un producto).
 */
export function useProducts(query: string, refreshKey = 0): ProductsState {
  const [state, setState] = useState<ProductsState>({ products: null, error: false });

  useEffect(() => {
    const controller = new AbortController();

    const timer = setTimeout(() => {
      fetchProducts(query, controller.signal)
        .then((products) => setState({ products, error: false }))
        .catch((error: unknown) => {
          if (controller.signal.aborted) return;
          console.error(error);
          setState({ products: null, error: true });
        });
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, refreshKey]);

  return state;
}
